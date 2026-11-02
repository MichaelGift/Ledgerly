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
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/schema';

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

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={migrateDbIfNeeded}
        options={{ enableChangeListener: true }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="transaction" options={{ presentation: 'modal' }} />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
