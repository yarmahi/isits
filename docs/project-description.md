# IT Support Intake and Tracking System - Project Description

## 1. Project Summary

This project is an internal web application for tracking computers that are received by the IT support department for maintenance, diagnosis, repair, or return.

The application replaces the current Excel-based workflow with a simple, mobile-first, role-based system that gives the IT department a reliable operational record and gives the manager full oversight of all activity in the system.

The system is intentionally small and focused. It is **not** a dashboard-heavy enterprise product. The primary experience should revolve around:

- a clean top navigation
- a fast records list page
- a simple record form
- a detailed audit log
- a small number of clear management pages

The design must support future growth without forcing a major rewrite.

---

## 2. Business Problem

The current Excel workflow has several limitations:

- data entry is manual and inconsistent
- accountability is weak because edits are hard to trace
- it is difficult to know who created or updated a record
- searching and filtering across many records becomes slow and error-prone
- the manager cannot easily monitor all actions in one place
- extending the structure with new fields is difficult

This project solves those problems by centralizing the workflow in a secure web application with role-based access control and a full audit trail.

---

## 3. Main Goals

1. Replace Excel with a structured web-based record system.
2. Let IT specialists create and update service records.
3. Let the manager monitor all records, all users, and all major system activity.
4. Keep the UI simple, responsive, and mobile oriented.
5. Make search, filtering, and browsing fast even as the data grows.
6. Preserve accountability through a detailed immutable activity log.
7. Allow future field extension without redesigning the whole database.

---

## 4. Assumptions

These assumptions should be used unless the product owner changes them later:

- The system is **single-tenant** for one company.
- Only internal staff use the system.
- There are only two roles in version 1: **Manager** and **IT Specialist**.
- Users are created by the manager. There is no public registration.
- The app should default to a simple list-driven workflow, not a complex analytics dashboard.
- Records should be **soft deleted / archived**, not hard deleted, to preserve auditability.
- Authentication is required for all protected pages.
- The records list page is the default landing page after login.
- The UI language is English unless specified otherwise later.

---

## 5. User Roles and Permissions

### Manager

The manager has full oversight and administrative access.

Manager permissions:

- view all records
- create, edit, archive, and restore records
- view who created and who updated each record
- view the complete activity log
- filter and search activity logs
- manage IT specialist accounts
- activate, deactivate, and reset specialist access
- manage lookup data such as branches, statuses, and delivery methods
- manage field configuration in later phases

### IT Specialist

The IT specialist is the operational user of the system.

IT Specialist permissions:

- log in and log out
- view all records
- create new records
- edit only records they created
- search and filter all records
- view record details
- view their own profile/session information if implemented

IT Specialist restrictions:

- cannot manage users
- cannot view the manager-only activity log page unless explicitly allowed later
- cannot delete/archive records
- cannot edit other users' records
- cannot manage field definitions or system settings

---

## 6. Core Workflow

1. A computer is received by the IT support department.
2. An IT specialist opens the system and creates a new record.
3. The specialist enters the intake information.
4. The record is saved with system metadata such as:
   - created by
   - created at
   - updated by
   - updated at
5. As work progresses, the specialist updates the record they created.
6. When the computer is returned, the specialist sets the return date and final status.
7. The manager can review all records and inspect every important action through the audit log.

---

## 7. Initial Record Fields

These are the current fields coming from the Excel file and should exist in version 1.

| Excel Column | System Field | Type | Required | Notes |
|---|---|---|---|---|
| Date recieved | `date_received` | date | yes | use corrected spelling in code and UI |
| Date returned | `date_returned` | date | no | empty until item is returned |
| Branch name | `branch_id` or `branch_name` | lookup / text | yes | lookup table is preferred |
| Pc model | `pc_model` | text | yes | searchable |
| serial number | `serial_number` | text | yes | searchable |
| tag number | `tag_number` | text | no | searchable |
| maintainiance note | `maintenance_note` | long text | no | use corrected spelling in code and UI |
| Name | `customer_name` | text | yes | searchable |
| phone number | `phone_number` | text | yes | searchable |
| status | `status_id` or `status` | lookup | yes | configurable list |
| delivery way (physically or by car) | `delivery_method_id` | lookup | yes | `delivery_methods` table (dynamic, like branch and status); seed examples: `physical`, `by_car` |

