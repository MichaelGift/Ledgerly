import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

export type TransactionKind = 'expense' | 'income';

export type Category = {
  id: string;
  name: string;
  kind: TransactionKind;
  color: string;
  icon: string;
};

export type Transaction = {
  id: string;
  kind: TransactionKind;
  amountMinor: number;
  currency: string;
  categoryId: string | null;
  note: string;
  /** Local calendar date, `YYYY-MM-DD`. */
  occurredOn: string;
};

export type TransactionWithCategory = Transaction & {
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
};

export type TransactionInput = Omit<Transaction, 'id'>;

export type CategoryTotal = {
  categoryId: string | null;
  name: string;
  color: string;
  icon: string;
  totalMinor: number;
};

export type PeriodSummary = {
  incomeMinor: number;
  expenseMinor: number;
  byCategory: CategoryTotal[];
};

type TransactionRow = {
  id: string;
  kind: TransactionKind;
  amount_minor: number;
  currency: string;
  category_id: string | null;
  note: string;
  occurred_on: string;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
};

const TRANSACTION_SELECT = `
  SELECT t.id, t.kind, t.amount_minor, t.currency, t.category_id, t.note, t.occurred_on,
         c.name AS category_name, c.color AS category_color, c.icon AS category_icon
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
`;

function toTransaction(row: TransactionRow): TransactionWithCategory {
  return {
    id: row.id,
    kind: row.kind,
    amountMinor: row.amount_minor,
    currency: row.currency,
    categoryId: row.category_id,
    note: row.note,
    occurredOn: row.occurred_on,
    categoryName: row.category_name,
    categoryColor: row.category_color,
    categoryIcon: row.category_icon,
  };
}

export async function listCategories(db: SQLiteDatabase, kind?: TransactionKind) {
  return db.getAllAsync<Category>(
    `SELECT id, name, kind, color, icon FROM categories
     WHERE deleted_at IS NULL AND (? IS NULL OR kind = ?)
     ORDER BY name`,
    kind ?? null,
    kind ?? null
  );
}

/** Transactions whose date falls in `[from, to)`, newest first. Dates are `YYYY-MM-DD`. */
export async function listTransactions(db: SQLiteDatabase, from: string, to: string) {
  const rows = await db.getAllAsync<TransactionRow>(
    `${TRANSACTION_SELECT}
     WHERE t.deleted_at IS NULL AND t.occurred_on >= ? AND t.occurred_on < ?
     ORDER BY t.occurred_on DESC, t.created_at DESC`,
    from,
    to
  );
  return rows.map(toTransaction);
}

export async function getTransaction(db: SQLiteDatabase, id: string) {
  const row = await db.getFirstAsync<TransactionRow>(
    `${TRANSACTION_SELECT} WHERE t.id = ? AND t.deleted_at IS NULL`,
    id
  );
  return row ? toTransaction(row) : null;
}

export async function createTransaction(db: SQLiteDatabase, input: TransactionInput) {
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO transactions
       (id, kind, amount_minor, currency, category_id, note, occurred_on, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.kind,
    input.amountMinor,
    input.currency,
    input.categoryId,
    input.note,
    input.occurredOn,
    now,
    now
  );
  return id;
}

export async function updateTransaction(db: SQLiteDatabase, id: string, input: TransactionInput) {
  await db.runAsync(
    `UPDATE transactions
     SET kind = ?, amount_minor = ?, currency = ?, category_id = ?, note = ?, occurred_on = ?,
         updated_at = ?, dirty = 1
     WHERE id = ?`,
    input.kind,
    input.amountMinor,
    input.currency,
    input.categoryId,
    input.note,
    input.occurredOn,
    new Date().toISOString(),
    id
  );
}

/** Soft delete, so the deletion can be pushed to the backend once sync exists. */
export async function deleteTransaction(db: SQLiteDatabase, id: string) {
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE transactions SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE id = ?',
    now,
    now,
    id
  );
}

