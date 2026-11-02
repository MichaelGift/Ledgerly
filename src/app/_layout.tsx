import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { StartupMessage } from '@/components/startup-message';
import { Colors } from '@/constants/theme';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/schema';
import { isolationState, recoverFromDatabaseError } from '@/utils/isolation';

SplashScreen.preventAutoHideAsync();

const theme = Colors.dark;
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.background,
    card: theme.surface,
    text: theme.text,
    border: theme.border,
    primary: theme.primary,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const ready = fontsLoaded || fontError !== null;
  const [databaseError, setDatabaseError] = useState<Error | null>(null);
  const [recovering, setRecovering] = useState(false);
  const isolation = isolationState();

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // On web the page reloads itself once to become cross-origin isolated; wait for that.
  if (!ready || isolation === 'pending' || recovering) {
    return null;
  }
  if (isolation === 'unsupported') {
    return (
      <StartupMessage
        title="Can't store data here"
        message="This browser doesn't support the on-device storage Ledgerly needs. Try Safari or Chrome, and make sure private browsing is off."
      />
    );
  }
  if (databaseError) {
    return (
      <StartupMessage
        title="Couldn't open your data"
        message="Ledgerly may already be open in another tab or window. Close it, then reopen Ledgerly."
      />
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={migrateDbIfNeeded}
        onError={(error) => {
          console.warn('Opening the database failed', error);
          if (recoverFromDatabaseError()) {
            setRecovering(true);
          } else {
            setDatabaseError(error);
          }
        }}
        options={{ enableChangeListener: true }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="transaction" options={{ presentation: 'modal' }} />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