### Recommended Additional System Fields

These are not in Excel but are strongly recommended for the application:

| Field | Purpose |
|---|---|
| `id` | primary key |
| `record_no` | human-friendly identifier such as `ITR-2026-0001` |
| `created_by` | user who created the record |
| `updated_by` | user who last updated the record |
| `created_at` | exact timestamp |
| `updated_at` | exact timestamp |
| `deleted_at` | soft delete / archive support |
| `custom_data` | JSONB field for future extension |

### Data Quality Notes

- Use lookup tables for **branch**, **status**, and **delivery method** to keep data consistent.
- Do **not** add database `UNIQUE` constraints on `serial_number` or `tag_number` in version 1.
- **Active records only:** On save, the app rejects a serial or tag that matches another **non-archived** row (so two open cases cannot share the same serial/tag). **Archived** rows are ignored—after a case is archived, a new intake can reuse the same serial or tag for the same machine.
- Normalize phone numbers for search if possible, but keep the original value for display.

---

## 8. Functional Requirements

### 8.1 Authentication and Access Control

The system must provide secure authentication.

Requirements:

- login page for internal users
- logout action
- protected routes
- role-based authorization on the server side
- no public signup
- manager-created user accounts for specialists
- disabled users cannot log in

### 8.2 User Management

Manager-only user management features:

- create IT specialist account
- edit account details
- activate/deactivate account
- reset password flow or set a temporary password
- view basic user metadata such as created date and last login if available

### 8.3 Records Management

Records features:

- create record
- edit record
- view record details
- list records
- archive/restore record (manager only)
- show record metadata: created by, created at, updated by, updated at

Business rules:

- IT specialists may edit only their own records.
- The manager may edit any record.
- Deletion should be implemented as archive/soft delete rather than hard delete.

### 8.4 Search, Filter, Sort, and Browsing

The records list page is the most important page in the system.

It should support:

- global search
- filter by date received range
- filter by date returned range
- filter by branch
- filter by status
- filter by delivery method
- filter by created by
- filter by updated by
- filter by active/archived state
- sort by date received, date returned, status, branch, created at, updated at
- server-side pagination
- query state reflected in the URL

Global search should target at least:

- record number
- serial number
- tag number
- PC model
- maintenance note
- customer name
- phone number
- branch

### 8.5 Activity Log / Audit Trail

The activity log is a first-class feature.

It must capture at minimum:

- login
- logout
- record creation
- record update
- record archive/delete
- user creation
- user update
- user activation/deactivation
- page views

For each activity log entry, capture as much of the following as practical:

- timestamp
- acting user id
- acting user name
- role
- action type
- entity type
- entity id
- entity label or human-friendly description
- route / page path
- full URL or path + query string
- HTTP method
- request id
- session id
- IP address
- raw user agent
- parsed browser name
- browser version
- operating system
- device type
- referrer if available
- before values for updates
- after values for updates
- additional metadata as JSON

Rules for audit logging:

- logs must be append-only
- logs must never be editable from the UI
- logs must never store passwords, reset tokens, cookies, or secrets
- logs must sanitize sensitive payloads before storage
- page view logging should ignore static assets and internal framework noise

### 8.6 UI / UX

UI requirements:

- mobile-first responsive design
- simple top navigation instead of a heavy dashboard sidebar
- clean forms with strong validation feedback
- records shown as cards on small screens and table/list on larger screens
- filters should be easy to use on mobile, preferably in a sheet or drawer
- minimal clutter
- manager pages visible only to manager

