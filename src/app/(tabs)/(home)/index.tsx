import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { CategoryBars } from '@/components/charts/category-bars';
import { MiniBars } from '@/components/charts/mini-bars';
import { MonthBars } from '@/components/charts/month-bars';
import { IconButton } from '@/components/icon-button';
import { MonthPicker } from '@/components/month-picker';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { getDailyExpenses, getMonthlyTotals, getPeriodSummary, type DayTotal } from '@/db/repository';
import { useCurrency } from '@/hooks/use-currency';
import { useLiveQuery } from '@/hooks/use-live-query';
import { useTheme } from '@/hooks/use-theme';
import {
  addDays,
  currentMonth,
  fromDateKey,
  monthRange,
  shiftMonth,
  todayKey,
  type Month,
} from '@/utils/dates';
import { formatAmount } from '@/utils/money';

const SPARK_DAYS = 14;
const TREND_MONTHS = 6;

function daysInMonth({ year, month }: Month) {
  return new Date(year, month + 1, 0).getDate();
}

/** Days of `m` that have already happened: all of a past month, none of a future one. */
function elapsedDays(m: Month) {
  const now = currentMonth();
  if (m.year === now.year && m.month === now.month) return new Date().getDate();
  return monthRange(m).to <= todayKey() ? daysInMonth(m) : 0;
}

function cumulativeAt(daily: DayTotal[], day: number) {
  return daily.reduce((sum, d) => (fromDateKey(d.day).getDate() <= day ? sum + d.totalMinor : sum), 0);
}

function monthName(m: Month, style: 'long' | 'short') {
  return new Date(m.year, m.month, 1).toLocaleDateString(undefined, { month: style });
}

