import { MoodMetric } from '../types';

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
