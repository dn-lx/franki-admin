# FrankiFlow Admin App — FrankiFlow + FrankiHolz

Cross-platform iPhone and Android administration app for the FrankiFlow cleaning business and FrankiHolz accommodation business.

## What is included

### Shared
- Supabase email/password authentication using the existing admin account.
- Server-side authorization through the existing FrankiFlow and FrankiHolz admin allowlists/RLS policies.
- German / English interface.
- Combined live dashboard without a generated personal greeting; the home hero is a neutral Dashboard view.
- Role-aware navigation: a user only sees the business modules they are authorized to access.
- Persistent mobile session; service-role and Stripe secret keys are never embedded in the app.
- User-facing app name: **FrankiFlow Admin App**.
- Approved dark FrankiFlow symbol-only application icon.

### FrankiFlow
- Quote/request inbox with statuses, contact actions and internal notes.
- Clients database.
- Employees database with role, employment type, hourly rate and active status.
- Cleaning jobs with client, employee, schedule, billing mode, agreed rate and address.
- Per-job cleaning checklist with employee completion and inspection confirmation.
- Customer-facing bilingual service checklist editor for office, home, Airbnb, stairwell, deep and window cleaning. These are the same checklist records used by the public Preisrechner and quotation PDF.
- Payment overview and checkout links.
- Live price-calculator administration for service prices, minimum charge, Grundreinigung, first-month promotion, windows/equipment and VAT.
- Website content in German and English.
- Website gallery uploads/deletes and testimonial management.

### FrankiHolz
- Booking inbox with guest/stay/payment details.
- Compact horizontal booking filters for All / Pending / Confirmed / Paid / Cancelled so the controls fit comfortably on phone screens.
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

The FrankiFlow service checklist source of truth is `public.frankiflow_checklists`. Each record stores the German and English service label plus ordered bilingual sections/tasks in JSONB. Public users can read the checklist for quotation display; writes are restricted by the existing FrankiFlow admin RLS check.

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

App identifiers remain stable:
- iOS bundle identifier: `de.frankiflow.admin`
- Android application ID: `de.frankiflow.admin`

The user-facing application name is **FrankiFlow Admin App**. The technical slug and package/bundle identifiers stay unchanged so existing installations and signing configuration remain compatible.

## First login

The login screen is pre-filled with the existing admin email `info@frankiflow.de`. The password is deliberately not stored in the project.

## Source structure

```text
App.tsx                       Main application shell and bottom navigation
src/context/                  Authentication and DE/EN language state
src/lib/                      Supabase client and formatting helpers
src/components/               Shared mobile UI components
src/screens/HomeScreen.tsx    Combined business dashboard
src/screens/flow/             FrankiFlow modules including ChecklistsView
src/screens/holz/             FrankiHolz modules
docs/                         Security, deployment and test documentation
```

## Important production notes

1. Run the test plan before submitting store builds.
2. Keep service-role and Stripe secrets out of the app.
3. Customer-facing service checklist edits go live through Supabase and affect the Preisrechner/quotation scope after saving.
4. Refunds for paid FrankiHolz bookings are intentionally not exposed as a one-tap mobile cancellation because the existing backend requires a proper refund workflow first.
5. The approved dark application icon is stored in the FrankiFlow project Drive folder and is pulled into the Android build workflow before Expo prebuild.

## GitHub Android build

`.github/workflows/android.yml` builds `FrankiFlow-Admin-App-1.2.1.apk`, validates TypeScript, applies the approved dark FrankiFlow symbol-only icon, installs the APK on an Android emulator and performs a launch smoke test. The application shown on the device is named **FrankiFlow Admin App**.
