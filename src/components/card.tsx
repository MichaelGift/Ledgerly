import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = {
  title?: string;
  /** Small muted text on the right of the title, e.g. the period. */
  aside?: string;
  /** Makes the whole card a button and shows a chevron after the aside. */
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
  children: ReactNode;
};

export function Card({ title, aside, onPress, accessibilityLabel, style, children }: CardProps) {
  const theme = useTheme();
  const content = (
    <>
      {title && (
        <View style={styles.titleRow}>
          <ThemedText type="heading">{title}</ThemedText>
          <View style={styles.aside}>
            {aside && (
              <ThemedText type="caption" themeColor="textSecondary">
                {aside}
              </ThemedText>
            )}
            {onPress && (
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={16}
                tintColor={theme.textSecondary}
              />
            )}
          </View>
        </View>
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.surface },
          pressed && styles.pressed,
          style,
        ]}>
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.card, { backgroundColor: theme.surface }, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aside: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
