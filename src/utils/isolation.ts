/** Native apps never need cross-origin isolation; see isolation.web.ts. */
export function isolationState(): 'ready' | 'pending' | 'unsupported' {
  return 'ready';
}

/** Tries to recover from a database that failed to open; returns true if recovery is under way. */
export function recoverFromDatabaseError(): boolean {
  return false;
}
