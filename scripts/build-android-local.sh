#!/usr/bin/env bash
set -euo pipefail
: "${EXPO_PUBLIC_SUPABASE_URL:?Set EXPO_PUBLIC_SUPABASE_URL or copy .env.example to .env}"
: "${EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:?Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY}"
npm install --no-audit --no-fund
npx expo install --check
EXPO_NO_GIT_STATUS=1 npx expo prebuild --platform android --clean --npm
(
  cd android
  chmod +x gradlew
  ./gradlew assembleRelease --no-daemon
)
mkdir -p release
cp android/app/build/outputs/apk/release/app-release.apk release/FrankiAdmin-Android.apk
sha256sum release/FrankiAdmin-Android.apk > release/FrankiAdmin-Android.apk.sha256
echo "APK: release/FrankiAdmin-Android.apk"
