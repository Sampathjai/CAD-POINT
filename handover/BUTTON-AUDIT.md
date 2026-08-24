# Button & Form Audit — Frontend Inventory

Generated: 2026-08-24

This inventory enumerates interactive elements found in `client/src` and maps each to the expected API, required permission, DB operation, and current verification status. Use this as the canonical checklist for verifying front-to-back functionality.

| Module | Button/Form | Expected behavior | API | Permission | DB operation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Login | Sign in button (login page) | Authenticate user, receive JWT, store token | POST /api/auth/login | public | read User table | IMPLEMENTED (manual tested; add e2e) |
| Navigation | Sidebar workspace buttons | Switch main view client-side | n/a | none | none | IMPLEMENTED (client-only) |
| Header | Global search input | Local filter / server search (TBD) | GET /api/search (not implemented) | authenticated | read across modules | CLIENT: implemented input; SERVER: not implemented |
| Header | Notification bell | Open notifications panel (placeholder) | GET /api/notifications (not implemented) | authenticated | read Notification | CLIENT: icon present; SERVER: not implemented |
| Header | User avatar/menu | Open profile/actions | GET /api/auth/me | authenticated | read User | IMPLEMENTED (client calls /auth/me) |
| Dashboard | Add Lead button | Open Add Lead modal | POST /api/leads | leads.create | create Lead | IMPLEMENTED (backend + frontend integration) |
| Dashboard | Schedule Follow-up button | Open follow-up scheduler modal | POST /api/followups | followups.create | create FollowUp | IMPLEMENTED (backend + frontend integration) |
| Dashboard | View calendar | Open calendar view | client-side | none | none | IMPLEMENTED (client-only) |
| Dashboard | View all (recent leads) | Navigate to Leads module | client-side | none | none | IMPLEMENTED (client-only) |
| Dashboard | Today's follow-up complete (round button) | Mark follow-up completed | PATCH /api/followups/:id/complete | followups.update | update FollowUp.completed | IMPLEMENTED (frontend calls complete endpoint) |
| Dashboard | Recent leads table rows | Click to open lead details (TBD) | GET /api/leads/:id | leads.read | read Lead | CLIENT: list present; SERVER: GET /leads/:id implemented? (verify) |
| Users | Add User button | Open create user modal | POST /api/users | SUPER_ADMIN | create User | IMPLEMENTED (frontend + backend) |
| Users | Create (form submit) | Submit and create user | POST /api/users | SUPER_ADMIN | create User | IMPLEMENTED (needs e2e) |
| Users | Search input | Filter users client-side | GET /api/users?search= | SUPER_ADMIN | read User | CLIENT: input present; SERVER supports listing |
| Modules | Module-level Add buttons (Courses, Batches, Students, Admissions, Payments) | Open module create forms (placeholders) | Module-specific APIs (not implemented here) | role-based | create respective records | CLIENT: placeholders; SERVER: not implemented (TBD) |

Summary & next steps
- PASS: Auth flow, Users create, Leads create, Follow-ups create, Follow-up complete — these are wired end-to-end in code and require integration test verification.
- TODO: Implement server endpoints for global search, notifications, and per-module create/read endpoints referenced by module Add buttons.
- TODO: Run automated integration tests (CI job added) to verify leads/followups flows. See `README.TESTING.md` for local steps.

Use this document as the source for marking each row PASS/FAIL once you run the integration tests or manual checks.

