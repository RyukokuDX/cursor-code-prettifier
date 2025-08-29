import * as vscode from 'vscode';
import * as path from 'path';

type Sub = { original: string; display: string };

let deco: vscode.TextEditorDecorationType;
let decoHi: vscode.TextEditorDecorationType;
let ch: vscode.OutputChannel;

// ドキュメントごとの装飾と索引
const docDecos = new Map<string, vscode.DecorationOptions[]>();
const docIndex = new Map<string, Array<{ range: vscode.Range; original: string; display: string; lenCh: number }>>();

// hover/キャレットで一時的に非表示にした範囲の管理
const hiddenKeys = new Set<string>();
const hideTimers = new Map<string, NodeJS.Timeout>();

// .aux 由来のラベル→番号キャッシュ
type AuxCache = { auxUri?: vscode.Uri; mtime?: number; labelMap?: Map<string, string> };
const auxCache: AuxCache = {};
let auxWatcher: vscode.FileSystemWatcher | undefined;

function rangeKeyOf(docUri: string, r: vscode.Range) {
  return `${docUri}:${r.start.line}:${r.start.character}:${r.end.line}:${r.end.character}`;
}

export function activate(ctx: vscode.ExtensionContext) {
  ch = vscode.window.createOutputChannel('Prettifier');
  ch.appendLine('[prettifier] activate');

  deco = vscode.window.createTextEditorDecorationType({
    color: 'transparent',
    after: { color: new vscode.ThemeColor('editor.foreground') }
  });
  // ハイライト用（counterモードで強調）
  decoHi = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
    border: '1px solid',
    borderColor: new vscode.ThemeColor('editor.findMatchBorder')
  });
  ctx.subscriptions.push(deco, decoHi, ch);

  const ed0 = vscode.window.activeTextEditor;
  if (ed0) {
    // 非同期で実行
    void update(ed0);
  }

  // エディタ切替・本文変更・設定変更
  ctx.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((ed: vscode.TextEditor | undefined) => {
      if (ed) { void update(ed); }
    }),
    vscode.workspace.onDidChangeTextDocument((ev: vscode.TextDocumentChangeEvent) => {
      const ed = vscode.window.activeTextEditor;
      if (ed && ev.document === ed.document) { void update(ed); }
    }),
    vscode.workspace.onDidChangeConfiguration((ev: vscode.ConfigurationChangeEvent) => {
      if (ev.affectsConfiguration('cursorCodePrettifier')) {
        const ed = vscode.window.activeTextEditor;
        if (ed) { void update(ed); }
      }
    })
  );

  // Hover: 範囲内に来たら元語を“保持”（ホバーが続く間は戻さない）
  ctx.subscriptions.push(
    vscode.languages.registerHoverProvider([{ language: 'latex' }, { language: 'tex' }], {
      provideHover(document: vscode.TextDocument, position: vscode.Position) {
        const uri = document.uri.toString();
        const list = docIndex.get(uri) ?? [];
        const hit = list.find(v => v.range.contains(position));
        if (!hit) { return; }
        const holdMs = vscode.workspace.getConfiguration('cursorCodePrettifier').get<number>('hoverRevealMs', 1600);
        holdHide(uri, hit.range, holdMs);
        return new vscode.Hover([`**Original:** \`${hit.original}\``, `**Display:** \`${hit.display}\``]);
      }
    })
  );

  // キャレットが入った時も元語を保持（編集しやすく）
  ctx.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((ev: vscode.TextEditorSelectionChangeEvent) => {
      const ed = ev.textEditor;
      const pos = ev.selections[0]?.active;
      if (!pos) { return; }
      const uri = ed.document.uri.toString();
      const list = docIndex.get(uri) ?? [];
      const hit = list.find(v => v.range.contains(pos));
      if (hit) {
        const holdMs = vscode.workspace.getConfiguration('cursorCodePrettifier').get<number>('hoverRevealMs', 1600);
        holdHide(uri, hit.range, holdMs);
      }
    })
  );

  // .aux 監視（作成/変更でキャッシュ更新、削除時はキャッシュ温存）
  auxWatcher = vscode.workspace.createFileSystemWatcher('**/*.aux', false, false, false);
  ctx.subscriptions.push(auxWatcher);
  auxWatcher.onDidCreate(async (uri) => { try { await refreshAuxCacheFromUri(uri); } catch {} });
  auxWatcher.onDidChange(async (uri) => { try { await refreshAuxCacheFromUri(uri); } catch {} });
}

