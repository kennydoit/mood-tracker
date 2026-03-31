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

/** Converts a Date to a 'YYYY-MM-DD' key */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Loads a single entry for a given calendar date (or null if none) */
export async function loadEntryForDate(date: Date): Promise<MoodEntry | null> {
  const key = toDateKey(date);
  const entries = await loadEntries();
  return entries.find((e) => e.date.slice(0, 10) === key) ?? null;
}

/**
 * Returns a map of dateKey ('YYYY-MM-DD') → MoodEntry for all stored entries.
 * If multiple entries exist for the same day, the most recent is used.
 */
export async function loadDateKeyMap(): Promise<Record<string, MoodEntry>> {
  const entries = await loadEntriesSorted(); // newest first
  const map: Record<string, MoodEntry> = {};
  for (const entry of entries) {
    const key = entry.date.slice(0, 10);
    if (!map[key]) map[key] = entry; // keep the newest per day
  }
  return map;
}

/**
 * Creates or updates an entry for a specific calendar date.
 * If an entry already exists for that date it is updated in-place.
 */
export async function saveEntryForDate(
  date: Date,
  values: Record<string, number>,
  notes?: string,
): Promise<void> {
  const key = toDateKey(date);
  const entries = await loadEntries();
  const existingIndex = entries.findIndex((e) => e.date.slice(0, 10) === key);

  if (existingIndex >= 0) {
    entries[existingIndex] = {
      ...entries[existingIndex],
      values,
      notes,
    };
  } else {
    // Preserve the selected date but set time to noon so it sorts predictably
    const entryDate = new Date(date);
    entryDate.setHours(12, 0, 0, 0);
    entries.unshift({
      id: Date.now().toString(),
      date: entryDate.toISOString(),
      values,
      notes,
    });
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
