const fs = require('node:fs');
const path = require('node:path');

const checkpoint = path.resolve(process.argv[2] || path.join('..', 'kindrich_web_stage1_backup_20261019'));
const required = ['index.html', 'firebase.json', '.firebaserc', 'firestore.rules', 'package.json', 'package-lock.json'];
const missing = required.filter(name => !fs.existsSync(path.join(checkpoint, name)));
if (missing.length) {
  console.error(`Checkpoint verification failed: missing ${missing.join(', ')} in ${checkpoint}`);
  process.exit(1);
}

const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
}
walk(checkpoint);
const bytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
console.log(`Checkpoint verified: ${files.length} files, ${bytes} bytes, ${checkpoint}`);