async function update(editor: vscode.TextEditor): Promise<void> {
  const lang = editor.document.languageId;
  if (lang !== 'latex' && lang !== 'tex') {
    editor.setDecorations(deco, []);
    return;
  }

  const cfg = vscode.workspace.getConfiguration('cursorCodePrettifier');
  const enabled = cfg.get<boolean>('enabled', true);
  const refMaskMode = cfg.get<'emoji' | 'counter'>('refMaskMode', 'emoji');
  const counterHighlightEnabled = cfg.get<boolean>('counterHighlightEnabled', true);
  const counterHighlightStyle = cfg.get<'background' | 'text' | 'emoji' | 'none'>('counterHighlightStyle', 'background');
  const counterTextColor = cfg.get<string>('counterTextColor', '#7aa2f7');
  
  // 新しい設定構造から読み込み
  const userSymbols = cfg.get<Sub[]>('symbols', []) ?? [];
  const userMathCommands = cfg.get<Sub[]>('math_commands', []) ?? [];
  const userTexCommands = cfg.get<Sub[]>('tex_commands', []) ?? [];
  
  // デバッグ情報を出力
  ch.appendLine(`[prettifier] Extension enabled: ${enabled}`);
  ch.appendLine(`[prettifier] User symbols count: ${userSymbols.length}`);
  ch.appendLine(`[prettifier] User math commands count: ${userMathCommands.length}`);
  ch.appendLine(`[prettifier] User tex commands count: ${userTexCommands.length}`);
  ch.appendLine(`[prettifier] refMaskMode: ${refMaskMode}`);
  ch.appendLine(`[prettifier] counterHighlightStyle: ${counterHighlightStyle}`);
  
  // グループ設定を取得
  const symbolEnabled = cfg.get<boolean>('symbolEnabled', true);
  const mathEnabled = cfg.get<boolean>('mathEnabled', true);
  const texEnabled = cfg.get<boolean>('texEnabled', true);
  
  // デバッグ情報を詳細に出力
  ch.appendLine(`[prettifier] Raw config values:`);
  ch.appendLine(`  - symbolEnabled: ${symbolEnabled} (type: ${typeof symbolEnabled})`);
  ch.appendLine(`  - mathEnabled: ${mathEnabled} (type: ${typeof mathEnabled})`);
  ch.appendLine(`  - texEnabled: ${texEnabled} (type: ${typeof texEnabled})`);

  // package.jsonのデフォルト値を使用（設定が空の場合）
  const symbols = userSymbols.length > 0 ? userSymbols : cfg.get<Sub[]>('symbols', []);
  const mathCommands = userMathCommands.length > 0 ? userMathCommands : cfg.get<Sub[]>('math_commands', []);
  const texCommands = userTexCommands.length > 0 ? userTexCommands : cfg.get<Sub[]>('tex_commands', []);
  
  // グループ設定に基づいてフィルタリング
  const activeSymbols = symbolEnabled ? symbols : [];
  const activeMathCommands = mathEnabled ? mathCommands : [];
  const activeTexCommands = texEnabled ? texCommands : [];
  
  // すべての有効な変換候補を結合
  const subs = [...activeSymbols, ...activeMathCommands, ...activeTexCommands]
    .slice()
    .sort((a: Sub, b: Sub) => b.original.length - a.original.length); // 長い順で優先
  
  // デバッグ情報を出力
  ch.appendLine(`[prettifier] Active substitutions: symbols=${activeSymbols.length}, math=${activeMathCommands.length}, tex=${activeTexCommands.length}, total=${subs.length}`);

  if (!enabled || subs.length === 0) {
    editor.setDecorations(deco, []);
    return;
  }

  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const text = editor.document.getText();

  // counter モードなら .aux を読み込んでラベル→番号を用意
  let labelToNumber: Map<string, string> | undefined;
  if (refMaskMode === 'counter') {
    try {
      labelToNumber = await ensureAuxLabelMap(editor.document, text);
      ch.appendLine(`[prettifier] aux labels loaded: ${labelToNumber?.size ?? 0}`);
    } catch (e: any) {
      ch.appendLine(`[prettifier] aux parse failed: ${e?.message ?? e}`);
    }
  }

  const decos: vscode.DecorationOptions[] = [];
  const decosHi: vscode.DecorationOptions[] = [];
  const index: Array<{ range: vscode.Range; original: string; display: string; lenCh: number }> = [];

  // ★確定済みマッチの占有区間（ドキュメントオフセット基準）でオーバーラップを禁止
  const taken: Array<[number, number]> = [];
  const overlaps = (s: number, e: number) => taken.some(([S, E]) => Math.max(S, s) < Math.min(E, e));

  // 先に counter モードの \ref/\eqref を“全体置換”で処理し、占有登録しておく
  if (refMaskMode === 'counter' && labelToNumber) {
    const reRef = /\\(eqref|ref)\s*\{([^}]+)\}/g;
    let refTotal = 0, refMatched = 0, refMissing = 0;
    let m2: RegExpExecArray | null;
    while ((m2 = reRef.exec(text)) !== null) {
      const startOff = m2.index;
      const endOff = m2.index + m2[0].length;
      if (overlaps(startOff, endOff)) { continue; }
      const kind = m2[1];
      const labelStr = m2[2];
      refTotal++;
      const labels = labelStr.split(/[;,]\s*/).map(s => s.trim()).filter(Boolean);
      const nums = labels.map(l => labelToNumber!.get(l)).filter((v): v is string => !!v);
      if (nums.length === 0) { refMissing++; continue; }
      refMatched++;
      const shown = kind === 'eqref' ? `(${nums.join(',')})` : nums.join(',');
      const start = editor.document.positionAt(startOff);
      const end = editor.document.positionAt(endOff);
      const lenCh = [...m2[0]].length;
      const range = new vscode.Range(start, end);
      // 軽量な強調（text/emoji）のための after/before を組み立て
      const after = { contentText: shown, margin: `0 0 0 -${lenCh}ch`, color: counterHighlightEnabled && counterHighlightStyle === 'text' ? counterTextColor : undefined } as vscode.ThemableDecorationAttachmentRenderOptions;
      const before = counterHighlightEnabled && counterHighlightStyle === 'emoji' ? { contentText: '🔎 ', margin: '0 0 0 0' } as vscode.ThemableDecorationAttachmentRenderOptions : undefined;
      const d: vscode.DecorationOptions = { range, renderOptions: { before, after } };
      decos.push(d);
      if (counterHighlightEnabled && counterHighlightStyle === 'background') { decosHi.push({ range }); }
      index.push({ range, original: `\\${kind}`, display: shown, lenCh });
      taken.push([startOff, endOff]);
    }
    ch.appendLine(`[prettifier] refs: total=${refTotal}, matched=${refMatched}, missing=${refMissing}`);
  }

  for (const { original, display } of subs) {
    // counterモードでは \ref/\eqref は前段で全体置換済みなのでスキップ
    if (refMaskMode === 'counter' && (original === '\\ref' || original === '\\eqref')) {
      continue;
    }
    const useWB = !(original.startsWith('\\')) && /^\w/.test(original) && /\w$/.test(original);
    const patt = useWB ? `\\b${esc(original)}\\b` : esc(original);
    // \alpha 等は 'u' フラグ非使用（/u だと \a が不正エスケープになる）
    const flags = original.startsWith('\\') ? 'g' : 'gu';
    const re = new RegExp(patt, flags);

    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const startOff = m.index;
      const endOff = m.index + m[0].length;
      if (overlaps(startOff, endOff)) { continue; } // 既存と重なるものは捨てる

      const start = editor.document.positionAt(startOff);
      const end = editor.document.positionAt(endOff);
      const lenCh = [...m[0]].length;

      // \\ref/\\eqref の場合、counter モードでは番号を表示
      let shown = display;
      // ここでの \ref/\eqref 個別処理は行わない（前段で全体置換済み）

      const range = new vscode.Range(start, end);
      const afterBase = { contentText: shown, margin: `0 0 0 -${lenCh}ch` } as const;
      const after = { ...afterBase, color: counterHighlightEnabled && counterHighlightStyle === 'text' ? counterTextColor : undefined } as vscode.ThemableDecorationAttachmentRenderOptions;
      const before = counterHighlightEnabled && counterHighlightStyle === 'emoji' ? { contentText: '🔎 ', margin: '0 0 0 0' } as vscode.ThemableDecorationAttachmentRenderOptions : undefined;
      const d: vscode.DecorationOptions = { range, renderOptions: { before, after } };

      decos.push(d);
      if (counterHighlightEnabled && refMaskMode === 'counter' && (original === '\\ref' || original === '\\eqref') && counterHighlightStyle === 'background') {
        decosHi.push({ range });
      }
      index.push({ range, original, display: shown, lenCh });
      taken.push([startOff, endOff]); // 占有登録
    }
  }

  const uri = editor.document.uri.toString();
  docDecos.set(uri, decos);
  docIndex.set(uri, index);

  // 既に一部が“保持で非表示”になっている場合は、そのまま維持して適用
  const effective = applyHiddenFilter(uri, decos);
  ch.appendLine(`[prettifier] decorations: total=${decos.length}, effective=${effective.length}`);
  editor.setDecorations(deco, effective);
  editor.setDecorations(decoHi, decosHi);
}

