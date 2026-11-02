import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useSeriesColor, useTheme } from '@/hooks/use-theme';

export type CategoryBar = {
  key: string;
  label: string;
  value: number;
  color: string | null;
  /** Previous-period value, drawn as a thin muted bar underneath when given. */
  previous?: number;
};

type CategoryBarsProps = {
  items: CategoryBar[];
  format: (value: number) => string;
};

/** Labelled horizontal bars scaled to the largest value, e.g. top spending categories. */
export function CategoryBars({ items, format }: CategoryBarsProps) {
  const theme = useTheme();
  const seriesColor = useSeriesColor();
  const max = Math.max(1, ...items.flatMap((item) => [Math.abs(item.value), Math.abs(item.previous ?? 0)]));

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          <View style={styles.labels}>
            <ThemedText type="small" numberOfLines={1} style={styles.name}>
              {item.label}
            </ThemedText>
            <ThemedText type="number" style={styles.value}>
              {format(item.value)}
            </ThemedText>
          </View>
          <View style={[styles.track, { backgroundColor: theme.background }]}>
            <View
              style={[
                styles.fill,
                { width: `${(Math.abs(item.value) / max) * 100}%`, backgroundColor: seriesColor(item.color) },
              ]}
            />
          </View>
          {item.previous !== undefined && (
            <View style={[styles.previousTrack, { backgroundColor: theme.background }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${(Math.abs(item.previous) / max) * 100}%`, backgroundColor: theme.muted },
                ]}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  item: {
    gap: 7,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    flex: 1,
  },
  value: {
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  previousTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: -3,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
