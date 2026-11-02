import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDay, fromDateKey, toDateKey } from '@/utils/dates';

type DateFieldProps = {
  /** `YYYY-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
};

/** Pill showing the date; opens the platform date picker (no future dates). */
export function DateField({ value, onChange }: DateFieldProps) {
  const theme = useTheme();
  const [iosOpen, setIosOpen] = useState(false);

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: fromDateKey(value),
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toDateKey(date));
        },
      });
    } else {
      setIosOpen(true);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Date: ${formatDay(value)}. Change date`}
        onPress={open}
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && styles.pressed,
        ]}>
        <SymbolView
          name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
          size={16}
          tintColor={theme.primary}
        />
        <ThemedText type="small">{formatDay(value)}</ThemedText>
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} accessibilityLabel="Close">
            <Pressable style={[styles.sheet, { backgroundColor: theme.raised, borderColor: theme.border }]}>
              <DateTimePicker
                value={fromDateKey(value)}
                mode="date"
                display="inline"
                themeVariant="dark"
                accentColor={theme.primary}
                maximumDate={new Date()}
                onChange={(_, date) => {
                  if (date) onChange(toDateKey(date));
                }}
              />
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIosOpen(false)}
                  style={[styles.done, { backgroundColor: theme.primary }]}>
                  <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                    Done
                  </ThemedText>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 46,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
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
    maxWidth: 380,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.three,
  },
  actions: {
    alignItems: 'flex-end',
  },
  done: {
    paddingHorizontal: 20,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
