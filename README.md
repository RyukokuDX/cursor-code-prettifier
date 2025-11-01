# Cursor Code Prettifier

Cursor Code Prettifierは、VS Code/Cursor拡張機能で、LaTeXファイル内のコマンドを視覚的に美しい記号や絵文字に置き換えて表示する機能を提供します。例えば、`\alpha`を`α`として表示し、マウスホバー時に元のコマンドを確認できるようになります。

## 📋 目次

- [機能](#機能)
- [インストール](#インストール)
- [クイックスタート](#クイックスタート)
- [設定](#設定)
- [使用方法](#使用方法)
- [カスタマイズ](#カスタマイズ)
- [開発](#開発)
- [リリースノート](#リリースノート)
- [既知の問題](#既知の問題)
- [今後の予定](#今後の予定)
- [貢献](#貢献)
- [ライセンス](#ライセンス)

## 機能

- **LaTeXコマンドの視覚的置き換え**: 設定されたLaTeXコマンドを記号や絵文字として表示
- **グループ別切り替え**: 記号・数学コマンド・TeXコマンドの3グループを個別に有効/無効可能
- **豊富な数学記号**: ギリシャ文字、矢印、集合演算、積分記号など300以上の記号をサポート
- **カテゴリ別グループ化**: 論理記号、数学記号、ギリシャ文字、積分・和・積、矢印類、集合演算、特殊文字、LaTeXコマンドに分類
- **ホバー機能**: 置き換えられたテキストにマウスを重ねると元のコマンドを表示
- **キャレット位置での表示**: カーソルが置き換えられたテキスト上にある時も元のコマンドを表示
- **重複防止**: 長いコマンドを優先してマッチングし、重複を防止
- **リアルタイム更新**: ファイルの変更や設定の変更にリアルタイムで対応
- **柔軟な設定**: 各グループのデフォルト設定を個別に上書き可能
- **マスク表示機能**: 行単位やドキュメント全体でマスク表示をトグル可能

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

## クイックスタート

1. 拡張機能をインストール後、LaTeXファイル（`.tex`）を開く
2. 設定で定義されたLaTeXコマンドが自動的に置き換えられて表示される
3. 置き換えられたテキストにマウスを重ねると、元のコマンドがツールチップで表示される
4. カーソルが置き換えられたテキスト上にある時も、一時的に元のコマンドが表示される

## 設定

基本的な設定項目は以下の通りです：

- **基本設定**: 拡張機能の有効/無効、グループ別の切り替え、ホバー時間など
- **Counterモード**: `\ref`/`\eqref`を実際の参照番号で表示
- **自動解除の制御**: ホバーやキャレット位置での一時的なマスク解除
- **カスタム変換ルール**: 独自の置き換えルールの追加

詳細は[設定リファレンス](docs/configuration.md)を参照してください。

### クイックリファレンス

| 設定項目 | デフォルト | 説明 |
|---------|----------|------|
| `cursorCodePrettifier.enabled` | `true` | 拡張機能の有効/無効 |
| `cursorCodePrettifier.symbolEnabled` | `true` | 記号グループの有効/無効 |
| `cursorCodePrettifier.mathEnabled` | `true` | 数学コマンドグループの有効/無効 |
| `cursorCodePrettifier.texEnabled` | `true` | TeXコマンドグループの有効/無効 |
| `cursorCodePrettifier.refMaskMode` | `emoji` | 参照表示モード（`emoji` または `counter`） |

### 対応記号

300以上の記号とLaTeXコマンドをサポートしています。

- 🔢 記号グループ: ギリシャ文字、矢印、集合演算、積分記号など
- 🧮 数学コマンドグループ: `\frac`, `\sqrt`, `\left`, `\right`など
- 📄 TeXコマンドグループ: `\section`, `\begin`, `\ref`, `\cite`など

詳細な一覧は[対応記号一覧](docs/supported-symbols.md)を参照してください。

## 使用方法

### マスク表示のトグル（行/全体）

**コマンド（Command Palette）**
- `Cursor Code Prettifier: Toggle Mask (Current Line)` - コマンドID: `cursorCodePrettifier.toggleMaskLine`
- `Cursor Code Prettifier: Toggle Mask (Document)` - コマンドID: `cursorCodePrettifier.toggleMaskAll`

**推奨キー割当**: `keybindings.json`
```json
[
  { 
    "key": "ctrl+alt+m", 
    "command": "cursorCodePrettifier.toggleMaskLine", 
    "when": "editorTextFocus && (editorLangId == latex || editorLangId == tex)" 
  },
  { 
    "key": "ctrl+alt+shift+m", 
    "command": "cursorCodePrettifier.toggleMaskAll", 
    "when": "editorTextFocus && (editorLangId == latex || editorLangId == tex)" 
  }
]
```

**Neovim統合環境での使用**

Cursor/VS CodeでNeovimを使用している場合（`vscode-neovim`など）、`.nvim.lua`ファイルに設定を追加することで`:Ml`コマンドで行のマスクをトグルできます。

詳細は[Neovim統合ガイド](docs/neovim-integration.md)を参照してください。

## カスタマイズ

独自の置き換えルールを追加して、拡張機能をカスタマイズできます。

詳細は[カスタマイズガイド](docs/customization.md)を参照してください。

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
├── docs/
│   ├── neovim-integration.md  # Neovim統合ガイド
│   ├── configuration.md        # 設定リファレンス
│   ├── counter-mode.md         # Counterモードガイド
│   ├── supported-symbols.md    # 対応記号一覧
│   └── customization.md        # カスタマイズガイド
├── package.json              # 設定と変換候補の定義
├── cursor-code-prettifier-latest.vsix  # 固定名VSIXファイル
└── README.md                 # このファイル
```

## リリースノート

### 0.1.31 (2025-11-01)
- Spec: changement/v00_01_31_20251101_2204_mask_on_off_commands.md

#### Added
- 

#### Changed
- 

#### Fixed
- 

#### Docs
- 

#### Chore
- 




### 0.1.30 (2025-10-26)
- Spec: changement/v00_01_30_log_injection.md

### 0.1.0
- **グループ別切り替え機能**: 記号・数学コマンド・TeXコマンドの3グループを個別に有効/無効可能
- **設定構造の改善**: `substitutions`を`symbols`、`math_commands`、`tex_commands`に分割
- **デフォルト設定の最適化**: 各グループに適切なデフォルト値を設定
- **柔軟なカスタマイズ**: 各グループのデフォルト設定を個別に上書き可能

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

<details>
<summary>以前のリリースノート</summary>

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

</details>

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
