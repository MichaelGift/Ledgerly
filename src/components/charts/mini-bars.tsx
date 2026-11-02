import { StyleSheet, View } from 'react-native';

type MiniBarsProps = {
  values: number[];
  color: string;
  height?: number;
  barWidth?: number;
  /** How many trailing bars are drawn at full strength; the rest are faded. */
  highlightLast?: number;
  accessibilityLabel: string;
};

/** A tiny bar sparkline (no axes or labels) for hero cards. */
export function MiniBars({
  values,
  color,
  height = 44,
  barWidth = 6,
  highlightLast = 1,
  accessibilityLabel,
}: MiniBarsProps) {
  const max = Math.max(1, ...values);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, { height }]}>
      {values.map((value, index) => (
        <View
          key={index}
          style={{
            width: barWidth,
            height: Math.max(barWidth, (value / max) * height),
            borderRadius: barWidth / 2,
            backgroundColor: color,
            opacity: index >= values.length - highlightLast ? 1 : 0.35,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
});
