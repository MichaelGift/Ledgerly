import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, TabBarHeight } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapHaptic } from '@/utils/haptics';

type TabIcon = { ios: SFSymbol; android: AndroidSymbol };

export default function AppTabs() {
  return (
    <Tabs style={styles.flex}>
      <TabSlot style={styles.flex} />
      <TabList asChild>
        <FloatingTabBar>
          <TabTrigger name="(home)" href="/" asChild>
            <TabButton icon={{ ios: 'chart.pie.fill', android: 'donut_large' }}>Overview</TabButton>
          </TabTrigger>
          <TabTrigger name="transactions" href="/transactions" asChild>
            <TabButton icon={{ ios: 'list.bullet', android: 'receipt_long' }}>Activity</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton icon={{ ios: 'gearshape.fill', android: 'settings' }}>Settings</TabButton>
          </TabTrigger>
        </FloatingTabBar>
      </TabList>
    </Tabs>
  );
}

/** A pill of tab buttons floating above the content, with the add button beside it. */
function FloatingTabBar({ children }: TabListProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[styles.barContainer, { bottom: insets.bottom + 22 }]}>
      <View style={[styles.pill, { backgroundColor: theme.raised, borderColor: '#2F3460' }]}>
        {children}
      </View>
      <View style={[styles.shadow, { boxShadow: '0 12px 30px rgba(198, 244, 50, 0.3)' }]}>
        <IconButton
          icon={{ ios: 'plus', android: 'add' }}
          accessibilityLabel="Add transaction"
          variant="primary"
          size={TabBarHeight}
          onPress={() => router.push('/transaction')}
        />
      </View>
    </View>
  );
}

function TabButton({
  icon,
  children,
  isFocused,
  onPress,
  onLongPress,
}: TabTriggerSlotProps & { icon: TabIcon }) {
  const theme = useTheme();
  return (
    <Pressable
      onLongPress={onLongPress}
      onPress={(event) => {
        if (!isFocused) tapHaptic();
        onPress?.(event);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={[styles.tab, isFocused && { backgroundColor: theme.primary }]}>
      <SymbolView
        name={{ ios: icon.ios, android: icon.android, web: icon.android }}
        size={20}
        tintColor={isFocused ? theme.onPrimary : theme.textSecondary}
      />
      {isFocused && (
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          {children}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  barContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pill: {
    flex: 1,
    height: TabBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
  },
  shadow: {
    borderRadius: Radius.full,
  },
  tab: {
    height: 48,
    minWidth: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
});
