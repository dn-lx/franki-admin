# Build-ready status — 10 September 2026

## Completed

- Expo SDK 57 / React Native 0.86 project structure.
- iOS bundle identifier: `de.frankiflow.admin`.
- Android application ID: `de.frankiflow.admin`.
- Supabase client configuration uses only the public project URL and publishable key.
- EAS profiles for Android APK, Android Play Store AAB, iOS internal IPA, and iOS App Store/TestFlight.
- GitHub Actions workflow for an installable Android preview APK without EAS credentials.
- GitHub Actions workflow for EAS cloud builds after Expo authorization.
- Provisional 1024×1024 app icon and Android adaptive icon.
- JSON, YAML and shell-script syntax validation passed in the current environment.
- Live Supabase backend and admin RLS were verified during the app implementation.

## External authorization still required

### Android private APK

Only a GitHub repository is required to run the included GitHub-hosted APK workflow. No Expo account is required for this path.

### Android Play Store

A production signing key and Google Play Console account are needed before publication. EAS can manage Android credentials if desired.

### iPhone / iPad

Apple does not permit a generally installable unsigned IPA. An Apple Developer Program team must sign the build. For internal ad hoc installation, the target iPhone UDID must be included in the provisioning profile. TestFlight uses App Store distribution signing.

### Expo EAS

An Expo account must own/link the EAS project. `eas init` will add the real `extra.eas.projectId` to the app configuration. The source intentionally does not contain a fabricated project ID.
