import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, TabBarHeight } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Chrome's install event (not yet in TypeScript's DOM types). */
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

declare global {
  interface Window {
    /** Captured by public/index.html, which can run before the app does. */
    __ledgerlyInstallEvent?: InstallEvent;
  }
  interface Navigator {
    /** iOS Safari: true when running from the home screen. */
    standalone?: boolean;
  }
}

const DISMISSED_KEY = 'ledgerly-install-dismissed';
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 1500;

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

/** iPhone/iPad, including iPadOS which reports itself as a Mac. */
function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function recentlyDismissed() {
  try {
    return Date.now() - Number(localStorage.getItem(DISMISSED_KEY) ?? 0) < SNOOZE_MS;
  } catch {
    return false;
  }
}

/**
 * Suggests installing the web app. Chrome/Edge get a real Install button (via the captured
 * `beforeinstallprompt` event); iOS Safari has no such API, so it gets Share → Add to Home Screen
 * instructions. Hidden once installed, and for two weeks after "Not now".
 */
export function InstallPrompt() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [installEvent, setInstallEvent] = useState<InstallEvent | undefined>(
    () => window.__ledgerlyInstallEvent
  );
  const [visible, setVisible] = useState(false);
  const ios = isIOS();

  useEffect(() => {
    if (isInstalled() || recentlyDismissed()) return;
    const onInstallable = () => setInstallEvent(window.__ledgerlyInstallEvent);
    const onInstalled = () => setVisible(false);
    window.addEventListener('ledgerly-installable', onInstallable);
    window.addEventListener('appinstalled', onInstalled);
    // Give the app a moment to appear before asking for anything.
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('ledgerly-installable', onInstallable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Without an install event or iOS instructions there is nothing useful to offer.
  if (!visible || (!installEvent && !ios)) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Private browsing: the prompt simply comes back next visit.
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    // The event can only be used once.
    window.__ledgerlyInstallEvent = undefined;
    setInstallEvent(undefined);
    if (outcome === 'accepted') setVisible(false);
    else dismiss();
  };

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.card,
        {
          bottom: insets.bottom + 22 + TabBarHeight + 12,
          backgroundColor: theme.raised,
          borderColor: theme.border,
        },
      ]}>
      <View style={[styles.icon, { backgroundColor: theme.primary }]}>
        <SymbolView
          name={{ ios: 'plus.app', android: 'add_to_home_screen', web: 'add_to_home_screen' }}
          size={22}
          tintColor={theme.onPrimary}
        />
      </View>
      <View style={styles.text}>
        <ThemedText type="medium">Install Ledgerly</ThemedText>
        {installEvent ? (
          <ThemedText type="caption" themeColor="textSecondary">
            Add it to your home screen to open it like an app, even offline.
          </ThemedText>
        ) : (
          <ThemedText type="caption" themeColor="textSecondary">
            Tap{' '}
            <SymbolView
              name={{ ios: 'square.and.arrow.up', android: 'ios_share', web: 'ios_share' }}
              size={14}
              tintColor={theme.text}
              style={styles.inlineIcon}
            />{' '}
            <ThemedText type="caption">Share</ThemedText>, then{' '}
            <ThemedText type="caption">Add to Home Screen</ThemedText>. Do it before adding entries:
            the home screen app keeps its own data.
          </ThemedText>
        )}
        {installEvent && (
          <Pressable
            accessibilityRole="button"
            onPress={install}
            style={({ pressed }) => [
              styles.installButton,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              Install
            </ThemedText>
          </Pressable>
        )}
      </View>
      <IconButton
        icon={{ ios: 'xmark', android: 'close' }}
        accessibilityLabel="Not now"
        variant="ghost"
        size={32}
        tintColor={theme.textSecondary}
        onPress={dismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: Spacing.three,
    paddingRight: Spacing.two,
    borderRadius: Radius.large,
    borderWidth: 1,
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 4,
  },
  inlineIcon: {
    transform: [{ translateY: 2 }],
  },
  installButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
