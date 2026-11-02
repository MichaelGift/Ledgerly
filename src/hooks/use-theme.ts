import { resolveSeriesColor } from '@/constants/palette';
import { Colors } from '@/constants/theme';

/** The app is dark-only (Night Market). */
export function useTheme() {
  return Colors.dark;
}

/** Resolves a stored category/series color (a palette slot name) to its hex value. */
export function useSeriesColor() {
  return (color: string | null) => resolveSeriesColor(color, 'dark');
}
