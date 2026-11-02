# Ledgerly

A spending tracker for Android and iPhone. Record expenses and income in a couple of taps, then see
where the money goes: month overviews, six-month trends, and an analysis playground you drive by
building a sentence ("Show **total spent** by **week** over **3 months** in **Food**").

Everything is stored on your device. Syncing through a shared backend is planned; the data model is
already built for it.

## Install

- **Android:** download the latest `ledgerly-…-android.apk` from
  [Releases](https://github.com/MichaelGift/Ledgerly/releases/latest) on your phone and open it.
  Allow installs from your browser or files app when asked.
- **iPhone:** open <https://michaelgift.github.io/Ledgerly/> in Safari, tap **Share**, then
  **Add to Home Screen**. The app offers this itself on first visit. Install it before adding
  entries: the home screen app keeps its own data, separate from Safari's.

The web app (a PWA) works offline after the first visit and updates itself after each release.

## Features

- **Overview:** the month's spending, a 14-day sparkline, comparison with the same point last month,
  income and net, top categories, and the last six months.
- **Activity:** every transaction, grouped by day, for any month.
- **Quick entry:** a keypad sheet with categories, date and note; edit or delete any entry.
- **Last 6 months:** spent against income per month, with month-on-month change.
- **Analyse:** total spent, income, net, transaction count or average spend, by day, week, month,
  category or weekday, over 7 days to 12 months; with average line, previous-period comparison and
  per-category stacks.
- **Settings:** default currency, category list, and CSV export of everything.

## Development

Requires Node.js (24, as used in CI) and npm.

```bash
npm install
```

```bash
npm start
```

Then open the app in [Expo Go](https://expo.dev/go) by scanning the QR code, or press `w` for the
web version (served at `http://localhost:8081/Ledgerly`). Everything the app uses runs in Expo Go;
no native build is needed for day-to-day work.

| Script | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run web` | Start the dev server and open the web app |
| `npm run lint` | Lint with ESLint (`npx tsc --noEmit` typechecks) |
| `npm run build:web` | Build the installable web app into `dist/` |
| `npm run icons` | Regenerate every icon and splash image from `scripts/generate-icons.mjs` |

### Stack

[Expo](https://expo.dev) SDK 58 with Expo Router, React Native 0.88 and the React Compiler.
Data lives in SQLite via `expo-sqlite` (its WebAssembly build on the web). Charts are drawn with
`react-native-svg`; type is Space Grotesk and Inter.

### Project layout

```
src/
  app/                 Screens (file-based routes)
    (tabs)/(home)/     Overview, Last 6 months, Analyse
    (tabs)/            Activity and Settings tabs
    transaction.tsx    Add / edit sheet
  components/          UI building blocks and charts (*.web.tsx = web-specific versions)
  db/                  Schema, migrations and queries
  hooks/               Live queries, currency, theme
  utils/               Dates, money, analysis, CSV export
  constants/           Design tokens and the chart palette
public/                Web app shell, manifest and service worker
scripts/               Icon generator and web build
```

### Data and sync readiness

Every row has a client-generated UUID, an `updated_at` timestamp for last-write-wins merging, a
soft-delete `deleted_at`, and a `dirty` flag for changes not yet pushed. Amounts are stored as
integer minor units (cents) with their currency. Schema changes go through numbered migrations in
`src/db/schema.ts`.

The web build needs a cross-origin isolated page for SQLite; `public/sw.js` provides it on hosts
like GitHub Pages that can't set headers. See [docs/releasing.md](docs/releasing.md#how-the-web-app-stores-data).

## Releasing

Push a version tag that matches `expo.version` in `app.json`:

```bash
git tag v1.1.0
```

```bash
git push origin v1.1.0
```

GitHub Actions builds and signs the Android APK, deploys the web app to GitHub Pages, and publishes
the release. One-time setup (signing key, Pages) is in [docs/releasing.md](docs/releasing.md).

## License

See [LICENSE](LICENSE).
