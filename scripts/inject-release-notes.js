/*
  Inject release notes into README.md and CHANGELOG.md.
  - Uses template at changement/_release_notes.md if present; otherwise falls back to a default template
  - Requires a latest spec file under changement/ (excluding files starting with '_')
  - Backs up edited files to .bak before writing
*/

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listSpecs(changementDir) {
  const files = fs.readdirSync(changementDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => path.join(changementDir, f));
  return files.map(f => ({ file: f, mtime: fs.statSync(f).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .map(x => x.file);
}

function ensureDirOf(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function backup(filePath) {
  if (!fs.existsSync(filePath)) return;
  const bak = filePath + '.bak';
  fs.copyFileSync(filePath, bak);
}

function replaceTemplateVars(str, vars) {
  return str
    .replace(/\$\{version\}/g, vars.version)
    .replace(/\$\{date\}/g, vars.date)
    .replace(/\$\{specPath\}/g, vars.specPath);
}

function buildDefaultTemplate() {
  return [
    '### ${version} (${date})',
    '- Spec: ${specPath}',
    '',
    '#### Added',
    '-',
    '',
    '#### Changed',
    '-',
    '',
    '#### Fixed',
    '-',
    '',
    '#### Docs',
    '-',
    '',
    '#### Chore',
    '-',
    ''
  ].join('\n');
}

function loadTemplate(changementDir) {
  const tplPath = path.join(changementDir, '_release_notes.md');
  if (fs.existsSync(tplPath)) {
    return fs.readFileSync(tplPath, 'utf8');
  }
  return buildDefaultTemplate();
}

function hasVersionBlock(content, version) {
  const re = new RegExp(`^###\\s+${version}\\b`, 'm');
  return re.test(content);
}

function insertIntoReadme(readmePath, block, version) {
  const headingRe = /^##\s*(Release Notes|リリースノート)\s*$/im;
  let content = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  if (hasVersionBlock(content, version)) {
    console.log(`⏭️ README.md: Skip, version ${version} already present`);
    return;
  }
  if (!headingRe.test(content)) {
    // Append new section at end
    const sectionHeader = '\n\n## リリースノート\n\n';
    content = content.trimEnd() + sectionHeader + block + '\n';
  } else {
    // Insert at top of the matched section body
    const match = content.match(headingRe);
    if (!match) return; // safety
    const insertPos = match.index + match[0].length;
    const before = content.slice(0, insertPos);
    const after = content.slice(insertPos);
    // ensure exactly two newlines after heading, then our block, then one newline
    const prefix = before.endsWith('\n') ? '' : '\n';
    content = before + prefix + '\n' + block + '\n' + after;
  }
  backup(readmePath);
  fs.writeFileSync(readmePath, content, 'utf8');
  console.log('✅ README.md updated');
}

function insertIntoChangelog(changelogPath, block, version) {
  let content = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
  if (hasVersionBlock(content, version)) {
    console.log(`⏭️ CHANGELOG.md: Skip, version ${version} already present`);
    return;
  }
  if (!content.trim()) {
    content = ['# Changelog', '', block, ''].join('\n');
  } else {
    content = [block, '', content].join('\n');
  }
  backup(changelogPath);
  fs.writeFileSync(changelogPath, content, 'utf8');
  console.log('✅ CHANGELOG.md updated');
}

// Main
try {
  const repoRoot = path.join(__dirname, '..');
  const pkgPath = path.join(repoRoot, 'package.json');
  const pkg = readJson(pkgPath);
  const version = pkg.version;
  const changementDir = path.join(repoRoot, 'changement');

  if (!fs.existsSync(changementDir)) {
    console.error('❌ changement/ directory not found');
    process.exit(1);
  }
  const specs = listSpecs(changementDir);
  if (specs.length === 0) {
    console.error('❌ spec not found under changement/*.md');
    process.exit(1);
  }
  const latestSpec = path.relative(repoRoot, specs[0]);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const date = `${yyyy}-${mm}-${dd}`;

  const tpl = loadTemplate(changementDir);
  const vars = { version, date, specPath: latestSpec };
  const block = replaceTemplateVars(tpl, vars);

  console.log(`📝 Injecting release notes for v${version}...`);

  const readmePath = path.join(repoRoot, 'README.md');
  const changelogPath = path.join(repoRoot, 'CHANGELOG.md');

  insertIntoReadme(readmePath, block, version);
  insertIntoChangelog(changelogPath, block, version);

} catch (err) {
  console.error('❌ Error during release note injection:', err && err.message ? err.message : err);
  process.exit(1);
}


