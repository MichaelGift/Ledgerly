/**
 * Categorical palette, stepped for the Night Market surfaces. Colorblind (CVD) and normal-vision
 * separation between neighbours and 3:1 contrast on cards are validated; the steps are deliberately
 * brighter than a neutral palette for the neon look. Categories store the slot *name*, not the hex.
 */
const Slots = {
  blue: '#3D9BFF',
  orange: '#FF7A45',
  aqua: '#2ED3C6',
  yellow: '#FFC233',
  magenta: '#F06BB8',
  green: '#3DDC97',
  violet: '#9085E9',
  red: '#FF5C6C',
  /** Not a series slot: "Uncategorized" and comparison context. */
  gray: '#6B7096',
} as const;

export const SeriesColors = Object.fromEntries(
  Object.entries(Slots).map(([name, hex]) => [name, { light: hex, dark: hex }])
) as { [K in keyof typeof Slots]: { light: string; dark: string } };

export type SeriesColorName = keyof typeof Slots;

export function resolveSeriesColor(color: string | null, scheme: 'light' | 'dark') {
  if (color && color in SeriesColors) {
    return SeriesColors[color as SeriesColorName][scheme];
  }
  // Older rows (or future custom colors) may hold a literal hex value.
  return color?.startsWith('#') ? color : Slots.gray;
}
