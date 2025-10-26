# 変更仕様 v0.1.30: ビルド/バンプ時のログ自動挿入

## 背景
- VS Code / Cursor の拡張機能表示（拡張ギャラリー、拡張ビュー）の「変更点（Changelog）」や説明欄に、本機能の最新の変更ログが十分に反映されていない。
- 手動で README/CHANGELOG を編集する運用では抜け漏れが発生しやすい。

## 目的
- `build` または `bump-version` 実行時に、最新のログ断片（ハイライト、改善点、既知の注意点）を README と CHANGELOG（新規導入可）へ自動注入し、拡張の表示に反映される状態を常に保つ。

## スコープ
- 自動注入する対象:
  - README.md の「リリースノート/変更履歴」セクション
  - CHANGELOG.md（なければ作成）
- トリガー:
  - `npm run build`（内部で `npm run bump-version` 実行済）
  - `npm run build-latest`
  - `npm run update`（内部で `bump-version` → `compile` → `package`）
- 対象バージョン:
  - `package.json.version` に基づく新リリースセクションを生成

## 仕様詳細
### 入力（テンプレート＝リリースノート雛形）
- 定義: 本仕様における「テンプレ」は、ビルド時に README/CHANGELOG へ差し込むリリースノートの雛形ファイル。
- 位置: `changement/_release_notes.md`
- 役割: 
  - バージョン・日付・直近の仕様変更書リンクなどを差し込むための枠を提供
  - 見出し（Added/Changed/Fixed/Docs/Chore 等）の骨格を提供（空項目は出力しない）
- 変数（ビルド時置換）:
  - `${version}`: 追加後の `package.json.version`
  - `${date}`: YYYY-MM-DD（ローカルタイム）
  - `${specPath}`: 直近の変更仕様書（後述）の相対パス
- 例（テンプレート）:
  ```md
  ### ${version} (${date})
  - Spec: ${specPath}
  
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
  ```

### 入力（変更仕様書＝ソース）
- 定義: リリースの根拠となる機能仕様の記録。`changement/` 配下のバージョン付き Markdown（例: `v00_01_30_*.md`）。
- 選定規則: `changement/` 直下の `*.md` のうち、`_` で始まらないファイルの最終更新日時が最新の 1 件を採用。
- 必須: 変更仕様書が存在しない場合はエラー停止（ビルド／バンプを中断）。

### 出力
- README.md
  - 先頭の「概要」は変更せず、末尾の「Release Notes」セクションの先頭に `${version}` の小見出しを追記（最大 N 件に古いものの折り畳み可）。
- CHANGELOG.md（新規）
  - Keep a Changelog 風の構成。
  - 直近の `${version}` セクションを最上部に追記。

### 生成ロジック
- `scripts/bump-version.js` 実行直後（またはその内部）で `package.json.version` を読み取り、テンプレートを読み込んで変数置換。
- 直近の変更仕様書を検出し、その相対パスを `${specPath}` に差し込み。
- ファイルへの挿入位置:
  - README.md: `## Release Notes`（または `## リリースノート`。いずれも無ければ後者を新設）配下の先頭に追記。
  - CHANGELOG.md: 先頭に追記。
- 重複防止:
  - 同一 `${version}` のセクションがすでに存在する場合はスキップ。

### エラーハンドリング
- テンプレート（`changement/_release_notes.md`）が無い場合: 既定雛形を自動生成して注入（ビルド継続）。
- 変更仕様書（直近の `changement/*.md`）が見つからない場合: エラー停止（プロセス終了コード≠0）。
- README/CHANGELOG への書き込み失敗: エラー停止（プロセス終了コード≠0）。

### ログ出力（ビルド時コンソール）
- `📝 Injecting release notes for v${version}...`
- `✅ README.md updated` / `✅ CHANGELOG.md updated`（スキップ時は `⏭️ Skip: already exists`）
- `⚠️ Template not found` など。

## 受け入れ基準
- `npm run build-latest` 実行後、`README.md` と `CHANGELOG.md` に新バージョンの項が自動で追加される。
- 同一バージョンで再実行しても重複追記されない。
- テンプレート未提供でもビルドは成功（自動生成を注入）。変更仕様書が存在しない場合のみエラー停止。

## リスクとロールバック
- リスク: 誤挿入（パーサの誤検出）により README の構造が崩れる可能性。
  - 緩和: セクション見出しの厳密一致、バックアップファイル（`.bak`）の自動作成。
- ロールバック: 直前の `.bak` に戻すか、Git で差分を取り消す。

## 実装方針（概要）
- 新規スクリプト `scripts/inject-release-notes.js` を追加。
- `scripts/bump-version.js` から呼び出し（または `build-latest.js` / `update-extension.js` の直後に呼ぶ）。
- 既存の `README.md` に `## Release Notes` セクションが無ければ自動生成（日本語見出しにも対応）。
- VS Code 拡張ギャラリーで表示される内容は主に `README.md` なので、注入後に `vsce package` で反映。

## 専用コマンド: 変更仕様書の自動コミット
### 目的
- 変更仕様書（`changement/` 配下の最新版）を素早くステージング・コミットする運用を標準化する。

### 仕様
- 対象ファイルの決定:
  - デフォルト: `changement/` 配下のうち、最終更新日時が最新の `*.md` を 1 件選択。
  - オプション: 引数で明示ファイル指定があれば、それを優先。
- 実行内容:
  - `git add <file>`
  - `git commit -m "doc: <file_name>"`
  - （オプション）`--push` 指定時のみ `git push` を実行。
- ログ出力例:
  - `🧾 Latest spec: changement/v00_01_30_log_injection.md`
  - `✅ Committed with message: doc: v00_01_30_log_injection.md`
  - `⏭️ Skip: nothing to commit`（差分なし）

### コマンドインターフェース（案）
```
node scripts/commit-latest-spec.js [--file <path>] [--push]
```
- `--file <path>`: コミット対象の仕様書を明示指定（ルート/相対どちらも可）。
- `--push`: コミット後に現在のブランチへ push。
- `--dry-run`: 実行内容のみ表示して終了（I/O なし）。

### 受け入れ基準（追加）
- `node scripts/commit-latest-spec.js` 実行で、最新の仕様書のみが `doc: <file_name>` 形式でコミットされる。
- 対象に差分がない場合はコミットを行わず、スキップログが出力される。
- `--file` 指定時はそのファイルが対象になる。

### リスク・運用注意
- 想定外のファイルが最新になっている場合に誤コミットの恐れ。
  - 緩和: `--dry-run` で事前確認、あるいは `--file` 明示指定を推奨。
- リポジトリの未保存変更が多い場合、仕様書以外が巻き込まれないよう `git add` は対象ファイルのみを指定。

### 実装方針（概要）
- 新規スクリプト `scripts/commit-latest-spec.js` を追加。
- `fs.readdir` で `changement/` を列挙し、`stat.mtime` 最大の `*.md` を取得。
- `child_process.execSync` で `git add`/`git commit`/`git push` を順次実行。
- 失敗時は終了コード非0でプロセス終了、標準エラーへ要約を出力。


