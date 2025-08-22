# Cursor Code Prettifier

Cursor Code Prettifierは、VS Code/Cursor拡張機能で、LaTeXファイル内のコマンドを視覚的に美しい記号や絵文字に置き換えて表示する機能を提供します。例えば、`\alpha`を`α`として表示し、マウスホバー時に元のコマンドを確認できるようになります。

## 🚀 新機能（v0.0.9以降）

- **豊富な数学記号**: ギリシャ文字、矢印、集合演算、積分記号など300以上の記号をサポート
- **カテゴリ別グループ化**: 論理記号、数学記号、ギリシャ文字、積分・和・積、矢印類、集合演算、特殊文字、LaTeXコマンドに分類
- **自動ビルドシステム**: 固定名VSIXファイルによる簡単な更新プロセス

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

### 開発者向けインストール（推奨）

1. リポジトリをクローン
   ```bash
   git clone https://github.com/RyukokuDX/cursor-code-prettifier.git
   cd cursor-code-prettifier
   ```

2. 依存関係をインストール
   ```bash
   npm install
   ```

3. 固定名VSIXファイルをビルド
   ```bash
   npm run build-latest
   ```

4. Cursor/VS Codeでインストール
   - 拡張機能タブ（Ctrl+Shift+X）を開く
   - 「...」メニュー（右上の歯車アイコン）をクリック
   - 「VSIXからのインストール」を選択
   - `cursor-code-prettifier-latest.vsix`を選択

### 更新手順

コードを変更した後は、以下のコマンドで簡単に更新できます：

```bash
npm run build-latest
```

その後、同じ`cursor-code-prettifier-latest.vsix`ファイルで再インストールするだけで更新されます（アンインストール不要）。

### 従来のインストール方法

