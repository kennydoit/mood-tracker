// TEMP: For clearing all data
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { POSITIVE_METRICS, NEGATIVE_METRICS, AVAILABLE_HABITS, METRIC_LABELS } from '../constants/moods';
import MoodSlider from '../components/MoodSlider';
import { WeekStrip } from '../components/WeekStrip';
import {
  loadEntryForDate,
  loadDateKeyMap,
  saveEntryForDate,
} from '../storage/moodStorage';
import { loadTrackedHabits } from '../storage/habitSettings';
import { loadTrackedMoodStates } from '../storage/moodStateSettings';
import { toDateKey } from '../utils/dateUtils';
import { calculateWellnessScore, calculateHabitScore, wellnessColor, wellnessLabel, supportiveWellnessLabel } from '../utils/wellness';
import { useTheme, ThemeColors } from '../theme';
// Utility to blend a color with white for a pale effect
function paleColor(hex: string, amount = 0.85) {
  // hex: #RRGGBB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const blend = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${blend(r).toString(16).padStart(2, '0')}${blend(g).toString(16).padStart(2, '0')}${blend(b).toString(16).padStart(2, '0')}`;
}
import { LinearGradient } from 'expo-linear-gradient';
import { loadAppSettings, AppSettings } from '../storage/settings';
import { MoodEntry } from '../types';

/**
 * Compute the wellness dot color for a saved entry using the same logic as the live score.
 * Filters metrics/habits through the currently-tracked lists so saved and live colors always match.
 */
function computeEntryDotColor(
  entry: MoodEntry,
  trackedMoodStates: string[],
  trackedHabits: string[],
  habitsEnabled: boolean
): string {
  // Only include metric values that are currently tracked
  const filteredValues = Object.fromEntries(
    Object.entries(entry.values).filter(([k]) => trackedMoodStates.includes(k))
  ) as Record<string, number>;
  const enteredMetrics = new Set(Object.keys(filteredValues));

  // Only include habits that are currently tracked
  const habitsTracked = habitsEnabled && trackedHabits.length > 0;
  let trackedHabitsRecord: Record<string, boolean> | undefined;
  if (habitsTracked && entry.habits) {
    trackedHabitsRecord = Object.fromEntries(
      trackedHabits.map((k) => [k, entry.habits![k] ?? false])
    );
    // Only flag habits as entered if the entry has any habit data at all
    if (Object.keys(entry.habits).length > 0) {
      enteredMetrics.add('__habits_entered__');
    }
  }

  const score = calculateWellnessScore(
    filteredValues,
    trackedHabitsRecord,
    enteredMetrics,
    trackedMoodStates,
    habitsTracked
  );
  return score === -1 ? '#ddd' : wellnessColor(score);
}

