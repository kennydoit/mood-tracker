import AsyncStorage from '@react-native-async-storage/async-storage';

const HABIT_SETTINGS_KEY = '@mood_tracker_tracked_habits';
const DEFAULT_TRACKED_HABITS = ['meditation', 'gratitude', 'read_book'];

/** Returns the list of habit keys the user has chosen to track. */
export async function loadTrackedHabits(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(HABIT_SETTINGS_KEY);
    if (!json) return DEFAULT_TRACKED_HABITS;
    return JSON.parse(json) as string[];
  } catch {
    return DEFAULT_TRACKED_HABITS;
  }
}

/** Persists the list of habit keys the user wants to track. */
export async function saveTrackedHabits(keys: string[]): Promise<void> {
  await AsyncStorage.setItem(HABIT_SETTINGS_KEY, JSON.stringify(keys));
}
