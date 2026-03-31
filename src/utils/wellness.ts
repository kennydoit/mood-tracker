import { POSITIVE_METRICS, NEGATIVE_METRICS } from '../constants/moods';

/**
 * Calculates a Wellness Score (0–100) from a set of metric values.
 *
 * Formula:
 *  - Positive metrics: normalised contribution = (value - 1) / 9  → 0..1
 *  - Negative metrics: normalised contribution = (10 - value) / 9 → 0..1 (inverted)
 *  - Average all normalised contributions, multiply by 100.
 *
 * All metrics are equally weighted for now.
 */
export function calculateWellnessScore(
  values: Record<string, number>,
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

  if (count === 0) return 0;
  return Math.round((total / count) * 100);
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
