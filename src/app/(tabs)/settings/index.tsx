import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListGroup, ListRow } from '@/components/list-group';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { countCategories, setSetting } from '@/db/repository';
import { useCurrency } from '@/hooks/use-currency';
import { useLiveQuery } from '@/hooks/use-live-query';
import { useTheme } from '@/hooks/use-theme';
import { exportTransactionsCsv } from '@/utils/export';
import { successHaptic, tapHaptic } from '@/utils/haptics';
import { COMMON_CURRENCIES } from '@/utils/money';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const currency = useCurrency();
  const categoryCount = useLiveQuery('category-count', ['categories'], countCategories);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function exportCsv() {
    setExporting(true);
    try {
      await exportTransactionsCsv(db);
      successHaptic();
    } catch (error) {
      Alert.alert('Export failed', String(error));
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset }]}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Settings" />

        <ListGroup>
          <ListRow label="Currency" value={currency ?? '—'} onPress={() => setCurrencyOpen(true)} />
          <ListRow
            label="Categories"
            value={categoryCount === undefined ? '—' : String(categoryCount)}
            onPress={() => router.push('/settings/categories')}
          />
          <ListRow
            label="Export data"
            value={exporting ? 'Exporting…' : 'CSV'}
            accentValue
            disabled={exporting}
            onPress={exportCsv}
          />
        </ListGroup>

        <ListGroup title="About">
          <ListRow label="Storage" value="On this device" />
          <ListRow label="Sync" value="Not set up" />
          <ListRow label="Version" value={Constants.expoConfig?.version ?? '—'} />
        </ListGroup>
      </ScrollView>

      <Modal
        visible={currencyOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCurrencyOpen(false)} accessibilityLabel="Close">
          <Pressable style={[styles.sheet, { backgroundColor: theme.raised, borderColor: theme.border }]}>
            <ThemedText type="heading">Default currency</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Used for new transactions and totals. Existing transactions keep their currency.
            </ThemedText>
            <View style={styles.currencyGrid}>
              {COMMON_CURRENCIES.map((code) => {
                const selected = code === currency;
                return (
                  <Pressable
                    key={code}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => {
                      tapHaptic();
                      setSetting(db, 'currency', code);
                      setCurrencyOpen(false);
                    }}
                    style={[
                      styles.currency,
                      { backgroundColor: selected ? theme.primary : theme.surface },
                    ]}>
                    {selected && (
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        size={14}
                        tintColor={theme.onPrimary}
                      />
                    )}
                    <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.text }}>
                      {code}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
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
    gap: Spacing.two,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  currency: {
    width: '30%',
    flexGrow: 1,
    height: 44,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
