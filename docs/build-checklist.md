# IT Support Intake and Tracking System - Build Checklist

Use this checklist while implementing the phased plan.

---

## Phase 1 - Foundation and Project Skeleton

- [ ] Create the Next.js project with TypeScript and App Router.
- [ ] Install Tailwind CSS.
- [ ] Install and configure shadcn/ui.
- [ ] Set up PostgreSQL connection (local dev; production uses Neon + same `DATABASE_URL` on Vercel).
- [ ] Install and configure Drizzle ORM.
- [ ] Create migration workflow and first migration.
- [ ] Create shared app layout with top navigation.
- [ ] Create placeholder routes for Records, Activity, Users, Settings, and Profile.
- [ ] Add environment variable management and validation.
- [ ] Create base utility folders: `lib`, `db`, `services`, `types`, `components`.
- [ ] Decide on route naming and folder structure early.
- [ ] Add a simple health check / test page.

### Phase 1 Done When

- [ ] The app runs locally.
- [ ] The database is connected.
- [ ] Migrations work.
- [ ] The responsive shell is visible.

---

## Phase 2 - Authentication, Roles, and User Management

- [ ] Implement login page.
- [ ] Implement logout flow.
- [ ] Add protected routes.
- [ ] Create users table.
- [ ] Add role field with only `director` and `specialist`.
- [ ] Seed the first director account.
- [ ] Add `is_active` support for users.
- [ ] Prevent inactive users from logging in.
- [ ] Create server-side permission helpers.
- [ ] Create director-only users list page.
- [ ] Create director-only create user form.
- [ ] Create director-only edit user form.
- [ ] Add activate/deactivate action for specialists.
- [ ] Hide director-only navigation items from specialists.
- [ ] Enforce director-only access on the server, not just in the UI.

### Phase 2 Done When

- [ ] The director can log in.
- [ ] The director can manage specialists.
- [ ] Specialists can log in.
- [ ] Specialists cannot access director-only pages.

---

## Phase 3 - Core Records Module

- [ ] Create records table with all required Excel fields.
- [ ] Add system fields: `id`, `record_no`, `created_by`, `updated_by`, timestamps, `deleted_at`.
- [ ] Add `custom_data` JSONB column now, even if it is not used yet.
- [ ] Create branches table.
- [ ] Create statuses table.
- [ ] Create `delivery_methods` lookup table (same pattern as branches/statuses).
- [ ] Seed default statuses.
- [ ] Seed default delivery methods.
- [ ] Build create record page.
- [ ] Build edit record page.
- [ ] Build record detail page.
- [ ] Show created by / updated by metadata on the detail page.
- [ ] Implement record number generation.
- [ ] Build archive action instead of hard delete.
- [ ] Build restore action for archived records.
- [ ] Ensure specialists can edit only their own records.
- [ ] Ensure director can edit any record.
- [ ] Ensure all record writes go through service functions.
- [ ] Add server-side validation for all record payloads.

### Phase 3 Done When

- [ ] A specialist can create a record.
- [ ] A specialist can edit their own record.
- [ ] A specialist cannot edit another specialist's record.
- [ ] A director can edit any record.
- [ ] A director can archive and restore records.

---

## Phase 4 - Records List, Search, Filtering, Sorting, and Pagination

- [ ] Build records list page as the main landing page after login.
- [ ] Add server-side pagination.
- [ ] Add global search input.
- [ ] Add filters for date received range.
- [ ] Add filters for date returned range.
- [ ] Add filters for branch.
- [ ] Add filters for status.
- [ ] Add filters for delivery method.
- [ ] Add filters for created by.
- [ ] Add filters for updated by.
- [ ] Add filters for archived / active records.
- [ ] Add "only my records" filter.
- [ ] Add sorting controls.
- [ ] Sync all filters and pagination state to the URL.
- [ ] Build desktop table view.
- [ ] Build mobile card view.
- [ ] Add empty-state design.
- [ ] Add loading-state design.
- [ ] Create indexes for frequent filters and sort fields.
- [ ] Add duplicate warning checks for serial number and tag number if desired.

