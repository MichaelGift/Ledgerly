import type { SQLiteDatabase } from 'expo-sqlite';

import { buildTransactionsCsv } from '@/utils/csv';

/**
 * Web version: opens the share sheet where the browser can share files (iOS Safari, Android
 * Chrome), otherwise downloads the CSV.
 */
export async function exportTransactionsCsv(db: SQLiteDatabase) {
  const csv = await buildTransactionsCsv(db);
  const file = new File([csv.content], csv.fileName, { type: 'text/csv' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Ledgerly export' });
      return csv.count;
    } catch (error) {
      // Closing the share sheet isn't a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return csv.count;
      throw error;
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = csv.fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return csv.count;
}
