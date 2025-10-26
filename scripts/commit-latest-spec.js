/*
  Commit latest spec file under changement/ with message: "doc: <file_name>"
  Options:
    --file <path>  explicit file to commit
    --push         push after commit
    --dry-run      print actions only
*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function listSpecs(changementDir) {
  const files = fs.readdirSync(changementDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => path.join(changementDir, f));
  if (files.length === 0) return [];
  return files.map(f => ({ file: f, mtime: fs.statSync(f).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .map(x => x.file);
}

function parseArgs(argv) {
  const args = { push: false, dry: false, file: undefined };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--push') args.push = true;
    else if (a === '--dry-run') args.dry = true;
    else if (a === '--file') { args.file = argv[++i]; }
  }
  return args;
}

try {
  const repoRoot = path.join(__dirname, '..');
  const changementDir = path.join(repoRoot, 'changement');
  if (!fs.existsSync(changementDir)) {
    throw new Error('changement/ directory not found');
  }

  const args = parseArgs(process.argv);
  let target = args.file ? path.resolve(args.file) : undefined;
  if (!target) {
    const list = listSpecs(changementDir);
    if (list.length === 0) {
      throw new Error('No spec files found under changement/*.md');
    }
    target = list[0];
  }
  if (!fs.existsSync(target)) {
    throw new Error(`Target spec not found: ${target}`);
  }

  const rel = path.relative(process.cwd(), target);
  const fileName = path.basename(target);
  const message = `doc: ${fileName}`;

  console.log(`🧾 Latest spec: ${rel}`);
  console.log(`📝 Commit message: ${message}`);

  if (args.dry) {
    console.log('⏭️ Dry-run: no changes made');
    process.exit(0);
  }

  // Stage only target file
  execSync(`git add -- "${rel}"`, { stdio: 'inherit' });

  // Check if there is anything to commit
  const changes = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
  if (!changes) {
    console.log('⏭️ Skip: nothing to commit');
    process.exit(0);
  }

  execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
  if (args.push) {
    execSync('git push', { stdio: 'inherit' });
  }
  console.log('✅ Spec committed');

} catch (err) {
  console.error('❌ commit-latest-spec failed:', err && err.message ? err.message : err);
  process.exit(1);
}


