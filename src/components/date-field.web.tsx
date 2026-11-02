import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDay, todayKey } from '@/utils/dates';

type DateFieldProps = {
  /** `YYYY-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
};

/**
 * Web version: the native picker doesn't exist here, so an invisible browser date input sits over
 * the pill and opens the browser's own picker (a wheel on iOS Safari).
 */
export function DateField({ value, onChange }: DateFieldProps) {
  const theme = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <SymbolView
        name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
        size={16}
        tintColor={theme.primary}
      />
      <ThemedText type="small">{formatDay(value)}</ThemedText>
      <input
        type="date"
        aria-label={`Date: ${formatDay(value)}. Change date`}
        value={value}
        max={todayKey()}
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value);
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          border: 0,
          padding: 0,
          margin: 0,
        }}
      />
    </View>
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
    position: 'relative',
    overflow: 'hidden',
  },
});
