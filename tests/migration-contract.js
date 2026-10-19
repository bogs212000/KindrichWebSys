'use strict';

const assert = require('node:assert/strict');
const {normalizeWorkspace, validateWorkspace} = require('../tools/normalized-migration');

const workspace = {
  projects: [{id: 'p1', company: 'finebuild', name: 'Project One'}],
  items: [{id: 'i1', project: 'p1', description: 'Cement'}],
  purchases: [{id: 'purchase-1', project: 'p1', qty: 2}],
  users: [{id: 'u1', username: 'admin', password: 'legacy-secret'}],
  roles: [{id: 'admin', name: 'Admin'}],
  logs: [{id: 'log-1', action: 'Add'}]
};

const validation = validateWorkspace(workspace);
assert.equal(validation.valid, true);
const manifest = normalizeWorkspace(workspace);
assert.equal(manifest.projects[0].id, 'p1');
assert.equal(manifest.projects[0].records.items[0].id, 'i1');
assert.equal(manifest.projects[0].records.purchases[0].id, 'purchase-1');
assert.equal(manifest.users[0].password, undefined);
assert.equal(manifest.users[0].hasLegacyPassword, true);

const invalid = validateWorkspace({
  projects: [{id: 'p1'}, {id: 'p1'}],
  items: [{id: 'i1', project: 'missing'}, {project: 'p1'}]
});
assert.equal(invalid.valid, false);
assert.ok(invalid.issues.some(issue => issue.type === 'duplicateIds'));
assert.ok(invalid.issues.some(issue => issue.type === 'orphanedProjectReferences'));
assert.ok(invalid.issues.some(issue => issue.type === 'missingIds'));
const invalidManifest = normalizeWorkspace({projects: [{id: 'p1'}], items: [{id: 'orphan', project: 'missing'}]});
assert.equal(invalidManifest.unassignedRecords.length, 1);
assert.equal(invalidManifest.unassignedRecords[0].data.id, 'orphan');
console.log('Normalized migration contract checks passed.');
