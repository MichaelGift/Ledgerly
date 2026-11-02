import type { SQLiteDatabase } from 'expo-sqlite';

import { listAllTransactions } from '@/db/repository';
import { todayKey } from '@/utils/dates';
import { minorToInput } from '@/utils/money';

function csvField(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Every transaction as CSV (date, type, amount, currency, category, note), plus a dated file name. */
export async function buildTransactionsCsv(db: SQLiteDatabase) {
  const transactions = await listAllTransactions(db);
  const header = ['date', 'type', 'amount', 'currency', 'category', 'note'];
  const rows = transactions.map((t) =>
    [
      t.occurredOn,
      t.kind,
      minorToInput(t.amountMinor, t.currency),
      t.currency,
      t.categoryName ?? '',
      t.note,
    ]
      .map(csvField)
      .join(',')
  );
  return {
    fileName: `ledgerly-${todayKey()}.csv`,
    content: [header.join(','), ...rows].join('\n'),
    count: transactions.length,
  };
}
