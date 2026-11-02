import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MonthPicker } from '@/components/month-picker';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { TransactionRow } from '@/components/transaction-row';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { listTransactions, type TransactionWithCategory } from '@/db/repository';
import { useCurrency } from '@/hooks/use-currency';
import { useLiveQuery } from '@/hooks/use-live-query';
import { useTheme } from '@/hooks/use-theme';
import { currentMonth, formatDay, monthRange, type Month } from '@/utils/dates';
import { formatAmount } from '@/utils/money';

type Day = { key: string; netMinor: number; transactions: TransactionWithCategory[] };

function groupByDay(transactions: TransactionWithCategory[], currency: string): Day[] {
  const days: Day[] = [];
  for (const transaction of transactions) {
    let day = days.at(-1);
    if (!day || day.key !== transaction.occurredOn) {
      day = { key: transaction.occurredOn, netMinor: 0, transactions: [] };
      days.push(day);
    }
    day.transactions.push(transaction);
    if (transaction.currency === currency) {
      day.netMinor += transaction.kind === 'income' ? transaction.amountMinor : -transaction.amountMinor;
    }
  }
  return days;
}

export default function TransactionsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const currency = useCurrency();
  const [month, setMonth] = useState<Month>(currentMonth);
  const { from, to } = monthRange(month);

  const transactions = useLiveQuery(`transactions:${from}`, ['transactions', 'categories'], (db) =>
    listTransactions(db, from, to)
  );

  return (
    <Screen>
      {/* Pinned: stays put while the days scroll underneath. */}
      <ScreenHeader title="Activity" right={<MonthPicker value={month} onChange={setMonth} />} />

      {transactions && currency && (
        <FlatList
          data={groupByDay(transactions, currency)}
          keyExtractor={(day) => day.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + BottomTabInset }]}
          renderItem={({ item: day }) => (
            <View style={styles.day}>
              <View style={styles.dayHeader}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {formatDay(day.key)}
                </ThemedText>
                <ThemedText type="caption" themeColor="textTertiary">
                  {day.netMinor > 0 ? '+' : day.netMinor < 0 ? '−' : ''}
                  {formatAmount(Math.abs(day.netMinor), currency)}
                </ThemedText>
              </View>
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                {day.transactions.map((t) => (
                  <TransactionRow key={t.id} transaction={t} defaultCurrency={currency} />
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="heading">Nothing here yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Tap + to record your first transaction this month.
              </ThemedText>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 18,
  },
  day: {
    gap: Spacing.two,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.one,
  },
  card: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.six,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 260,
  },
});
