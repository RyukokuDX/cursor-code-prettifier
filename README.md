# Cursor Code Prettifier

Cursor Code Prettifierは、VS Code拡張機能で、LaTeXやMarkdownファイル内の特定の単語を別の表示テキストに置き換える機能を提供します。例えば、LaTeXのコマンド（`\alpha`）を実際の記号（α）として表示し、マウスホバー時に元のテキストを確認できるようになります。

## 機能

- **単語の置き換え表示**: 設定された単語を別のテキストとして表示
- **ホバー機能**: 置き換えられたテキストにマウスを重ねると元のテキストを表示
- **言語別設定**: LaTeX、Markdown、TeXファイルで動作
- **カスタマイズ可能**: 設定ファイルで置き換えルールを自由に定義

### 対応言語
- LaTeX (`.tex`, `.latex`)
- Markdown (`.md`, `.markdown`)
- TeX (`.tex`)

## インストール

1. VS Codeを開く
2. 拡張機能タブ（Ctrl+Shift+X）を開く
3. "Cursor Code Prettifier"を検索
4. インストールボタンをクリック

## 設定

この拡張機能は以下の設定を提供します：

### `cursorCodePrettifier.enabled`
- **型**: `boolean`
- **デフォルト**: `true`
- **説明**: 単語の置き換え機能を有効/無効にする

### `cursorCodePrettifier.substitutions`
- **型**: `array`
- **説明**: 各言語に対する単語の置き換えルールを定義

#### デフォルト設定例
```json
{
  "cursorCodePrettifier.substitutions": [
    {
      "language": "latex",
      "words": [
        { "original": "\\alpha", "display": "α" },
        { "original": "\\beta", "display": "β" },
        { "original": "\\gamma", "display": "γ" },
        { "original": "\\to", "display": "→" },
        { "original": "\\leq", "display": "≤" },
        { "original": "\\geq", "display": "≥" },
        { "original": "\\in", "display": "∈" },
        { "original": "\\notin", "display": "∉" }
      ]
    }
  ]
}
```

## 使用方法

1. 拡張機能をインストール後、LaTeX、Markdown、またはTeXファイルを開く
2. 設定で定義された単語が自動的に置き換えられて表示される
3. 置き換えられたテキストにマウスを重ねると、元のテキストがツールチップで表示される

## カスタマイズ

独自の置き換えルールを追加するには：

1. VS Codeの設定を開く（Ctrl+,）
2. "Cursor Code Prettifier"を検索
3. "Substitutions"設定を編集
4. 新しい言語や単語の置き換えルールを追加

### 設定例
```json
{
  "cursorCodePrettifier.substitutions": [
    {
      "language": "markdown",
      "words": [
        { "original": "\\[", "display": "「" },
        { "original": "\\]", "display": "」" },
        { "original": "\\{", "display": "｛" },
        { "original": "\\}", "display": "｝" }
      ]
    }
  ]
}
```

## 既知の問題

現在、以下の制限があります：
- 正規表現の置き換えには対応していません
- 複数行にわたる置き換えには対応していません

## リリースノート

### 0.0.1
- 初期リリース
- LaTeX、Markdown、TeXファイルでの基本的な単語置き換え機能
- ホバー機能による元テキスト表示

## 開発

このプロジェクトはTypeScriptで開発されています。

### 開発環境のセットアップ
```bash
npm install
npm run compile
npm run watch
```

### テスト
```bash
npm run test
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

バグ報告や機能要望は、GitHubのIssuesページでお知らせください。

---

**お楽しみください！**
