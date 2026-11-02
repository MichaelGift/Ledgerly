import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { AnalyseChart } from '@/components/charts/analyse-chart';
import { CategoryBars } from '@/components/charts/category-bars';
import { Legend } from '@/components/charts/legend';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, FontFamily, Radius, Spacing } from '@/constants/theme';
import { listCategories, listTransactions } from '@/db/repository';
import { useCurrency } from '@/hooks/use-currency';
import { useLiveQuery } from '@/hooks/use-live-query';
import { useSeriesColor, useTheme } from '@/hooks/use-theme';
import {
  GROUPINGS,
  METRICS,
  RANGES,
  buildSeries,
  daysIn,
  measure,
  rangeBounds,
  relevant,
  type Grouping,
  type Metric,
  type RangeKey,
} from '@/utils/analyse';
import { tapHaptic } from '@/utils/haptics';
import { formatAmount } from '@/utils/money';

type Slot = 'metric' | 'by' | 'over' | 'in';

/** Each part of the sentence wears its own color so the swap row reads as belonging to it. */
const SLOT_COLORS: Record<Slot, { background: string; text: string }> = {
  metric: { background: '#C6F432', text: '#10130A' },
  by: { background: '#3D9BFF', text: '#08111F' },
  over: { background: '#9085E9', text: '#0E0B24' },
  in: { background: '#FF7A45', text: '#1A0E08' },
};

const SLOT_NAMES: Record<Slot, string> = { metric: 'SHOW', by: 'BY', over: 'OVER', in: 'IN' };

function isGrouping(value: unknown): value is Grouping {
  return GROUPINGS.some((g) => g.value === value);
}

