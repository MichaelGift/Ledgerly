import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Android's Vibrator-based fallbacks feel buzzy, so use the platform haptic constants there.

export function tapHaptic() {
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Keyboard_Tap);
  } else if (Platform.OS === 'ios') {
    Haptics.selectionAsync();
  }
}

export function successHaptic() {
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
  } else if (Platform.OS === 'ios') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}