### Phase 4 Done When

- [ ] Users can find records quickly.
- [ ] Filters are preserved in the URL.
- [ ] The list works well on phone and desktop.
- [ ] The page does not rely on client-side full dataset filtering.

---

## Phase 5 - Detailed Activity Log and Audit Trail

- [ ] Create `activity_logs` table.
- [ ] Create centralized audit logging utility.
- [ ] Log successful login events.
- [ ] Log logout events.
- [ ] Log page views for authenticated page visits.
- [ ] Log record create events.
- [ ] Log record update events.
- [ ] Log record archive events.
- [ ] Log record restore events.
- [ ] Log user create events.
- [ ] Log user update events.
- [ ] Log user activate/deactivate events.
- [ ] Capture actor user id and role.
- [ ] Capture entity type and entity id.
- [ ] Capture route and URL.
- [ ] Capture HTTP method.
- [ ] Capture request id.
- [ ] Capture session id when available.
- [ ] Capture IP address.
- [ ] Capture raw user agent.
- [ ] Parse and store browser name and version.
- [ ] Parse and store operating system.
- [ ] Parse and store device type.
- [ ] Store before/after JSON snapshots for updates.
- [ ] Exclude secrets and sensitive values from logs.
- [ ] Build director-only activity log page.
- [ ] Add activity log filters for date, event type, actor, entity type, entity id, and IP.

### Phase 5 Done When

- [ ] The director can inspect the audit trail.
- [ ] All major actions appear in the log.
- [ ] Log entries include request metadata.
- [ ] No secret data is stored in the logs.

---

## Phase 6 - Field Configuration and Extensibility

- [ ] Create `field_definitions` table.
- [ ] Build director-only field settings page.
- [ ] Add support for active/inactive fields.
- [ ] Add support for required fields.
- [ ] Add support for searchable fields.
- [ ] Add support for filterable fields.
- [ ] Add support for field order.
- [ ] Add support for select options in custom fields.
- [ ] Render custom fields from configuration in the create form.
- [ ] Render custom fields from configuration in the edit form.
- [ ] Render custom fields from configuration in the detail page.
- [ ] Store custom field values in `records.custom_data`.
- [ ] Add basic search/filter support for searchable/filterable custom fields.
- [ ] Allow optional system fields to be hidden from the UI.
- [ ] Keep core required columns protected from unsafe removal.

### Phase 6 Done When

- [ ] The director can add a custom field without code changes.
- [ ] The director can hide an optional field.
- [ ] The record pages still work correctly with the configured fields.

---

## Phase 7 - UX Refinement, Validation, and Hardening

- [ ] Improve form validation messages.
- [ ] Improve error handling for failed submissions.
- [ ] Add loading states for key actions.
- [ ] Add friendly empty states.
- [ ] Add confirmation dialogs for archive, restore, deactivate, and similar actions.
- [ ] Improve mobile navigation behavior.
- [ ] Improve filter UI on small screens.
- [ ] Improve spacing and readability for cards and forms.
- [ ] Ensure labels and form controls are accessible.
- [ ] Check keyboard navigation on main pages.
- [ ] Ensure top navigation remains simple and uncluttered.
- [ ] Review page performance on realistic data.
- [ ] Review duplicate warning experience.

### Phase 7 Done When

- [ ] The UI feels clean and focused.
- [ ] The mobile experience feels intentional.
- [ ] Users get clear feedback for both success and failure states.

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
- [ ] Create seed script for director, statuses, branches, and delivery methods.
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
- [ ] The director can oversee all records and manage all users.
- [ ] The activity log captures CRUD, login/logout, and page views.
- [ ] The activity log stores rich metadata such as IP and browser context.
- [ ] The records list supports strong search and filtering.
- [ ] The design supports field extension without a major rewrite.
- [ ] The project remains simple and focused.

