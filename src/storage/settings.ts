import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@mood_tracker_settings';

export interface AppSettings {
  wellnessLabelMode: 'default' | 'supportive';
  habitsEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  wellnessLabelMode: 'default',
  habitsEnabled: true,
};

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!json) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
