import AsyncStorage from '@react-native-async-storage/async-storage';

const HABIT_SETTINGS_KEY = '@mood_tracker_tracked_habits';

/** Returns the list of habit keys the user has chosen to track. */
export async function loadTrackedHabits(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(HABIT_SETTINGS_KEY);
    if (!json) return [];
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

/** Persists the list of habit keys the user wants to track. */
export async function saveTrackedHabits(keys: string[]): Promise<void> {
  await AsyncStorage.setItem(HABIT_SETTINGS_KEY, JSON.stringify(keys));
}
