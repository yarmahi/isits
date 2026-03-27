# IT Support Intake and Tracking System - Build Checklist

Use this checklist while implementing the phased plan.

---

## Phase 1 - Foundation and Project Skeleton

- [x] Create the Next.js project with TypeScript and App Router.
- [x] Install Tailwind CSS.
- [x] Install and configure shadcn/ui.
- [x] Set up PostgreSQL connection (local dev; production uses Neon + same `DATABASE_URL` on Vercel).
- [x] Install and configure Drizzle ORM.
- [x] Create migration workflow and first migration.
- [x] Create shared app layout with top navigation.
- [x] Create placeholder routes for Records, Activity, Users, Settings, and Profile.
- [x] Add environment variable management and validation.
- [x] Create base utility folders: `lib`, `db`, `services`, `types`, `components`.
- [x] Decide on route naming and folder structure early.
- [x] Add a simple health check / test page.

### Phase 1 Done When

- [x] The app runs locally.
- [x] The database is connected.
- [x] Migrations work.
- [x] The responsive shell is visible.

---

## Phase 2 - Authentication, Roles, and User Management

- [x] Implement login page.
- [x] Implement logout flow.
- [x] Add protected routes.
- [x] Create users table.
- [x] Add role field with only `manager` and `specialist`.
- [x] Seed the first manager account.
- [x] Add `is_active` support for users.
- [x] Prevent inactive users from logging in.
- [x] Create server-side permission helpers.
- [x] Create manager-only users list page.
- [x] Create manager-only create user form.
- [x] Create manager-only edit user form.
- [x] Add activate/deactivate action for specialists.
- [x] Hide manager-only navigation items from specialists.
- [x] Enforce manager-only access on the server, not just in the UI.

### Phase 2 Done When

- [x] The manager can log in.
- [x] The manager can manage specialists.
- [x] Specialists can log in.
- [x] Specialists cannot access manager-only pages.

---

## Phase 3 - Core Records Module

- [x] Create records table with all required Excel fields.
- [x] Add system fields: `id`, `record_no`, `created_by`, `updated_by`, timestamps, `deleted_at`.
- [x] Add `custom_data` JSONB column now, even if it is not used yet.
- [x] Create branches table.
- [x] Create statuses table.
- [x] Create `delivery_methods` lookup table (same pattern as branches/statuses).
- [x] Seed default statuses.
- [x] Seed default delivery methods.
- [x] Build create record page.
- [x] Build edit record page.
- [x] Build record detail page.
- [x] Show created by / updated by metadata on the detail page.
- [x] Implement record number generation.
- [x] Build archive action instead of hard delete.
- [x] Build restore action for archived records.
- [x] Ensure specialists can edit only their own records.
- [x] Ensure manager can edit any record.
- [x] Ensure all record writes go through service functions.
- [x] Add server-side validation for all record payloads.

### Phase 3 Done When

- [x] A specialist can create a record.
- [x] A specialist can edit their own record.
- [x] A specialist cannot edit another specialist's record.
- [x] A manager can edit any record.
- [x] A manager can archive and restore records.

---

## Phase 4 - Records List, Search, Filtering, Sorting, and Pagination

- [ ] Build records list page as the main landing page after login.
- [x] Add server-side pagination.
- [x] Add global search input.
- [x] Add filters for date received range.
- [x] Add filters for date returned range.
- [x] Add filters for branch.
- [x] Add filters for status.
- [x] Add filters for delivery method.
- [x] Add filters for created by.
- [x] Add filters for updated by.
- [x] Add filters for archived / active records.
- [x] Add "only my records" filter.
- [x] Add sorting controls.
- [x] Sync all filters and pagination state to the URL.
- [x] Build desktop table view.
- [x] Build mobile card view.
- [x] Add empty-state design.
- [x] Add loading-state design.
- [x] Create indexes for frequent filters and sort fields.
- [x] Duplicate checks for serial/tag among **active** records on save (archived rows ignored).

### Phase 4 Done When

- [x] Users can find records quickly.
- [x] Filters are preserved in the URL.
- [x] The list works well on phone and desktop.
- [x] The page does not rely on client-side full dataset filtering.

---

## Phase 5 - Detailed Activity Log and Audit Trail

