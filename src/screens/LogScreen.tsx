import React, { useState } from 'react';
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
import { POSITIVE_METRICS, NEGATIVE_METRICS } from '../constants/moods';
import MoodSlider from '../components/MoodSlider';
import { createEntry, saveEntry } from '../storage/moodStorage';

const defaultValues = (): Record<string, number> => {
  const vals: Record<string, number> = {};
  [...POSITIVE_METRICS, ...NEGATIVE_METRICS].forEach((m) => {
    vals[m.key] = 5;
  });
  return vals;
};

export default function LogScreen() {
  const [values, setValues] = useState<Record<string, number>>(defaultValues());
  const [notes, setNotes] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [saving, setSaving] = useState(false);

  const setValue = (key: string, val: number) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const entry = createEntry(values, notes.trim() || undefined);
      await saveEntry(entry);
      Alert.alert('Saved!', 'Your mood has been logged.', [{ text: 'OK' }]);
      setValues(defaultValues());
      setNotes('');
    } catch {
      Alert.alert('Error', 'Could not save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Entry'}</Text>
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
