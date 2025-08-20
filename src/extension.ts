import * as vscode from 'vscode';

type Sub = { original: string; display: string };

let deco: vscode.TextEditorDecorationType;
let ch: vscode.OutputChannel;

export function activate(ctx: vscode.ExtensionContext) {
  ch = vscode.window.createOutputChannel('Prettifier');
  ch.appendLine('[prettifier] activate called');
  vscode.window.showInformationMessage('Prettifier activated'); // 起動トースト

  deco = vscode.window.createTextEditorDecorationType({
    color: 'transparent',
    after: { color: new vscode.ThemeColor('editor.foreground') },
  });
  ctx.subscriptions.push(deco, ch);

  const ed0 = vscode.window.activeTextEditor;
  if (ed0) { update(ed0); }

  ctx.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((ed: vscode.TextEditor | undefined) => {
      ch.appendLine(`[prettifier] onDidChangeActiveTextEditor: ${ed?.document.languageId ?? 'none'}`);
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
    }),
    vscode.commands.registerCommand('cursor-code-prettifier.helloWorld', () => {
      vscode.window.showInformationMessage('Hello from Prettifier');
    })
  );
}

function update(editor: vscode.TextEditor) {
  const lang = editor.document.languageId;
  ch.appendLine(`[prettifier] update: languageId=${lang}`);

  if (lang !== 'latex' && lang !== 'tex') {
    editor.setDecorations(deco, []);
    ch.appendLine('[prettifier] skip: not latex/tex');
    return;
  }

  const cfg = vscode.workspace.getConfiguration('cursorCodePrettifier');
  const enabled = cfg.get<boolean>('enabled', true);
  const subs = (cfg.get<Sub[]>('substitutions', []) ?? [])
    .slice()
    .sort((a: Sub, b: Sub) => b.original.length - a.original.length);

  ch.appendLine(`[prettifier] enabled=${enabled} subs=${subs.length}`);
  if (!enabled || subs.length === 0) {
    editor.setDecorations(deco, []);
    return;
  }

  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const text = editor.document.getText();
  const decos: vscode.DecorationOptions[] = [];

  for (const { original, display } of subs) {
    const useWB = !(original.startsWith('\\')) && /^\w/.test(original) && /\w$/.test(original);
    const patt = useWB ? `\\b${esc(original)}\\b` : esc(original);
    const re = new RegExp(patt, 'gu');

    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = editor.document.positionAt(m.index);
      const end = editor.document.positionAt(m.index + m[0].length);
      const lenCh = [...m[0]].length;

      decos.push({
        range: new vscode.Range(start, end),
        renderOptions: { after: { contentText: display, margin: `0 0 0 -${lenCh}ch` } }
      });
    }
  }

  editor.setDecorations(deco, decos);
  ch.appendLine(`[prettifier] applied decorations: ${decos.length}`);
}

export function deactivate() {}
