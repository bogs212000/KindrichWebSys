const fs = require('node:fs');
const path = require('node:path');

const rulesPath = path.resolve(__dirname, '..', 'firestore.rules');
const rules = fs.readFileSync(rulesPath, 'utf8');
const publicRules = /allow\s+read\s*,\s*write\s*:\s*if\s+true\s*;/i.test(rules);

if (publicRules) {
  console.error('Firestore deploy blocked: firestore.rules still permits unauthenticated reads and writes.');
  console.error('Complete Firebase Auth enrollment, rules emulator tests, and administrator approval before deploying rules.');
  process.exit(1);
}

console.log('Firestore deploy guard passed: no unconditional public read/write rule was found.');
