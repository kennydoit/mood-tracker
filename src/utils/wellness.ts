import { POSITIVE_METRICS, NEGATIVE_METRICS } from '../constants/moods';

/**
 * Calculates a Wellness Score (0–100) from mood metric values and optional habits.
 *
 * Formula:
 *  - Positive metrics: normalised contribution = (value - 1) / 9  → 0..1
 *  - Negative metrics: normalised contribution = (10 - value) / 9 → 0..1 (inverted)
 *  - Each tracked habit: contribution = 1 if checked, 0 if unchecked → 0..1
 *  - All components averaged equally, multiplied by 100.
 *
 * Habits blend in proportionally — if you track 5 habits they contribute
 * 5 slots out of (10 metrics + 5 habits) = 15 total.
 */
export function calculateWellnessScore(
  values: Record<string, number>,
  habits?: Record<string, boolean>,
): number {
  let total = 0;
  let count = 0;

  for (const m of POSITIVE_METRICS) {
    const v = values[m.key];
    if (v !== undefined) {
      total += (v - 1) / 9;
      count++;
    }
  }

  for (const m of NEGATIVE_METRICS) {
    const v = values[m.key];
    if (v !== undefined) {
      total += (10 - v) / 9;
      count++;
    }
  }

  if (habits) {
    for (const key of Object.keys(habits)) {
      total += habits[key] ? 1 : 0;
      count++;
    }
  }

  if (count === 0) return 0;
  return Math.round((total / count) * 100);
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
