const assert = require('node:assert/strict');

const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const base = `http://${host}/v1/projects/kindrich-8e2bd/databases/(default)/documents`;

async function expectDenied(path) {
  const response = await fetch(`${base}/${path}`);
  assert.equal(response.status, 403, `${path} should reject unauthenticated access`);
}

(async () => {
  await expectDenied('workspaces/main');
  await expectDenied('projects/example');
  await expectDenied('settings/expenseCategories');
  console.log('Migration rules emulator smoke checks passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

