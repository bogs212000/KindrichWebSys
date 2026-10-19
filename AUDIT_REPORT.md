# KINDRICH System Audit

Audit date: 2026-10-19
Firebase project: `kindrich-8e2bd`
Primary application: `index.html`

## Scope Inspected

- `index.html`
- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `package.json` and `package-lock.json`
- Firebase Hosting assets under `assets/`

The application is a single-page, server-rendered DOM application implemented in one large `index.html` with multiple classic script blocks and one Firebase module block. No separate framework route or component tree was found.

## Existing Modules

### Global modules

- Login and logout
- Firebase workspace synchronization
- Persistent Firestore client cache
- JSON backup import/export
- Firebase ZIP backup and restore
- Activity logs
- User and role configuration
- Confirmation queue for deletion requests
- Company selector for Finebuild and Consumer Goods Trading
- Light and dark theme support
- Collapsible navigation
- Bootstrap Icons
- Success notifications and edit undo support

### Main navigation

- Dashboard
- Projects
- Approval
- Vouchering
- Project Cost Reports
- Configuration
- Confirmation
- General Expenses
- Messages

### Project tabs

- BOQ Monitoring
- Purchased
- Manpower Expenses
- Other Expenses
- Forwarded
- Canvassing
- Approval
- Purchase Order
- Vouchering
- Payed

## Firebase Data Paths

Current workspace synchronization writes a full `workspaces/main` document. It also mirrors project bundles into `projects/{projectId}`, users into `users/{userId}`, and logs into `logs/{logId}`. This duplicates nested transaction arrays and can make a small edit expensive.

The application also reads:

- `workspaces/main` through one realtime listener
- `projects` as a fallback collection query when the workspace is incomplete
- `projects`, `users`, and `logs` for the Firebase ZIP backup feature

The application currently uses Firestore, not Realtime Database.

## Highest-Risk Findings

1. `firestore.rules` allows unauthenticated reads and writes to the main collections.
2. Legacy browser login compares plaintext passwords in JavaScript and stores them in workspace/user documents.
3. Company and role access is primarily client-side and is not enforced by production rules.
4. A large workspace document duplicates project transactions into project bundle documents.
5. A login event currently writes an activity log and can trigger the workspace autosave.
6. Browser local storage contains the workspace and browser-login marker. This is not an authorization boundary.
7. A full workspace listener can refresh every page when any workspace field changes.
8. The backup feature intentionally downloads complete collections and should remain restricted to authorized administrators.

## Non-Destructive Work Completed

- Created a pre-migration backup at:
  `C:\Users\garry\Desktop\kindrich_web_stage1_backup_20261019`
- Added `SECURITY_MIGRATION.md` with enrollment, rollback, and approval gates.
- Added `firestore.rules.migration-draft`; it is not referenced by `firebase.json` and has not been deployed.
- Initialized Firebase Authentication support for users with an enrolled email address.
- Added optional validated enrollment email editing in Configuration.
- Added Firestore usage diagnostics on localhost only.
- Added visible localhost-only Firestore usage metrics in Configuration, including realtime listener document estimates.
- Added Admin-only client guards for Firebase backup download and restore controls.
- Added an Admin-only Firebase Auth enrollment status view in Configuration; it reports email/UID readiness without exposing passwords.
- Added a read-only Configuration integrity check for duplicate IDs, missing IDs, orphaned project references, and missing company assignments.
- Added a header sync-state indicator for connection, save, synced, and offline states without adding a Firebase listener.
- Added authenticated actor and company/project context to new activity logs; the migration rules draft now binds new log writes to the Firebase Auth UID.
- Added a tested, non-destructive normalized migration planner for exported workspace JSON; it preserves orphaned records for review and does not access or modify Firebase.
- Documented the offline migration review workflow in `tools/README.md`, including backup verification and emulator/rollback gates.
- Added document fingerprints to skip unchanged mirrored project, user, and log writes.
- Added top-level workspace field fingerprints so autosave sends only changed workspace fields and no longer persists `activeUser` login state to the shared document.
- Added progressive password cleanup for Firebase-enrolled users: authenticated accounts no longer write plaintext passwords to workspace or mirrored user documents.
- Added targeted login/logout audit writes so authentication events no longer trigger a full workspace save.
- Added Firebase password-reset email support for users with enrolled email addresses.
- Added guarded first-login Firebase Auth enrollment for users with an email, without creating accounts from a stored password alone.
- Added Firebase Auth session restoration on refresh, with enrolled accounts matched by UID/email and legacy browser restoration limited to unenrolled users.
- Excluded migration notes, draft rules, tests, and package metadata from Firebase Hosting so they are not publicly served from the app root.
- Disabled the insecure full-workspace `localStorage` cache; Firestore persistent cache remains the application cache, while the browser-login preference and UI preferences remain separate.
- Added a compatibility helper initialization fix for `addDays`, `purchaseItem`, and `itemPoQty`.
- Removed automatic creation of the insecure `admin/admin` account when no users exist.
- Deployed Hosting only; Firestore rules and production data were not changed.
- Added a Firestore predeploy guard that blocks rules deployment while the production rules contain unconditional public read/write access.

## Current Migration Gates

The authenticated rules cannot safely replace the public rules yet because active users need verified Firebase Authentication accounts and company/role authorization mappings. Before changing production rules:

1. Verify the backup independently.
2. Enroll active users through Firebase Authentication without copying plaintext passwords.
3. Decide the trusted representation of company IDs, roles, and permissions in custom claims or protected user documents.
4. Add and test rules for every collection used by the application.
5. Run emulator tests for reads, writes, company isolation, approvals, deletion confirmation, logs, backups, and concurrent edits.
6. Obtain administrator approval for the rules cutover and rollback window.

The migration draft now treats the legacy all-company workspace as admin-only and defines company-scoped project and normalized transaction paths using Auth claims. It remains a draft because the current client still reads and writes the legacy workspace document.

## Validation Evidence

- All 27 classic script blocks parse successfully with Node `vm.Script`.
- `git diff --check` passes; only line-ending warnings are present.
- Hosting-only deploy completed successfully for `kindrich-8e2bd`.
- No production Firestore data was modified by the audit work.
- `npm test` and `npm run test:rules` pass. The rules test runs in the Firestore Emulator using Firebase CLI 13.35.1 and Java 17 on dedicated local port 8090; no production rules were contacted.

## Next Safe Implementation Stage

The next stage should add a tested, normalized transaction persistence path behind a feature flag or migration mode. It must preserve existing document IDs, write only changed records, and keep the workspace document as a compatibility read source until reconciliation and rollback checks pass. The production rules cutover should remain separate from that data migration.

