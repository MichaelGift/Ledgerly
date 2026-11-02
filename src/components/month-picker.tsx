import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentMonth, type Month } from '@/utils/dates';
import { tapHaptic } from '@/utils/haptics';

type MonthPickerProps = {
  value: Month;
  onChange: (month: Month) => void;
};

function shortLabel({ year, month }: Month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/** A pill showing the month; tapping it opens a year grid to jump to any past month. */
export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(value.year);
  const now = currentMonth();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Month: ${shortLabel(value)}. Change month`}
        onPress={() => {
          setYear(value.year);
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="small">{shortLabel(value)}</ThemedText>
        <SymbolView
          name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
          size={16}
          tintColor={theme.text}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close">
          {/* Swallow taps inside the sheet so they don't close it. */}
          <Pressable style={[styles.sheet, { backgroundColor: theme.raised, borderColor: theme.border }]}>
            <View style={styles.yearRow}>
              <IconButton
                icon={{ ios: 'chevron.left', android: 'chevron_left' }}
                accessibilityLabel="Previous year"
                variant="ghost"
                size={36}
                onPress={() => setYear(year - 1)}
              />
              <ThemedText type="heading">{year}</ThemedText>
              <IconButton
                icon={{ ios: 'chevron.right', android: 'chevron_right' }}
                accessibilityLabel="Next year"
                variant="ghost"
                size={36}
                disabled={year >= now.year}
                onPress={() => setYear(year + 1)}
              />
            </View>
            <View style={styles.grid}>
              {Array.from({ length: 12 }, (_, month) => {
                const selected = value.year === year && value.month === month;
                const future = year > now.year || (year === now.year && month > now.month);
                return (
                  <Pressable
                    key={month}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: future }}
                    disabled={future}
                    onPress={() => {
                      tapHaptic();
                      onChange({ year, month });
                      setOpen(false);
                    }}
                    style={[
                      styles.cell,
                      { backgroundColor: selected ? theme.primary : theme.surface },
                      future && styles.disabled,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={{ color: selected ? theme.onPrimary : theme.text }}>
                      {new Date(year, month, 1).toLocaleDateString(undefined, { month: 'short' })}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 15, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    width: '31%',
    flexGrow: 1,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
});
