# IT Support Intake and Tracking System - Incremental Build Plan

## Build Strategy

This plan is designed for AI-assisted development in Cursor.

Guiding rules:

- every phase must be useful on its own
- each phase may depend on earlier phases only
- no phase should require a later phase to be complete
- later phases should extend the system, not force a rebuild
- keep the codebase modular so the audit trail, permissions, and search logic stay consistent

The recommended stack assumed in this plan is:

- Next.js App Router (deploy target: **Vercel**)
- TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL (**Neon** in production; `DATABASE_URL` from the Neon dashboard)
- Drizzle ORM
- Better Auth or Auth.js for authentication

---

## Phase 1 - Foundation and Project Skeleton

### Goal

Create a clean technical foundation and application shell.

### Scope

- initialize the Next.js project with TypeScript
- install Tailwind CSS and shadcn/ui
- connect PostgreSQL (local or Neon; same `DATABASE_URL` pattern for Vercel)
- set up Drizzle ORM and migration workflow
- create shared layout and top navigation shell
- define the app folder structure
- configure environment variables and base utilities
- create placeholder pages for the main routes

### Key Decisions in This Phase

- use a top navigation, not a sidebar dashboard
- use a hybrid records design from day one by reserving a `custom_data` JSONB column in the records table, even if custom fields are not exposed yet
- define a service-layer folder early so later mutations are centralized

### Deliverables

- running app locally
- database connection working
- migration system working
- protected layout shell ready for future pages
- base folders such as `app`, `components`, `lib`, `db`, `services`, `types`

### Exit Criteria

- project starts cleanly
- first migration runs successfully
- app has a responsive top nav shell
- all placeholder routes render

---

## Phase 2 - Authentication, Roles, and User Management

### Goal

Secure the application and make users manageable.

### Scope

- implement login and logout
- implement role-based route protection
- create the users table and role model
- seed one director account
- build director-only user management pages
- allow the director to create, edit, activate, and deactivate specialist accounts
- build shared permission helpers

### Important Rules

- no public registration
- server-side authorization is mandatory
- disabled users must not log in
- users must be assigned one of two roles only: `director` or `specialist`

### Deliverables

- login page
- logout flow
- session handling
- role guards / access helpers
- users list page (director only)
- create/edit user forms (director only)

### Exit Criteria

- director can log in and manage specialist accounts
- specialist can log in but cannot access director-only pages
- protected routes work correctly

---

## Phase 3 - Core Records Module

### Goal

Make the main workflow usable end to end.

### Scope

- create the core `records` table
- include all current Excel fields
- add system fields such as `record_no`, `created_by`, `updated_by`, and timestamps
- build record creation form
- build record detail page
- build record edit page
- implement archive instead of hard delete
- create lookup tables and seed data for branches, statuses, and **delivery_methods** (dynamic like the others)
- show record metadata such as creator and last updater

### Rules in This Phase

- specialists can create records
- specialists can edit only their own records
- director can edit any record
- director can archive and restore records
- record writes must use service functions, not direct UI database calls

### Deliverables

- create record flow
- edit record flow
- view record details
- archive/restore flow
- record number generation
- lookup seed data

### Exit Criteria

- the app is already useful for real intake and update work
- specialists can create and maintain their own records
- director can review and manage any record

---

## Phase 4 - Records List, Search, Filtering, Sorting, and Pagination

### Goal

Turn the records list page into the main operational workspace.

### Scope

- build the main records list page
- add server-side pagination
- add global search
- add structured filters
- add sorting
- add URL-synced query state
- build mobile card view and desktop table view
- add indexes required for common filters and sorts
- add duplicate warnings for serial number and tag number where helpful

### Required Filters

- date received range
- date returned range
- branch
- status
- delivery method
- created by
- updated by
- active / archived
- only my records

### Required Search Targets

- record number
- serial number
- tag number
- customer name
- phone number
- PC model
- maintenance note
- branch

### Performance Notes

- do not fetch all rows to the client
- keep search and filtering server-side
- start with practical indexing on frequently queried columns
- add PostgreSQL full-text and trigram search only where it helps the real query patterns

### Deliverables

- usable searchable records workspace
- fast list page with filters
- responsive layout for both mobile and desktop

### Exit Criteria