const defaultValues = (): Record<string, number | undefined> => {
  const vals: Record<string, number | undefined> = {};
  [...POSITIVE_METRICS, ...NEGATIVE_METRICS].forEach((m) => {
    vals[m.key] = undefined;
  });
  return vals;
};

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function LogScreen() {
  const { colors, mode } = useTheme();
  const isLightMode = colors.bg === '#fafafa';
  const isColorful = mode === 'colorful';
  const styles = makeStyles(colors);
  const [selectedDate, setSelectedDate] = useState<Date>(todayMidnight());
  const [entryDateKeys, setEntryDateKeys] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, number | undefined>>(defaultValues());
  const [notes, setNotes] = useState('');
  const [habits, setHabits] = useState<Record<string, boolean>>({});
  const [trackedHabits, setTrackedHabits] = useState<string[]>([]);
  const [trackedMoodStates, setTrackedMoodStates] = useState<string[]>([]);
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [enteredMetrics, setEnteredMetrics] = useState<string[]>([]);
  const [habitsEntered, setHabitsEntered] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({ wellnessLabelMode: 'default', habitsEnabled: true });
  // Used to force dot color recomputation after entry update
  const [dotColorRefreshKey, setDotColorRefreshKey] = useState(0);

  // Reload the dot-map, tracked habits, and mood states whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDateKeyMap().then((map) => setEntryDateKeys(new Set(Object.keys(map))));
      loadTrackedHabits().then(setTrackedHabits);
      loadTrackedMoodStates().then(setTrackedMoodStates);
      loadAppSettings().then(setAppSettings);
    }, []),
  );

  // Whenever selected date changes, load that day's entry (or reset to defaults)
  useEffect(() => {
    loadEntryForDate(selectedDate).then((entry) => {
      if (entry) {
        setValues(entry.values);
        setNotes(entry.notes ?? '');
        setExistingEntryId(entry.id);
        setHabits(entry.habits ?? {});
        // When loading an existing entry, all its metrics are considered entered
        setEnteredMetrics(Object.keys(entry.values));
        // Mark habits as entered if they exist
        setHabitsEntered(!!(entry.habits && Object.keys(entry.habits).length > 0));
      } else {
        setValues(defaultValues());
        setNotes('');
        setExistingEntryId(null);
        setHabits({});
        // When starting fresh, no metrics are entered yet
        setEnteredMetrics([]);
        setHabitsEntered(false);
      }
    });
  }, [selectedDate]);

  const setValue = (key: string, val: number | undefined) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    // Mark this metric as explicitly entered only if it's not undefined
    if (val !== undefined) {
      setEnteredMetrics((prev) => prev.includes(key) ? prev : [...prev, key]);
    } else {
      // Remove from entered metrics if deselected
      setEnteredMetrics((prev) => prev.filter((k) => k !== key));
    }
  };

  const handleSelectDate = (date: Date) => {
    // Reset form immediately so the live score drops to -1 before the entry loads.
    // This prevents the previous day's score colour bleeding onto the new dot.
    setValues(defaultValues());
    setNotes('');
    setHabits({});
    setExistingEntryId(null);
    setEnteredMetrics([]);
    setHabitsEntered(false);
    setSelectedDate(date);
    // Recompute dot colors so previous selected day reverts to saved color
    loadDateKeyMap().then((map) => {
      const colors: { [key: string]: string } = {};
      Object.entries(map).forEach(([dateKey, entry]) => {
        colors[dateKey] = computeEntryDotColor(entry, trackedMoodStates, trackedHabits, habitsEnabled);
      });
      setEntryDotColors(colors);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out undefined values before saving
      const definedValues = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== undefined)
      ) as Record<string, number>;
      await saveEntryForDate(selectedDate, definedValues, notes.trim() || undefined, habits);
      // Refresh dot map
      const map = await loadDateKeyMap();
      setEntryDateKeys(new Set(Object.keys(map)));
      // Immediately update the dot color for the selected date
      setEntryDotColors((prev) => {
        const newColors = { ...prev };
        const savedEntry: MoodEntry = {
          id: existingEntryId ?? '',
          date: toDateKey(selectedDate),
          values: definedValues,
          habits,
        };
        newColors[toDateKey(selectedDate)] = computeEntryDotColor(savedEntry, trackedMoodStates, trackedHabits, habitsEnabled);
        return newColors;
      });
      // Force dot color recomputation for other dates if needed
      setDotColorRefreshKey((k) => k + 1);
      Alert.alert('Saved!', 'Your mood has been logged.', [{ text: 'OK' }]);
    } catch {
      Alert.alert('Error', 'Could not save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const habitsEnabled = appSettings.habitsEnabled !== false;
  // Only pass the habits that are actually tracked
  const trackedHabitsRecord = habitsEnabled && trackedHabits.length > 0
    ? Object.fromEntries(trackedHabits.map((k) => [k, habits[k] ?? false]))
    : undefined;
  const enteredMetricsSet = new Set(enteredMetrics);
  if (habitsEntered && habitsEnabled) enteredMetricsSet.add('__habits_entered__');
  // Only tracked metrics should contribute
  const trackedMetricKeys = trackedMoodStates;
  const habitsTracked = habitsEnabled && trackedHabits.length > 0;
  // Filter out undefined values for wellness score calculation
  const definedValuesForScore = Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== undefined)
  ) as Record<string, number>;
  const score = calculateWellnessScore(
    definedValuesForScore,
    trackedHabitsRecord,
    enteredMetricsSet,
    trackedMetricKeys,
    habitsTracked
  );

  const scoreColor = score === -1 ? '#ddd' : wellnessColor(score);
  const sectionBg = isColorful ? paleColor(scoreColor, 0.85) : undefined;
  const scoreLabel = score === -1
    ? '—'
    : appSettings.wellnessLabelMode === 'supportive'
      ? supportiveWellnessLabel(score)
      : wellnessLabel(score);
  const habitScore = calculateHabitScore(habits, trackedHabits);
  const isToday = toDateKey(selectedDate) === toDateKey(new Date());
  const isEditing = !!existingEntryId;

  // Build a map of dateKey -> wellness color for all days with entries
  const [entryDotColors, setEntryDotColors] = useState<{ [key: string]: string }>({});
  useEffect(() => {
    async function computeDotColors() {
      const map = await loadDateKeyMap();
      const colors: { [key: string]: string } = {};
      Object.entries(map).forEach(([dateKey, entry]) => {
        colors[dateKey] = computeEntryDotColor(entry, trackedMoodStates, trackedHabits, habitsEnabled);
      });
      setEntryDotColors(colors);
    }
    computeDotColors();
  }, [entryDateKeys, trackedMoodStates, trackedHabits, habitsEnabled, dotColorRefreshKey]);

  // TEMP: Handler to clear all data
  const handleClearAllData = async () => {
    try {
      await AsyncStorage.clear();
      setEntryDotColors({}); // Reset dot colors in memory
      setEntryDateKeys(new Set()); // Reset entry keys in memory
      Alert.alert('All data cleared', 'The app will now reload.');
      // Optionally reload the app (works in Expo)
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to clear data.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* TEMP: Remove this button after use! */}
        <View style={{ padding: 16 }}>
          <TouchableOpacity onPress={handleClearAllData} style={{ backgroundColor: '#e74c3c', padding: 12, borderRadius: 8 }}>
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Clear ALL Data (Danger)</Text>
          </TouchableOpacity>
        </View>
        {/* Week strip — fixed above the scrollable content */}
        <WeekStrip
          selectedDateKey={toDateKey(selectedDate)}
          entryDateKeys={entryDateKeys}
          entryDotColors={entryDotColors}
          onSelectDate={handleSelectDate}
          liveSelectedDotColor={score === -1 ? undefined : wellnessColor(score)}
        />
        {/* Date heading — fixed below week strip */}
        <View style={styles.fixedHeader}>
          <View style={styles.dateHeading}>
            <Text style={styles.dateHeadingText}>
              {isToday ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
            </Text>
          </View>
        </View>
        {/* Wellness Score banner — pinned under date */}
        <View style={{paddingHorizontal: 16}}>
          <View style={[styles.wellnessBanner, { borderColor: scoreColor }, isColorful && { backgroundColor: sectionBg }]}> 
            <View style={styles.wellnessLeft}>
              <Text style={styles.wellnessTitle}>Wellness Score</Text>
              {score === -1 && (
                <Text style={styles.wellnessSubtitle}>Start entering metrics to see your score</Text>
              )}
            </View>
            <View style={styles.wellnessRight}>
              <Text style={[styles.wellnessScore, { color: scoreColor }]}>{score === -1 ? '—' : score}</Text>
              <Text style={[styles.wellnessLabel, { color: scoreColor }]}>{scoreLabel}</Text>
            </View>
          </View>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mood States */}
          {trackedMoodStates.length > 0 && (
            <View style={[styles.section, { borderColor: scoreColor }, isColorful && { backgroundColor: sectionBg }]}> 
              <Text style={styles.sectionTitle}>Emotional Metrics</Text>
              {/* Removed 'Intensity Scales: 1-10' as requested */}
              {[...POSITIVE_METRICS, ...NEGATIVE_METRICS]
                .filter((metric) => trackedMoodStates.includes(metric.key))
                .map((metric, index, filtered) => (
                  <React.Fragment key={metric.key}>
                    <MoodSlider
                      label={metric.label}
                      value={values[metric.key]}
                      color={metric.color}
                      onChange={(v) => setValue(metric.key, v)}
                      startLabel={METRIC_LABELS[metric.key]?.start}
                      endLabel={METRIC_LABELS[metric.key]?.end}
                    />
                    {index < filtered.length - 1 && <View style={styles.metricDivider} />}
                  </React.Fragment>
                ))}
            </View>
          )}
          {/* Habits */}
          {habitsEnabled && trackedHabits.length > 0 && (
            <View style={[styles.section, { borderColor: scoreColor }, isColorful && { backgroundColor: sectionBg }]}>
              <View style={styles.habitHeader}>
                <Text style={styles.sectionTitle}>Habits</Text>
                <View style={styles.habitScoreBadge}>
                  <Text style={styles.habitScoreText}>{habitScore}%</Text>
                </View>
              </View>
              <Text style={styles.sectionSub}>Build routines that support your well‑being</Text>
              {AVAILABLE_HABITS.filter((h) => trackedHabits.includes(h.key)).map((habit, index, filtered) => {
                const checked = habits[habit.key] === true;
                return (
                  <React.Fragment key={habit.key}>
                    <TouchableOpacity
                      style={styles.habitRow}
                      onPress={() => {
                        setHabits((prev) => ({ ...prev, [habit.key]: !prev[habit.key] }));
                        setHabitsEntered(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.habitCheckbox, checked && styles.habitCheckboxChecked]}>
                        {checked && <Text style={styles.habitCheckmark}>✓</Text>}
                      </View>
                      <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                      <Text style={[styles.habitLabel, checked && styles.habitLabelChecked]}>
                        {habit.label}
                      </Text>
                    </TouchableOpacity>
                    {index < filtered.length - 1 && <View style={styles.habitDivider} />}
                  </React.Fragment>
                );
              })}
            </View>
          )}
          {/* Notes */}
          <View style={[styles.section, { borderColor: scoreColor }]}> 
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="How are you feeling? What's on your mind?"
              placeholderTextColor="#bbb"
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>
          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveText}>
              {saving ? 'Saving…' : isEditing ? 'Update Entry' : 'Save Entry'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    fixedHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    scroll: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    dateHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    dateHeadingText: {
      fontSize: 20,
      fontWeight: '800',
      color: c.textPrimary,
    },
    editingBadge: {
      backgroundColor: '#FF9800',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    editingBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    wellnessBanner: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 2,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: c.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    wellnessLeft: {
      flex: 1,
    },
    wellnessTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: c.textPrimary,
    },
    wellnessSubtitle: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    wellnessRight: {
      alignItems: 'flex-end',
    },
    wellnessScore: {
      fontSize: 48,
      fontWeight: '900',
      lineHeight: 52,
    },
    wellnessLabel: {
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    section: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: c.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      borderWidth: 2,
      // borderColor will be set dynamically
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 2,
    },
    sectionSub: {
      fontSize: 12,
      color: c.textMuted,
      marginBottom: 12,
    },
    metricDivider: {
      height: 1,
      backgroundColor: c.divider,
      marginVertical: 12,
    },
    habitDivider: {
      height: 1,
      backgroundColor: c.divider,
      marginVertical: 8,
    },
    notesInput: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      color: c.textPrimary,
      minHeight: 90,
      backgroundColor: c.inputBg,
    },
    habitHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    habitScoreBadge: {
      backgroundColor: c.accent,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    habitScoreText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    habitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    habitCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.cardAlt,
      marginRight: 10,
    },
    habitCheckboxChecked: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    habitCheckmark: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    habitEmoji: {
      fontSize: 18,
      marginRight: 8,
    },
    habitLabel: {
      fontSize: 15,
      color: c.textPrimary,
      fontWeight: '500',
    },
    habitLabelChecked: {
      color: c.accent,
      fontWeight: '700',
    },
    saveButton: {
      backgroundColor: c.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '700',
    },
    metricLabel: {
      fontSize: 18,
      fontWeight: '700',
    },
    scaleLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