export default function OverviewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const currency = useCurrency();
  const [month, setMonth] = useState<Month>(currentMonth);

  const range = monthRange(month);
  const previousMonth = shiftMonth(month, -1);
  const previousRange = monthRange(previousMonth);
  // The sparkline ends on the last day that has happened within the selected month.
  const sparkEnd = range.to <= todayKey() ? addDays(range.to, -1) : todayKey();
  const sparkFrom = addDays(sparkEnd, -(SPARK_DAYS - 1));
  const trendFrom = monthRange(shiftMonth(month, -(TREND_MONTHS - 1))).from;

  const data = useLiveQuery(
    `overview:${range.from}:${currency}`,
    ['transactions', 'categories'],
    async (db) => {
      if (!currency) return undefined;
      const [summary, previousDaily, spark, monthly] = await Promise.all([
        getPeriodSummary(db, range.from, range.to, currency),
        getDailyExpenses(db, previousRange.from, previousRange.to, currency),
        getDailyExpenses(db, sparkFrom, addDays(sparkEnd, 1), currency),
        getMonthlyTotals(db, trendFrom, range.to, currency),
      ]);
      return { summary, previousDaily, spark, monthly };
    }
  );

  if (!data || !currency) {
    return <Screen>{null}</Screen>;
  }

  const format = (minor: number) => formatAmount(minor, currency);
  const { summary } = data;
  const netMinor = summary.incomeMinor - summary.expenseMinor;
  const elapsed = elapsedDays(month);
  const previousAtSamePoint = cumulativeAt(data.previousDaily, elapsed);
  const change = previousAtSamePoint > 0 ? summary.expenseMinor / previousAtSamePoint - 1 : null;

  const sparkValues = Array.from({ length: SPARK_DAYS }, (_, i) => {
    const key = addDays(sparkFrom, i);
    return data.spark.find((d) => d.day === key)?.totalMinor ?? 0;
  });

  const trend = Array.from({ length: TREND_MONTHS }, (_, i) => {
    const m = shiftMonth(month, i - (TREND_MONTHS - 1));
    const key = monthRange(m).from.slice(0, 7);
    const totals = data.monthly.find((row) => row.month === key);
    return {
      key,
      label: monthName(m, 'short'),
      spent: totals?.expenseMinor ?? 0,
      income: totals?.incomeMinor ?? 0,
    };
  });

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset }]}>
        <ScreenHeader
          title="Overview"
          right={
            <>
              <IconButton
                icon={{ ios: 'chart.bar.xaxis', android: 'query_stats' }}
                accessibilityLabel="Analyse"
                size={36}
                onPress={() => router.push('/analyse')}
              />
              <MonthPicker value={month} onChange={setMonth} />
            </>
          }
        />

        <View style={[styles.hero, { backgroundColor: theme.primary }]}>
          <ThemedText type="small" style={[styles.onLime, styles.heroLabel]}>
            Spent in {monthName(month, 'long')} · {currency}
          </ThemedText>
          <ThemedText type="display" style={styles.onLime} numberOfLines={1} adjustsFontSizeToFit>
            {format(summary.expenseMinor)}
          </ThemedText>
          <View style={styles.heroFooter}>
            {change !== null && Math.abs(change) >= 0.005 ? (
              <View style={styles.deltaChip}>
                <SymbolView
                  name={
                    change > 0
                      ? { ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }
                      : { ios: 'arrow.down.right', android: 'south_east', web: 'south_east' }
                  }
                  size={14}
                  tintColor={theme.onPrimary}
                />
                <ThemedText type="smallBold" style={styles.onLime}>
                  {Math.round(Math.abs(change) * 100)}% {change > 0 ? 'more' : 'less'} than{' '}
                  {monthName(previousMonth, 'short')}
                </ThemedText>
              </View>
            ) : (
              <View />
            )}
            <MiniBars
              values={sparkValues}
              color={theme.onPrimary}
              accessibilityLabel={`Daily spending, last ${SPARK_DAYS} days`}
            />
          </View>
        </View>

        <View style={styles.tiles}>
          <StatTile
            label="Income"
            value={format(summary.incomeMinor)}
            icon={{ ios: 'arrow.down.left', android: 'south_west' }}
            accent={theme.income}
          />
          <StatTile
            label="Net"
            value={`${netMinor >= 0 ? '+' : '−'}${format(Math.abs(netMinor))}`}
            icon={{ ios: 'plus', android: 'add' }}
            accent={theme.primary}
            valueColor={netMinor >= 0 ? theme.primary : theme.danger}
          />
        </View>

        <Card
          title="Top spending"
          aside={new Date(month.year, month.month, 1).toLocaleDateString(undefined, {
            month: 'short',
            year: 'numeric',
          })}
          onPress={() => router.push({ pathname: '/analyse', params: { by: 'category' } })}
          accessibilityLabel="Top spending. Open breakdown by category">
          {summary.byCategory.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No spending recorded this month.
            </ThemedText>
          ) : (
            <CategoryBars
              items={summary.byCategory.slice(0, 3).map((c) => ({
                key: c.categoryId ?? 'none',
                label: c.name,
                value: c.totalMinor,
                color: c.color,
              }))}
              format={format}
            />
          )}
        </Card>

        <Card
          title={`Last ${TREND_MONTHS} months`}
          aside="Spent vs income"
          onPress={() => router.push('/trends')}>
          <MonthBars groups={trend} selectedIndex={TREND_MONTHS - 1} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function StatTile({
  label,
  value,
  icon,
  accent,
  valueColor,
}: {
  label: string;
  value: string;
  icon: { ios: 'arrow.down.left' | 'plus'; android: 'south_west' | 'add' };
  accent: string;
  valueColor?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.surface }]}>
      <View style={styles.tileLabel}>
        <View style={[styles.tileIcon, { backgroundColor: `${accent}29` }]}>
          <SymbolView
            name={{ ios: icon.ios, android: icon.android, web: icon.android }}
            size={13}
            tintColor={accent}
          />
        </View>
        <ThemedText type="caption" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
      <ThemedText
        type="title"
        style={[styles.tileValue, valueColor !== undefined && { color: valueColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  hero: {
    borderRadius: 28,
    padding: 20,
    gap: 6,
  },
  onLime: {
    color: '#10130A',
  },
  heroLabel: {
    opacity: 0.75,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  deltaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 19, 10, 0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tiles: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    gap: Spacing.one,
  },
  tileLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileValue: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0,
  },
});
