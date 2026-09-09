# Validation Report — 10 September 2026

## Passed in this environment
- Supabase project discovery and production project health check.
- Existing admin identity is authorized for both FrankiFlow and FrankiHolz.
- New FrankiFlow operations database migration applied successfully.
- New foreign-key indexes migration applied successfully.
- All five new operational tables verified present in production.
- All five new operational tables verified with authenticated admin policies.
- Existing Stripe payment/cancellation and iCal sync functions inspected and reused instead of duplicating secret logic in the mobile client.
- JSON parsing for `package.json`, `app.json`, `eas.json`, and `tsconfig.json`.
- Every relative TypeScript import resolves to a source file.
- TypeScript/TSX parser pass found no syntax/JSX parse errors.
- Source scan found no Stripe secret key, Supabase secret key or service-role credential value.

## Build dependency limitation
This execution container could not reach npm long enough to download Expo/React Native dependencies. `npm install` timed out, therefore a dependency-backed `npm run typecheck`, `expo-doctor`, simulator launch, EAS binary build and physical-device test cannot honestly be marked as completed here.

Run these on an internet-connected development machine before release:

```bash
npm install
npm run doctor
npm run typecheck
npx expo start
```

Then follow `RELEASE_CHECKLIST.md` and `TEST_PLAN.md`.

## Security advisor note
The existing Supabase project already had several advisor notices outside the newly created mobile operations tables. In particular, leaked-password protection is currently disabled. Enable it before broad production rollout. The existing FrankiHolz public booking/rate RPCs also produce security-definer advisor notices; those should be reviewed in context because some are intentionally public guest endpoints.

## Cloud-build preparation update — 10 September 2026

- `app.json`, `package.json`, and `eas.json`: parsed successfully as JSON.
- `.github/workflows/android-apk.yml`: parsed successfully as YAML.
- `.github/workflows/eas-cloud-build.yml`: parsed successfully as YAML.
- `scripts/build-android-local.sh`: passed `bash -n` syntax validation.
- Expo SDK 57 dependency baseline was checked against current Expo documentation; SDK 57 targets React Native 0.86 and React 19.2.3.
- Android test workflow builds the generated native `release` variant; Expo's current bare template signs local release builds with the debug keystore by default for testing. It must not be used as the Google Play production signing identity.
- A real cloud build has not yet been triggered because no GitHub repository/Expo account is authorized in this chat.
