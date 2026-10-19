# Migration Tools

## Normalized migration planner

Create a JSON backup from the application, verify the file independently, then run:

```text
node tools/normalized-migration.js path\to\workspace-backup.json path\to\normalized-migration-manifest.json
```

The planner is intentionally offline and review-only. It does not initialize Firebase, read production data, deploy rules, or write any Firestore document.

The manifest contains:

- Project records grouped by project ID.
- Project transaction records grouped by collection type.
- `unassignedRecords` for missing or unknown project references so no source record is silently dropped.
- `globalRecords` for General Expenses, Messages, and deletion requests that do not belong under a project.
- Workspace categories and the log-retention setting.
- Validation findings for duplicate IDs, missing IDs, orphaned references, and missing company assignments.
- Users without password fields. Legacy password presence is represented only by `hasLegacyPassword: true`.

Do not use the manifest as a production import until an administrator has reviewed the validation findings, verified the source backup, approved the normalized schema, and tested a rollback path in the Firebase Emulator Suite.

## Firestore deployment guard

Run `npm run security:firestore-deploy-check` before a rules deployment. The Firebase
predeploy hook runs the same check and blocks deployment while `firestore.rules`
contains an unconditional public read/write rule. This guard is intentionally
non-destructive; it does not modify rules or production data.

## Checkpoint verification

Run `npm run audit:verify-checkpoint` to verify the source checkpoint created
before migration work. Pass another checkpoint directory as the first argument
when reviewing a different backup. The verifier only checks required files and
reports file count and size; it does not modify the checkpoint or Firebase.
