import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { listAllTransactions } from '@/db/repository';
import { todayKey } from '@/utils/dates';
import { minorToInput } from '@/utils/money';

function csvField(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Writes every transaction to a CSV in the cache directory and opens the share sheet. */
export async function exportTransactionsCsv(db: SQLiteDatabase) {
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

  const file = new File(Paths.cache, `ledgerly-${todayKey()}.csv`);
  file.create({ overwrite: true });
  await file.write([header.join(','), ...rows].join('\n'));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export transactions',
  });
  return transactions.length;
}
