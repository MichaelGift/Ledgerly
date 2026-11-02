import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ScreenHeaderProps = {
  title: string;
  /** Shows a back button that pops the current stack. */
  back?: boolean;
  right?: ReactNode;
};

export function ScreenHeader({ title, back = false, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {back && (
          <IconButton
            icon={{ ios: 'chevron.left', android: 'chevron_left' }}
            accessibilityLabel="Back"
            onPress={() => router.back()}
          />
        )}
        <ThemedText type="title" numberOfLines={1} style={styles.title}>
          {title}
        </ThemedText>
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingTop: 28,
    paddingBottom: 14,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
