'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PROJECT_RECORD_TYPES = [
  'items', 'purchases', 'manpower', 'manpowerApprovals', 'expenses',
  'forwarded', 'canvassing', 'vouchering', 'payed', 'purchaseRequests'
];

function rows(value) {
  return Array.isArray(value) ? value.filter(row => row && typeof row === 'object') : [];
}

function validateWorkspace(workspace) {
  const source = workspace && typeof workspace === 'object' ? workspace : {};
  const projects = rows(source.projects);
  const projectIds = new Set(projects.map(project => project.id).filter(Boolean));
  const issues = [];

  for (const collection of ['projects', ...PROJECT_RECORD_TYPES, 'users', 'roles', 'logs']) {
    const collectionRows = rows(source[collection]);
    const seen = new Set();
    let duplicateIds = 0;
    let missingIds = 0;
    let orphanedProjects = 0;
    for (const row of collectionRows) {
      if (!row.id) {
        missingIds += 1;
      } else if (seen.has(row.id)) {
        duplicateIds += 1;
      } else {
        seen.add(row.id);
      }
      const projectId = row.project ?? row.projectId;
      if (PROJECT_RECORD_TYPES.includes(collection) && projectId && !projectIds.has(projectId)) {
        orphanedProjects += 1;
      }
    }
    if (duplicateIds) issues.push({collection, type: 'duplicateIds', count: duplicateIds});
    if (missingIds) issues.push({collection, type: 'missingIds', count: missingIds});
    if (orphanedProjects) issues.push({collection, type: 'orphanedProjectReferences', count: orphanedProjects});
  }

  const missingCompany = projects.filter(project => !project.company).length;
  if (missingCompany) issues.push({collection: 'projects', type: 'missingCompany', count: missingCompany});
  return {valid: issues.length === 0, issues};
}

function withoutPassword(user) {
  const result = {...user};
  if (Object.prototype.hasOwnProperty.call(result, 'password')) {
    delete result.password;
    result.hasLegacyPassword = true;
  }
  return result;
}

function normalizeWorkspace(workspace) {
  const source = workspace && typeof workspace === 'object' ? workspace : {};
  const validation = validateWorkspace(source);
  const projects = rows(source.projects).map(project => {
    const projectId = project.id;
    const records = {};
    for (const type of PROJECT_RECORD_TYPES) {
      records[type] = rows(source[type])
        .filter(record => (record.project ?? record.projectId) === projectId)
        .map(record => ({...record, project: record.project ?? record.projectId ?? projectId}));
    }
    return {id: projectId || null, data: {...project}, records};
  });
  const projectIds = new Set(rows(source.projects).map(project => project.id).filter(Boolean));
  const unassignedRecords = [];
  for (const type of PROJECT_RECORD_TYPES) {
    for (const record of rows(source[type])) {
      const projectId = record.project ?? record.projectId;
      if (!projectId || !projectIds.has(projectId)) {
        unassignedRecords.push({collection: type, id: record.id || null, data: {...record}});
      }
    }
  }

  return {
    format: 'kindrich-normalized-migration-manifest',
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'workspace export; no Firebase writes performed',
    validation,
    projects,
    unassignedRecords,
    users: rows(source.users).map(withoutPassword),
    roles: rows(source.roles).map(role => ({...role})),
    logs: rows(source.logs).map(log => ({...log})),
    summary: {
      projects: projects.length,
      projectRecords: Object.fromEntries(PROJECT_RECORD_TYPES.map(type => [type, projects.reduce((total, project) => total + project.records[type].length, 0)])),
      unassignedRecords: unassignedRecords.length,
      users: rows(source.users).length,
      roles: rows(source.roles).length,
      logs: rows(source.logs).length
    }
  };
}

if (require.main === module) {
  const input = process.argv[2];
  const output = process.argv[3] || path.resolve(process.cwd(), 'normalized-migration-manifest.json');
  if (!input) {
    console.error('Usage: node tools/normalized-migration.js <workspace-backup.json> [output.json]');
    process.exitCode = 2;
  } else {
    const manifest = normalizeWorkspace(JSON.parse(fs.readFileSync(path.resolve(input), 'utf8')));
    fs.writeFileSync(output, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log(`Wrote normalized migration manifest to ${output}`);
    console.log(`Validation: ${manifest.validation.valid ? 'passed' : `${manifest.validation.issues.length} issue type(s) found`}`);
  }
}

module.exports = {PROJECT_RECORD_TYPES, validateWorkspace, normalizeWorkspace};
