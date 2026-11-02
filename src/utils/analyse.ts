import type { TransactionWithCategory } from '@/db/repository';
import { addDays, formatDay, fromDateKey, toDateKey, todayKey } from '@/utils/dates';

export type Metric = 'spent' | 'income' | 'net' | 'count' | 'average';
export type Grouping = 'day' | 'week' | 'month' | 'category' | 'weekday';
export type RangeKey = '7d' | '30d' | '3m' | '6m' | '12m';

export const METRICS: { value: Metric; label: string }[] = [
  { value: 'spent', label: 'total spent' },
  { value: 'income', label: 'total income' },
  { value: 'net', label: 'net' },
  { value: 'count', label: 'transactions' },
  { value: 'average', label: 'average spend' },
];

export const GROUPINGS: { value: Grouping; label: string }[] = [
  { value: 'day', label: 'day' },
  { value: 'week', label: 'week' },
  { value: 'month', label: 'month' },
  { value: 'category', label: 'category' },
  { value: 'weekday', label: 'weekday' },
];

export const RANGES: { value: RangeKey; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '12m', label: '12 months' },
];

/** Half-open date-key range. */
export type DateRange = { from: string; to: string };

/** The selected range ending today, plus the equally long range just before it. */
export function rangeBounds(range: RangeKey): { current: DateRange; previous: DateRange } {
  const to = addDays(todayKey(), 1);
  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30;
    const from = addDays(to, -days);
    return { current: { from, to }, previous: { from: addDays(from, -days), to: from } };
  }
  const months = range === '3m' ? 3 : range === '6m' ? 6 : 12;
  const today = new Date();
  const from = toDateKey(new Date(today.getFullYear(), today.getMonth() - (months - 1), 1));
  const previousFrom = toDateKey(new Date(today.getFullYear(), today.getMonth() - (2 * months - 1), 1));
  return { current: { from, to }, previous: { from: previousFrom, to: from } };
}

export function daysIn({ from, to }: DateRange) {
  return Math.round((fromDateKey(to).getTime() - fromDateKey(from).getTime()) / 86_400_000);
}

/** Monday of the week containing `key`. */
function weekStart(key: string) {
  const day = fromDateKey(key).getDay();
  return addDays(key, -((day + 6) % 7));
}

/** `label` is the short axis label; `title` names the bucket in full for the readout. */
export type Bucket = { key: string; label: string; title: string };

/** Ordered buckets covering the range for time groupings; weekday and category are fixed or data-driven. */
export function timeBuckets(grouping: Grouping, range: DateRange): Bucket[] {
  const buckets: Bucket[] = [];
  if (grouping === 'day') {
    for (let key = range.from; key < range.to; key = addDays(key, 1)) {
      const date = fromDateKey(key);
      buckets.push({
        key,
        // The first of each month carries the month name so the axis reads across month boundaries.
        label: date.getDate() === 1 ? date.toLocaleDateString(undefined, { month: 'short' }) : String(date.getDate()),
        title: formatDay(key),
      });
    }
  } else if (grouping === 'week') {
    for (let key = weekStart(range.from); key < range.to; key = addDays(key, 7)) {
      const label = fromDateKey(key).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      buckets.push({ key, label, title: `Week of ${label}` });
    }
  } else if (grouping === 'month') {
    const start = fromDateKey(range.from);
    for (let d = new Date(start.getFullYear(), start.getMonth(), 1); toDateKey(d) < range.to; d.setMonth(d.getMonth() + 1)) {
      buckets.push({
        key: toDateKey(d).slice(0, 7),
        label: d.toLocaleDateString(undefined, { month: 'short' }),
        title: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      });
    }
  } else if (grouping === 'weekday') {
    // Monday-first; 2026-11-02 is a Monday, so it anchors the localized short names.
    for (let i = 0; i < 7; i++) {
      const date = new Date(2026, 10, 2 + i);
      buckets.push({
        key: String(date.getDay()),
        label: date.toLocaleDateString(undefined, { weekday: 'short' }),
        title: `${date.toLocaleDateString(undefined, { weekday: 'long' })}s`,
      });
    }
  }
  return buckets;
}

