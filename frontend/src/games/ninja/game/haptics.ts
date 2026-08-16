import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Maps game events -> haptic feedback. No-op on web / when disabled.
export function haptic(event: string, enabled: boolean) {
  if (!enabled || Platform.OS === "web") return;
  try {
    switch (event) {
      case "jump":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "coin":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "stomp":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "power":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "life":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "through":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "die":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "tap":
        Haptics.selectionAsync();
        break;
    }
  } catch {
    // ignore
  }
}
