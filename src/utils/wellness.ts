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
  trackedMetricKeys?: string[],
  habitsTracked?: boolean
): number {
  // Gather only tracked metrics that are entered
  const trackedMetrics = trackedMetricKeys || [];
  const enteredTrackedMetrics = trackedMetrics.filter((key) => enteredMetrics?.has(key));
  const numMetrics = enteredTrackedMetrics.length;
  const hasHabits = habitsTracked && enteredMetrics?.has('__habits_entered__') && habits && Object.keys(habits).length > 0;

  // If nothing is entered, return -1
  if (numMetrics === 0 && !hasHabits) return -1;

  // Calculate metric contribution (average of entered metrics, 0-10)
  let metricTotal = 0;
  for (const key of enteredTrackedMetrics) {
    if (POSITIVE_METRICS.some((m) => m.key === key)) {
      metricTotal += values[key];
    } else if (NEGATIVE_METRICS.some((m) => m.key === key)) {
      metricTotal += 11 - values[key];
    }
  }
  const metricAvg = numMetrics > 0 ? metricTotal / numMetrics : 0; // 0-10
  const metricPoints = numMetrics > 0 ? (metricAvg / 10) * 75 : 0; // 0-75

  // Calculate habits contribution (percentage checked, 0-1)
  let habitsPoints = 0;
  if (hasHabits) {
    const trackedKeys = Object.keys(habits!);
    const checked = trackedKeys.filter((k) => habits![k] === true).length;
    const habitsPct = trackedKeys.length > 0 ? checked / trackedKeys.length : 0;
    habitsPoints = habitsPct * 25; // 0-25
  }

  // If both are present, sum to 100; if only one, max is 75 or 25
  let score = 0;
  if (numMetrics > 0 && hasHabits) {
    score = metricPoints + habitsPoints;
  } else if (numMetrics > 0) {
    score = metricPoints;
  } else if (hasHabits) {
    score = habitsPoints;
  }
  return Math.round(score);
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
  if (score >= 86) return 'Very High';
  if (score >= 70) return 'High';
  if (score >= 55) return 'Moderate';
  if (score >= 40) return 'Low';
  return 'Very Low';
}

/** Returns a supportive label that reflects the score level */
export function supportiveWellnessLabel(score: number): string {
  if (score >= 86) return 'Flourishing';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Steady';
  if (score >= 40) return 'Below Baseline';
  return 'Needing Support';
}
