import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'ledgerly.db';

/**
 * Every synced table follows the same shape so a future sync engine can treat them uniformly:
 * - `id` is a client-generated UUID, so rows created offline never collide with the server.
 * - `updated_at` (ISO string) drives last-write-wins conflict resolution.
 * - `deleted_at` marks soft deletes so deletions can be propagated instead of silently lost.
 * - `dirty` = 1 means the row changed locally and has not been pushed yet.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
    color TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    dirty INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE transactions (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
    amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
    currency TEXT NOT NULL,
    category_id TEXT REFERENCES categories (id),
    note TEXT NOT NULL DEFAULT '',
    occurred_on TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    dirty INTEGER NOT NULL DEFAULT 1
  );

  CREATE INDEX idx_transactions_occurred_on ON transactions (occurred_on);
  CREATE INDEX idx_transactions_dirty ON transactions (dirty);

  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
  // v2: icons for categories, plus a calmer default palette.
  `
  ALTER TABLE categories ADD COLUMN icon TEXT NOT NULL DEFAULT 'tag';
  UPDATE categories SET icon = 'food', color = '#E0A23B' WHERE name = 'Food';
  UPDATE categories SET icon = 'transport', color = '#5B7FEA' WHERE name = 'Transport';
  UPDATE categories SET icon = 'housing', color = '#8E72E8' WHERE name = 'Housing';
  UPDATE categories SET icon = 'utilities', color = '#2FAFBF' WHERE name = 'Utilities';
  UPDATE categories SET icon = 'shopping', color = '#E06C9F' WHERE name = 'Shopping';
  UPDATE categories SET icon = 'health', color = '#E2574C' WHERE name = 'Health';
  UPDATE categories SET icon = 'entertainment', color = '#3FAF7F' WHERE name = 'Entertainment';
  UPDATE categories SET icon = 'other', color = '#8E8E93' WHERE name = 'Other';
  UPDATE categories SET icon = 'salary', color = '#3FAF7F' WHERE name = 'Salary';
  UPDATE categories SET icon = 'income', color = '#7DB548' WHERE name = 'Other income';
  `,
  // v3: colors become palette slot names (see constants/palette.ts) so each theme resolves its own step.
  `
  UPDATE categories SET color = 'blue' WHERE name = 'Transport';
  UPDATE categories SET color = 'orange' WHERE name = 'Food';
  UPDATE categories SET color = 'aqua' WHERE name = 'Entertainment';
  UPDATE categories SET color = 'yellow' WHERE name = 'Utilities';
  UPDATE categories SET color = 'magenta' WHERE name = 'Shopping';
  UPDATE categories SET color = 'green' WHERE name = 'Other';
  UPDATE categories SET color = 'violet' WHERE name = 'Housing';
  UPDATE categories SET color = 'red' WHERE name = 'Health';
  UPDATE categories SET color = 'aqua' WHERE name = 'Salary';
  UPDATE categories SET color = 'green' WHERE name = 'Other income';
  `,
];

const DEFAULT_CATEGORIES: { name: string; kind: 'expense' | 'income'; color: string }[] = [
  { name: 'Food', kind: 'expense', color: 'orange' },
  { name: 'Transport', kind: 'expense', color: 'blue' },
  { name: 'Housing', kind: 'expense', color: 'violet' },
  { name: 'Utilities', kind: 'expense', color: 'yellow' },
  { name: 'Shopping', kind: 'expense', color: 'magenta' },
  { name: 'Health', kind: 'expense', color: 'red' },
  { name: 'Entertainment', kind: 'expense', color: 'aqua' },
  { name: 'Other', kind: 'expense', color: 'green' },
  { name: 'Salary', kind: 'income', color: 'aqua' },
  { name: 'Other income', kind: 'income', color: 'green' },
];

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= MIGRATIONS.length) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (let version = currentVersion; version < MIGRATIONS.length; version++) {
      await db.execAsync(MIGRATIONS[version]);
      if (version === 0) {
        await seedCategories(db);
      }
    }
    await db.execAsync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  });
}

async function seedCategories(db: SQLiteDatabase) {
  const now = new Date().toISOString();
  for (const category of DEFAULT_CATEGORIES) {
    await db.runAsync(
      'INSERT INTO categories (id, name, kind, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      randomUUID(),
      category.name,
      category.kind,
      category.color,
      now,
      now
    );
  }
}