### 8.7 Extensibility

The system must allow future extension and controlled field removal.

Recommended interpretation:

- existing important fields remain as first-class database columns for speed and reporting
- future optional fields are stored in `custom_data` JSONB
- field definitions are stored in a configuration table
- removing a field in the UI should usually mean **deactivating/hiding** it, not physically dropping the database column immediately
- real physical column drops should only happen through an intentional migration later

This approach keeps the system flexible without sacrificing search performance on the most important fields.

---

## 9. Recommended Technology Stack

### Recommended Choice

Use a **Next.js + TypeScript + shadcn/ui + PostgreSQL** stack for this project.

Recommended stack details:

- **Next.js (App Router)** for the web application
- **TypeScript** across frontend and backend code
- **Tailwind CSS + shadcn/ui** for the UI
- **PostgreSQL** as the database (e.g. **Neon** serverless Postgres in production)
- **Drizzle ORM** for schema and queries
- **Better Auth** for authentication, with Auth.js as an acceptable fallback if needed
- **Zod** for validation
- a small user-agent parser library for browser and device parsing

### Why this stack fits this project

- one TypeScript codebase is convenient when using AI-assisted development tools such as Cursor
- Next.js works well as a monolithic internal app without needing a separate API server for a simple CRUD system
- shadcn/ui is a strong fit for a clean, minimal interface
- PostgreSQL gives strong relational modeling plus JSONB support for extensibility; Neon pairs cleanly with **Vercel** for hosting
- Drizzle is a good fit when you want close control over SQL, indexes, and PostgreSQL features

---

## 10. Suggested System Architecture

### 10.1 Main Tables

#### `users`

Suggested fields:

- `id`
- `full_name`
- `email` or `username`
- `phone_number` (optional)
- `role` (`manager`, `specialist`)
- `is_active`
- `password_hash` or auth-provider-managed fields
- `last_login_at` (optional)
- `created_at`
- `updated_at`

#### `records`

Suggested fields:

- `id`
- `record_no`
- `date_received`
- `date_returned`
- `branch_id`
- `pc_model`
- `serial_number`
- `tag_number`
- `maintenance_note`
- `customer_name`
- `phone_number`
- `status_id`
- `delivery_method_id`
- `custom_data` (JSONB)
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- `deleted_at`

#### `branches`

- `id`
- `name`
- `is_active`
- `created_at`
- `updated_at`

#### `statuses`

- `id`
- `name`
- `code`
- `sort_order`
- `is_active`

Suggested starter values:

- Received
- In Progress
- Waiting
- Ready for Return
- Returned
- Cancelled

#### `delivery_methods`

Same pattern as branches and statuses: manager-managed, active/inactive rows.

- `id`
- `name` (display label)
- `code` (stable key, e.g. `physical`, `by_car`)
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

Suggested starter values:

- Physical (`physical`)
- By car (`by_car`)

#### `field_definitions`

This table supports configurable fields.

Suggested fields:

- `id`
- `key`
- `label`
- `field_type` (`text`, `textarea`, `date`, `select`, `phone`, `boolean`)
- `storage_type` (`column`, `jsonb`)
- `column_name` (nullable)
- `json_key` (nullable)
- `is_system`
- `is_active`
- `is_required`
- `is_searchable`
- `is_filterable`
- `sort_order`
- `options_json`
- `created_at`
- `updated_at`

#### `activity_logs`

Suggested fields:

- `id`
- `occurred_at`
- `actor_user_id`
- `actor_role`
- `event_type`
- `entity_type`
- `entity_id`
- `entity_label`
- `route`
- `url`
- `http_method`
- `request_id`
- `session_id`
- `ip_address`
- `user_agent`
- `browser_name`
- `browser_version`
- `os_name`
- `device_type`
- `referrer`
- `before_data` (JSONB)
- `after_data` (JSONB)
- `metadata` (JSONB)

