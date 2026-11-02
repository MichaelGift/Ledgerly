import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import type { TransactionWithCategory } from '@/db/repository';
import { useTheme } from '@/hooks/use-theme';
import { formatAmount } from '@/utils/money';

type TransactionRowProps = {
  transaction: TransactionWithCategory;
  /** The currency code is only shown when it differs from this one. */
  defaultCurrency: string;
};

export function TransactionRow({ transaction, defaultCurrency }: TransactionRowProps) {
  const theme = useTheme();
  const isIncome = transaction.kind === 'income';
  const category = transaction.categoryName ?? 'Uncategorized';
  const title = transaction.note || category;
  const foreignCurrency = transaction.currency !== defaultCurrency;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/transaction', params: { id: transaction.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <CategoryIcon icon={transaction.categoryIcon} color={transaction.categoryColor} />
      <View style={styles.text}>
        <ThemedText type="medium" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {category}
        </ThemedText>
      </View>
      <ThemedText type="number" style={isIncome && { color: theme.income }}>
        {isIncome ? '+' : ''}
        {formatAmount(transaction.amountMinor, transaction.currency)}
        {foreignCurrency && (
          <ThemedText type="caption" themeColor="textSecondary">
            {' '}
            {transaction.currency}
          </ThemedText>
        )}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    flex: 1,
  },
  pressed: {
    opacity: 0.5,
  },
});
