const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting extension update process...');

try {
  // 1. バージョン更新
  console.log('📝 Updating version...');
  execSync('npm run bump-version', { stdio: 'inherit' });
  
  // 1.5. リリースノート注入
  console.log('📝 Injecting release notes...');
  execSync('node scripts/inject-release-notes.js', { stdio: 'inherit' });
  
  // 2. ビルド
  console.log('🔨 Building extension...');
  execSync('npm run compile', { stdio: 'inherit' });
  
  // 3. パッケージング
  console.log('📦 Packaging VSIX...');
  execSync('npx vsce package', { stdio: 'inherit' });
  
  // 4. インストール
  console.log('📥 Installing extension...');
  execSync('node scripts/install-vsix.js', { stdio: 'inherit' });
  
  console.log('✅ Extension updated successfully!');
} catch (error) {
  console.error('❌ Error during update:', error.message);
}

