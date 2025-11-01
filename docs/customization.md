# カスタマイズガイド

このドキュメントでは、Cursor Code Prettifierをカスタマイズする方法を詳しく説明します。

## 独自の置き換えルールの追加

独自の置き換えルールを追加するには、以下の手順に従います：

### 1. 設定を開く

1. VS Codeの設定を開く（`Ctrl+,` または `Cmd+,`）
2. "Cursor Code Prettifier"を検索
3. 編集したい設定項目を選択

### 2. 設定項目の編集

以下の3つの設定項目から選択します：

- **`cursorCodePrettifier.symbols`**: 記号グループの変換候補
- **`cursorCodePrettifier.math_commands`**: 数学コマンドグループの変換候補
- **`cursorCodePrettifier.tex_commands`**: TeXコマンドグループの変換候補

### 3. 変換ルールの追加

各設定項目は、以下の形式のオブジェクトの配列です：

```json
{
  "original": "\\コマンド名",
  "display": "表示したい記号や絵文字"
}
```

### 設定例

```json
{
  "cursorCodePrettifier.symbols": [
    { "original": "\\alpha", "display": "α" },
    { "original": "\\beta", "display": "β" },
    { "original": "\\mycommand", "display": "★" }
  ],
  "cursorCodePrettifier.math_commands": [
    { "original": "\\frac", "display": "分数" },
    { "original": "\\custommath", "display": "🔢" }
  ],
  "cursorCodePrettifier.tex_commands": [
    { "original": "\\section", "display": "セクション" },
    { "original": "\\mytex", "display": "📝" }
  ]
}
```

## 設定のヒント

### 長いコマンドを優先

設定では長いコマンドから順にマッチングされるため、`\mathbb{R}`は`\mathbb`より優先されます。

例：
```json
[
  { "original": "\\mathbb", "display": "B" },
  { "original": "\\mathbb{R}", "display": "ℝ" }
]
```

この場合、`\mathbb{R}`は`ℝ`として表示され、`\mathbb{Q}`は`B`として表示されます。

### 正規表現エスケープ

特殊文字は自動的にエスケープされるため、そのまま記述できます。

```json
[
  { "original": "\\command{arg}", "display": "記号" }
]
```

### 単語境界

`\`で始まらないコマンドは単語境界（`\b`）で囲まれます。

例：
```json
[
  { "original": "text", "display": "テキスト" }
]
```

この場合、`text`という単語のみがマッチし、`context`のような単語にはマッチしません。

## グループの有効/無効

各グループを個別に有効/無効にできます：

```json
{
  "cursorCodePrettifier.symbolEnabled": true,
  "cursorCodePrettifier.mathEnabled": false,
  "cursorCodePrettifier.texEnabled": true
}
```

## カスタム記号の例

### 例1: 独自の数学記号

```json
{
  "cursorCodePrettifier.symbols": [
    { "original": "\\myintegral", "display": "⨋" },
    { "original": "\\customsum", "display": "⨁" }
  ]
}
```

### 例2: カスタムTeXコマンド

```json
{
  "cursorCodePrettifier.tex_commands": [
    { "original": "\\mynote", "display": "📌" },
    { "original": "\\mytodo", "display": "✅" },
    { "original": "\\mywarning", "display": "⚠️" }
  ]
}
```

### 例3: 複数の変換候補

```json
{
  "cursorCodePrettifier.symbols": [
    { "original": "\\vector{a}", "display": "→a" },
    { "original": "\\vector{b}", "display": "→b" },
    { "original": "\\vector", "display": "→" }
  ]
}
```

## トラブルシューティング

### 変換が適用されない場合

1. 設定が正しく保存されているか確認してください
2. LaTeXファイルを再読み込みしてください
3. 拡張機能が有効になっているか確認してください（`cursorCodePrettifier.enabled`）
4. 該当するグループが有効になっているか確認してください

### 意図しない変換が発生する場合

1. 長いコマンドが優先されることを確認してください
2. 単語境界の動作を確認してください（`\`で始まらないコマンドの場合）
3. 他の設定との競合を確認してください

## ベストプラクティス

1. **グループを適切に選択**: コマンドの種類に応じて適切なグループに配置します
2. **長いコマンドを先に**: より具体的なコマンドを配列の先頭に配置します
3. **デフォルト値を確認**: 既存のデフォルト値を確認してから追加します
4. **設定をバックアップ**: カスタム設定を`settings.json`でバックアップしておきます

## 関連ドキュメント

- [設定リファレンス](configuration.md)
- [対応記号一覧](supported-symbols.md)