[Releases](https://github.com/RyukokuDX/cursor-code-prettifier/releases)ページから最新のVSIXファイルをダウンロードしてインストールすることも可能です。

## 設定

この拡張機能は以下の設定を提供します：

### `cursorCodePrettifier.enabled`
- **型**: `boolean`
- **デフォルト**: `true`
- **説明**: 拡張機能の有効/無効を切り替える

### `cursorCodePrettifier.substitutions`
- **型**: `array`
- **説明**: LaTeXコマンドの置き換えルールを定義

#### 対応記号カテゴリ

現在、以下のカテゴリの記号をサポートしています：

**論理記号**
- `\forall` → ∀, `\exists` → ∃

**数学記号**
- `\partial` → ∂, `\infty` → ∞, `\leq` → ≤, `\geq` → ≥, `\times` → ×, `\prime` → ′, `\|` → ‖

**ギリシャ文字（小文字）**
- `\alpha` → α, `\beta` → β, `\gamma` → γ, `\delta` → δ, `\epsilon` → ϵ, `\varepsilon` → ε, `\zeta` → ζ, `\eta` → η, `\theta` → θ, `\iota` → ι, `\kappa` → κ, `\lambda` → λ, `\mu` → μ, `\nu` → ν, `\xi` → ξ, `\pi` → π, `\rho` → ρ, `\sigma` → σ, `\tau` → τ, `\upsilon` → υ, `\phi` → ϕ, `\varphi` → φ, `\chi` → χ, `\psi` → ψ, `\omega` → ω

**ギリシャ文字（大文字）**
- `\Delta` → Δ, `\Gamma` → Γ, `\Theta` → Θ, `\Lambda` → Λ, `\Xi` → Ξ, `\Pi` → Π, `\Sigma` → Σ, `\Phi` → Φ, `\Psi` → Ψ, `\Omega` → Ω

**積分・和・積**
- `\int` → ∫, `\iint` → ∬, `\iiint` → ∭, `\iiiint` → ⨌, `\oint` → ∮, `\oiint` → ∯, `\oiiint` → ∰
- `\sum` → ∑, `\prod` → ∏, `\coprod` → ∐, `\bigcup` → ⋃, `\bigcap` → ⋂, `\bigvee` → ⋁, `\bigwedge` → ⋀

**矢印類**
- `\to` → →, `\leftarrow` → ←, `\rightarrow` → →, `\leftrightarrow` → ↔
- `\Leftarrow` → ⇐, `\Rightarrow` → ⇒, `\Leftrightarrow` → ⇔
- `\mapsto` → ↦, `\hookleftarrow` → ↩, `\hookrightarrow` → ↪
- `\uparrow` → ↑, `\downarrow` → ↓, `\updownarrow` → ↕
- `\nearrow` → ↗, `\searrow` → ↘, `\swarrow` → ↙, `\nwarrow` → ↖
- `\longleftarrow` → ⟵, `\longrightarrow` → ⟶, `\longleftrightarrow` → ⟷

**集合演算**
- `\in` → ∈, `\notin` → ∉, `\ni` → ∋, `\notni` → ∌
- `\subset` → ⊂, `\supset` → ⊃, `\subseteq` → ⊆, `\supseteq` → ⊇
- `\cap` → ∩, `\cup` → ∪, `\emptyset` → ∅, `\setminus` → ∖
- `\oplus` → ⊕, `\ominus` → ⊖, `\otimes` → ⊗, `\odot` → ⊙

**特殊文字**
- `\mathbb{A}`～`\mathbb{Z}` → 𝔸～ℤ（二重線文字）
- `\mathfrak{A}`～`\mathfrak{Z}` → 𝔄～ℨ（フラクトゥール文字）

**LaTeXコマンド**
- `\section` → 🟥, `\subsection` → 🟨, `\subsubsection` → 🟩
- `\begin` → ⏩, `\end` → ⏪, `\cite` → 📖, `\label` → 🏷️
- `\ref` → 🔗, `\eqref` → 🔢, `\usepackage` → 📦, `\documentclass` → ☃️
- `\title` → 📘, `\author` → 😎, `\date` → 📅, `\bibliography` → 📚

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

## 今後の予定

- [ ] Markdownファイルのサポート
- [ ] 複数行コマンドのサポート
- [ ] ネストしたコマンドのサポート
- [ ] カスタム記号の追加機能
- [ ] 設定のインポート/エクスポート機能

## リリースノート

### 0.0.9
- **豊富な数学記号サポート**: ギリシャ文字、矢印、集合演算、積分記号など300以上の記号を追加
- **カテゴリ別グループ化**: 変換候補を論理的に分類して整理
- **自動ビルドシステム**: 固定名VSIXファイルによる簡単な更新プロセス
- **開発効率向上**: アンインストール不要の上書き更新機能

### 0.0.8
- ギリシャ文字の完全セットを追加（α～ω, Α～Ω）
- 矢印記号の大幅拡充（→, ←, ↔, ⇒, ⇐, ⇔, など）
- 集合演算記号の追加（∈, ∉, ⊂, ⊃, ∪, ∩, など）
- 積分記号の拡充（∫, ∬, ∭, ∮, ∯, ∰, など）

### 0.0.7
- 特殊文字の追加（\mathbb A～Z, \mathfrak A～Z）
- デフォルト変換候補の設定

### 0.0.6
- デフォルトJSONデータの実装
- 自動化スクリプトの追加

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

### ビルドコマンド

| コマンド | 説明 |
|---------|------|
| `npm run compile` | TypeScriptをコンパイル |
| `npm run watch` | ファイル変更を監視して自動コンパイル |
| `npm run build` | バージョン更新 + コンパイル + パッケージング |
| `npm run build-latest` | 固定名VSIXファイルを作成（推奨） |
| `npm run build-quick` | バージョン更新なしでクイックビルド |

### 開発ワークフロー

1. **コードを変更**
2. **ビルド実行**
   ```bash
   npm run build-latest
   ```
3. **インストール/更新**
   - `cursor-code-prettifier-latest.vsix`をCursor/VS Codeでインストール
   - 更新時は同じファイルで再インストール（アンインストール不要）

### プロジェクト構造

```
cursor-code-prettifier/
├── src/
│   └── extension.ts          # メイン拡張機能コード
├── scripts/
│   ├── build-latest.js       # 固定名ビルドスクリプト
│   ├── bump-version.js       # バージョン更新スクリプト
│   ├── install-vsix.js       # インストールスクリプト
│   └── update-extension.js   # 完全自動化スクリプト
├── package.json              # 設定と変換候補の定義
├── cursor-code-prettifier-latest.vsix  # 固定名VSIXファイル
└── README.md                 # このファイル
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

バグ報告や機能要望は、GitHubのIssuesページでお知らせください。

## 貢献

バグ報告や機能要望は、GitHubのIssuesページでお知らせください。

### 開発への参加

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

**お楽しみください！** 🎉
