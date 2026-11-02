/** Local calendar date as `YYYY-MM-DD` (not UTC, so late-evening entries land on the right day). */
export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toDateKey(new Date());
}

export function addDays(key: string, days: number) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** A calendar month identified by year and 0-based month index. */
export type Month = { year: number; month: number };

export function currentMonth(): Month {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function shiftMonth({ year, month }: Month, delta: number): Month {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** Half-open date-key range `[from, to)` covering the month. */
export function monthRange(m: Month) {
  return {
    from: toDateKey(new Date(m.year, m.month, 1)),
    to: toDateKey(new Date(m.year, m.month + 1, 1)),
  };
}

export function formatMonth({ year, month }: Month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatDay(key: string) {
  const today = todayKey();
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
