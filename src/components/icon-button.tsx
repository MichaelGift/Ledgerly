import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  icon: { ios: SFSymbol; android: AndroidSymbol };
  accessibilityLabel: string;
  onPress: () => void;
  variant?: 'primary' | 'subtle' | 'ghost';
  size?: number;
  tintColor?: string;
  disabled?: boolean;
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'subtle',
  size = 40,
  tintColor,
  disabled = false,
}: IconButtonProps) {
  const theme = useTheme();
  const background =
    variant === 'primary' ? theme.primary : variant === 'subtle' ? theme.surface : 'transparent';
  const foreground = tintColor ?? (variant === 'primary' ? theme.onPrimary : theme.text);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <SymbolView
        name={{ ios: icon.ios, android: icon.android, web: icon.android }}
        size={size * 0.45}
        tintColor={foreground}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.4,
  },
});
