import { useCallback, useEffect, useState } from "react";
import { storage } from "@/src/utils/storage";
import { KEY_HAPTICS, KEY_SOUND } from "./constants";

export interface Settings {
  haptics: boolean;
  sound: boolean;
}

const DEFAULTS: Settings = { haptics: true, sound: true };

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const haptics = await storage.getItem<boolean>(KEY_HAPTICS, true);
      const sound = await storage.getItem<boolean>(KEY_SOUND, true);
      setSettings({ haptics: haptics ?? true, sound: sound ?? true });
      setLoaded(true);
    })();
  }, []);

  const setHaptics = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, haptics: v }));
    storage.setItem(KEY_HAPTICS, v);
  }, []);

  const setSound = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, sound: v }));
    storage.setItem(KEY_SOUND, v);
  }, []);

  return { settings, loaded, setHaptics, setSound };
}
