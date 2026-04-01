import { POSITIVE_METRICS, NEGATIVE_METRICS } from '../constants/moods';

/**
 * Calculates a Wellness Score (0–100) from entered metric values and optional habits.
 *
 * Formula:
 *  - Positive metrics: contribute their value (1–10) directly
 *  - Negative metrics: contribute (10 - value + 1) to invert the scale
 *  - Habits: contribute (checked / tracked) * 10 if explicitly entered and tracked
 *  - Score = (sum of all contributions) / (count of entered items * 10) * 100
 *
 * Only metrics/habits marked as explicitly entered are counted.
 * Returns -1 if no metrics have been entered, so no score is shown.
 */
export function calculateWellnessScore(
  values: Record<string, number>,
  habits?: Record<string, boolean>,
  enteredMetrics?: Set<string>,
): number {
  let total = 0;
  let count = 0;

  // Count only explicitly entered positive metrics
  for (const m of POSITIVE_METRICS) {
    if (enteredMetrics?.has(m.key)) {
      total += values[m.key];
      count++;
    }
  }

  // Count only explicitly entered negative metrics (inverted)
  for (const m of NEGATIVE_METRICS) {
    if (enteredMetrics?.has(m.key)) {
      total += 11 - values[m.key];
      count++;
    }
  }

  // Count habits as a group if they've been explicitly entered and any are tracked
  if (enteredMetrics?.has('__habits_entered__') && habits) {
    const trackedKeys = Object.keys(habits);
    if (trackedKeys.length > 0) {
      const checked = trackedKeys.filter((k) => habits[k] === true).length;
      total += (checked / trackedKeys.length) * 10;
      count++;
    }
  }

  // Return -1 if no metrics entered, so no score is displayed
  if (count === 0) return -1;
  return Math.round((total / (count * 10)) * 100);
}

/**
 * Calculates a Habit Score (0–100) = percentage of tracked habits checked off.
 */
export function calculateHabitScore(
  habits: Record<string, boolean>,
  trackedKeys: string[],
): number {
  if (trackedKeys.length === 0) return 0;
  const checked = trackedKeys.filter((k) => habits[k] === true).length;
  return Math.round((checked / trackedKeys.length) * 100);
}

/** Returns a colour that reflects the score level */
export function wellnessColor(score: number): string {
  if (score >= 75) return '#4CAF50'; // green
  if (score >= 50) return '#FF9800'; // amber
  return '#F44336';                  // red
}

/** Returns a short label that reflects the score level */
export function wellnessLabel(score: number): string {
  if (score >= 85) return 'Thriving';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Okay';
  if (score >= 40) return 'Low';
  return 'Struggling';
}
