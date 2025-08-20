# Cursor Code Prettifier

Cursor Code Prettifierは、VS Code拡張機能で、LaTeXファイル内のコマンドを視覚的に美しい記号や絵文字に置き換えて表示する機能を提供します。例えば、`\alpha`を`α`として表示し、マウスホバー時に元のコマンドを確認できるようになります。

## 機能

- **LaTeXコマンドの視覚的置き換え**: 設定されたLaTeXコマンドを記号や絵文字として表示
- **ホバー機能**: 置き換えられたテキストにマウスを重ねると元のコマンドを表示
- **キャレット位置での表示**: カーソルが置き換えられたテキスト上にある時も元のコマンドを表示
- **重複防止**: 長いコマンドを優先してマッチングし、重複を防止
- **リアルタイム更新**: ファイルの変更や設定の変更にリアルタイムで対応

### 対応言語
- LaTeX (`.tex`, `.latex`)
- TeX (`.tex`)

## インストール

### VSIXファイルからのインストール（推奨）

1. [Releases](https://github.com/RyukokuDX/cursor-code-prettifier/releases)ページから最新のVSIXファイル（`cursor-code-prettifier-0.0.3.vsix`）をダウンロード
2. VS Codeを開く
3. 拡張機能タブ（Ctrl+Shift+X）を開く
4. 「...」メニュー（右上の歯車アイコン）をクリック
5. 「VSIXからのインストール」を選択
6. ダウンロードしたVSIXファイルを選択してインストール

### 手動ビルドからのインストール

1. リポジトリをクローン
   ```bash
   git clone https://github.com/RyukokuDX/cursor-code-prettifier.git
   cd cursor-code-prettifier
   ```

2. 依存関係をインストールしてビルド
   ```bash
   npm install
   npm run compile
   npx vsce package
   ```

3. 生成されたVSIXファイルをインストール
   - VS Codeで拡張機能タブを開く
   - 「...」メニューから「VSIXからのインストール」を選択
   - `cursor-code-prettifier-0.0.3.vsix`を選択

## 設定

この拡張機能は以下の設定を提供します：

### `cursorCodePrettifier.enabled`
- **型**: `boolean`
- **デフォルト**: `true`
- **説明**: 拡張機能の有効/無効を切り替える

### `cursorCodePrettifier.substitutions`
- **型**: `array`
- **説明**: LaTeXコマンドの置き換えルールを定義

#### 設定例
```json
{
  "cursorCodePrettifier.substitutions": [
    { "original": "\\alpha", "display": "α" },
    { "original": "\\beta", "display": "β" },
    { "original": "\\gamma", "display": "γ" },
    { "original": "\\to", "display": "→" },
    { "original": "\\leq", "display": "≤" },
    { "original": "\\geq", "display": "≥" },
    { "original": "\\in", "display": "∈" },
    { "original": "\\notin", "display": "∉" },
    { "original": "\\forall", "display": "∀" },
    { "original": "\\exists", "display": "∃" },
    { "original": "\\partial", "display": "∂" },
    { "original": "\\infty", "display": "∞" },
    { "original": "\\int", "display": "∫" },
    { "original": "\\mathbb{R}", "display": "ℝ" },
    { "original": "\\mathbb{N}", "display": "ℕ" },
    { "original": "\\mathbb{Z}", "display": "ℤ" },
    { "original": "\\mathbb{Q}", "display": "ℚ" },
    { "original": "\\mathbb{C}", "display": "ℂ" },
    { "original": "\\cap", "display": "∩" },
    { "original": "\\cup", "display": "∪" },
    { "original": "\\emptyset", "display": "∅" },
    { "original": "\\times", "display": "×" },
    { "original": "\\frac", "display": "〓" },
    { "original": "\\sqrt", "display": "⟦√⟧" },
    { "original": "\\section", "display": "🟥" },
    { "original": "\\subsection", "display": "🟨" },
    { "original": "\\subsubsection", "display": "🟩" },
    { "original": "\\begin", "display": "⏩" },
    { "original": "\\end", "display": "⏪" },
    { "original": "\\cite", "display": "📖" },
    { "original": "\\label", "display": "🏷️" },
    { "original": "\\ref", "display": "🔗" },
    { "original": "\\eqref", "display": "🔢" },
    { "original": "\\usepackage", "display": "📦" },
    { "original": "\\documentclass", "display": "☃️" },
    { "original": "\\title", "display": "📘" },
    { "original": "\\author", "display": "😎" },
    { "original": "\\date", "display": "📅" },
    { "original": "\\bibliography", "display": "📚" }
  ]
}
```

### `cursorCodePrettifier.hoverRevealMs`
- **型**: `number`
- **デフォルト**: `1600`
- **説明**: ホバー時に元のコマンドを表示する時間（ミリ秒）

## 使用方法

1. 拡張機能をインストール後、LaTeXファイル（`.tex`）を開く
2. 設定で定義されたLaTeXコマンドが自動的に置き換えられて表示される
3. 置き換えられたテキストにマウスを重ねると、元のコマンドがツールチップで表示される
4. カーソルが置き換えられたテキスト上にある時も、一時的に元のコマンドが表示される

## カスタマイズ

独自の置き換えルールを追加するには：

1. VS Codeの設定を開く（Ctrl+,）
2. "Cursor Code Prettifier"を検索
3. "Substitutions"設定を編集
4. 新しいLaTeXコマンドと表示したい記号や絵文字を追加

### 設定のヒント
- **長いコマンドを優先**: 設定では長いコマンドから順にマッチングされるため、`\mathbb{R}`は`\mathbb`より優先されます
- **正規表現エスケープ**: 特殊文字は自動的にエスケープされるため、そのまま記述できます
- **単語境界**: `\`で始まらないコマンドは単語境界（`\b`）で囲まれます

## 技術仕様

- **重複防止**: 同じ位置に複数のコマンドがマッチした場合、長いコマンドが優先されます
- **リアルタイム更新**: ファイルの変更や設定の変更に即座に対応します
- **ホバー保持**: ホバー中は元のコマンドが表示され続け、設定可能な時間後に元の表示に戻ります
- **キャレット対応**: カーソルが置き換えられたテキスト上にある時も元のコマンドを表示します

## 既知の問題

現在、以下の制限があります：
- Markdownファイルには対応していません（LaTeX、TeXファイルのみ）
- 複数行にわたるコマンドには対応していません
- ネストしたコマンドには対応していません

## リリースノート

### 0.0.2
- ホバー機能の改善
- キャレット位置での元コマンド表示機能を追加
- 重複防止機能を追加
- リアルタイム更新機能を改善
- 設定の簡素化

### 0.0.1
- 初期リリース
- LaTeXファイルでの基本的なコマンド置き換え機能
- ホバー機能による元コマンド表示

## 開発

このプロジェクトはTypeScriptで開発されています。

### 開発環境のセットアップ
```bash
npm install
npm run compile
npm run watch
```

### ビルド
```bash
npm run compile
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

バグ報告や機能要望は、GitHubのIssuesページでお知らせください。

---

**お楽しみください！**
