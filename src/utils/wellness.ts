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
  habits?: Record<string, boolean | 'intent'>,
  enteredMetrics?: Set<string>,
  trackedMetricKeys?: string[],
  habitsTracked?: boolean,
  emotionalMetricScoring?: 'default' | 's-curve'
): number {
  // Gather only tracked metrics that are entered
  const trackedMetrics = trackedMetricKeys || [];
  const enteredTrackedMetrics = trackedMetrics.filter((key) => enteredMetrics?.has(key));
  const numMetrics = enteredTrackedMetrics.length;
  // Check if any habits are actually checked (not just if keys exist)
  const actuallyCheckedHabits = habits && Object.keys(habits).some(k => habits[k] === true || habits[k] === 'intent');
  const hasHabits = habitsTracked && enteredMetrics?.has('__habits_entered__') && actuallyCheckedHabits;

  // If nothing is entered, return -1
  if (numMetrics === 0 && !hasHabits) return -1;

  // S-curve scoring
  if (emotionalMetricScoring === 's-curve') {
    // S = 100 / (1 + exp(-k (x - x_0)))
    const k = 0.05;
    const m = numMetrics;
    const x_0 = m * 5;
    let x = 0;
    for (const key of enteredTrackedMetrics) {
      if (POSITIVE_METRICS.some((m) => m.key === key)) {
        x += values[key];
      } else if (NEGATIVE_METRICS.some((m) => m.key === key)) {
        x += 11 - values[key];
      }
    }
    // Determine number of tracked habits (independent of whether any are checked)
    const numTrackedHabits = habits ? Object.keys(habits).length : 0;
    const maxHabitBonus = numTrackedHabits > 0 ? (100 / (numTrackedHabits + 1)) : 0;
    
    // Calculate actual habit bonus based on how many are checked
    let habitBonus = 0;
    if (numTrackedHabits > 0 && habits) {
      const checked = Object.keys(habits).reduce((sum, k) => {
        const v = habits![k];
        if (v === true) return sum + 1;
        if (v === 'intent') return sum + 0.5;
        return sum;
      }, 0);
      habitBonus = maxHabitBonus * (checked / numTrackedHabits);
    }
    
    // Calculate S-curve, including habitBonus in x for consistency
    const S = 100 / (1 + Math.exp(-k * (x + habitBonus - x_0)));
    // Calculate maximum possible S
    // For max: all metrics = 10, all habits checked
    // x_0 is always based on number of metrics (m), not habits
    const x_max = m * 10 + maxHabitBonus;
    const x0_max = m * 5;
    const S_max = 100 / (1 + Math.exp(-k * (x_max - x0_max)));
    const intercept = 100 - S_max;
    // Add intercept to normalize, cap at 100
    return Math.round(Math.min(S + intercept, 100));
  }

  // Default (linear) scoring logic
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
  let metricPoints = (metricAvg / 10) * 100;
  let habitBonus = 0;
  if (hasHabits) {
    const trackedKeys = Object.keys(habits!);
    const checked = trackedKeys.reduce((sum, k) => {
      const v = habits![k];
      if (v === true) return sum + 1;
      if (v === 'intent') return sum + 0.5;
      return sum;
    }, 0);
    if (trackedKeys.length > 0) {
      habitBonus = (100 / (trackedKeys.length + 1)) * (checked / trackedKeys.length);
    }
  }
  // Additive: metricPoints + habitBonus, cap at 100
  let score = metricPoints + habitBonus;
  return Math.round(Math.min(score, 100));
}

/**
 * Calculates a Habit Score (0–100) = percentage of tracked habits checked off.
 */
export function calculateHabitScore(
  habits: Record<string, boolean | 'intent'>,
  trackedKeys: string[],
): number {
  if (trackedKeys.length === 0) return 0;
  const score = trackedKeys.reduce((sum, k) => {
    const v = habits[k];
    if (v === true) return sum + 1;
    if (v === 'intent') return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((score / trackedKeys.length) * 100);
}

/** Returns a colour that reflects the score level */
export function wellnessColor(score: number): string {
  // Clamp score to [0, 100]
  const s = Math.max(0, Math.min(100, score));
  // Define color stops
  const stops = [
    { score: 0, color: [255, 0, 0] },        // Red
    { score: 25, color: [255, 140, 0] },    // Dark Orange (#FF8C00)
    { score: 40, color: [255, 215, 0] },    // Gold (#FFD700)
    { score: 60, color: [50, 205, 50] },    // Lime Green (#32CD32)
    { score: 75, color: [30, 144, 255] },   // Dodger Blue (#1E90FF)
    { score: 90, color: [75, 0, 130] },     // Indigo
    { score: 100, color: [139, 0, 255] },   // Violet
  ];

  // Find the two stops s is between
  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (s >= stops[i].score && s <= stops[i + 1].score) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }
  // Linear interpolation
  const range = upper.score - lower.score;
  const t = range === 0 ? 0 : (s - lower.score) / range;
  const interp = (a: number, b: number) => Math.round(a + (b - a) * t);
  const [r, g, b] = [
    interp(lower.color[0], upper.color[0]),
    interp(lower.color[1], upper.color[1]),
    interp(lower.color[2], upper.color[2]),
  ];
  // Return as hex string
  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
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
