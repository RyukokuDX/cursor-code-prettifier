print(".nvim.lua loaded")

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

-- テスト用コマンド（開発用）
vim.api.nvim_create_user_command("PingVS", function()
  vim.fn.VSCodeNotify("workbench.action.toggleSidebarVisibility")
end, {})