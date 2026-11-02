import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { buildTransactionsCsv } from '@/utils/csv';

/** Writes every transaction to a CSV in the cache directory and opens the share sheet. */
export async function exportTransactionsCsv(db: SQLiteDatabase) {
  const csv = await buildTransactionsCsv(db);

  const file = new File(Paths.cache, csv.fileName);
  file.create({ overwrite: true });
  await file.write(csv.content);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export transactions',
  });
  return csv.count;
}
