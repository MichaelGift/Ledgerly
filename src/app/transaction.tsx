import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/category-icon';
import { DateField } from '@/components/date-field';
import { IconButton } from '@/components/icon-button';
import { Keypad, type KeypadKey } from '@/components/keypad';
import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listCategories,
  updateTransaction,
  type Category,
  type Transaction,
  type TransactionKind,
} from '@/db/repository';
import { useCurrency } from '@/hooks/use-currency';
import { useLiveQuery } from '@/hooks/use-live-query';
import { useTheme } from '@/hooks/use-theme';
import { formatDay, todayKey } from '@/utils/dates';
import { confirmDestructive, showError } from '@/utils/dialogs';
import { successHaptic } from '@/utils/haptics';
import { fractionDigits, minorToInput, parseAmount } from '@/utils/money';

const MAX_INTEGER_DIGITS = 9;

export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const defaultCurrency = useCurrency();
  const categories = useLiveQuery('categories', ['categories'], (db) => listCategories(db));
  // `null` = not found (or new), `undefined` = still loading.
  const existing = useLiveQuery(`transaction:${id ?? ''}`, [], async (db) =>
    id ? getTransaction(db, id) : null
  );

  if (!defaultCurrency || !categories || existing === undefined) {
    return null;
  }
  return (
    <TransactionForm
      existing={existing}
      categories={categories}
      defaultCurrency={defaultCurrency}
    />
  );
}

/** Applies a keypad press to the raw amount string, enforcing the currency's decimal places. */
function applyKey(text: string, key: KeypadKey, decimals: number) {
  if (key === 'back') return text.slice(0, -1);
  const [integer, fraction] = text.split('.');
  if (key === '.') {
    if (decimals === 0 || fraction !== undefined) return text;
    return text === '' ? '0.' : `${text}.`;
  }
  if (fraction !== undefined) {
    return fraction.length < decimals ? text + key : text;
  }
  if (integer === '0') return key;
  return integer.length < MAX_INTEGER_DIGITS ? text + key : text;
}

/** "12345.6" → "12,345.6", leaving whatever the user has typed after the point untouched. */
function groupDigits(text: string) {
  const [integer, fraction] = text.split('.');
  const grouped = (integer || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

function TransactionForm({
  existing,
  categories,
  defaultCurrency,
}: {
  existing: Transaction | null;
  categories: Category[];
  defaultCurrency: string;
}) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const currency = existing?.currency ?? defaultCurrency;
  const decimals = fractionDigits(currency);
  const [kind, setKind] = useState<TransactionKind>(existing?.kind ?? 'expense');
  const [amountText, setAmountText] = useState(
    existing ? minorToInput(existing.amountMinor, currency) : ''
  );
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null);
  const [occurredOn, setOccurredOn] = useState(existing?.occurredOn ?? todayKey());
  const [note, setNote] = useState(existing?.note ?? '');
  const [saving, setSaving] = useState(false);

  const amountMinor = parseAmount(amountText, currency);
  const visibleCategories = categories.filter((category) => category.kind === kind);
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const canSave = amountMinor !== null && !saving;

  function changeKind(next: TransactionKind) {
    setKind(next);
    if (selectedCategory?.kind !== next) {
      setCategoryId(null);
    }
  }

  async function save() {
    if (amountMinor === null) return;
    setSaving(true);
    const input = { kind, amountMinor, currency, categoryId, note: note.trim(), occurredOn };
    try {
      if (existing) {
        await updateTransaction(db, existing.id, input);
      } else {
        await createTransaction(db, input);
      }
      successHaptic();
      router.back();
    } catch (error) {
      setSaving(false);
      showError('Could not save', String(error));
    }
  }

  function confirmDelete() {
    if (!existing) return;
    confirmDestructive('Delete transaction?', 'This cannot be undone.', 'Delete', async () => {
      await deleteTransaction(db, existing.id);
      router.back();
    });
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'ios' ? Spacing.four : insets.top + Spacing.three,
          paddingBottom: insets.bottom + 26,
        },
      ]}>
      <View style={styles.topBar}>
        <IconButton
          icon={{ ios: 'xmark', android: 'close' }}
          accessibilityLabel="Close"
          onPress={() => router.back()}
        />
        <SegmentedControl
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
          value={kind}
          onChange={changeKind}
        />
        {existing ? (
          <IconButton
            icon={{ ios: 'trash', android: 'delete' }}
            accessibilityLabel="Delete transaction"
            tintColor={theme.danger}
            onPress={confirmDelete}
          />
        ) : (
          <View style={styles.topBarSpacer} />
        )}
      </View>

      <View style={styles.amountArea}>
        <ThemedText type="small" themeColor="textSecondary">
          {currency}
        </ThemedText>
        <View style={styles.amountRow}>
          <ThemedText
            style={[styles.amount, amountText === '' && { color: theme.textTertiary }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {kind === 'income' && amountText !== '' ? '+' : ''}
            {groupDigits(amountText)}
          </ThemedText>
          <View style={[styles.caret, { backgroundColor: theme.primary }]} />
        </View>
        <ThemedText type="caption" themeColor="textTertiary">
          {selectedCategory?.name ?? 'No category'} · {formatDay(occurredOn)}
        </ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categories}>
        {visibleCategories.map((category) => {
          const selected = category.id === categoryId;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={category.name}
              onPress={() => setCategoryId(selected ? null : category.id)}
              style={styles.category}>
              <CategoryIcon icon={category.icon} color={category.color} size={52} selected={selected} />
              <ThemedText
                type="caption"
                themeColor={selected ? 'text' : 'textSecondary'}
                numberOfLines={1}>
                {category.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.detailsRow}>
        <DateField value={occurredOn} onChange={setOccurredOn} />
        <View style={[styles.notePill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SymbolView
            name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
            size={16}
            tintColor={theme.textSecondary}
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
            placeholderTextColor={theme.textTertiary}
            accessibilityLabel="Note"
            maxLength={200}
            returnKeyType="done"
            style={[styles.noteInput, { color: theme.text }]}
          />
        </View>
      </View>

      <Keypad
        allowDecimal={decimals > 0}
        onKey={(key) => setAmountText((text) => applyKey(text, key, decimals))}
        onClear={() => setAmountText('')}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave }}
        disabled={!canSave}
        onPress={save}
        style={({ pressed }) => [
          styles.saveButton,
          { backgroundColor: theme.primary },
          (!canSave || pressed) && styles.dimmed,
        ]}>
        <ThemedText style={[styles.saveLabel, { color: theme.onPrimary }]}>
          {existing ? 'Save changes' : kind === 'income' ? 'Add income' : 'Add expense'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
    gap: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarSpacer: {
    width: 40,
  },
  amountArea: {
    flex: 1,
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
  },
  amount: {
    fontFamily: FontFamily.display,
    fontSize: 68,
    lineHeight: 76,
    letterSpacing: -2.5,
    fontVariant: ['tabular-nums'],
  },
  caret: {
    width: 3,
    height: 56,
    borderRadius: 2,
  },
  categoryScroll: {
    flexGrow: 0,
    marginHorizontal: -20,
  },
  categories: {
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  category: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  notePill: {
    flex: 1,
    height: 46,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  noteInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: FontFamily.body,
    fontSize: 13,
    padding: 0,
  },
  saveButton: {
    height: 58,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    lineHeight: 22,
  },
  dimmed: {
    opacity: 0.35,
  },
});
