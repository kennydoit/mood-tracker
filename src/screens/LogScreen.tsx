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
import WeekStrip from '../components/WeekStrip';
import {
  loadEntryForDate,
  loadDateKeyMap,
  saveEntryForDate,
} from '../storage/moodStorage';
import { loadTrackedHabits } from '../storage/habitSettings';
import { toDateKey } from '../utils/dateUtils';
import { calculateWellnessScore, calculateHabitScore, wellnessColor, wellnessLabel } from '../utils/wellness';
import { useTheme, ThemeColors } from '../theme';

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
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [selectedDate, setSelectedDate] = useState<Date>(todayMidnight());
  const [entryDateKeys, setEntryDateKeys] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, number | undefined>>(defaultValues());
  const [notes, setNotes] = useState('');
  const [habits, setHabits] = useState<Record<string, boolean>>({});
  const [trackedHabits, setTrackedHabits] = useState<string[]>([]);
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [showNegative, setShowNegative] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enteredMetrics, setEnteredMetrics] = useState<string[]>([]);
  const [habitsEntered, setHabitsEntered] = useState(false);

  // Reload the dot-map and tracked habits whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDateKeyMap().then((map) => setEntryDateKeys(new Set(Object.keys(map))));
      loadTrackedHabits().then(setTrackedHabits);
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
    setSelectedDate(date);
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
      Alert.alert('Saved!', 'Your mood has been logged.', [{ text: 'OK' }]);
    } catch {
      Alert.alert('Error', 'Could not save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Only pass the habits that are actually tracked
  const trackedHabitsRecord = trackedHabits.length > 0
    ? Object.fromEntries(trackedHabits.map((k) => [k, habits[k] ?? false]))
    : undefined;
  const enteredMetricsSet = new Set(enteredMetrics);
  if (habitsEntered) enteredMetricsSet.add('__habits_entered__');
  // Filter out undefined values for wellness score calculation
  const definedValuesForScore = Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== undefined)
  ) as Record<string, number>;
  const score = calculateWellnessScore(definedValuesForScore, trackedHabitsRecord, enteredMetricsSet);
  const scoreColor = score === -1 ? '#ddd' : wellnessColor(score);
  const scoreLabel = score === -1 ? '—' : wellnessLabel(score);
  const habitScore = calculateHabitScore(habits, trackedHabits);
  const isToday = toDateKey(selectedDate) === toDateKey(new Date());
  const isEditing = !!existingEntryId;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Week strip — fixed above the scrollable content */}
      <WeekStrip
        selectedDateKey={toDateKey(selectedDate)}
        entryDateKeys={entryDateKeys}
        onSelectDate={handleSelectDate}
      />

      {/* Date heading — fixed below week strip */}
      <View style={styles.fixedHeader}>
        <View style={styles.dateHeading}>
          <Text style={styles.dateHeadingText}>
            {isToday ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
          </Text>
          {isEditing && (
            <View style={styles.editingBadge}>
              <Text style={styles.editingBadgeText}>Editing</Text>
            </View>
          )}
        </View>

        {/* Wellness Score banner — pinned under date */}
        <View style={[styles.wellnessBanner, { borderColor: scoreColor }]}>
          <View style={styles.wellnessLeft}>
            <Text style={styles.wellnessTitle}>Wellness Score</Text>
            <Text style={styles.wellnessSubtitle}>{score === -1 ? 'Start entering metrics to see your score' : 'Weighted average of all metrics'}</Text>
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
        {/* Positive section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Positive States</Text>
          <Text style={styles.sectionSub}>1 = Not at all · 10 = Extremely</Text>
          {POSITIVE_METRICS.map((metric) => (
            <MoodSlider
              key={metric.key}
              label={metric.label}
              value={values[metric.key]}
              color={metric.color}
              onChange={(v) => setValue(metric.key, v)}
              startLabel={METRIC_LABELS[metric.key]?.start}
              endLabel={METRIC_LABELS[metric.key]?.end}
            />
          ))}
        </View>

        {/* Negative section toggle */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowNegative((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleText}>
            {showNegative ? '▲ Hide Negative States' : '▼ Track Negative States'}
          </Text>
        </TouchableOpacity>

        {showNegative && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Negative States</Text>
            <Text style={styles.sectionSub}>1 = Not at all · 10 = Extremely</Text>
            {NEGATIVE_METRICS.map((metric) => (
              <MoodSlider
                key={metric.key}
                label={metric.label}
                value={values[metric.key]}
                color={metric.color}
                onChange={(v) => setValue(metric.key, v)}
                startLabel={METRIC_LABELS[metric.key]?.start}
                endLabel={METRIC_LABELS[metric.key]?.end}
              />
            ))}
          </View>
        )}

        {/* Habits */}
        {trackedHabits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.habitHeader}>
              <Text style={styles.sectionTitle}>Habits</Text>
              <View style={styles.habitScoreBadge}>
                <Text style={styles.habitScoreText}>{habitScore}%</Text>
              </View>
            </View>
            <Text style={styles.sectionSub}>Check off what you did today</Text>
            {AVAILABLE_HABITS.filter((h) => trackedHabits.includes(h.key)).map((habit) => {
              const checked = habits[habit.key] === true;
              return (
                <TouchableOpacity
                  key={habit.key}
                  style={styles.habitRow}
                  onPress={() => {
                    setHabits((prev) => ({ ...prev, [habit.key]: !prev[habit.key] }));
                    // Mark habits as explicitly entered when user interacts with them
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
              );
            })}
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
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
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    fixedHeader: {
      backgroundColor: c.bg,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    scroll: {
      flex: 1,
      backgroundColor: c.bg,
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
    toggleButton: {
      alignItems: 'center',
      paddingVertical: 10,
      marginBottom: 12,
    },
    toggleText: {
      fontSize: 15,
      color: c.accent,
      fontWeight: '600',
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
      borderBottomWidth: 1,
      borderBottomColor: c.borderLight,
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
  });
}
