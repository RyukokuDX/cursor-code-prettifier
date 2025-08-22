import * as vscode from 'vscode';

type Sub = { original: string; display: string };

let deco: vscode.TextEditorDecorationType;
let ch: vscode.OutputChannel;

// ドキュメントごとの装飾と索引
const docDecos = new Map<string, vscode.DecorationOptions[]>();
const docIndex = new Map<string, Array<{ range: vscode.Range; original: string; display: string; lenCh: number }>>();

// hover/キャレットで一時的に非表示にした範囲の管理
const hiddenKeys = new Set<string>();
const hideTimers = new Map<string, NodeJS.Timeout>();

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
  ctx.subscriptions.push(deco, ch);

  const ed0 = vscode.window.activeTextEditor;
  if (ed0) {
    update(ed0);
  }

  // エディタ切替・本文変更・設定変更
  ctx.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((ed: vscode.TextEditor | undefined) => {
      if (ed) { update(ed); }
    }),
    vscode.workspace.onDidChangeTextDocument((ev: vscode.TextDocumentChangeEvent) => {
      const ed = vscode.window.activeTextEditor;
      if (ed && ev.document === ed.document) { update(ed); }
    }),
    vscode.workspace.onDidChangeConfiguration((ev: vscode.ConfigurationChangeEvent) => {
      if (ev.affectsConfiguration('cursorCodePrettifier')) {
        const ed = vscode.window.activeTextEditor;
        if (ed) { update(ed); }
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
}

function update(editor: vscode.TextEditor) {
  const lang = editor.document.languageId;
  if (lang !== 'latex' && lang !== 'tex') {
    editor.setDecorations(deco, []);
    return;
  }

  const cfg = vscode.workspace.getConfiguration('cursorCodePrettifier');
  const enabled = cfg.get<boolean>('enabled', true);
  
  // 新しい設定構造から読み込み
  const userSymbols = cfg.get<Sub[]>('symbols', []) ?? [];
  const userMathCommands = cfg.get<Sub[]>('math_commands', []) ?? [];
  const userTexCommands = cfg.get<Sub[]>('tex_commands', []) ?? [];
  
  // デバッグ情報を出力
  ch.appendLine(`[prettifier] Extension enabled: ${enabled}`);
  ch.appendLine(`[prettifier] User symbols count: ${userSymbols.length}`);
  ch.appendLine(`[prettifier] User math commands count: ${userMathCommands.length}`);
  ch.appendLine(`[prettifier] User tex commands count: ${userTexCommands.length}`);
  
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

  const decos: vscode.DecorationOptions[] = [];
  const index: Array<{ range: vscode.Range; original: string; display: string; lenCh: number }> = [];

  // ★確定済みマッチの占有区間（ドキュメントオフセット基準）でオーバーラップを禁止
  const taken: Array<[number, number]> = [];
  const overlaps = (s: number, e: number) => taken.some(([S, E]) => Math.max(S, s) < Math.min(E, e));

  for (const { original, display } of subs) {
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

      const range = new vscode.Range(start, end);
      const d: vscode.DecorationOptions = {
        range,
        renderOptions: { after: { contentText: display, margin: `0 0 0 -${lenCh}ch` } }
      };

      decos.push(d);
      index.push({ range, original, display, lenCh });
      taken.push([startOff, endOff]); // 占有登録
    }
  }

  const uri = editor.document.uri.toString();
  docDecos.set(uri, decos);
  docIndex.set(uri, index);

  // 既に一部が“保持で非表示”になっている場合は、そのまま維持して適用
  const effective = applyHiddenFilter(uri, decos);
  editor.setDecorations(deco, effective);
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
}
