import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

/** Overview and the screens it drills into, so the tab bar stays visible on them. */
export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background } }}
    />
  );
}
