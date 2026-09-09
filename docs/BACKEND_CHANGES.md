# Production Backend Changes

Supabase project: `FrankiFlow & FrankiHolz Backend` (`eu-central-1`)

## Migration: add_frankiflow_mobile_operations

The mobile app needed structured operations data that did not previously exist in the FrankiFlow website backend. The following tables were added.

### frankiflow_clients
- `id` UUID primary key
- client type: private / business / airbnb / property management / other
- contact and address fields
- internal notes
- active flag
- created/updated timestamps

### frankiflow_employees
- `id` UUID primary key
- contact fields
- role: cleaner / inspector / manager / owner
- employment type: minijob / part-time / full-time / contractor / owner
- hourly rate (default EUR 13.90)
- optional link to a Supabase Auth user for future employee-app access
- active flag, notes and timestamps

### frankiflow_jobs
- client and assigned employee references
- service/title and service address
- start/end schedule
- status: scheduled / in progress / completed / cancelled
- billing mode: hourly / fixed / monthly
- agreed rate and estimated hours
- internal note and timestamps

### frankiflow_job_checklist_items
- belongs to a job
- ordered checklist label
- employee completion status/time
- inspector confirmation status/time
- notes and timestamps

### frankiflow_service_proofs
- one record per job
- employee reference
- actual start/finish times
- inspection completion/note
- completion timestamp

## Security

RLS is enabled on all five tables. Each table has an `ALL` policy for `authenticated` users that also requires the existing server-side `private.frankiflow_is_admin()` check. No anonymous access was granted.

A private `SECURITY INVOKER` trigger function updates `updated_at` on edits. Its execute privilege is not granted to the public API roles.

## Migration: index_frankiflow_mobile_foreign_keys

Added covering indexes for:
- `frankiflow_employees.auth_user_id`
- `frankiflow_job_checklist_items.completed_by`
- `frankiflow_service_proofs.employee_id`

The primary operational indexes also cover active clients/employees, job start/status, job client/employee and job checklist ordering.

## Existing backend reused without replacement

The app deliberately reuses the production systems already powering the websites:
- FrankiFlow quote requests, payments, site settings, gallery, testimonials and price configuration.
- FrankiHolz rooms, bookings, calendar, dynamic pricing, room images, site settings, iCal feeds/blocks and payment events.
- Existing Supabase Auth account and admin allowlists.
- Existing FrankiHolz Stripe Checkout, cancellation and webhook Edge Functions.
- Existing FrankiHolz iCal/Airbnb synchronization Edge Function.

This keeps mobile and web data in one source of truth.