- the records list page can be used as the main daily working page
- query state is shareable through the URL
- pagination and filters perform well on realistic sample data

---

## Phase 5 - Detailed Activity Log and Audit Trail

### Goal

Make the system fully accountable and traceable.

### Scope

- create the `activity_logs` table
- create a centralized audit logging utility
- log login and logout actions
- log page views for authenticated pages
- log create, update, and archive actions for records
- log create, update, activate, and deactivate actions for users
- store before/after snapshots for updates
- capture request metadata such as IP, browser, operating system, and device type
- create the director-only activity log page with filters

### Event Categories

- `auth.login`
- `auth.logout`
- `page.view`
- `record.create`
- `record.update`
- `record.archive`
- `record.restore`
- `user.create`
- `user.update`
- `user.activate`
- `user.deactivate`

### Technical Rules

- logs are append-only
- logs are written from the service layer or centralized request/event hooks
- page-view logging should exclude framework assets and other noisy requests
- sensitive fields must be removed or masked before logging

### Deliverables

- working audit logger
- filtered activity log page for the director
- request metadata capture
- before/after diff storage for update events

### Exit Criteria

- all major user actions are traceable
- the director can inspect who did what, when, where, and from which client context
- this phase is fully valuable even if field configuration does not exist yet

---

## Phase 6 - Field Configuration and Extensibility

### Goal

Allow the system to evolve beyond the original Excel columns without redesigning the database.

### Scope

- create the `field_definitions` table
- expose director-only field settings UI
- support activating/deactivating fields in the form and detail page
- support adding new custom fields stored in `records.custom_data`
- support ordering fields in the UI
- support marking fields as required, searchable, and filterable
- support select-type custom fields with options

### Design Intent

- core important fields remain real columns
- optional future fields live in JSONB
- "removing" a field usually means hiding/deactivating it in the UI
- physically dropping old columns is a later migration choice, not a normal UI action

### Deliverables

- field settings page
- ability to add at least one custom field type
- record forms and detail page that render custom fields dynamically
- basic search/filter support for fields flagged as searchable/filterable

### Exit Criteria

- the director can add a new custom field without code changes
- the director can hide an optional field from the form/UI
- the core record workflow still works without depending on any later phase

---

## Phase 7 - UX Refinement, Validation, and Hardening

### Goal

Make the application polished, reliable, and pleasant to use.

### Scope

- improve form validation and inline error messages
- add loading, empty, and error states
- refine mobile interactions for forms, filters, and navigation
- add confirmation dialogs for risky actions
- improve accessibility labels and keyboard support
- add duplicate detection warnings where useful
- ensure director-only pages are clearly separated
- improve consistency of record cards, tables, and details views

### Deliverables

- polished responsive UI
- reliable validation behavior
- consistent feedback for all critical actions
- cleaner and more seamless mobile experience

### Exit Criteria

- the application feels production-ready to end users
- the main flows are clear on phone and desktop
- error states do not feel broken or confusing

---

## Phase 8 - Testing, Deployment, and Handover

### Goal

Prepare the project for real-world use.

### Scope

- add tests for permissions, records logic, and audit logging
- add end-to-end tests for login, create record, update record, filtering, and activity log visibility
- prepare production environment configuration
- create seed data for initial branches, statuses, and director account
- add backup and migration notes
- write a concise developer README for future maintenance
- document how to run the app locally and how to deploy it

### Minimum Test Coverage Targets

- permissions: specialists cannot edit others' records
- director-only routes are protected
- record create/update/archive actions log correctly
- activity log entries are written with metadata
- filters return expected results

### Deliverables

- test suite
- deployment notes
- seed scripts
- operational README

### Exit Criteria

- project can be deployed with confidence
- new developers can understand and run the project
- the team has a clear handover package

---

## Recommended Build Order Notes for Cursor

Use this order exactly:

1. foundation
2. auth and users
3. records CRUD
4. list/search/filter
5. audit logging
6. extensibility
7. UX polish
8. testing and deployment

This order keeps the project incremental and practical:

- Phase 3 already gives a working product.
- Phase 4 makes it operationally strong.
- Phase 5 adds full accountability.
- Phase 6 adds flexibility without blocking earlier phases.
- Phase 7 and Phase 8 improve quality rather than changing the architecture.

