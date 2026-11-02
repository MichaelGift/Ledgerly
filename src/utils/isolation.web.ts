/** Must match the key and window used by the script in public/index.html. */
const RELOAD_KEY = 'ledgerly-isolation-reload';
const RELOAD_WINDOW_MS = 10_000;

/**
 * The on-device database (expo-sqlite) needs a cross-origin isolated page. public/index.html
 * registers a service worker that adds the headers and reloads when a page loads without them
 * (first visit, hard refresh). Until then the app must not open the database, or the half-started
 * worker keeps the file locked.
 */
export function isolationState(): 'ready' | 'pending' | 'unsupported' {
  if (window.crossOriginIsolated) return 'ready';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
  // A reload already happened moments ago and didn't help: the browser can't be isolated.
  return Date.now() - lastReload < RELOAD_WINDOW_MS ? 'unsupported' : 'pending';
}

const RECOVERY_KEY = 'ledgerly-db-recovery';
const MAX_RECOVERY_RELOADS = 3;
const RECOVERY_WINDOW_MS = 30_000;

/**
 * Right after a reload the previous page's database worker can still hold the file lock, and the
 * failed open leaves this page's worker unusable. A fresh page is the only fix, so reload shortly
 * (a few times at most) and let the old worker shut down. Returns true while recovering.
 */
export function recoverFromDatabaseError(): boolean {
  const now = Date.now();
  const recent = (JSON.parse(sessionStorage.getItem(RECOVERY_KEY) ?? '[]') as number[]).filter(
    (time) => now - time < RECOVERY_WINDOW_MS
  );
  if (recent.length >= MAX_RECOVERY_RELOADS) return false;
  sessionStorage.setItem(RECOVERY_KEY, JSON.stringify([...recent, now]));
  setTimeout(() => location.reload(), 600 * (recent.length + 1));
  return true;
}
