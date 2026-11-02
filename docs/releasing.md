# Releasing

`.github/workflows/release.yml` runs on a version tag and ships Ledgerly two ways:

- **Android:** a signed APK, built with Gradle on a GitHub runner and attached to the GitHub Release.
- **iPhone (and any browser):** the installable web app (PWA), deployed to GitHub Pages at
  <https://michaelgift.github.io/Ledgerly/>.

No Expo/EAS account is needed.

## One-time setup

### 1. Android signing key

Every APK must be signed with the same key, or phones refuse to install updates over the old version.
Create the key once (keep the file and passwords safe; losing them means users must uninstall to update):

```bash
keytool -genkeypair -v -keystore ledgerly-release.jks -alias ledgerly -keyalg RSA -keysize 2048 -validity 10000
```

Then add four secrets under the repo's *Settings › Secrets and variables › Actions*:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | output of `base64 -w0 ledgerly-release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
| `ANDROID_KEY_ALIAS` | `ledgerly` (the `-alias` above) |
| `ANDROID_KEY_PASSWORD` | the key password (same as the keystore password unless you set one) |

Don't commit the `.jks` file; `.gitignore` already excludes it.

### 2. GitHub Pages

1. *Settings › Pages › Build and deployment › Source*: choose **GitHub Actions**.
2. *Settings › Environments › github-pages › Deployment branches and tags*: add a **tag** rule
   for `v*`. Without it, Pages refuses deployments from release tags.

The site lives under `/Ledgerly/`, set by `experiments.baseUrl` in `app.json` and the paths in
`public/index.html`. If the repo is renamed, update all three (and the manifest `id`).

## Cutting a release

1. Bump `expo.version` in `app.json` (e.g. `1.0.0` → `1.1.0`) and commit it.
2. Tag that commit with the same version and push the tag:

   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

   Or run **Release** from the Actions tab and enter the tag; it is created on the branch you pick.

The workflow checks the tag matches `app.json`, lints and typechecks, then in parallel builds the APK
and deploys the web app, and finally publishes the release with `ledgerly-v1.1.0-android.apk` and
install instructions for both platforms.

Android's `versionCode` comes from the tag (`v1.2.3` → `10203`), so minor and patch numbers must
stay below 100.

## Installing

- **Android:** open the APK from the release on the phone and allow installs from that app when asked.
- **iPhone:** open the Pages URL in Safari, tap Share, then **Add to Home Screen**. The app works
  offline and updates itself on the next launch after a release.

Data stays on each device: the Android app and the web app keep separate databases until sync exists.

## How the web app stores data

The web build uses the same SQLite database as the native app (expo-sqlite's WebAssembly build).
That needs a cross-origin isolated page, which GitHub Pages can't provide with headers, so
`public/sw.js` adds them: the first visit loads once, the service worker takes over, and the page
reloads isolated. The same worker caches the app for offline use. `npm run build:web` builds it
locally into `dist/`.

## Building locally

```bash
npm run build:web
```

```bash
npx expo prebuild --platform android
```

```bash
cd android && ./gradlew assembleRelease
```

The local APK is signed with the debug key; only CI signs with the release key.
