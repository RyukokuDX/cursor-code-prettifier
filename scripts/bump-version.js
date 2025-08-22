const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '../package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// バージョンを自動的に更新（例：0.0.3 → 0.0.4）
const [major, minor, patch] = package.version.split('.').map(Number);
package.version = `${major}.${minor}.${patch + 1}`;

fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));
console.log(`Version updated to ${package.version}`);

