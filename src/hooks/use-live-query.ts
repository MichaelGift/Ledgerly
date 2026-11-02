import { addDatabaseChangeListener, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Runs `query` and re-runs it whenever `key` changes or one of `tables` is written to, so screens
 * stay in sync with writes made elsewhere (e.g. the add/edit sheet). `key` must capture every
 * input the query depends on. Requires the database to be opened with `enableChangeListener`.
 */
export function useLiveQuery<T>(
  key: string,
  tables: string[],
  query: (db: SQLiteDatabase) => Promise<T>
) {
  const db = useSQLiteContext();
  const [result, setResult] = useState<{ key: string; data: T } | undefined>(undefined);

  const runQuery = useEffectEvent(() => query(db));

  const tableKey = tables.join(',');
  useEffect(() => {
    let active = true;
    const load = () => {
      if (!active) return;
      runQuery().then(
        (data) => {
          if (active) setResult({ key, data });
        },
        (error: unknown) => {
          // After unmount the provider may already have closed the database; that's expected.
          if (active) console.error(`Query "${key}" failed`, error);
        }
      );
    };
    load();

    const watched = new Set(tableKey.split(','));
    const subscription = addDatabaseChangeListener((event) => {
      if (watched.has(event.tableName)) {
        load();
      }
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [db, key, tableKey]);

  // Hide data from a previous key so screens never render stale results for new inputs.
  return result?.key === key ? result.data : undefined;
}
