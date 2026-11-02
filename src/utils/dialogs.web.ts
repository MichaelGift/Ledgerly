// React Native Web's Alert is a no-op, so fall back to the browser's own dialogs.

export function showError(title: string, message: string) {
  window.alert(`${title}\n\n${message}`);
}

export function confirmDestructive(
  title: string,
  message: string,
  _confirmLabel: string,
  onConfirm: () => void
) {
  if (window.confirm(`${title}\n\n${message}`)) {
    onConfirm();
  }
}
