# KINDRICH Security Migration

## Current State

- Login is implemented in `index.html` with browser-side username/password comparison.
- User passwords are stored in the workspace and mirrored user documents.
- The application no longer creates a default `admin/admin` account when no users exist; an administrator must enroll the first account through the approved migration process.
- `sessionStorage` and `localStorage` are used for browser login persistence.
- Firebase Authentication is initialized in the client, but active users are not yet fully enrolled and production rules still use the legacy compatibility posture.
- `firestore.rules` currently allows unauthenticated reads and writes.
- Company and role filtering is currently enforced by client-side JavaScript.

## Compatibility Layer Implemented

- Firebase Authentication client initialization is now available in the app.
- Users with a validated `email` field can sign in through Firebase Authentication.
- Users without an enrolled email continue using the legacy login during migration.
- Configuration now accepts an optional enrollment email and persists it with the existing user record.
- Logout signs out of Firebase Authentication when a Firebase session is active.
- Empty workspaces are forced to the login screen instead of silently entering the application with a synthetic account.
- After a Firebase-authenticated sign-in records `authUid`, password fields are omitted from the shared workspace payload and removed from the mirrored user document. Legacy users retain compatibility until enrollment.
- Configuration exposes a Firebase password-reset action only for users with an enrolled email address.
- Firebase backup download and restore controls are restricted to the Admin role in the application as defense-in-depth; server-side rules remain the authoritative security gate after cutover.
- Configuration shows Admin-only Firebase Auth enrollment status for each user without exposing passwords.
- Configuration includes a read-only integrity check for duplicate IDs, missing IDs, orphaned project references, and missing project company assignments before migration.
- Added `tools/normalized-migration.js`, a review-only converter for workspace JSON exports. It preserves record IDs, keeps invalid/orphaned records in `unassignedRecords`, reports validation issues, removes passwords from the manifest, and performs no Firebase writes.
- Localhost-only Firestore usage diagnostics expose application-side read, returned-document, write, listener, failure, and duration estimates without writing diagnostics to Firestore.
- The header now shows connection/sync state (`Connecting`, `Saving`, `Synced`, or `Offline`) using the existing listener and save hooks; it does not create additional Firebase operations.
- New activity logs include stable `actorUid`, local `userId`, `companyId`, and `projectId` context. Existing logs remain readable; the draft rules require `actorUid` to match the authenticated Firebase user for new log writes.
- Users with an enrollment email can self-enroll on first login: the typed legacy password is checked against the existing record before Firebase Auth account creation, then the local plaintext password is removed after success.
- Firebase Auth state is restored on refresh by matching the authenticated UID or email to the configured user; enrolled users are not trusted solely from a browser-local login marker.
- Full workspace data is no longer retained in the application `localStorage` cache; Firestore remains the authoritative backend and persistent client cache.
- A Firebase Firestore predeploy guard now blocks accidental rules deployment while the legacy public rules remain active.

This layer is intentionally transitional. It does not remove plaintext passwords or change production Firestore rules.

## Safe Migration Contract

1. Back up `workspaces/main`, `projects`, `users`, and `logs` before enrollment.
2. Add an optional, validated `email` field to each existing user without removing the legacy record.
3. Enroll each user in Firebase Authentication using an administrator-controlled process. Passwords must be entered by the user or reset through Firebase; they must not be copied into Auth automatically from the plaintext workspace field.
4. Store the Firebase Auth UID on the existing user record as `authUid`.
5. Keep the legacy login available only during the migration window and mark each account with `authMigrationStatus: "enrolled"` after verification.
6. Test sign-in, sign-out, password reset, role access, company isolation, approvals, deletes, and offline recovery with the Firebase Emulator Suite.
7. Deploy authenticated rules only after all active users are enrolled and the rollback backup has been verified.
8. Remove plaintext password fields and legacy browser password comparison in a separate approved cleanup change.

## Rollback

Do not delete existing users or records during enrollment. Rollback consists of restoring the pre-migration backup and reverting the rules deployment. No production migration should be run from the browser.

## Required Administrator Inputs

- Verified email address for each active user.
- Firebase Auth enrollment/reset procedure approved by the system administrator.
- Company access mapping for each user.
- Role mapping for each user.
- Approval that the authenticated rules can replace the current public rules after emulator verification.
