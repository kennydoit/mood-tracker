export type MoodCategory = 'positive' | 'negative';

export interface MoodMetric {
  key: string;
  label: string;
  category: MoodCategory;
  color: string;
}

export interface MoodEntry {
  id: string;
  date: string; // ISO string
  values: Record<string, number>; // metric key -> 1–10
  notes?: string;
}