function applyHiddenFilter(docUri: string, all: vscode.DecorationOptions[]): vscode.DecorationOptions[] {
  // 現在保持中のキーに該当する範囲は取り除いて返す
  const filtered = all.filter(d => {
    const key = rangeKeyOf(docUri, d.range);
    return !hiddenKeys.has(key);
  });
  return filtered;
}

// hover/キャレット中は隠したまま、最後の呼び出しから holdMs 経過で復帰（デバウンス保持）
function holdHide(docUri: string, range: vscode.Range, holdMs: number) {
  const key = rangeKeyOf(docUri, range);

  // 初回なら該当範囲を取り除いて反映
  if (!hiddenKeys.has(key)) {
    hiddenKeys.add(key);
    const ed = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === docUri);
    if (ed) {
      const all = docDecos.get(docUri) ?? [];
      ed.setDecorations(deco, applyHiddenFilter(docUri, all));
    }
  }

  // タイマーを延長（ホバーが続く間は戻さない）
  const prev = hideTimers.get(key);
  if (prev) { clearTimeout(prev); }
  const t = setTimeout(() => {
    hiddenKeys.delete(key);
    hideTimers.delete(key);
    const edLater = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === docUri);
    if (edLater) {
      const all = docDecos.get(docUri) ?? [];
      edLater.setDecorations(deco, applyHiddenFilter(docUri, all));
    }
  }, Math.max(100, holdMs | 0));
  hideTimers.set(key, t);
}

