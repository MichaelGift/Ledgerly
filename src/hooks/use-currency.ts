import { getSetting } from '@/db/repository';
import { useLiveQuery } from '@/hooks/use-live-query';

export const DEFAULT_CURRENCY = 'USD';

/** The user's default currency, or undefined while loading. */
export function useCurrency() {
  const value = useLiveQuery('currency', ['settings'], (db) => getSetting(db, 'currency'));
  return value === undefined ? undefined : (value ?? DEFAULT_CURRENCY);
}