export function bucketKey(grouping: Grouping, t: TransactionWithCategory) {
  switch (grouping) {
    case 'day':
      return t.occurredOn;
    case 'week':
      return weekStart(t.occurredOn);
    case 'month':
      return t.occurredOn.slice(0, 7);
    case 'weekday':
      return String(fromDateKey(t.occurredOn).getDay());
    case 'category':
      return t.categoryId ?? 'none';
  }
}

/** Transactions that count towards `metric` (count includes both kinds). */
export function relevant(metric: Metric, t: TransactionWithCategory) {
  if (metric === 'income') return t.kind === 'income';
  if (metric === 'spent' || metric === 'average') return t.kind === 'expense';
  return true;
}

export function measure(metric: Metric, transactions: TransactionWithCategory[]) {
  let income = 0;
  let expense = 0;
  let expenseCount = 0;
  for (const t of transactions) {
    if (t.kind === 'income') {
      income += t.amountMinor;
    } else {
      expense += t.amountMinor;
      expenseCount++;
    }
  }
  switch (metric) {
    case 'spent':
      return expense;
    case 'income':
      return income;
    case 'net':
      return income - expense;
    case 'count':
      return transactions.length;
    case 'average':
      return expenseCount > 0 ? Math.round(expense / expenseCount) : 0;
  }
}

export type Segment = { key: string; value: number; color: string | null };

export type SeriesPoint = {
  key: string;
  label: string;
  title: string;
  value: number;
  previous: number;
  /** Per-category split, largest first (only for summable metrics). */
  segments: Segment[];
  /** Category grouping only. */
  icon?: string | null;
  color?: string | null;
};

type Filtered = { current: TransactionWithCategory[]; previous: TransactionWithCategory[] };

function group(grouping: Grouping, transactions: TransactionWithCategory[]) {
  const map = new Map<string, TransactionWithCategory[]>();
  for (const t of transactions) {
    const key = bucketKey(grouping, t);
    const list = map.get(key);
    if (list) list.push(t);
    else map.set(key, [t]);
  }
  return map;
}

function segmentsFor(metric: Metric, transactions: TransactionWithCategory[]): Segment[] {
  if (metric !== 'spent' && metric !== 'income') return [];
  const byCategory = new Map<string, Segment>();
  for (const t of transactions) {
    if (!relevant(metric, t)) continue;
    const key = t.categoryId ?? 'none';
    const segment = byCategory.get(key) ?? { key, value: 0, color: t.categoryColor };
    segment.value += t.amountMinor;
    byCategory.set(key, segment);
  }
  return [...byCategory.values()].sort((a, b) => b.value - a.value);
}

export function buildSeries(
  metric: Metric,
  grouping: Grouping,
  ranges: { current: DateRange; previous: DateRange },
  data: Filtered
): SeriesPoint[] {
  const current = group(grouping, data.current);
  const previous = group(grouping, data.previous);

  if (grouping === 'category') {
    const points: SeriesPoint[] = [];
    for (const [key, list] of current) {
      const relevantList = list.filter((t) => relevant(metric, t));
      if (relevantList.length === 0) continue;
      points.push({
        key,
        label: list[0].categoryName ?? 'Uncategorized',
        title: list[0].categoryName ?? 'Uncategorized',
        value: measure(metric, relevantList),
        previous: measure(metric, (previous.get(key) ?? []).filter((t) => relevant(metric, t))),
        segments: [],
        icon: list[0].categoryIcon,
        color: list[0].categoryColor,
      });
    }
    return points.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }

  const buckets = timeBuckets(grouping, ranges.current);
  // Previous-period buckets line up with the current ones by position (weekday: by key).
  const previousBuckets = grouping === 'weekday' ? buckets : timeBuckets(grouping, ranges.previous);
  const previousOffset = previousBuckets.length - buckets.length;
  return buckets.map((bucket, index) => {
    const list = current.get(bucket.key) ?? [];
    const previousKey = previousBuckets[index + previousOffset]?.key;
    return {
      key: bucket.key,
      label: bucket.label,
      title: bucket.title,
      value: measure(metric, list),
      previous: previousKey ? measure(metric, previous.get(previousKey) ?? []) : 0,
      segments: segmentsFor(metric, list),
    };
  });
}