export function deactivate() {
  // クリーンアップ（任意）
  hideTimers.forEach(t => clearTimeout(t));
  hideTimers.clear();
  hiddenKeys.clear();
  docDecos.clear();
  docIndex.clear();
  auxWatcher?.dispose();
}

// 直後の { ... } 引数を素朴に抽出（ネストなし、改行なし想定）
function findFollowingBraceArg(text: string, startOffset: number): { value: string; begin: number; end: number } | undefined {
  // 直前に空白が入る場合があるのでスキップ
  let i = startOffset;
  while (i < text.length && /\s/.test(text[i])) { i++; }
  if (text[i] !== '{') { return undefined; }
  const braceOpen = i;
  i++;
  const begin = i; // 内容の開始
  while (i < text.length && text[i] !== '}') { i++; }
  if (i >= text.length) { return undefined; }
  const end = i + 1; // '}' の次の位置（排他的）
  return { value: text.slice(begin, i), begin: braceOpen, end };
}

async function ensureAuxLabelMap(doc: vscode.TextDocument, docText?: string): Promise<Map<string, string>> {
  // 1) Latex-Workshop から root を取得試行
  const root = await tryGetRootFileFromLatexWorkshop(doc.uri) ?? guessRootFromDocument(doc.uri);
  if (!root) { throw new Error('root file not found'); }
  // 候補: ルート隣接, latex-workshop.latex.outDir
  const auxCandidates = await getAuxCandidates(root, doc.uri, docText);
  for (const auxUri of auxCandidates) {
    const stat = await statIfExists(auxUri);
    if (stat) {
      const bytes = await vscode.workspace.fs.readFile(auxUri);
      const content = Buffer.from(bytes).toString('utf8');
      const map = parseAuxNewlabel(content);
      auxCache.auxUri = auxUri;
      auxCache.mtime = stat.mtime;
      auxCache.labelMap = map;
      ch.appendLine(`[prettifier] aux file: ${auxUri.fsPath} labels=${map.size}`);
      // 追加: ワークスペース内の他の .aux をマージ
      const merged = await loadMergedAuxLabels(map);
      if (merged.size !== map.size) {
        ch.appendLine(`[prettifier] aux merged labels: ${merged.size}`);
      }
      auxCache.labelMap = merged;
      return map;
    }
  }

  // 見つからない場合、ワークスペース走査
  {
    // 追加フォールバック: ワークスペース内の .aux を探索し、\newlabel を含むものを採用
    const fromScan = await findAuxWithLabelsNear(doc.uri);
    if (!fromScan) { return auxCache.labelMap ?? new Map(); }
    const bytes = await vscode.workspace.fs.readFile(fromScan);
    const content = Buffer.from(bytes).toString('utf8');
    const map = parseAuxNewlabel(content);
    auxCache.auxUri = fromScan;
    auxCache.mtime = Date.now();
    ch.appendLine(`[prettifier] aux file: ${fromScan.fsPath} labels=${map.size}`);
    const merged = await loadMergedAuxLabels(map);
    if (merged.size !== map.size) {
      ch.appendLine(`[prettifier] aux merged labels: ${merged.size}`);
    }
    auxCache.labelMap = merged;
    return merged;
  }
}

