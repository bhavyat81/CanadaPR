# Mobile App Build Guide

## Prerequisites
- Node.js 18+
- For iOS: macOS with Xcode 15+ (use MacInCloud if on Windows)
- For Android: Android Studio
- Apple Developer Account (for iOS App Store)
- Google Play Developer Account (for Android)

## Setup (First Time Only)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the web app:
   ```bash
   npm run build
   ```

3. Add native platforms:
   ```bash
   npx cap add ios
   npx cap add android
   ```

4. Sync web assets to native projects:
   ```bash
   npx cap sync
   ```

## iOS Build

1. Open in Xcode:
   ```bash
   npx cap open ios
   ```

2. In Xcode:
   - Select your team/signing certificate
   - Set the target device
   - Product > Archive
   - Distribute to App Store

## Android Build

1. Open in Android Studio:
   ```bash
   npx cap open android
   ```

2. In Android Studio:
   - Build > Generate Signed Bundle/APK
   - Follow the signing wizard
   - Upload to Google Play Console

## Daily Development

After making code changes:
```bash
npm run build:mobile
```

This rebuilds the web app and syncs to both platforms.

## App Details
- **Bundle ID**: com.canadapr.chat
- **App Name**: Canada PR Chat
