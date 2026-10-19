'use strict';

const assert = require('node:assert/strict');
const {normalizeWorkspace, validateWorkspace} = require('../tools/normalized-migration');

const workspace = {
  projects: [{id: 'p1', company: 'finebuild', name: 'Project One'}],
  items: [{id: 'i1', project: 'p1', description: 'Cement'}],
  purchases: [{id: 'purchase-1', project: 'p1', qty: 2}],
  users: [{id: 'u1', username: 'admin', password: 'legacy-secret'}],
  roles: [{id: 'admin', name: 'Admin'}],
  logs: [{id: 'log-1', action: 'Add'}],
  generatedExpenses: [{id: 'ge-1', description: 'Fuel', amount: 100}],
  deleteRequests: [{id: 'delete-1', type: 'expenses'}],
  messages: [{id: 'message-1', from: 'u1', to: 'u2', text: 'Hello'}],
  categories: ['Fuel', 'Fuel'],
  logAutoDelete: false
};

const validation = validateWorkspace(workspace);
assert.equal(validation.valid, true);
const manifest = normalizeWorkspace(workspace);
assert.equal(manifest.projects[0].id, 'p1');
assert.equal(manifest.projects[0].records.items[0].id, 'i1');
assert.equal(manifest.projects[0].records.purchases[0].id, 'purchase-1');
assert.equal(manifest.users[0].password, undefined);
assert.equal(manifest.users[0].hasLegacyPassword, true);
assert.equal(manifest.version, 2);
assert.equal(manifest.globalRecords.generatedExpenses.length, 1);
assert.equal(manifest.globalRecords.deleteRequests.length, 1);
assert.equal(manifest.globalRecords.messages.length, 1);
assert.deepEqual(manifest.categories, ['Fuel']);
assert.equal(manifest.settings.logAutoDelete, false);

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
