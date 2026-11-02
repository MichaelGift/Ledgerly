import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type MonthBarGroup = { key: string; label: string; spent: number; income: number };

type MonthBarsProps = {
  groups: MonthBarGroup[];
  /** The highlighted month; the others recede into muted history. */
  selectedIndex: number;
  onSelect?: (index: number) => void;
  height?: number;
  barWidth?: number;
  showLabels?: boolean;
};

/** Spent vs income per month. The selected month wears full color (spent lime, income green). */
export function MonthBars({
  groups,
  selectedIndex,
  onSelect,
  height = 90,
  barWidth = 12,
  showLabels = false,
}: MonthBarsProps) {
  const theme = useTheme();
  const max = Math.max(1, ...groups.flatMap((g) => [g.spent, g.income]));
  const barHeight = (value: number) => (value > 0 ? Math.max(4, (value / max) * height) : 0);

  return (
    <View style={styles.container}>
      <View style={[styles.plot, { height }]}>
        {groups.map((group, index) => {
          const selected = index === selectedIndex;
          return (
            <Pressable
              key={group.key}
              disabled={!onSelect}
              accessibilityRole={onSelect ? 'button' : undefined}
              accessibilityState={{ selected }}
              accessibilityLabel={`${group.label}: spent ${group.spent}, income ${group.income}`}
              onPress={() => onSelect?.(index)}
              style={styles.group}>
              <View
                style={{
                  width: barWidth,
                  height: barHeight(group.spent),
                  borderRadius: barWidth / 3,
                  backgroundColor: selected ? theme.primary : theme.backgroundSelected,
                }}
              />
              <View
                style={{
                  width: barWidth,
                  height: barHeight(group.income),
                  borderRadius: barWidth / 3,
                  backgroundColor: selected ? theme.income : theme.muted,
                }}
              />
            </Pressable>
          );
        })}
      </View>
      {showLabels && (
        <View style={styles.labels}>
          {groups.map((group, index) => (
            <ThemedText
              key={group.key}
              type={index === selectedIndex ? 'smallBold' : 'caption'}
              themeColor={index === selectedIndex ? 'text' : 'textSecondary'}
              style={styles.label}>
              {group.label}
            </ThemedText>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  group: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  labels: {
    flexDirection: 'row',
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
});