function parseAuxNewlabel(auxContent: string): Map<string, string> {
  const map = new Map<string, string>();
  // 一般形: \newlabel{key}{{num}{page}...}
  // num に {H1} のように波括弧が重なるケースもあるため非貪欲に取得
  const re = /\\newlabel\{([^}]+)\}\{\{(.+?)\}\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(auxContent)) !== null) {
    const key = m[1];
    let num = m[2];
    if (!key || !num) { continue; }
    // 余分な外側の波括弧を剥がす（{{H1}} → H1）
    while (num.length >= 2 && num.startsWith('{') && num.endsWith('}')) {
      num = num.slice(1, -1);
    }
    map.set(key, num);
  }
  return map;
}

function replaceExt(filePath: string, newExt: string): string {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, path.extname(filePath));
  return path.join(dir, base + newExt);
}

async function tryGetRootFileFromLatexWorkshop(current: vscode.Uri): Promise<vscode.Uri | undefined> {
  try {
    // LaTeX-Workshop は getRootFile を公開していない可能性があるため、一般的に使われるコマンド名を試す
    const cmdIds = [
      'latex-workshop.getRootFile',
      'latex-workshop.get.texroot'
    ];
    for (const id of cmdIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await vscode.commands.executeCommand(id, current.toString());
      if (!res) { continue; }
      if (typeof res === 'string') { return vscode.Uri.file(res); }
      if (res.fsPath) { return vscode.Uri.file(String(res.fsPath)); }
    }
  } catch {
    // ignore
  }
  return undefined;
}

function guessRootFromDocument(uri: vscode.Uri): vscode.Uri | undefined {
  // 単純にドキュメント自身を root とみなす（multi-fileは非対応、最低限のフォールバック）
  return uri;
}

async function statIfExists(u: vscode.Uri): Promise<{ mtime: number } | undefined> {
  try {
    const s = await vscode.workspace.fs.stat(u);
    return { mtime: s.mtime }; // 秒ではなくms単位
  } catch {
    return undefined;
  }
}

