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
  const userSubs = cfg.get<Sub[]>('substitutions', []) ?? [];
  
  // ユーザー設定が空の場合はデフォルト値を使用
  const subs = userSubs.length > 0 ? userSubs : [
    { original: "\\forall", display: "∀" },
    { original: "\\exists", display: "∃" },
    { original: "\\partial", display: "∂" },
    { original: "\\infty", display: "∞" },
    { original: "\\lesssim", display: "≲" },
    { original: "\\sim", display: "∼" },
    { original: "\\leq", display: "≤" },
    { original: "\\geq", display: "≥" },
    { original: "\\times", display: "×" },
    { original: "\\prime", display: "′" },
    { original: "\\|", display: "‖" },
    { original: "\\alpha", display: "α" },
    { original: "\\beta", display: "β" },
    { original: "\\gamma", display: "γ" },
    { original: "\\delta", display: "δ" },
    { original: "\\epsilon", display: "ϵ" },
    { original: "\\varepsilon", display: "ε" },
    { original: "\\zeta", display: "ζ" },
    { original: "\\eta", display: "η" },
    { original: "\\theta", display: "θ" },
    { original: "\\iota", display: "ι" },
    { original: "\\kappa", display: "κ" },
    { original: "\\lambda", display: "λ" },
    { original: "\\mu", display: "μ" },
    { original: "\\nu", display: "ν" },
    { original: "\\xi", display: "ξ" },
    { original: "\\pi", display: "π" },
    { original: "\\rho", display: "ρ" },
    { original: "\\sigma", display: "σ" },
    { original: "\\tau", display: "τ" },
    { original: "\\upsilon", display: "υ" },
    { original: "\\phi", display: "ϕ" },
    { original: "\\varphi", display: "φ" },
    { original: "\\chi", display: "χ" },
    { original: "\\psi", display: "ψ" },
    { original: "\\omega", display: "ω" },
    { original: "\\Delta", display: "Δ" },
    { original: "\\Gamma", display: "Γ" },
    { original: "\\Theta", display: "Θ" },
    { original: "\\Lambda", display: "Λ" },
    { original: "\\Xi", display: "Ξ" },
    { original: "\\Pi", display: "Π" },
    { original: "\\Sigma", display: "Σ" },
    { original: "\\Phi", display: "Φ" },
    { original: "\\Psi", display: "Ψ" },
    { original: "\\Omega", display: "Ω" },
    { original: "\\int", display: "∫" },
    { original: "\\iint", display: "∬" },
    { original: "\\iiint", display: "∭" },
    { original: "\\iiiint", display: "⨌" },
    { original: "\\oint", display: "∮" },
    { original: "\\oiint", display: "∯" },
    { original: "\\oiiint", display: "∰" },
    { original: "\\intop", display: "∫" },
    { original: "\\smallint", display: "∫" },
    { original: "\\intlimits", display: "∫" },
    { original: "\\int\\limits", display: "∫" },
    { original: "\\int\\nolimits", display: "∫" },
    { original: "\\sum\\limits", display: "∑" },
    { original: "\\sum\\nolimits", display: "∑" },
    { original: "\\prod\\limits", display: "∏" },
    { original: "\\prod\\nolimits", display: "∏" },
    { original: "\\coprod\\limits", display: "∐" },
    { original: "\\coprod\\nolimits", display: "∐" },
    { original: "\\bigcup\\limits", display: "⋃" },
    { original: "\\bigcap\\limits", display: "⋂" },
    { original: "\\bigvee\\limits", display: "⋁" },
    { original: "\\bigwedge\\limits", display: "⋀" },
    { original: "\\biguplus\\limits", display: "⨄" },
    { original: "\\bigsqcup\\limits", display: "⨆" },
    { original: "\\to", display: "→" },
    { original: "\\leftarrow", display: "←" },
    { original: "\\rightarrow", display: "→" },
    { original: "\\leftrightarrow", display: "↔" },
    { original: "\\Leftarrow", display: "⇐" },
    { original: "\\Rightarrow", display: "⇒" },
    { original: "\\Leftrightarrow", display: "⇔" },
    { original: "\\mapsto", display: "↦" },
    { original: "\\hookleftarrow", display: "↩" },
    { original: "\\hookrightarrow", display: "↪" },
    { original: "\\leftharpoonup", display: "↼" },
    { original: "\\rightharpoonup", display: "⇀" },
    { original: "\\leftharpoondown", display: "↽" },
    { original: "\\rightharpoondown", display: "⇁" },
    { original: "\\rightleftharpoons", display: "⇌" },
    { original: "\\leftrightharpoons", display: "⇋" },
    { original: "\\uparrow", display: "↑" },
    { original: "\\downarrow", display: "↓" },
    { original: "\\updownarrow", display: "↕" },
    { original: "\\Uparrow", display: "⇑" },
    { original: "\\Downarrow", display: "⇓" },
    { original: "\\Updownarrow", display: "⇕" },
    { original: "\\nearrow", display: "↗" },
    { original: "\\searrow", display: "↘" },
    { original: "\\swarrow", display: "↙" },
    { original: "\\nwarrow", display: "↖" },
    { original: "\\longleftarrow", display: "⟵" },
    { original: "\\longrightarrow", display: "⟶" },
    { original: "\\longleftrightarrow", display: "⟷" },
    { original: "\\Longleftarrow", display: "⟸" },
    { original: "\\Longrightarrow", display: "⟹" },
    { original: "\\Longleftrightarrow", display: "⟺" },
    { original: "\\longmapsto", display: "⟼" },
    { original: "\\xleftarrow", display: "⟵" },
    { original: "\\xrightarrow", display: "⟶" },
    { original: "\\xleftrightarrow", display: "⟷" },
    { original: "\\cap", display: "∩" },
    { original: "\\cup", display: "∪" },
    { original: "\\emptyset", display: "∅" },
    { original: "\\in", display: "∈" },
    { original: "\\notin", display: "∉" },
    { original: "\\ni", display: "∋" },
    { original: "\\notni", display: "∌" },
    { original: "\\subset", display: "⊂" },
    { original: "\\supset", display: "⊃" },
    { original: "\\subseteq", display: "⊆" },
    { original: "\\supseteq", display: "⊇" },
    { original: "\\subsetneq", display: "⊊" },
    { original: "\\supsetneq", display: "⊋" },
    { original: "\\sqsubset", display: "⊏" },
    { original: "\\sqsupset", display: "⊐" },
    { original: "\\sqsubseteq", display: "⊑" },
    { original: "\\sqsupseteq", display: "⊒" },
    { original: "\\setminus", display: "∖" },
    { original: "\\triangle", display: "△" },
    { original: "\\bigtriangleup", display: "△" },
    { original: "\\bigtriangledown", display: "▽" },
    { original: "\\triangleleft", display: "◁" },
    { original: "\\triangleright", display: "▷" },
    { original: "\\oplus", display: "⊕" },
    { original: "\\ominus", display: "⊖" },
    { original: "\\otimes", display: "⊗" },
    { original: "\\oslash", display: "⊘" },
    { original: "\\odot", display: "⊙" },
    { original: "\\bigcirc", display: "○" },
    { original: "\\amalg", display: "⨿" },
    { original: "\\uplus", display: "⊎" },
    { original: "\\bigcup", display: "⋃" },
    { original: "\\bigcap", display: "⋂" },
    { original: "\\biguplus", display: "⨄" },
    { original: "\\bigsqcup", display: "⨆" },
    { original: "\\coprod", display: "∐" },
    { original: "\\prod", display: "∏" },
    { original: "\\sum", display: "∑" },
    { original: "\\bigvee", display: "⋁" },
    { original: "\\bigwedge", display: "⋀" },
    { original: "\\mathbb R", display: "ℝ" },
    { original: "\\mathbb A", display: "𝔸" },
    { original: "\\mathbb B", display: "𝔹" },
    { original: "\\mathbb C", display: "ℂ" },
    { original: "\\mathbb D", display: "𝔻" },
    { original: "\\mathbb E", display: "𝔼" },
    { original: "\\mathbb F", display: "𝔽" },
    { original: "\\mathbb G", display: "𝔾" },
    { original: "\\mathbb H", display: "ℍ" },
    { original: "\\mathbb I", display: "𝕀" },
    { original: "\\mathbb J", display: "𝕁" },
    { original: "\\mathbb K", display: "𝕂" },
    { original: "\\mathbb L", display: "𝕃" },
    { original: "\\mathbb M", display: "𝕄" },
    { original: "\\mathbb N", display: "ℕ" },
    { original: "\\mathbb O", display: "𝕆" },
    { original: "\\mathbb P", display: "ℙ" },
    { original: "\\mathbb Q", display: "ℚ" },
    { original: "\\mathbb S", display: "𝕊" },
    { original: "\\mathbb T", display: "𝕋" },
    { original: "\\mathbb U", display: "𝕌" },
    { original: "\\mathbb V", display: "𝕍" },
    { original: "\\mathbb W", display: "𝕎" },
    { original: "\\mathbb X", display: "𝕏" },
    { original: "\\mathbb Y", display: "𝕐" },
    { original: "\\mathbb Z", display: "ℤ" },
    { original: "\\mathfrak A", display: "𝔄" },
    { original: "\\mathfrak B", display: "𝔅" },
    { original: "\\mathfrak C", display: "ℭ" },
    { original: "\\mathfrak D", display: "𝔇" },
    { original: "\\mathfrak E", display: "𝔈" },
    { original: "\\mathfrak F", display: "𝔉" },
    { original: "\\mathfrak G", display: "𝔊" },
    { original: "\\mathfrak H", display: "ℌ" },
    { original: "\\mathfrak I", display: "ℑ" },
    { original: "\\mathfrak J", display: "𝔍" },
    { original: "\\mathfrak K", display: "𝔎" },
    { original: "\\mathfrak L", display: "𝔏" },
    { original: "\\mathfrak M", display: "𝔐" },
    { original: "\\mathfrak N", display: "𝔑" },
    { original: "\\mathfrak O", display: "𝔒" },
    { original: "\\mathfrak P", display: "𝔓" },
    { original: "\\mathfrak Q", display: "𝔔" },
    { original: "\\mathfrak R", display: "ℜ" },
    { original: "\\mathfrak S", display: "𝔖" },
    { original: "\\mathfrak T", display: "𝔗" },
    { original: "\\mathfrak U", display: "𝔘" },
    { original: "\\mathfrak V", display: "𝔙" },
    { original: "\\mathfrak W", display: "𝔚" },
    { original: "\\mathfrak X", display: "𝔛" },
    { original: "\\mathfrak Y", display: "𝔜" },
    { original: "\\mathfrak Z", display: "ℨ" },
    { original: "\\left", display: "️️️️◀️" },
    { original: "\\right", display: "️️▶️" },
    { original: "\\frac", display: "〓" },
    { original: "\\sqrt", display: "⟦√⟧" },
    { original: "\\label", display: "🏷️" },
    { original: "\\ref", display: "🔗" },
    { original: "\\eqref", display: "🔢" },
    { original: "\\section", display: "🟥" },
    { original: "\\subsection", display: "🟨" },
    { original: "\\subsubsection", display: "🟩" },
    { original: "\\begin", display: "⏩" },
    { original: "\\end", display: "⏪" },
    { original: "\\cite", display: "📖" },
    { original: "\\newtheorem", display: "🏛️" },
    { original: "\\usepackage", display: "📦" },
    { original: "\\documentclass", display: "☃️" },
    { original: "\\title", display: "📘" },
    { original: "\\author", display: "😎" },
    { original: "\\date", display: "📅" },
    { original: "\\bibliographystyle", display: "🎨" },
    { original: "\\bibliography", display: "📚" },
    { original: "\\bigg", display: "🌲" },
    { original: "\\ll", display: "≪" },
    { original: "\\\\", display: "⏎" }
  ]
    .slice()
    .sort((a: Sub, b: Sub) => b.original.length - a.original.length); // 長い順で優先

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
