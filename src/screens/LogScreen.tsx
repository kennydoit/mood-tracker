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
import { POSITIVE_METRICS, NEGATIVE_METRICS } from '../constants/moods';
import MoodSlider from '../components/MoodSlider';
import WeekStrip from '../components/WeekStrip';
import {
  loadEntryForDate,
  loadDateKeyMap,
  saveEntryForDate,
  toDateKey,
} from '../storage/moodStorage';
import { calculateWellnessScore, wellnessColor, wellnessLabel } from '../utils/wellness';

const defaultValues = (): Record<string, number> => {
  const vals: Record<string, number> = {};
  [...POSITIVE_METRICS, ...NEGATIVE_METRICS].forEach((m) => {
    vals[m.key] = 5;
  });
  return vals;
};

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function LogScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(todayMidnight());
  const [entryDateKeys, setEntryDateKeys] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, number>>(defaultValues());
  const [notes, setNotes] = useState('');
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [showNegative, setShowNegative] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reload the dot-map whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDateKeyMap().then((map) => setEntryDateKeys(new Set(Object.keys(map))));
    }, []),
  );

  // Whenever selected date changes, load that day's entry (or reset to defaults)
  useEffect(() => {
    loadEntryForDate(selectedDate).then((entry) => {
      if (entry) {
        setValues(entry.values);
        setNotes(entry.notes ?? '');
        setExistingEntryId(entry.id);
      } else {
        setValues(defaultValues());
        setNotes('');
        setExistingEntryId(null);
      }
    });
  }, [selectedDate]);

  const setValue = (key: string, val: number) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveEntryForDate(selectedDate, values, notes.trim() || undefined);
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

  const score = calculateWellnessScore(values);
  const scoreColor = wellnessColor(score);
  const scoreLabel = wellnessLabel(score);
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date heading */}
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

        {/* Wellness Score banner */}
        <View style={[styles.wellnessBanner, { borderColor: scoreColor }]}>
          <View style={styles.wellnessLeft}>
            <Text style={styles.wellnessTitle}>Wellness Score</Text>
            <Text style={styles.wellnessSubtitle}>Weighted average of all metrics</Text>
          </View>
          <View style={styles.wellnessRight}>
            <Text style={[styles.wellnessScore, { color: scoreColor }]}>{score}</Text>
            <Text style={[styles.wellnessLabel, { color: scoreColor }]}>{scoreLabel}</Text>
          </View>
        </View>

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
              />
            ))}
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

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#fafafa',
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
    color: '#111',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
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
    color: '#111',
  },
  wellnessSubtitle: {
    fontSize: 11,
    color: '#aaa',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 12,
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 12,
  },
  toggleText: {
    fontSize: 15,
    color: '#5B7FFF',
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#333',
    minHeight: 90,
    backgroundColor: '#fafafa',
  },
  saveButton: {
    backgroundColor: '#5B7FFF',
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
