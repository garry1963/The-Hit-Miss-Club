# Security Specification - Hit & Miss Golf Society DB

## 1. Data Invariants
1. Only authenticated users can read society data.
2. Only authorized administrators (Admin conceptual check) can perform write operations (create, update, delete) on divisions, courses, events, and settings.
3. Members can register themselves, but we allow club-wide views for authenticated members.
4. All IDs must be strictly validated alpha-numeric-dash characters.
5. Strict Schema validation must be verified on creation and updates.

## 2. The "Dirty Dozen" Malware/Spoof Payloads
We test 12 malicious payloads to ensure permissions block them:
1. Impersonating another player when registering/updating profiles.
2. Injecting a 1MB string into a division name or golf course name.
3. Accessing member personal PII (email, phone, notes) as a non-owner, non-admin.
4. Directly creating high scores/results to alter standings without authorization.
5. Changing the active season status directly as a general member.
6. Bypass schema validation by sending shadow property fields (e.g. `isAdmin: true`).
7. Bypassing state machine rules by registering a tournament entry for a fictional, non-existent event.
8. Modifying a completed tournament result to change player standings after it has finalized.
9. Modifying static metadata like `createdAt` or immutability tags.
10. Attempting an injection attack on Member fields.
11. Bypassing the system-generated constraint on statistics calculations.
12. Attempting to spoof an administrator's email or identity.

## 3. Test Runner Concept (verification outline)
All operations described in the Dirty Dozen must result in `PERMISSION_DENIED` when queried against the final `firestore.rules`.
