# Building for Capacitor (iOS / Android)

## Why You Must Always Clean Before Building

Next.js generates chunk files with content-based hashes in their filenames (e.g. `190-60da933b3aea3e26.js`). When you rebuild, the hashes change but old files from the previous build remain in the `out/` directory. When `npx cap sync` copies the `out/` folder into the iOS/Android project, the HTML page references new hashes while the old chunk files still exist alongside them — or vice versa. Capacitor serves files from the local filesystem using the `capacitor://localhost` scheme, and any mismatch causes:

```
ChunkLoadError: Loading chunk 190 failed.
(error: capacitor://localhost/_next/static/chunks/190-60da933b3aea3e26.js)
```

This results in a **blank screen** on the device.

The `assetPrefix: './'` setting in `next.config.mjs` ensures all asset paths are relative, which is required for Capacitor's `capacitor://localhost` scheme to resolve chunks correctly from the local filesystem.

## Correct Build Commands

### iOS
```bash
npm run build:ios
```
This runs `npm run clean && next build && npx cap sync ios && npx cap open ios`.

### Android
```bash
npm run build:android
```
This runs `npm run clean && next build && npx cap sync android && npx cap open android`.

### Both Platforms
```bash
npm run build:mobile
```
This runs `npm run clean && next build && npx cap sync`.

### Manual Clean
```bash
npm run clean
```
Removes the `out/` and `.next/` directories.

## What Happens Automatically

A `prebuild` script is configured in `package.json`. This means every time you run `npm run build` directly, it first cleans stale artifacts automatically — no manual clean step needed for standard builds.

## Troubleshooting: Blank Screen on Device

If you see a blank screen after installing on iOS or Android:

1. **Check the Xcode / Android Studio console** for a `ChunkLoadError` message.
2. **Clean and rebuild:**
   ```bash
   npm run build:ios
   # or
   npm run build:android
   ```
3. **Verify `assetPrefix`** — open `next.config.mjs` and confirm `assetPrefix: './'` is present.
4. **Hard-reinstall the app** on the device/simulator after syncing, to ensure no cached chunks remain.
5. If the issue persists, delete the native project's web assets folder manually:
   - iOS: `ios/App/App/public/`
   - Android: `android/app/src/main/assets/public/`
   Then re-run `npx cap sync`.
