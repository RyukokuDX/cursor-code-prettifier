const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 最新のVSIXファイルを検索
const vsixFiles = fs.readdirSync('.').filter(file => file.endsWith('.vsix'));
const latestVsix = vsixFiles.sort().pop();

if (latestVsix) {
  console.log(`Installing ${latestVsix}...`);
  try {
    // VS Code CLIを使用してインストール
    execSync(`code --install-extension ${latestVsix}`, { stdio: 'inherit' });
    console.log('Extension installed successfully!');
  } catch (error) {
    console.log('Please install manually from VS Code extension panel');
    console.log(`VSIX file: ${latestVsix}`);
  }
} else {
  console.log('No VSIX file found. Please run npm run build first.');
}