### 10.2 Service Layer Rule

All write operations should go through a dedicated server-side service layer.

Examples:

- `createRecord()`
- `updateRecord()`
- `archiveRecord()`
- `createUser()`
- `updateUser()`
- `setUserActiveState()`

Each service function must do all of the following in one place:

1. authorize the action
2. validate the payload
3. perform the database write
4. write the audit log entry
5. return a typed result

This is a critical architectural rule because it prevents missing audit logs and weak permission checks.

### 10.3 Soft Delete Rule

For records, prefer:

- archive = set `deleted_at`
- restore = clear `deleted_at`

Do not hard delete records in normal UI flows.

### 10.4 Time and Timezone Rule

- store timestamps in UTC+3 (Africa/Addis_Ababa)
- display them in the company timezone (Africa/Addis_Ababa)
- date fields such as `date_received` and `date_returned` can remain date-only in the UI

### 10.5 Deployment (target)

- **Hosting**: Vercel for the Next.js app (App Router, serverless-friendly).
- **Database**: Neon PostgreSQL; use `DATABASE_URL` (prefer Neon’s pooled connection string for serverless).
- **Migrations**: run Drizzle migrations against Neon from CI or locally for deploys; avoid ad-hoc schema changes in production.

---

## 11. Search and Performance Strategy

The list page must remain fast as data grows.

Recommended approach:

1. Use **server-side pagination**.
2. Keep the most important searchable fields as real columns.
3. Add indexes for high-value filters and sorting.
4. Use PostgreSQL text search and/or trigram search where it adds value.
5. Keep filters URL-driven so searches are shareable and reproducible.

### Suggested Indexes

At minimum, consider indexes for:

- `record_no`
- `date_received`
- `date_returned`
- `branch_id`
- `status_id`
- `delivery_method_id`
- `created_by`
- `updated_by`
- `deleted_at`
- `serial_number`
- `tag_number`
- `phone_number`

Additional options:

- full-text search index for text-heavy fields such as `pc_model`, `maintenance_note`, and `customer_name`
- trigram index for partial matching on serial number, tag number, phone number, and branch names if needed

---

## 12. Suggested Routes and Pages

### Public

- `/login`

### Authenticated - Shared

- `/records`
- `/records/new`
- `/records/[id]`
- `/records/[id]/edit`
- `/profile`

### Manager Only

- `/activity`
- `/users`
- `/users/new`
- `/users/[id]/edit`
- `/settings/fields`
- `/settings/lookups`

### Navigation Recommendation

#### Specialist

- Records
- New Record
- Profile / Logout

#### Manager

- Records
- New Record
- Activity Log
- Users
- Settings
- Profile / Logout

---

## 13. Non-Negotiable Implementation Rules for Cursor AI

These rules should be followed throughout the build:

1. Do not put authorization only in the UI. Enforce it on the server.
2. Do not write directly to the database from page components.
3. Do not perform record mutations without creating audit logs.
4. Do not hard delete records in normal flows.
5. Do not log secrets or passwords.
6. Do not use client-side only filtering for the main records list.
7. Do not create a sidebar-heavy admin dashboard unless requested later.
8. Always use migrations for schema changes.
9. Keep record filters and pagination in the URL.
10. Keep the UI responsive from the beginning.

---

## 14. Out of Scope for Version 1

To keep the project simple, the following are out of scope unless added later:

- file attachments
- public ticket submission portal
- inventory and spare-parts management
- SMS or email notifications
- SLA analytics dashboards
- multi-company tenancy
- advanced workflow automation
- Excel import wizard in the initial release

---

## 15. Definition of Success

The project is successful when:

- IT specialists can reliably create and update service records from desktop or mobile
- the manager can see all records and all important system activity
- every important action is traceable to a user, time, and request context
- the list page is fast, searchable, and easy to filter
- the UI feels simple and focused rather than heavy
- the data model can accept future fields without a disruptive redesign

