# Cloud build paths

## Fastest: GitHub Actions Android APK (no Expo account required)

The repository includes `.github/workflows/android-apk.yml`. It builds an installable Android APK on a GitHub-hosted Ubuntu/Android runner.

1. Put this project in a GitHub repository.
2. Open **Actions → Build installable Android APK → Run workflow**.
3. When the workflow finishes, open the run and download the **FrankiAdmin-Android-APK** artifact.
4. The artifact contains `FrankiAdmin-Android.apk` and its SHA-256 checksum.

The generated preview APK is signed with the generated development/debug signing configuration. It is intended for private testing, not Google Play publication.

## EAS Android APK

One-time Expo setup:

```bash
npx eas login
npx eas init
```

Then:

```bash
npm run build:android:apk
```

The `android-apk` profile sets `distribution: internal` and `android.buildType: apk`.

## Google Play AAB

```bash
npm run build:android:store
```

This uses the `production-android` profile and produces an Android App Bundle (`.aab`) suitable for Google Play after signing is configured.

## iPhone internal IPA

An installable iPhone `.ipa` must be signed with an Apple Developer Program team and an ad hoc provisioning profile that includes the test device.

```bash
npm run build:ios:internal
```

EAS can manage the certificate and provisioning profile. Register the iPhone in EAS/Apple first when using ad hoc internal distribution.

## TestFlight

```bash
npm run build:ios:testflight
```

This creates the store-distribution iOS build and attempts submission to TestFlight. Apple Developer / App Store Connect authorization is required.

## GitHub + EAS automation

`.github/workflows/eas-cloud-build.yml` is included for manual cloud builds. Create a GitHub repository secret named `EXPO_TOKEN`, initialize/link the EAS project once, then trigger the workflow from GitHub Actions.

The Supabase URL and publishable key are client-public values. No Supabase service-role key, Stripe secret, database password, Apple private key, or Expo token is committed to the project.
