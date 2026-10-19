const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
const migrationRules = fs.readFileSync(path.join(root, 'firestore.rules.migration-draft'), 'utf8');
const deployGuard = fs.readFileSync(path.join(root, 'tools/firestore-deploy-guard.js'), 'utf8');
const checkpointVerifier = fs.readFileSync(path.join(root, 'tools/verify-checkpoint.js'), 'utf8');
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8').replace(/^\uFEFF/, ''));

assert.match(html, /firebaseAuth/);
assert.match(html, /firebaseResetPassword/);
assert.match(html, /browserLocalPersistence/);
assert.match(html, /setPersistence\(firebaseAuth, browserLocalPersistence\)/);
assert.match(html, /window\.firebaseAuthReady = false/);
assert.match(html, /window\.firebaseAuthReady = true/);
assert.match(html, /firebaseEnroll/);
assert.match(html, /auth\/user-not-found/);
assert.match(html, /applyFirebaseAuthUser/);
assert.match(html, /workspaceStorageKey='kindrich_project_workspace_v2'/);
assert.match(html, /Storage\.prototype\.setItem=function\(key,value\)/);
assert.match(html, /function enforceConfiguredUser\(\)/);
assert.match(html, /const addDays=/);
assert.match(html, /const purchaseItem=/);
assert.match(html, /const itemPoQty=/);
assert.match(html, /chart\.umd\.min\.js/);
assert.equal((html.match(/chart\.umd\.min\.js/g) || []).length, 1, 'Chart.js should be loaded only once');
for (const chartName of ['Monthly Expenses / Collected', 'Project Budget vs Actual Cost', 'Expense Distribution', 'Monthly Spending Trend', 'Project Financial Performance', 'Project Status Overview']) {
  assert.match(html, new RegExp(chartName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.match(html, /destroyAllCharts/);
assert.match(html, /General Expenses Trend/);
assert.match(html, /generalExpensesChartInstance/);
assert.match(html, /data\.values\.kindrich/);
assert.match(html, /selectLatestGeneralExpensePeriod/);
assert.match(html, /createGeneralExpensesChartHost/);
assert.match(html, /No general expenses are available for the selected period/);
assert.match(html, /getFirestoreDiagnostics/);
assert.match(html, /Firestore Usage Diagnostics/);
assert.match(html, /listener event.*documents/);
assert.match(html, /isKindrichAdmin/);
assert.match(html, /Only an Admin can download a Firebase backup/);
assert.match(html, /Firebase Auth Enrollment/);
assert.match(html, /Data Integrity Check/);
assert.match(html, /Orphaned project references/);
assert.match(html, /kindrichSyncStatus/);
assert.match(html, /kindrichSyncWrapped/);
assert.match(html, /getFirebaseSyncState/);
assert.match(html, /const shouldRender=initialWorkspaceEvent\|\|window\.firebaseWorkspaceReady===false/);
assert.match(html, /Pending save/);
assert.match(html, /actorUid/);
assert.match(migrationRules, /request\.resource\.data\.actorUid == request\.auth\.uid/);
assert.doesNotMatch(html, /data-auth-migration-status[^>]*>[^<]*password/i);
assert.doesNotMatch(html, /password:'admin'/);
assert.match(rules, /allow read, write: if true/);
assert.match(migrationRules, /request\.auth != null/);
assert.match(migrationRules, /function canAccessCompany/);
assert.match(deployGuard, /Firestore deploy blocked/);
assert.match(checkpointVerifier, /Checkpoint verified/);
assert.match(firebaseConfig.firestore.predeploy.join(' '), /firestore-deploy-guard\.js/);
assert.match(migrationRules, /allow read: if isAdmin\(\);/);
assert.match(migrationRules, /records\.write/);
for (const ignored of ['firestore.rules.migration-draft', 'SECURITY_MIGRATION.md', 'AUDIT_REPORT.md', 'tests/**', 'tools/**', 'normalized-migration-manifest.json']) {
  assert.ok(firebaseConfig.hosting.ignore.includes(ignored), `Hosting must ignore ${ignored}`);
}
assert.ok(firebaseConfig.hosting.ignore.includes('firebase.emulator.json'));
assert.ok(firebaseConfig.hosting.ignore.includes('.git/**'));
assert.ok(firebaseConfig.hosting.ignore.includes('.firebase/**'));

const scriptPattern = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
let parsed = 0;
while ((match = scriptPattern.exec(html))) {
  if (/type=["']module/i.test(match[1])) continue;
  new vm.Script(match[2], { filename: 'index.html' });
  parsed += 1;
}

assert.ok(parsed >= 20, 'expected the application script blocks to be present');
console.log(`KINDRICH smoke checks passed (${parsed} classic script blocks parsed).`);
