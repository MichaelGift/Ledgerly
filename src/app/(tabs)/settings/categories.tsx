import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/category-icon';
import { ListGroup, ListRow } from '@/components/list-group';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listCategories } from '@/db/repository';
import { useLiveQuery } from '@/hooks/use-live-query';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const categories = useLiveQuery('categories', ['categories'], (db) => listCategories(db));

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset }]}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Categories" back />
        {categories && (
          <>
            {(['expense', 'income'] as const).map((kind) => (
              <ListGroup key={kind} title={kind === 'expense' ? 'Expenses' : 'Income'}>
                {categories
                  .filter((c) => c.kind === kind)
                  .map((c) => (
                    <ListRow
                      key={c.id}
                      label={c.name}
                      leading={<CategoryIcon icon={c.icon} color={c.color} size={32} />}
                    />
                  ))}
              </ListGroup>
            ))}
            <ThemedText type="caption" themeColor="textTertiary" style={styles.note}>
              Adding and editing categories is coming in a later version.
            </ThemedText>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
  },
  note: {
    paddingHorizontal: Spacing.three,
  },
});
