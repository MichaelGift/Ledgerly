import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { useSeriesColor, useTheme } from '@/hooks/use-theme';

/** Icon keys are stored in the database, so they stay platform-neutral. */
const ICONS: Record<string, { ios: SFSymbol; android: AndroidSymbol }> = {
  food: { ios: 'fork.knife', android: 'restaurant' },
  transport: { ios: 'car.fill', android: 'directions_car' },
  housing: { ios: 'house.fill', android: 'home' },
  utilities: { ios: 'bolt.fill', android: 'bolt' },
  shopping: { ios: 'bag.fill', android: 'shopping_bag' },
  health: { ios: 'heart.fill', android: 'favorite' },
  entertainment: { ios: 'film.fill', android: 'movie' },
  other: { ios: 'square.grid.2x2.fill', android: 'category' },
  salary: { ios: 'banknote.fill', android: 'payments' },
  income: { ios: 'arrow.down.circle.fill', android: 'savings' },
  tag: { ios: 'tag.fill', android: 'sell' },
};

type CategoryIconProps = {
  icon: string | null;
  color: string | null;
  size?: number;
  /** Solid tile with a lime-free ring: used for the selected category in the add sheet. */
  selected?: boolean;
};

/** Rounded tile with the category's symbol, on a 16% wash of its color (or solid when selected). */
export function CategoryIcon({ icon, color, size = 40, selected = false }: CategoryIconProps) {
  const theme = useTheme();
  const tint = useSeriesColor()(color);
  const symbol = ICONS[icon ?? 'tag'] ?? ICONS.tag;
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.35,
          backgroundColor: selected ? tint : `${tint}29`,
        },
        selected && {
          // A background-colored gap, then a ring in the category color.
          borderWidth: 2,
          borderColor: theme.background,
          outlineWidth: 2,
          outlineColor: tint,
          outlineStyle: 'solid',
        },
      ]}>
      <SymbolView
        name={{ ios: symbol.ios, android: symbol.android, web: symbol.android }}
        size={size * 0.46}
        tintColor={selected ? theme.onPrimary : tint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
