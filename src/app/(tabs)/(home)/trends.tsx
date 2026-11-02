import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { Legend } from '@/components/charts/legend';
import { MonthBars } from '@/components/charts/month-bars';
import { ListGroup, ListRow } from '@/components/list-group';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getMonthlyTotals } from '@/db/repository';
import { useCurrency } from '@/hooks/use-currency';
import { useLiveQuery } from '@/hooks/use-live-query';
import { useTheme } from '@/hooks/use-theme';
import { currentMonth, monthRange, shiftMonth, type Month } from '@/utils/dates';
import { formatAmount } from '@/utils/money';

const MONTHS = 6;

function monthLabel(m: Month, style: 'long' | 'short') {
  return new Date(m.year, m.month, 1).toLocaleDateString(undefined, { month: style });
}

export default function TrendsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const currency = useCurrency();
  const [selected, setSelected] = useState(MONTHS - 1);

  const end = currentMonth();
  // One extra month before the window so the first visible month has something to compare against.
  const from = monthRange(shiftMonth(end, -MONTHS)).from;
  const to = monthRange(end).to;

  const monthly = useLiveQuery(`trends:${from}:${currency}`, ['transactions'], async (db) =>
    currency ? getMonthlyTotals(db, from, to, currency) : undefined
  );

  if (!monthly || !currency) {
    return <Screen>{null}</Screen>;
  }

  const months = Array.from({ length: MONTHS + 1 }, (_, i) => {
    const m = shiftMonth(end, i - MONTHS);
    const key = monthRange(m).from.slice(0, 7);
    const totals = monthly.find((row) => row.month === key);
    return { month: m, key, spent: totals?.expenseMinor ?? 0, income: totals?.incomeMinor ?? 0 };
  });
  const visible = months.slice(1);
  const current = visible[selected];
  const previous = months[selected];
  const change = previous.spent > 0 ? current.spent / previous.spent - 1 : null;
  const format = (minor: number) => formatAmount(minor, currency);
  const firstLabel = visible[0].month;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset }]}>
        <ScreenHeader title={`Last ${MONTHS} months`} back />

        <Card
          title="Spent vs income"
          aside={`${monthLabel(firstLabel, 'short')} – ${monthLabel(end, 'short')} ${end.year}`}>
          <MonthBars
            groups={visible.map((m) => ({
              key: m.key,
              label: monthLabel(m.month, 'short'),
              spent: m.spent,
              income: m.income,
            }))}
            selectedIndex={selected}
            onSelect={setSelected}
            height={182}
            barWidth={20}
            showLabels
          />
          <Legend
            items={[
              { key: 'spent', label: 'Spent', color: theme.primary },
              { key: 'income', label: 'Income', color: theme.income },
            ]}
          />
        </Card>

        <ListGroup>
          <ListRow label={`Spent in ${monthLabel(current.month, 'long')}`} value={format(current.spent)} />
          <ListRow label={`Income in ${monthLabel(current.month, 'long')}`} value={format(current.income)} />
          <ListRow
            label="Net"
            value={`${current.income >= current.spent ? '+' : '−'}${format(Math.abs(current.income - current.spent))}`}
          />
          <View style={styles.changeRow}>
            <ThemedText style={styles.changeLabel}>
              Change vs {monthLabel(previous.month, 'long')}
            </ThemedText>
            <ThemedText
              type="smallBold"
              style={{
                color: change === null ? theme.textSecondary : change > 0 ? '#FF7A45' : theme.primary,
              }}>
              {change === null
                ? 'No data'
                : Math.abs(change) < 0.005
                  ? 'No change'
                  : `${Math.round(Math.abs(change) * 100)}% ${change > 0 ? 'more' : 'less'}`}
            </ThemedText>
          </View>
        </ListGroup>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  changeRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  changeLabel: {
    flex: 1,
  },
});
