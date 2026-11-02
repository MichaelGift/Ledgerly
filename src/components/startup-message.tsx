import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

/** Full-screen notice for when the app can't start, e.g. the database won't open. */
export function StartupMessage({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.center}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    backgroundColor: Colors.dark.background,
  },
  center: {
    textAlign: 'center',
    maxWidth: 360,
  },
});