- [x] Create `activity_logs` table.
- [x] Create centralized audit logging utility.
- [x] Log successful login events.
- [x] Log logout events.
- [x] Log page views for authenticated page visits.
- [x] Log record create events.
- [x] Log record update events.
- [x] Log record archive events.
- [x] Log record restore events.
- [x] Log user create events.
- [x] Log user update events.
- [x] Log user activate/deactivate events.
- [x] Capture actor user id and role.
- [x] Capture entity type and entity id.
- [x] Capture route and URL.
- [x] Capture HTTP method.
- [x] Capture request id.
- [x] Capture session id when available.
- [x] Capture IP address.
- [x] Capture raw user agent.
- [x] Parse and store browser name and version.
- [x] Parse and store operating system.
- [x] Parse and store device type.
- [x] Store before/after JSON snapshots for updates.
- [x] Exclude secrets and sensitive values from logs.
- [x] Build manager-only activity log page.
- [x] Add activity log filters for date, event type, actor, entity type, entity id, and IP.

### Phase 5 Done When

- [x] The manager can inspect the audit trail.
- [x] All major actions appear in the log.
- [x] Log entries include request metadata.
- [x] No secret data is stored in the logs.

---

## Phase 6 - Field Configuration and Extensibility

- [x] Create `field_definitions` table.
- [x] Build manager-only field settings page.
- [x] Add support for active/inactive fields.
- [x] Add support for required fields.
- [x] Add support for searchable fields.
- [x] Add support for filterable fields.
- [x] Add support for field order.
- [x] Add support for select options in custom fields.
- [x] Render custom fields from configuration in the create form.
- [x] Render custom fields from configuration in the edit form.
- [x] Render custom fields from configuration in the detail page.
- [x] Store custom field values in `records.custom_data`.
- [x] Add basic search/filter support for searchable/filterable custom fields.
- [x] Allow optional system fields to be hidden from the UI.
- [x] Keep core required columns protected from unsafe removal.

### Phase 6 Done When

- [x] The manager can add a custom field without code changes.
- [x] The manager can hide an optional field.
- [x] The record pages still work correctly with the configured fields.

---

## Phase 7 - UX Refinement, Validation, and Hardening

- [x] Improve form validation messages.
- [x] Improve error handling for failed submissions.
- [x] Add loading states for key actions.
- [x] Add friendly empty states.
- [x] Add confirmation dialogs for archive, restore, deactivate, and similar actions.
- [x] Improve mobile navigation behavior.
- [x] Improve filter UI on small screens.
- [x] Improve spacing and readability for cards and forms.
- [x] Ensure labels and form controls are accessible.
- [x] Check keyboard navigation on main pages.
- [x] Ensure top navigation remains simple and uncluttered.
- [x] Review page performance on realistic data.
- [x] Review duplicate check behavior (active vs archived records).

### Phase 7 Done When

- [x] The UI feels clean and focused.
- [x] The mobile experience feels intentional.
- [x] Users get clear feedback for both success and failure states.

---

## Phase 8 - Testing, Deployment, and Handover

- [ ] Add permission tests.
- [ ] Add record service tests.
- [ ] Add audit logging tests.
- [ ] Add end-to-end login test.
- [ ] Add end-to-end create record test.
- [ ] Add end-to-end edit record test.
- [ ] Add end-to-end record filtering test.
- [ ] Add end-to-end activity log visibility test.
- [ ] Prepare production environment variables.
- [ ] Create seed script for manager, statuses, branches, and delivery methods.
- [ ] Write local setup instructions.
- [ ] Write deployment instructions.
- [ ] Write backup/migration notes.
- [ ] Write short maintenance README.
- [ ] Verify migrations can run in a clean environment.
- [ ] Verify the app can be started by a new developer following the README.

### Phase 8 Done When

- [ ] The project can be deployed.
- [ ] The core workflows are tested.
- [ ] The team can maintain the codebase after handover.

---

## Final Review Checklist

- [ ] The app uses top navigation instead of a heavy dashboard.
- [ ] The app is mobile oriented and responsive.
- [ ] Specialists can create records and edit only their own records.
- [ ] Specialists can view all records.
- [ ] The manager can oversee all records and manage all users.
- [ ] The activity log captures CRUD, login/logout, and page views.
- [ ] The activity log stores rich metadata such as IP and browser context.
- [ ] The records list supports strong search and filtering.
- [ ] The design supports field extension without a major rewrite.
- [ ] The project remains simple and focused.
