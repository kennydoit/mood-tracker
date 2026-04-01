import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ReminderSettings,
  loadReminderSettings,
  saveReminderSettings,
  scheduleDailyReminder,
  requestPermissions,
} from '../notifications/reminderService';
import { AVAILABLE_HABITS } from '../constants/moods';
import { loadTrackedHabits, saveTrackedHabits } from '../storage/habitSettings';
import { useTheme, ThemeColors, ThemeMode } from '../theme';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatTime(hour: number, minute: number) {
  const ampm = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${pad(minute)} ${ampm}`;
}

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = makeStyles(colors);
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: false,
    hour: 20,
    minute: 0,
  });
  const [trackedHabits, setTrackedHabits] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadReminderSettings().then(setSettings);
      loadTrackedHabits().then(setTrackedHabits);
    }, []),
  );

  const handleHabitToggle = async (key: string) => {
    const updated = trackedHabits.includes(key)
      ? trackedHabits.filter((k) => k !== key)
      : [...trackedHabits, key];
    setTrackedHabits(updated);
    await saveTrackedHabits(updated);
  };

  const handleToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please allow notifications in your device settings to receive daily reminders.',
        );
        return;
      }
    }
    const updated = { ...settings, enabled: value };
    setSettings(updated);
    await saveReminderSettings(updated);
    await scheduleDailyReminder(updated);
  };

  const handleHourChange = async (hour: number) => {
    const updated = { ...settings, hour };
    setSettings(updated);
    await saveReminderSettings(updated);
    if (updated.enabled) await scheduleDailyReminder(updated);
  };

  const handleMinuteChange = async (minute: number) => {
    const updated = { ...settings, minute };
    setSettings(updated);
    await saveReminderSettings(updated);
    if (updated.enabled) await scheduleDailyReminder(updated);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Reminder toggle */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Daily Reminder</Text>
            <Text style={styles.rowSub}>
              Get a notification to log your mood each day
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#ddd', true: '#5B7FFF' }}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
          />
        </View>
      </View>

      {/* Time picker */}
      {settings.enabled && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reminder Time</Text>
          <Text style={styles.timeDisplay}>
            {formatTime(settings.hour, settings.minute)}
          </Text>

          <Text style={styles.pickerLabel}>Hour</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerRow}>
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() => handleHourChange(h)}
                  style={[
                    styles.pickerChip,
                    settings.hour === h && styles.pickerChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      settings.hour === h && styles.pickerChipTextActive,
                    ]}
                  >
                    {pad(h)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.pickerLabel, { marginTop: 12 }]}>Minute</Text>
          <View style={styles.pickerRow}>
            {MINUTES.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => handleMinuteChange(m)}
                style={[
                  styles.pickerChip,
                  settings.minute === m && styles.pickerChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.pickerChipText,
                    settings.minute === m && styles.pickerChipTextActive,
                  ]}
                >
                  :{pad(m)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Appearance */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Dark Mode</Text>
            <Text style={styles.rowSub}>
              {mode === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
            </Text>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={(value) => setMode(value ? 'dark' : 'light')}
            trackColor={{ false: '#ddd', true: '#5B7FFF' }}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
          />
        </View>
      </View>

      {/* Habits to Track */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Habits to Track</Text>
        <Text style={styles.rowSub}>Select which habits you want to log each day</Text>
        <View style={{ marginTop: 12 }}>
          {AVAILABLE_HABITS.map((habit) => {
            const isSelected = trackedHabits.includes(habit.key);
            return (
              <TouchableOpacity
                key={habit.key}
                style={styles.habitRow}
                onPress={() => handleHabitToggle(habit.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                <Text style={styles.habitLabel}>{habit.label}</Text>
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.aboutText}>Mood Tracker v1.0</Text>
        <Text style={styles.aboutSub}>
          Track your daily emotional and physical wellbeing. All data is stored
          locally on your device.
        </Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 40 },
    card: {
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textPrimary,
    },
    rowSub: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 10,
    },
    timeDisplay: {
      fontSize: 32,
      fontWeight: '300',
      color: c.accent,
      textAlign: 'center',
      marginBottom: 16,
    },
    pickerLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    pickerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    pickerChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.cardAlt,
    },
    pickerChipActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    pickerChipText: {
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: '500',
    },
    pickerChipTextActive: {
      color: '#fff',
      fontWeight: '700',
    },
    aboutText: {
      fontSize: 15,
      color: c.textSecondary,
      fontWeight: '600',
    },
    aboutSub: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 4,
      lineHeight: 18,
    },
    habitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.cardAlt,
    },
    habitEmoji: {
      fontSize: 20,
      width: 32,
    },
    habitLabel: {
      flex: 1,
      fontSize: 15,
      color: c.textSecondary,
      fontWeight: '500',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.cardAlt,
    },
    checkboxActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    checkmark: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
