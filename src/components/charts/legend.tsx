import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type LegendItem = { key: string; label: string; color: string };

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <ThemedText type="caption" themeColor="textSecondary">
            {item.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
});
