import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapHaptic } from '@/utils/haptics';

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'back';

const ROWS: KeypadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'back'],
];

type KeypadProps = {
  onKey: (key: KeypadKey) => void;
  onClear: () => void;
  /** Hides the decimal key for currencies without minor units. */
  allowDecimal: boolean;
};

export function Keypad({ onKey, onClear, allowDecimal }: KeypadProps) {
  const theme = useTheme();
  return (
    <View style={styles.grid}>
      {ROWS.map((row, index) => (
        <View key={index} style={styles.row}>
          {row.map((key) => {
            const hidden = key === '.' && !allowDecimal;
            return (
              <Pressable
                key={key}
                disabled={hidden}
                accessibilityRole="button"
                accessibilityLabel={key === 'back' ? 'Delete' : key === '.' ? 'Decimal point' : key}
                onPress={() => {
                  tapHaptic();
                  onKey(key);
                }}
                onLongPress={key === 'back' ? onClear : undefined}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: pressed ? theme.backgroundSelected : theme.surface },
                  hidden && styles.hidden,
                ]}>
                {key === 'back' ? (
                  <SymbolView
                    name={{ ios: 'delete.left', android: 'backspace', web: 'backspace' }}
                    size={24}
                    tintColor={theme.text}
                  />
                ) : (
                  <ThemedText style={styles.keyLabel}>{key}</ThemedText>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  key: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  hidden: {
    opacity: 0,
  },
  keyLabel: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 24,
    lineHeight: 30,
  },
});