async function findAuxWithLabelsNear(contextUri: vscode.Uri): Promise<vscode.Uri | undefined> {
  try {
    const uris = await vscode.workspace.findFiles('**/*.aux', '**/{.git,node_modules,dist,build}/**', 400);
    const baseDir = path.dirname(contextUri.fsPath);
    const distance = (p: string) => {
      const rel = path.relative(baseDir, path.dirname(p));
      const parts = rel.split(path.sep).filter(Boolean);
      return parts.length;
    };
    const sorted = uris.sort((a, b) => distance(a.fsPath) - distance(b.fsPath));
    for (const u of sorted) {
      try {
        const bytes = await vscode.workspace.fs.readFile(u);
        const content = Buffer.from(bytes).toString('utf8');
        if (/\\newlabel\{[^}]+\}\{\{[^}]*/.test(content)) {
          return u;
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return undefined;
}

async function loadMergedAuxLabels(seed?: Map<string, string>): Promise<Map<string, string>> {
  const acc = new Map<string, string>(seed ? Array.from(seed.entries()) : []);
  try {
    const uris = await vscode.workspace.findFiles('**/*.aux', '**/{.git,node_modules,dist,build}/**', 300);
    for (const u of uris) {
      try {
        const bytes = await vscode.workspace.fs.readFile(u);
        const content = Buffer.from(bytes).toString('utf8');
        // \\newlabel が無いファイルはスキップ
        if (!/\\newlabel\{/.test(content)) { continue; }
        const m = parseAuxNewlabel(content);
        if (m.size > 0) {
          for (const [k, v] of m) { if (!acc.has(k)) { acc.set(k, v); } }
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return acc;
}

async function getAuxCandidates(root: vscode.Uri, currentDoc: vscode.Uri, docText?: string): Promise<vscode.Uri[]> {
  const cands: vscode.Uri[] = [];
  // 0) 現在編集中ファイル隣接
  cands.push(vscode.Uri.file(replaceExt(currentDoc.fsPath, '.aux')));
  // 1) ルート隣接
  cands.push(vscode.Uri.file(replaceExt(root.fsPath, '.aux')));
  // 2) 文書内の \bibliography{...}, \include{...}, \input{...} から近傍候補を追加
  try {
    const patterns = /\\(?:include|input)\{([^}]+)\}|\\bibliography\{([^}]+)\}/g;
    let m: RegExpExecArray | null;
    const dir = path.dirname(currentDoc.fsPath);
    const pushAux = (p: string) => {
      const texPath = p.endsWith('.tex') ? p : p + '.tex';
      const full = path.isAbsolute(texPath) ? texPath : path.join(dir, texPath);
      cands.push(vscode.Uri.file(replaceExt(full, '.aux')));
    };
    if (docText) {
      while ((m = patterns.exec(docText)) !== null) {
        const p = (m[1] || m[2] || '').trim();
        if (p) { pushAux(p); }
      }
    }
  } catch { /* ignore */ }
  try {
    const lw = vscode.workspace.getConfiguration('latex-workshop');
    const outDir = lw.get<string>('latex.outDir');
    if (outDir && typeof outDir === 'string' && outDir.trim().length > 0) {
      const rootDir = path.dirname(root.fsPath);
      const docDir = path.dirname(currentDoc.fsPath);
      const resolvedDoc = resolveOutDir(outDir, rootDir, root, docDir);
      const resolvedRoot = resolveOutDir(outDir, rootDir, root, rootDir);
      const baseDoc = path.basename(currentDoc.fsPath, path.extname(currentDoc.fsPath));
      const baseRoot = path.basename(root.fsPath, path.extname(root.fsPath));
      cands.push(vscode.Uri.file(path.join(resolvedDoc, `${baseDoc}.aux`)));
      cands.push(vscode.Uri.file(path.join(resolvedRoot, `${baseRoot}.aux`)));
    }
  } catch {
    // ignore
  }
  return cands;
}

function resolveOutDir(template: string, rootDir: string, root: vscode.Uri, docDir: string): string {
  let p = template;
  p = p.replace(/%DIR%/g, docDir);
  p = p.replace(/\$\{workspaceRoot\}/g, rootDir);
  // その他のトークンは未対応: 相対なら rootDir 基準
  if (!path.isAbsolute(p)) {
    p = path.join(rootDir, p);
  }
  return p;
}

async function refreshAuxCacheFromUri(auxUri: vscode.Uri): Promise<void> {
  try {
    const stat = await statIfExists(auxUri);
    if (!stat) { return; }
    const bytes = await vscode.workspace.fs.readFile(auxUri);
    const content = Buffer.from(bytes).toString('utf8');
    const map = parseAuxNewlabel(content);
    auxCache.auxUri = auxUri;
    auxCache.mtime = stat.mtime;
    auxCache.labelMap = map;
    ch.appendLine(`[prettifier] aux cache refreshed: ${auxUri.fsPath}, labels=${map.size}`);
    const ed = vscode.window.activeTextEditor;
    if (ed && (ed.document.languageId === 'latex' || ed.document.languageId === 'tex')) {
      void update(ed);
    }
  } catch {
    // ignore
  }
}
