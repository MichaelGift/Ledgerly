import { Alert } from 'react-native';

export function showError(title: string, message: string) {
  Alert.alert(title, message);
}

/** Asks before a destructive action; `onConfirm` runs only if the user agrees. */
export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void
) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