export async function getPeriodSummary(
  db: SQLiteDatabase,
  from: string,
  to: string,
  currency: string
): Promise<PeriodSummary> {
  const totals = await db.getFirstAsync<{ income: number | null; expense: number | null }>(
    `SELECT
       SUM(CASE WHEN kind = 'income' THEN amount_minor END) AS income,
       SUM(CASE WHEN kind = 'expense' THEN amount_minor END) AS expense
     FROM transactions
     WHERE deleted_at IS NULL AND currency = ? AND occurred_on >= ? AND occurred_on < ?`,
    currency,
    from,
    to
  );

  const byCategory = await db.getAllAsync<CategoryTotal>(
    `SELECT t.category_id AS categoryId,
            COALESCE(c.name, 'Uncategorized') AS name,
            COALESCE(c.color, 'gray') AS color,
            COALESCE(c.icon, 'tag') AS icon,
            SUM(t.amount_minor) AS totalMinor
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.deleted_at IS NULL AND t.kind = 'expense' AND t.currency = ?
       AND t.occurred_on >= ? AND t.occurred_on < ?
     GROUP BY t.category_id
     ORDER BY totalMinor DESC`,
    currency,
    from,
    to
  );

  return {
    incomeMinor: totals?.income ?? 0,
    expenseMinor: totals?.expense ?? 0,
    byCategory,
  };
}

export async function getSetting(db: SQLiteDatabase, key: string) {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}

export type DayTotal = { day: string; totalMinor: number };
export type MonthTotals = { month: string; incomeMinor: number; expenseMinor: number };
export type WeekdayTotal = { weekday: number; totalMinor: number };

/** Expense total per day in `[from, to)`; days without spending are omitted. */
export async function getDailyExpenses(db: SQLiteDatabase, from: string, to: string, currency: string) {
  return db.getAllAsync<DayTotal>(
    `SELECT occurred_on AS day, SUM(amount_minor) AS totalMinor
     FROM transactions
     WHERE deleted_at IS NULL AND kind = 'expense' AND currency = ?
       AND occurred_on >= ? AND occurred_on < ?
     GROUP BY occurred_on
     ORDER BY occurred_on`,
    currency,
    from,
    to
  );
}

/** Income and expense per calendar month (`YYYY-MM`) in `[from, to)`. */
export async function getMonthlyTotals(db: SQLiteDatabase, from: string, to: string, currency: string) {
  return db.getAllAsync<MonthTotals>(
    `SELECT substr(occurred_on, 1, 7) AS month,
            COALESCE(SUM(CASE WHEN kind = 'income' THEN amount_minor END), 0) AS incomeMinor,
            COALESCE(SUM(CASE WHEN kind = 'expense' THEN amount_minor END), 0) AS expenseMinor
     FROM transactions
     WHERE deleted_at IS NULL AND currency = ? AND occurred_on >= ? AND occurred_on < ?
     GROUP BY month
     ORDER BY month`,
    currency,
    from,
    to
  );
}

/** Expense total per weekday (0 = Sunday) in `[from, to)`. */
export async function getWeekdayExpenses(db: SQLiteDatabase, from: string, to: string, currency: string) {
  return db.getAllAsync<WeekdayTotal>(
    `SELECT CAST(strftime('%w', occurred_on) AS INTEGER) AS weekday, SUM(amount_minor) AS totalMinor
     FROM transactions
     WHERE deleted_at IS NULL AND kind = 'expense' AND currency = ?
       AND occurred_on >= ? AND occurred_on < ?
     GROUP BY weekday`,
    currency,
    from,
    to
  );
}

export async function getLargestExpenses(
  db: SQLiteDatabase,
  from: string,
  to: string,
  currency: string,
  limit: number
) {
  const rows = await db.getAllAsync<TransactionRow>(
    `${TRANSACTION_SELECT}
     WHERE t.deleted_at IS NULL AND t.kind = 'expense' AND t.currency = ?
       AND t.occurred_on >= ? AND t.occurred_on < ?
     ORDER BY t.amount_minor DESC
     LIMIT ?`,
    currency,
    from,
    to,
    limit
  );
  return rows.map(toTransaction);
}

export async function countCategories(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM categories WHERE deleted_at IS NULL'
  );
  return row?.count ?? 0;
}

/** Every live transaction, oldest first, for export. */
export async function listAllTransactions(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<TransactionRow>(
    `${TRANSACTION_SELECT}
     WHERE t.deleted_at IS NULL
     ORDER BY t.occurred_on, t.created_at`
  );
  return rows.map(toTransaction);
}
