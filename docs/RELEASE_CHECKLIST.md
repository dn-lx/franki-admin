# Release Checklist

## Before the first development build
1. On an internet-connected machine run `npm install` to create and commit `package-lock.json`.
2. Run `npm run doctor` and `npm run typecheck`.
3. Run `npx eas-cli login` and `npx eas-cli init`.
4. Ensure the EAS project ID in `app.json` is no longer the placeholder.
5. Add production app icon, Android adaptive foreground icon and splash artwork.
6. Build with `npm run build:dev` and test on a physical iPhone and Android device.

## Before store submission
1. Complete every section of `TEST_PLAN.md`.
2. Review Supabase Security Advisor and enable leaked-password protection.
3. Confirm only publishable Supabase client configuration is present in the app build.
4. Prepare privacy policy and support URLs.
5. Prepare App Store / Play Store screenshots and descriptions.
6. Create production binaries with `npm run build:production`.
7. Submit using the owner's Apple Developer and Google Play accounts.

## Deliberately not embedded
- Supabase service role key
- Stripe secret key
- Stripe webhook secret
- Database password
- Admin password
- Apple signing certificates
- Google Play service-account key
