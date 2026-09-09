# Franki Admin — FrankiFlow + FrankiHolz

Cross-platform iPhone and Android administration app for the FrankiFlow cleaning business and FrankiHolz accommodation business.

## What is included

### Shared
- Supabase email/password authentication using the existing admin account.
- Server-side authorization through the existing FrankiFlow and FrankiHolz admin allowlists/RLS policies.
- German / English interface.
- Combined live dashboard.
- Role-aware navigation: a user only sees the business modules they are authorized to access.
- Persistent mobile session; service-role and Stripe secret keys are never embedded in the app.

### FrankiFlow
- Quote/request inbox with statuses, contact actions and internal notes.
- Clients database.
- Employees database with role, employment type, hourly rate and active status.
- Cleaning jobs with client, employee, schedule, billing mode, agreed rate and address.
- Per-job cleaning checklist with employee completion and inspection confirmation.
- Payment overview and checkout links.
- Live price-calculator administration for service prices, minimum charge, Grundreinigung, first-month promotion, windows/equipment and VAT.
- Website content in German and English.
- Website gallery uploads/deletes and testimonial management.

### FrankiHolz
- Booking inbox with guest/stay/payment details.
- New booking request creation.
- Safe booking approval through the existing Stripe Checkout Edge Function.
- Shareable Stripe payment link.
- Safe cancellation of unpaid reservations through the existing payment-expiry Edge Function.
- Monthly room calendar showing rates, bookings, manual blocks and external iCal blocks.
- Date-range availability/block controls, price overrides and notes.
- Room name, description, base price, capacity and online status editing.
- Room photo uploads and deletes.
- Dynamic pricing settings: weekend, last-minute, long-stay, occupancy and payment-hold rules.
- FrankiHolz website hero, DE/EN content, address and SEO settings.
- Airbnb/other iCal feed management and manual sync.

## Backend

This project uses the existing Supabase project **FrankiFlow & FrankiHolz Backend** in `eu-central-1`.

The app only receives these public client values through `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Never add `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, webhook signing secrets, database passwords or other private credentials to `.env` in this mobile project.

Two production migrations were added for the mobile operations module:

- `add_frankiflow_mobile_operations`
- `index_frankiflow_mobile_foreign_keys`

They add the admin-only tables:

- `frankiflow_clients`
- `frankiflow_employees`
- `frankiflow_jobs`
- `frankiflow_job_checklist_items`
- `frankiflow_service_proofs`

Every new public table has Row Level Security enabled. CRUD access is granted only to authenticated users for whom the existing `private.frankiflow_is_admin()` authorization check returns true.

## Local setup

Requirements:
- Node.js LTS
- npm
- Expo account for cloud/device builds
- Android Studio for a local Android emulator (optional)
- macOS + Xcode for a local iOS simulator (optional); Windows users can still create iOS builds through EAS Build.

Install and start:

```bash
npm install
npx expo start
```

Then open the project with Expo Go for development where supported, or create a development build.

## EAS device builds

First sign in and initialize EAS:

```bash
npx eas login
npx eas init
```

After `eas init`, replace the placeholder `REPLACE_AFTER_EAS_INIT` in `app.json` if EAS did not update it automatically.

Development build:

```bash
npm run build:dev
```

Internal preview build:

```bash
npm run build:preview
```

Production store binaries:

```bash
npm run build:production
```

App identifiers are currently:
- iOS bundle identifier: `de.frankiflow.admin`
- Android application ID: `de.frankiflow.admin`

Store signing and publication require the owner's Apple Developer / Google Play / Expo credentials and are intentionally not stored in this source package.

## First login

The login screen is pre-filled with the existing admin email `info@frankiflow.de`. The password is deliberately not stored in the project.

## Source structure

```text
App.tsx                       Main application shell and bottom navigation
src/context/                  Authentication and DE/EN language state
src/lib/                      Supabase client and formatting helpers
src/components/               Shared mobile UI components
src/screens/HomeScreen.tsx    Combined business dashboard
src/screens/flow/             FrankiFlow modules
src/screens/holz/             FrankiHolz modules
docs/                         Security, deployment and test documentation
```

## Important production notes

1. Run the test plan in `docs/TEST_PLAN.md` before submitting store builds.
2. Enable Supabase leaked-password protection before wider production use.
3. Add app icons/splash artwork before App Store/Google Play publication.
4. For push notifications, add Expo Notifications plus a server-side notification function. The current app relies on live dashboard updates rather than push notifications.
5. Refunds for paid FrankiHolz bookings are intentionally not exposed as a one-tap mobile cancellation because the existing backend requires a proper refund workflow first.

## Ready-made cloud build automation

This package now includes two CI paths:

### 1. GitHub-only Android test APK

`.github/workflows/android-apk.yml` can create `FrankiAdmin-Android.apk` on a GitHub-hosted Android runner without requiring an Expo account. The workflow generates the native Android project, bundles the JavaScript into the release APK, and uses the generated debug signing identity for private device testing. It is not a Google Play production signing identity.

### 2. Expo EAS production builds

`.github/workflows/eas-cloud-build.yml` supports the `android-apk`, `ios-internal`, `production-android`, and `production-ios` EAS profiles. This path requires an Expo project and `EXPO_TOKEN`. iOS additionally requires Apple signing credentials.

See `docs/CLOUD_BUILD.md` for the exact build paths.
