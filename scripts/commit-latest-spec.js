/*
  Commit latest spec file under changement/ with message from spec content
  Options:
    --file <path>  explicit file to commit
    --push         push after commit (also pushes tags)
    --tag          create git tag from version in spec
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

/**
 * Parse spec file and extract version, date, and changes
 */
function parseSpecFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Extract version from title (e.g., "# 変更仕様 v0.1.30: ..." or "# 変更仕様 v1.2.8")
  let version = null;
  const titleMatch = lines[0].match(/v(\d+\.\d+\.\d+)/);
  if (titleMatch) {
    version = titleMatch[1];
  }
  
  // Get file modification date
  const stats = fs.statSync(filePath);
  const date = stats.mtime.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Extract changes section or summary
  // Look for sections like "## 変更", "## 変更内容", "## 仕様", etc.
  let changesSection = '';
  let inChangesSection = false;
  let changesStartIdx = -1;
  
  // Try to find a "変更" or "変更内容" section first
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^##+\s*(変更|変更内容|Changes?)/i)) {
      inChangesSection = true;
      changesStartIdx = i;
      break;
    }
  }
  
  // If no explicit "変更" section, use "## 仕様" or summary from first few sections
  if (changesStartIdx === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^##+\s*(仕様|目的|要件|スコープ)/i)) {
        changesStartIdx = i;
        break;
      }
    }
  }
  
  // Extract content from the found section (up to next ## or end)
  if (changesStartIdx !== -1) {
    const extracted = [];
    for (let i = changesStartIdx + 1; i < lines.length; i++) {
      if (lines[i].match(/^##+\s/)) {
        break;
      }
      extracted.push(lines[i]);
    }
    changesSection = extracted
      .join('\n')
      .trim()
      .split('\n')
      .slice(0, 10) // Limit to first 10 lines
      .join('\n');
  } else {
    // Fallback: use title or first few non-empty lines
    changesSection = lines.slice(0, 5).filter(l => l.trim()).join('\n');
  }
  
  // Clean up changes section (remove excessive whitespace)
  changesSection = changesSection.replace(/\n{3,}/g, '\n\n').trim();
  
  return { version, date, changes: changesSection, lines: lines };
}

/**
 * Extract commit message section from spec file
 */
function extractCommitMessageSection(lines) {
  let commitMsgStartIdx = -1;
  let commitMsgEndIdx = lines.length;
  
  // Find "## コミットメッセージ" section
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^##+\s*コミットメッセージ/i)) {
      commitMsgStartIdx = i;
      // Find the end of this section (next ## header or end of file)
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^##+\s/)) {
          commitMsgEndIdx = j;
          break;
        }
      }
      break;
    }
  }
  
  if (commitMsgStartIdx === -1) {
    return null;
  }
  
  // Extract commit message content (skip the header line)
  const commitMessage = lines
    .slice(commitMsgStartIdx + 1, commitMsgEndIdx)
    .join('\n')
    .trim();
  
  return commitMessage || null;
}

/**
 * Update or add commit message section to spec file
 */
function updateCommitMessageSection(filePath, commitMessage) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let commitMsgStartIdx = -1;
  let commitMsgEndIdx = -1;
  
  // Find existing "## コミットメッセージ" section
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^##+\s*コミットメッセージ/i)) {
      commitMsgStartIdx = i;
      // Find the end of this section (next ## header or end of file)
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^##+\s/)) {
          commitMsgEndIdx = j;
          break;
        }
      }
      if (commitMsgEndIdx === -1) {
        commitMsgEndIdx = lines.length;
      }
      break;
    }
  }
  
  // Split commit message into lines
  const commitMsgLines = commitMessage.split('\n');
  
  let newLines;
  if (commitMsgStartIdx !== -1) {
    // Update existing section
    newLines = [
      ...lines.slice(0, commitMsgStartIdx + 1),
      ...commitMsgLines,
      ...lines.slice(commitMsgEndIdx)
    ];
  } else {
    // Add new section at the end
    newLines = [
      ...lines,
      '',
      '## コミットメッセージ',
      ...commitMsgLines
    ];
  }
  
  fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
}

