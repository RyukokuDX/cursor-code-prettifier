# 設定リファレンス

このドキュメントでは、Cursor Code Prettifierのすべての設定項目を詳しく説明します。

## 基本設定

| 設定項目 | 型 | デフォルト | 説明 |
|---------|-----|----------|------|
| `cursorCodePrettifier.enabled` | `boolean` | `true` | 拡張機能の有効/無効を切り替える |
| `cursorCodePrettifier.symbolEnabled` | `boolean` | `true` | 記号グループ（ギリシャ文字、矢印、集合演算など）の有効/無効 |
| `cursorCodePrettifier.mathEnabled` | `boolean` | `true` | 数学コマンドグループ（`\frac`, `\sqrt`, `\left`, `\right`, `\bigg`など）の有効/無効 |
| `cursorCodePrettifier.texEnabled` | `boolean` | `true` | TeXコマンドグループ（`\begin`, `\end`, `\section`, `\cite`など）の有効/無効 |
| `cursorCodePrettifier.hoverRevealMs` | `number` | `1600` | ホバー時に元のコマンドを表示する時間（ミリ秒） |

## Counterモード（参照番号表示）

Counterモードは、`\ref`や`\eqref`コマンドをLaTeXの`.aux`ファイルから取得した実際の参照番号で表示する機能です。

詳細は[Counterモードガイド](counter-mode.md)を参照してください。

| 設定項目 | 型 | デフォルト | 説明 |
|---------|-----|----------|------|
| `cursorCodePrettifier.refMaskMode` | `string` | `emoji` | `\ref`/`\eqref` の表示方法（`emoji` または `counter`） |
| `cursorCodePrettifier.counterHighlightEnabled` | `boolean` | `true` | counterモードで番号マスクしている箇所を控えめに強調 |
| `cursorCodePrettifier.counterHighlightStyle` | `string` | `background` | 強調スタイル（`background` / `text` / `emoji` / `none`） |
| `cursorCodePrettifier.counterTextColor` | `string` | `#7aa2f7` | `counterHighlightStyle: "text"` のときの文字色 |

## 自動解除の制御

| 設定項目 | 型 | デフォルト | 説明 |
|---------|-----|----------|------|
| `cursorCodePrettifier.autoRevealOnHover` | `boolean` | `false` | ホバーで一時的にマスク解除 |
| `cursorCodePrettifier.autoRevealOnCaret` | `boolean` | `false` | キャレット位置で一時的にマスク解除 |

既定はどちらも `false`（無効）。必要な場合のみ有効化してください。

## カスタム変換ルール

| 設定項目 | 型 | 説明 |
|---------|-----|------|
| `cursorCodePrettifier.symbols` | `array` | 記号グループの変換候補（空の場合デフォルト値が使用されます） |
| `cursorCodePrettifier.math_commands` | `array` | 数学コマンドグループの変換候補（空の場合デフォルト値が使用されます） |
| `cursorCodePrettifier.tex_commands` | `array` | TeXコマンドグループの変換候補（空の場合デフォルト値が使用されます） |

各設定項目は、以下の形式のオブジェクトの配列です：

```json
{
  "original": "\\alpha",
  "display": "α"
}
```

### 設定例

```json
{
  "cursorCodePrettifier.symbolEnabled": true,
  "cursorCodePrettifier.mathEnabled": false,
  "cursorCodePrettifier.texEnabled": true,
  "cursorCodePrettifier.symbols": [
    { "original": "\\alpha", "display": "α" },
    { "original": "\\beta", "display": "β" },
    { "original": "\\to", "display": "→" }
  ],
  "cursorCodePrettifier.math_commands": [
    { "original": "\\frac", "display": "分数" }
  ],
  "cursorCodePrettifier.tex_commands": [
    { "original": "\\section", "display": "セクション" }
  ]
}
```

詳細な対応記号一覧は[対応記号一覧](supported-symbols.md)を参照してください。

## 設定のヒント

- **長いコマンドを優先**: 設定では長いコマンドから順にマッチングされるため、`\mathbb{R}`は`\mathbb`より優先されます
- **正規表現エスケープ**: 特殊文字は自動的にエスケープされるため、そのまま記述できます
- **単語境界**: `\`で始まらないコマンドは単語境界（`\b`）で囲まれます

