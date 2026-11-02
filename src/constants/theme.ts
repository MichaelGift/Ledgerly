/**
 * "Night Market" design tokens: a deep indigo ground with electric lime as the single action color.
 * The app is dark-only, so both schemes resolve to the same palette.
 */

const Night = {
  text: '#F2F3FA',
  textSecondary: '#9EA3C7',
  textTertiary: '#6B7096',
  background: '#0E1022',
  /** Cards, keys, inputs. */
  surface: '#171A33',
  /** The floating tab bar and anything sitting above a card. */
  raised: '#23264A',
  backgroundElement: '#171A33',
  backgroundSelected: '#2B2F55',
  border: '#2B2F55',
  /** Muted data marks (history, inactive bars). */
  muted: '#3D4170',
  primary: '#C6F432',
  onPrimary: '#10130A',
  income: '#3DDC97',
  danger: '#FF5C6C',
} as const;

export const Colors = { light: Night, dark: Night } as const;

export type ThemeColor = keyof typeof Night;

/** Loaded in the root layout via @expo-google-fonts. Custom families carry their own weight. */
export const FontFamily = {
  display: 'SpaceGrotesk_700Bold',
  displaySemiBold: 'SpaceGrotesk_600SemiBold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 22,
  card: 26,
  full: 999,
} as const;

export const TabBarHeight = 62;
/** Space to leave under scroll content so the floating tab bar never covers it (plus the safe-area inset). */
export const BottomTabInset = TabBarHeight + 22 + Spacing.three;
export const MaxContentWidth = 800;