function parseArgs(argv) {
  const args = { push: false, dry: false, tag: true, file: undefined };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--push') args.push = true;
    else if (a === '--dry-run') args.dry = true;
    else if (a === '--tag') args.tag = true;
    else if (a === '--no-tag') args.tag = false;
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

  const rel = path.relative(repoRoot, target);
  const fileName = path.basename(target);
  
  // Parse spec file to extract version, date, and changes
  const specInfo = parseSpecFile(target);
  
  // Build commit message from spec content
  let commitMessage = `doc: ${fileName}`;
  if (specInfo.version) {
    commitMessage += ` (v${specInfo.version})`;
  }
  if (specInfo.date) {
    commitMessage += `\n\n日付: ${specInfo.date}`;
  }
  if (specInfo.changes) {
    commitMessage += `\n\n変更内容:\n${specInfo.changes}`;
  }

  console.log(`🧾 Latest spec: ${rel}`);
  if (specInfo.version) {
    console.log(`📌 Version: v${specInfo.version}`);
  }
  console.log(`📅 Date: ${specInfo.date || 'N/A'}`);
  console.log(`📝 Commit message:\n${commitMessage}`);

  if (args.dry) {
    console.log('⏭️ Dry-run: no changes made');
    process.exit(0);
  }

  // Update commit message section in spec file
  updateCommitMessageSection(target, commitMessage);
  console.log('📝 Commit message section updated in spec file');

  // Stage spec file (including the updated commit message section)
  execSync(`git add -- "${rel}"`, { stdio: 'inherit', cwd: repoRoot });

  // Check if there is anything to commit
  const changes = execSync('git diff --cached --name-only', { encoding: 'utf8', cwd: repoRoot }).trim();
  if (!changes) {
    console.log('⏭️ Skip: nothing to commit');
    process.exit(0);
  }

  // Extract commit message section from spec file and use it for commit
  const updatedSpecInfo = parseSpecFile(target);
  const extractedCommitMsg = extractCommitMessageSection(updatedSpecInfo.lines);
  
  if (!extractedCommitMsg) {
    throw new Error('Failed to extract commit message section from spec file');
  }

  // Use spec file itself as commit message source via -F option
  // Create a temporary file with just the commit message section content
  const tmpCommitMsg = path.join(repoRoot, '.git-commit-msg.tmp');
  fs.writeFileSync(tmpCommitMsg, extractedCommitMsg, 'utf8');
  try {
    execSync(`git commit -F "${tmpCommitMsg}"`, { stdio: 'inherit', cwd: repoRoot });
    console.log('✅ Spec committed using commit message from spec file');
  } finally {
    // Clean up temp file
    if (fs.existsSync(tmpCommitMsg)) {
      fs.unlinkSync(tmpCommitMsg);
    }
  }
  
  // Create version tag if version found and tag option is enabled
  if (specInfo.version && args.tag) {
    const tagName = `v${specInfo.version}`;
    const tagMessage = `Version ${specInfo.version}\n\n${specInfo.changes || ''}`;
    
    try {
      // Check if tag already exists
      try {
        execSync(`git rev-parse -q --verify "${tagName}"`, { stdio: 'pipe', cwd: repoRoot });
        console.log(`⚠️  Tag ${tagName} already exists, skipping tag creation`);
      } catch (e) {
        // Tag doesn't exist, create it using temp file
        const tmpTagMsg = path.join(repoRoot, '.git-tag-msg.tmp');
        fs.writeFileSync(tmpTagMsg, tagMessage, 'utf8');
        try {
          execSync(`git tag -a "${tagName}" -F "${tmpTagMsg}"`, { stdio: 'inherit', cwd: repoRoot });
          console.log(`🏷️  Tag created: ${tagName}`);
          
          if (args.push) {
            execSync(`git push origin "${tagName}"`, { stdio: 'inherit', cwd: repoRoot });
            console.log(`📤 Tag pushed: ${tagName}`);
          }
        } finally {
          if (fs.existsSync(tmpTagMsg)) {
            fs.unlinkSync(tmpTagMsg);
          }
        }
      }
    } catch (err) {
      console.error(`⚠️  Failed to create tag: ${err.message}`);
      // Don't fail the whole process if tagging fails
    }
  }
  
  if (args.push) {
    execSync('git push', { stdio: 'inherit', cwd: repoRoot });
    console.log('📤 Pushed to remote');
  }

} catch (err) {
  console.error('❌ commit-latest-spec failed:', err && err.message ? err.message : err);
  process.exit(1);
}


