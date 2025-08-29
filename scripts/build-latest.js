const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔨 Building extension with fixed filename...');

try {
  // 0. 古いVSIXファイルの退避（削除せず old/ に保存）
  console.log('🧹 Archiving old VSIX files into old/ ...');
  const oldVsixFiles = fs.readdirSync('.').filter(file =>
    file.endsWith('.vsix') &&
    file !== 'cursor-code-prettifier-latest.vsix' &&
    !file.includes('latest')
  );

  if (oldVsixFiles.length > 0) {
    const oldDir = path.join('.', 'old');
    if (!fs.existsSync(oldDir)) {
      fs.mkdirSync(oldDir, { recursive: true });
    }
    oldVsixFiles.forEach(file => {
      const baseDest = path.join(oldDir, file);
      const dest = fs.existsSync(baseDest)
        ? path.join(oldDir, `${Date.now()}-${file}`)
        : baseDest;
      fs.renameSync(file, dest);
      console.log(`📦 Archived: ${file} -> ${path.relative('.', dest)}`);
    });
  } else {
    console.log('✨ No old VSIX files to archive');
  }

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
    // 5. 変更検知用: 既存 latest のハッシュ/サイズ
    const fixedName = 'cursor-code-prettifier-latest.vsix';
    let oldInfo = { exists: false, size: 0, sha256: '' };
    if (fs.existsSync(fixedName)) {
      const buf = fs.readFileSync(fixedName);
      oldInfo = {
        exists: true,
        size: buf.length,
        sha256: crypto.createHash('sha256').update(buf).digest('hex')
      };
    }

    // 固定名にコピー（リネームではなくコピー）
    const newBuf = fs.readFileSync(latestVsix);
    fs.copyFileSync(latestVsix, fixedName);

    const newInfo = {
      size: newBuf.length,
      sha256: crypto.createHash('sha256').update(newBuf).digest('hex')
    };
    const updated = !oldInfo.exists || oldInfo.sha256 !== newInfo.sha256;

    console.log(`✅ Extension packaged as: ${fixedName}`);
    console.log(`✅ Version: ${latestVsix}`);
    console.log(`🔎 latest.vsix updated: ${updated}`);
    console.log(`   old: exists=${oldInfo.exists} size=${oldInfo.size} sha256=${oldInfo.sha256 || 'N/A'}`);
    console.log(`   new: size=${newInfo.size} sha256=${newInfo.sha256}`);
    console.log('📥 You can now install/update by selecting this file in Cursor');
  }
  
} catch (error) {
  console.error('❌ Error during build:', error.message);
}

