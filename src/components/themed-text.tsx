import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'display'
    | 'title'
    | 'heading'
    | 'number'
    | 'default'
    | 'medium'
    | 'small'
    | 'smallBold'
    | 'caption'
    | 'label';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  /** Hero amounts. */
  display: {
    fontFamily: FontFamily.display,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -1.5,
  },
  title: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  /** Amounts in lists and tiles. */
  number: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  default: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  medium: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  small: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  smallBold: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 16,
  },
  /** Small uppercase section labels. */
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
