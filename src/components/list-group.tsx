import { SymbolView } from 'expo-symbols';
import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A card of rows separated by hairlines, as in Settings. */
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const theme = useTheme();
  const rows = Children.toArray(children);
  return (
    <View style={styles.group}>
      {title && (
        <ThemedText type="label" themeColor="textSecondary" style={styles.groupTitle}>
          {title}
        </ThemedText>
      )}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <View style={[styles.separator, { backgroundColor: theme.border }]} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

type ListRowProps = {
  label: string;
  value?: string;
  /** Lime, bold value: marks an action such as "CSV". */
  accentValue?: boolean;
  leading?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

export function ListRow({ label, value, accentValue = false, leading, onPress, disabled }: ListRowProps) {
  const theme = useTheme();
  const content = (
    <>
      {leading}
      <ThemedText style={styles.label}>{label}</ThemedText>
      {value !== undefined && (
        <ThemedText
          type={accentValue ? 'smallBold' : 'default'}
          style={{ color: accentValue ? theme.primary : theme.textSecondary }}>
          {value}
        </ThemedText>
      )}
      {onPress && !accentValue && (
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={16}
          tintColor={theme.textTertiary}
        />
      )}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, (pressed || disabled) && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  groupTitle: {
    paddingHorizontal: Spacing.three,
  },
  card: {
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    flex: 1,
  },
  separator: {
    height: 1,
  },
  pressed: {
    opacity: 0.5,
  },
});
