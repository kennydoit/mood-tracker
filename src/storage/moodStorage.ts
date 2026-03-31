import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodEntry } from '../types';

const STORAGE_KEY = '@mood_tracker_entries';

export async function loadEntries(): Promise<MoodEntry[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as MoodEntry[];
  } catch {
    return [];
  }
}

export async function saveEntry(entry: MoodEntry): Promise<void> {
  const entries = await loadEntries();
  const existingIndex = entries.findIndex((e) => e.id === entry.id);
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.unshift(entry);
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function deleteEntry(id: string): Promise<void> {
  const entries = await loadEntries();
  const filtered = entries.filter((e) => e.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function createEntry(
  values: Record<string, number>,
  notes?: string,
): MoodEntry {
  return {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    values,
    notes,
  };
}

/** Returns entries sorted newest-first */
export async function loadEntriesSorted(): Promise<MoodEntry[]> {
  const entries = await loadEntries();
  return entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