export default function AnalyseScreen() {
  const theme = useTheme();
  const seriesColor = useSeriesColor();
  const insets = useSafeAreaInsets();
  const currency = useCurrency();
  const params = useLocalSearchParams<{ by?: string }>();

  const [metric, setMetric] = useState<Metric>('spent');
  const [grouping, setGrouping] = useState<Grouping>(isGrouping(params.by) ? params.by : 'day');
  const [range, setRange] = useState<RangeKey>(isGrouping(params.by) && params.by === 'category' ? '30d' : '3m');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [activeSlot, setActiveSlot] = useState<Slot>('by');
  const [showAverage, setShowAverage] = useState(true);
  const [compare, setCompare] = useState(false);
  const [stacked, setStacked] = useState(false);

  const ranges = rangeBounds(range);
  const data = useLiveQuery(
    `analyse:${ranges.previous.from}:${ranges.current.to}`,
    ['transactions', 'categories'],
    async (db) => {
      const [transactions, categories] = await Promise.all([
        listTransactions(db, ranges.previous.from, ranges.current.to),
        listCategories(db),
      ]);
      return { transactions, categories };
    }
  );

  if (!data || !currency) {
    return <Screen>{null}</Screen>;
  }

  // Analysis covers the default currency only, like the rest of the app's totals.
  const inScope = data.transactions.filter(
    (t) => t.currency === currency && (categoryId === 'all' || (t.categoryId ?? 'none') === categoryId)
  );
  const current = inScope.filter((t) => t.occurredOn >= ranges.current.from);
  const previous = inScope.filter((t) => t.occurredOn < ranges.current.from);
  const points = buildSeries(metric, grouping, ranges, { current, previous });

  const relevantCurrent = current.filter((t) => relevant(metric, t));
  const total = measure(metric, relevantCurrent);
  const previousTotal = measure(metric, previous.filter((t) => relevant(metric, t)));
  const days = daysIn(ranges.current);
  const isMoney = metric !== 'count';
  const format = (value: number) =>
    isMoney ? `${value < 0 ? '−' : ''}${formatAmount(Math.abs(value), currency)}` : String(value);

  const canStack = (metric === 'spent' || metric === 'income') && grouping !== 'category' && categoryId === 'all';
  const canAverage = grouping !== 'category';
  const change = previousTotal !== 0 ? (total - previousTotal) / Math.abs(previousTotal) : null;

  const secondary =
    metric === 'count'
      ? `${(total / days).toFixed(1)} per day`
      : metric === 'average'
        ? `across ${relevantCurrent.length} expenses`
        : `avg ${format(Math.round(total / days))} / day`;

  const categoryName =
    categoryId === 'all'
      ? 'all categories'
      : (data.categories.find((c) => c.id === categoryId)?.name ?? 'Uncategorized');

  const slotLabel: Record<Slot, string> = {
    metric: METRICS.find((m) => m.value === metric)!.label,
    by: GROUPINGS.find((g) => g.value === grouping)!.label,
    over: RANGES.find((r) => r.value === range)!.label,
    in: categoryName,
  };

  const swapOptions: { key: string; label: string; onPress: () => void }[] =
    activeSlot === 'metric'
      ? METRICS.filter((m) => m.value !== metric).map((m) => ({
          key: m.value,
          label: m.label,
          onPress: () => setMetric(m.value),
        }))
      : activeSlot === 'by'
        ? GROUPINGS.filter((g) => g.value !== grouping).map((g) => ({
            key: g.value,
            label: g.label,
            onPress: () => setGrouping(g.value),
          }))
        : activeSlot === 'over'
          ? RANGES.filter((r) => r.value !== range).map((r) => ({
              key: r.value,
              label: r.label,
              onPress: () => setRange(r.value),
            }))
          : [
              { key: 'all', label: 'All categories', onPress: () => setCategoryId('all') },
              ...data.categories.map((c) => ({ key: c.id, label: c.name, onPress: () => setCategoryId(c.id) })),
            ].filter((option) => option.key !== categoryId);

  // Time series default to the latest period; weekday to its biggest day.
  const defaultSelected =
    grouping === 'weekday'
      ? points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0)
      : points.length - 1;

  const legendCategories = canStack && stacked
    ? [...new Map(points.flatMap((p) => p.segments).map((s) => [s.key, s])).values()]
        .slice(0, 6)
        .map((s) => ({
          key: s.key,
          label: data.categories.find((c) => c.id === s.key)?.name ?? 'Uncategorized',
          color: seriesColor(s.color),
        }))
    : [];

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset }]}>
        <ScreenHeader title="Analyse" back />

        <View style={[styles.builder, { backgroundColor: theme.surface }]}>
          <ThemedText type="label" themeColor="textSecondary">
            Build your question
          </ThemedText>
          <View style={styles.sentence}>
            <SentenceWord>Show</SentenceWord>
            <SlotPill slot="metric" label={slotLabel.metric} active={activeSlot === 'metric'} onPress={setActiveSlot} />
            <SentenceWord>by</SentenceWord>
            <SlotPill slot="by" label={slotLabel.by} active={activeSlot === 'by'} onPress={setActiveSlot} />
            <SentenceWord>over</SentenceWord>
            <SlotPill slot="over" label={slotLabel.over} active={activeSlot === 'over'} onPress={setActiveSlot} />
            <SentenceWord>in</SentenceWord>
            <SlotPill slot="in" label={slotLabel.in} active={activeSlot === 'in'} onPress={setActiveSlot} />
          </View>
          <View style={styles.swap}>
            <ThemedText type="label" themeColor="textSecondary">
              Swap “{SLOT_NAMES[activeSlot].toLowerCase()}” for
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {swapOptions.map((option) => (
                <Chip
                  key={option.key}
                  label={option.label}
                  onPress={() => {
                    tapHaptic();
                    option.onPress();
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        <Card>
          <View style={styles.resultHeader}>
            <View style={styles.resultTotal}>
              <ThemedText type="caption" themeColor="textSecondary">
                {slotLabel.metric.charAt(0).toUpperCase() + slotLabel.metric.slice(1)}
                {isMoney ? ` · ${currency}` : ''}
              </ThemedText>
              <ThemedText style={styles.total} numberOfLines={1} adjustsFontSizeToFit>
                {format(total)}
              </ThemedText>
            </View>
            <View style={styles.resultMeta}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                {secondary}
              </ThemedText>
              {compare && change !== null && (
                <ThemedText type="caption" themeColor="textSecondary">
                  {Math.abs(change) < 0.005
                    ? 'Same as previous'
                    : `${Math.round(Math.abs(change) * 100)}% ${change > 0 ? 'up' : 'down'} vs previous`}
                </ThemedText>
              )}
            </View>
          </View>

          {points.length === 0 || points.every((p) => p.value === 0 && p.previous === 0) ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              Nothing recorded for this question yet.
            </ThemedText>
          ) : grouping === 'category' ? (
            <CategoryBars
              items={points.map((p) => ({
                key: p.key,
                label: p.label,
                value: p.value,
                color: p.color ?? null,
                previous: compare ? p.previous : undefined,
              }))}
              format={format}
            />
          ) : (
            <AnalyseChart
              key={`${metric}:${grouping}:${range}:${categoryId}`}
              points={points}
              format={format}
              showAverage={showAverage && canAverage}
              compare={compare}
              stacked={stacked && canStack}
              defaultSelected={defaultSelected}
            />
          )}

          {legendCategories.length > 0 && <Legend items={legendCategories} />}
          {compare && grouping !== 'category' && (
            <Legend
              items={[
                { key: 'current', label: 'This period', color: theme.primary },
                { key: 'previous', label: 'Previous period', color: theme.backgroundSelected },
              ]}
            />
          )}

          <View style={styles.toggles}>
            <Toggle label="Average line" value={showAverage && canAverage} disabled={!canAverage} onChange={setShowAverage} />
            <Toggle label="Compare previous" value={compare} onChange={setCompare} />
            <Toggle label="Stack by category" value={stacked && canStack} disabled={!canStack} onChange={setStacked} />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function SentenceWord({ children }: { children: string }) {
  return <ThemedText style={styles.word} themeColor="textSecondary">{children}</ThemedText>;
}

function SlotPill({
  slot,
  label,
  active,
  onPress,
}: {
  slot: Slot;
  label: string;
  active: boolean;
  onPress: (slot: Slot) => void;
}) {
  const theme = useTheme();
  const colors = SLOT_COLORS[slot];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${SLOT_NAMES[slot]}: ${label}. Change`}
      onPress={() => {
        tapHaptic();
        onPress(slot);
      }}
      style={[
        styles.pill,
        { backgroundColor: colors.background, borderColor: active ? theme.text : 'transparent' },
      ]}>
      <ThemedText style={[styles.pillLabel, { color: colors.text }]}>{label}</ThemedText>
    </Pressable>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { borderColor: theme.border }, pressed && styles.pressed]}>
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

function Toggle({
  label,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => {
        tapHaptic();
        onChange(!value);
      }}
      style={[
        styles.chip,
        value ? { backgroundColor: theme.backgroundSelected, borderColor: theme.backgroundSelected } : { borderColor: theme.border },
        disabled && styles.disabled,
      ]}>
      <ThemedText type={value ? 'smallBold' : 'small'}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  builder: {
    borderRadius: Radius.card,
    padding: 18,
    gap: Spacing.three,
  },
  sentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  word: {
    fontFamily: FontFamily.displayMedium,
    fontSize: 20,
    lineHeight: 26,
  },
  pill: {
    borderRadius: Radius.full,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillLabel: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  swap: {
    gap: Spacing.two,
  },
  chips: {
    gap: Spacing.two,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.35,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultTotal: {
    flexShrink: 1,
  },
  total: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 28,
    lineHeight: 34,
  },
  resultMeta: {
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  toggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  empty: {
    paddingVertical: Spacing.four,
    textAlign: 'center',
  },
});
