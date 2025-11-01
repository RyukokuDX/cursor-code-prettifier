# Neovim統合環境での使用

Cursor/VS CodeでNeovimを使用している場合（`vscode-neovim`など）、`.nvim.lua`ファイルに設定を追加することで、Cursor Code Prettifierのマスク機能をNeovimから直接操作できます。

## 設定方法

プロジェクトルートに`.nvim.lua`ファイルを作成（または既存のファイルに追加）し、以下の設定を追加してください：

```lua
-- Cursor Code Prettifier: マスク機能のコマンド
vim.api.nvim_create_user_command("Ml", function()
  local ok, res = pcall(vim.fn.VSCodeCall, "cursorCodePrettifier.toggleMaskLine")
  print("Ml VSCodeCall ok=", ok, " res=", res)
end, {
  desc = "Toggle mask for current line(s)"
})

-- ドキュメント全体のマスクをトグル
vim.api.nvim_create_user_command("Ma", function()
  vim.fn.VSCodeCall("cursorCodePrettifier.toggleMaskAll")
end, {
  desc = "Toggle mask for entire document"
})

-- Mode line用: .nvim.luaを簡単に読み込むコマンド
vim.api.nvim_create_user_command("Neo", function()
  vim.cmd("luafile .nvim.lua")
end, {
  desc = "Reload .nvim.lua file"
})
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `:Ml` | 現在の行（または選択範囲）のマスクをトグル |
| `:Ma` | ドキュメント全体のマスクをトグル |
| `:Neo` | `.nvim.lua`ファイルを再読み込み |

## 使用方法

1. **初回設定**: プロジェクトルートに`.nvim.lua`ファイルを作成し、上記の設定を追加します

2. **設定の読み込み**: 
   - Cursor/VS Codeを再起動すると自動的に読み込まれます
   - または、mode lineで`:Neo`（または`:luafile .nvim.lua`）を実行して手動で読み込みます

3. **マスクのトグル**: 
   - LaTeX/TeXファイルを開いている状態で`:Ml`を実行すると、現在の行のマスクがトグルされます
   - 複数行を選択している場合は、選択範囲のすべての行がトグルされます

## 自動マスク切り替え

インサートモードとノーマルモードに応じて、カーソル行のマスクを自動的に切り替えることができます。

### 機能の説明

この機能を有効にすると：
- **インサートモードに入った時**: カーソル行のマスクが自動的にOFFになり、元のLaTeXコマンドが表示されます（編集しやすくなります）
- **ノーマルモードに戻った時**: マスクONは手動で`:Ml`コマンドを実行して戻す必要があります

### 設定方法

`.nvim.lua`ファイルに以下のオートコマンドを追加してください：

```lua
-- 自動マスク切り替え: インサートモードでカーソル行のマスクOFF（マスクONは手動で:Mlコマンドで実行）
vim.api.nvim_create_autocmd("InsertEnter", {
  pattern = "*.tex,*.latex",
  callback = function()
    -- インサートモードに入った時は即座にマスクOFF
    vim.fn.VSCodeCall("cursorCodePrettifier.maskLineOff")
  end,
})
```

### 設定例（完全版）

既存のコマンド設定と組み合わせた完全な設定例：

```lua
-- Cursor Code Prettifier: マスク機能のコマンド
vim.api.nvim_create_user_command("Ml", function()
  local ok, res = pcall(vim.fn.VSCodeCall, "cursorCodePrettifier.toggleMaskLine")
  print("Ml VSCodeCall ok=", ok, " res=", res)
end, {
  desc = "Toggle mask for current line(s)"
})

-- ドキュメント全体のマスクをトグル
vim.api.nvim_create_user_command("Ma", function()
  vim.fn.VSCodeCall("cursorCodePrettifier.toggleMaskAll")
end, {
  desc = "Toggle mask for entire document"
})

-- Mode line用: .nvim.luaを簡単に読み込むコマンド
vim.api.nvim_create_user_command("Neo", function()
  vim.cmd("luafile .nvim.lua")
end, {
  desc = "Reload .nvim.lua file"
})

-- 自動マスク切り替え: インサートモードでカーソル行のマスクOFF（マスクONは手動で:Mlコマンドで実行）
vim.api.nvim_create_autocmd("InsertEnter", {
  pattern = "*.tex,*.latex",
  callback = function()
    -- インサートモードに入った時は即座にマスクOFF
    vim.fn.VSCodeCall("cursorCodePrettifier.maskLineOff")
  end,
})
```

### 注意事項

- `.tex`および`.latex`ファイルのみに適用されるように`pattern`を指定しています
- インサートモードに入るとカーソル行のマスクが自動的にOFFになり、編集時は元のコマンドが見えるようになります
- ノーマルモードに戻った後、マスクONに戻すには`:Ml`コマンドを手動で実行する必要があります
- 自動マスク切り替えは、既存の手動トグルコマンド（`:Ml`、`:Ma`）と併用できます

## トラブルシューティング

### コマンドが「not an editor command」と表示される場合

`.nvim.lua`ファイルが読み込まれていない可能性があります。以下の方法を試してください：

1. **手動で読み込む**: `:Neo`または`:luafile .nvim.lua`を実行
2. **Cursor/VS Codeを再起動**: 設定が自動的に読み込まれます
3. **ファイルの場所を確認**: `.nvim.lua`はプロジェクトルートに配置されている必要があります

### VSCodeCallが動作しない場合

`vscode-neovim`拡張機能が正しくインストール・有効化されていることを確認してください。

## 関連リソース

- [vscode-neovim](https://github.com/vscode-neovim/vscode-neovim) - VS Code/Cursor用Neovim統合拡張機能
- [Cursor Code Prettifier - マスク機能](../README.md#マスク表示のトグル行全体) - メインREADMEのマスク機能セクション

