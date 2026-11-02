import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapHaptic } from '@/utils/haptics';

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.track, { backgroundColor: theme.surface }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                tapHaptic();
                onChange(option.value);
              }
            }}
            style={[styles.segment, selected && { backgroundColor: theme.primary }]}>
            <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.textSecondary }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    gap: 2,
    borderRadius: Radius.full,
  },
  segment: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
});
