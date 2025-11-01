# Counterモード

Counterモードは、`\ref`や`\eqref`コマンドをLaTeXの`.aux`ファイルから取得した実際の参照番号で表示する機能です。

## 概要

通常のモード（`emoji`）では、`\ref`や`\eqref`は絵文字で表示されます：
- `\ref{sec:intro}` → 🔗
- `\eqref{eq:main}` → 🔢

Counterモード（`counter`）では、実際の参照番号が表示されます：
- `\ref{sec:intro}` → `1.2`（セクション1.2への参照）
- `\eqref{eq:main}` → `(3)`（式3への参照）

## 設定方法

`settings.json`で以下の設定を行います：

```json
{
  "cursorCodePrettifier.refMaskMode": "counter"
}
```

## 動作要件

Counterモードを有効にするには、以下の条件が必要です：

1. **LaTeXファイルがビルドされていること**: `.aux`ファイルが存在する必要があります
2. **参照ラベルが定義されていること**: `\label{...}`で定義されたラベルが存在する必要があります

### `.aux`ファイルの場所

拡張機能は以下の順序で`.aux`ファイルを検索します：

1. 編集中の`.tex`ファイルと同じディレクトリの同名`.aux`ファイル
2. LaTeX-Workshopが検出したルートファイルの`.aux`ファイル
3. プロジェクト内の他の`.aux`ファイル（`\newlabel`を含むもの）

## `.aux`ファイルを保持する方法

Counterモードを使用するには、`.aux`ファイルをビルド後に残しておく必要があります。以下のいずれかの方法で設定してください。

### 方法1: LaTeX-Workshopのクリーン機能を無効化

```json
{
  "latex-workshop.latex.clean.enabled": false
}
```

### 方法2: クリーン対象から`aux`を除外

```json
{
  "latex-workshop.latex.clean.fileTypes": [
    "bbl", "blg", "idx", "ind", "ilg", "log", "out", "toc"
  ]
}
```

### 方法3: `latexmk`を使う場合

`.latexmkrc`ファイルで削除拡張子を調整：

```perl
$clean_ext = 'bbl blg idx ind ilg log out toc';
```

## 強調スタイル

Counterモードで表示された番号を視覚的に強調する設定が可能です。

### `cursorCodePrettifier.counterHighlightEnabled`

番号の強調を有効/無効にします（デフォルト: `true`）。

### `cursorCodePrettifier.counterHighlightStyle`

強調スタイルを選択します（デフォルト: `background`）：

- `background`: 背景色で強調
- `text`: 文字色で強調
- `emoji`: 絵文字で囲む
- `none`: 強調なし

### `cursorCodePrettifier.counterTextColor`

`counterHighlightStyle: "text"`のときの文字色を指定します（デフォルト: `#7aa2f7`）。

### 設定例

```json
{
  "cursorCodePrettifier.refMaskMode": "counter",
  "cursorCodePrettifier.counterHighlightEnabled": true,
  "cursorCodePrettifier.counterHighlightStyle": "text",
  "cursorCodePrettifier.counterTextColor": "#7aa2f7"
}
```

## トラブルシューティング

### 番号が表示されない場合

1. LaTeXファイルがビルドされているか確認してください
2. `.aux`ファイルが存在するか確認してください
3. 参照ラベルが正しく定義されているか確認してください（`\label{...}`）
4. `.aux`ファイルがクリーンで削除されていないか確認してください

### 間違った番号が表示される場合

- 複数の`.aux`ファイルが存在する場合、最優先のもの（編集中ファイルと同じディレクトリ）が使用されます
- プロジェクト全体で`.aux`ファイルをマージして参照するため、他のファイルのラベルが混在する可能性があります
- 最新の状態を反映するには、LaTeXファイルを再ビルドしてください

## 使用例

```latex
\section{はじめに}
\label{sec:intro}

このセクションでは...

\section{主な結果}
\label{sec:main}

前のセクション（\ref{sec:intro}）で説明したように...

\begin{equation}
  E = mc^2
  \label{eq:einstein}
\end{equation}

アインシュタインの方程式（\eqref{eq:einstein}）は...
```

Counterモードが有効な場合、`\ref{sec:intro}`は`1.1`、`\eqref{eq:einstein}`は`(1)`のように表示されます。

