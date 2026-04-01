import { MoodMetric, Habit } from '../types';

export const POSITIVE_METRICS: MoodMetric[] = [
  { key: 'mood',       label: 'Mood',       category: 'positive', color: '#4CAF50' },
  { key: 'vitality',   label: 'Vitality',   category: 'positive', color: '#8BC34A' },
  { key: 'motivation', label: 'Motivation', category: 'positive', color: '#2196F3' },
  { key: 'energy',     label: 'Energy',     category: 'positive', color: '#FF9800' },
  { key: 'sleep',      label: 'Sleep',      category: 'positive', color: '#9C27B0' },
];

export const NEGATIVE_METRICS: MoodMetric[] = [
  { key: 'depression',  label: 'Depression',  category: 'negative', color: '#F44336' },
  { key: 'sadness',     label: 'Sadness',     category: 'negative', color: '#E91E63' },
  { key: 'anxiety',     label: 'Anxiety',     category: 'negative', color: '#FF5722' },
  { key: 'nervousness', label: 'Nervousness', category: 'negative', color: '#FF9800' },
  { key: 'irritability',label: 'Irritability',category: 'negative', color: '#795548' },
];

export const ALL_METRICS = [...POSITIVE_METRICS, ...NEGATIVE_METRICS];

export const SCALE_LABELS: Record<number, string> = {
  1: 'Not at all',
  5: 'Moderate',
  10: 'Extremely',
};

export const AVAILABLE_HABITS: Habit[] = [
  { key: 'meditation',     label: 'Meditation',      emoji: '🧘' },
  { key: 'gratitude',      label: 'Gratitude',       emoji: '🙏' },
  { key: 'read_book',      label: 'Read a Book',     emoji: '📚' },
  { key: 'learn',          label: 'Learn Something', emoji: '💡' },
  { key: 'healthy_eating', label: 'Healthy Eating',  emoji: '🥗' },
  { key: 'exercise',       label: 'Exercise',        emoji: '💪' },
  { key: 'cardio',         label: 'Cardio',          emoji: '🏃' },
  { key: 'walk',           label: 'Walk',            emoji: '🚶' },
  { key: 'run',            label: 'Run',             emoji: '🏃‍♂️' },
  { key: 'smile',          label: 'Smile',           emoji: '😊' },
  { key: 'journal',        label: 'Journal',         emoji: '📓' },
];
