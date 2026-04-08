import AsyncStorage from '@react-native-async-storage/async-storage';

const MOOD_STATES_KEY = '@mood_tracker_tracked_mood_states';
const DEFAULT_TRACKED_MOODS = ['mood', 'vitality', 'motivation', 'depression', 'anxiety', 'sadness'];

/** Returns the list of mood state keys the user has chosen to track. */
export async function loadTrackedMoodStates(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(MOOD_STATES_KEY);
    if (!json) return DEFAULT_TRACKED_MOODS;
    return JSON.parse(json) as string[];
  } catch {
    return DEFAULT_TRACKED_MOODS;
  }
}

/** Persists the list of mood state keys the user wants to track. */
export async function saveTrackedMoodStates(keys: string[]): Promise<void> {
  await AsyncStorage.setItem(MOOD_STATES_KEY, JSON.stringify(keys));
}
