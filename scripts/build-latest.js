const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building extension with fixed filename...');

try {
  // 1. バージョン更新
  console.log('📝 Updating version...');
  execSync('npm run bump-version', { stdio: 'inherit' });
  
  // 2. ビルド
  console.log('🔨 Building extension...');
  execSync('npm run compile', { stdio: 'inherit' });
  
  // 3. パッケージング
  console.log('📦 Packaging VSIX...');
  execSync('npx vsce package', { stdio: 'inherit' });
  
  // 4. 最新のVSIXファイルを検索（今作成されたファイルを特定）
  const vsixFiles = fs.readdirSync('.').filter(file => 
    file.endsWith('.vsix') && !file.includes('latest')
  );
  
  // 作成時間でソートして最新のファイルを取得
  const latestVsix = vsixFiles
    .map(file => ({ file, time: fs.statSync(file).mtime }))
    .sort((a, b) => b.time - a.time)[0]?.file;
  
  if (latestVsix) {
    // 5. 固定名にコピー（リネームではなくコピー）
    const fixedName = 'cursor-code-prettifier-latest.vsix';
    fs.copyFileSync(latestVsix, fixedName);
    console.log(`✅ Extension packaged as: ${fixedName}`);
    console.log(`✅ Version: ${latestVsix}`);
    console.log('📥 You can now install/update by selecting this file in Cursor');
  }
  
} catch (error) {
  console.error('❌ Error during build:', error.message);
}

