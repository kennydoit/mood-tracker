// Imports remain as originally intended, remove misplaced JSX and duplicate imports
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
import { AVAILABLE_HABITS, POSITIVE_METRICS, NEGATIVE_METRICS } from '../constants/moods';
import { loadTrackedHabits, saveTrackedHabits } from '../storage/habitSettings';
import { loadTrackedMoodStates, saveTrackedMoodStates } from '../storage/moodStateSettings';
import { loadAppSettings, saveAppSettings, AppSettings } from '../storage/settings';
import { useTheme } from '../theme';
import type { ThemeColors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

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
  const isLightMode = colors.bg === '#fafafa';
  const styles = makeStyles(colors);
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: false,
    hour: 20,
    minute: 0,
  });
  const [trackedHabits, setTrackedHabits] = useState<string[]>([]);
  const [expandedHabits, setExpandedHabits] = useState(false);
  const [expandedMoods, setExpandedMoods] = useState(false);
  const [trackedMoodStates, setTrackedMoodStates] = useState<string[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ wellnessLabelMode: 'default', habitsEnabled: false, habitScoringMethod: 'standard', emotionalMetricScoring: 'default' });

  useFocusEffect(
    useCallback(() => {
      setExpandedHabits(false); // Collapse 'Habits to Track' on focus
      setExpandedMoods(false); // Collapse 'Emotional Metrics to Track' on focus
      loadReminderSettings().then(setSettings);
      loadTrackedHabits().then(setTrackedHabits);
      loadTrackedMoodStates().then(setTrackedMoodStates);
      loadAppSettings().then(setAppSettings);
    }, []),
  );

  const handleHabitToggle = async (key: string) => {
    const updated = trackedHabits.includes(key)
      ? trackedHabits.filter((k) => k !== key)
      : [...trackedHabits, key];
    setTrackedHabits(updated);
    await saveTrackedHabits(updated);
  };

  const handleMoodStateToggle = async (key: string) => {
    const isSelected = trackedMoodStates.includes(key);
    if (isSelected && trackedMoodStates.length === 1) {
      Alert.alert(
        'At least one required',
        'You must track at least one emotional metric.',
      );
      return;
    }
    const updated = isSelected
      ? trackedMoodStates.filter((k) => k !== key)
      : [...trackedMoodStates, key];
    setTrackedMoodStates(updated);
    await saveTrackedMoodStates(updated);
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

  const handleWellnessLabelToggle = async (value: boolean) => {
    const updated: AppSettings = { ...appSettings, wellnessLabelMode: value ? 'supportive' : 'default' };
    setAppSettings(updated);
    await saveAppSettings(updated);
  };

  const handleHabitsEnabledToggle = async (value: boolean) => {
    const updated: AppSettings = { ...appSettings, habitsEnabled: value };
    setAppSettings(updated);
    await saveAppSettings(updated);
  };

  const handleHabitScoringMethodToggle = async (value: boolean) => {
    const updated: AppSettings = { ...appSettings, habitScoringMethod: value ? 'intent' : 'standard' };
    setAppSettings(updated);
    await saveAppSettings(updated);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Reminder toggle */}

      {/* Emotional Metric Scoring Method */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Emotional Metric Scoring</Text>
            <Text style={styles.rowSub}>
              {appSettings.emotionalMetricScoring === 's-curve'
                ? 'S-curve: Uses a sigmoid function for scoring emotional metrics.'
                : 'Default: Linear scoring for emotional metrics.'}
            </Text>
          </View>
          <Switch
            value={appSettings.emotionalMetricScoring === 's-curve'}
            onValueChange={async (value: boolean) => {
              const updated = { ...appSettings, emotionalMetricScoring: value ? 's-curve' as 's-curve' : 'default' as 'default' };
              setAppSettings(updated);
              await saveAppSettings(updated);
            }}
            trackColor={{ false: '#ddd', true: '#5B7FFF' }}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
          />
        </View>
      </View>
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

      {/* Colorful Mode Toggle */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Colorful Mode</Text>
            <Text style={styles.rowSub}>
              {mode === 'colorful' ? 'Sections use pale highlight colors' : 'Sections use neutral backgrounds'}
            </Text>
          </View>
          <Switch
            value={mode === 'colorful'}
            onValueChange={(value) => setMode(value ? 'colorful' : 'light')}
            trackColor={{ false: '#ddd', true: '#5B7FFF' }}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
          />
        </View>
      </View>

      {/* Emotional Metrics to Track */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setExpandedMoods(!expandedMoods)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.dropdownTitle}>Emotional Metrics to Track</Text>
            <Text style={styles.rowSub}>Positive and negative metrics to track</Text>
          </View>
          <Text style={styles.dropdownArrow}>{expandedMoods ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {expandedMoods && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.moodSectionLabel}>Positive</Text>
            {POSITIVE_METRICS.map((metric, index, arr) => {
              const isSelected = trackedMoodStates.includes(metric.key);
              return (
                <React.Fragment key={metric.key}>
                  <TouchableOpacity
                    style={styles.habitRow}
                    onPress={() => handleMoodStateToggle(metric.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.colorDot, { backgroundColor: metric.color }]} />
                    <Text style={styles.habitLabel}>{metric.label}</Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  {index < arr.length - 1 && <View style={styles.moodDivider} />}
                </React.Fragment>
              );
            })}
            <Text style={[styles.moodSectionLabel, { marginTop: 12 }]}>Negative</Text>
            {NEGATIVE_METRICS.map((metric, index, arr) => {
              const isSelected = trackedMoodStates.includes(metric.key);
              return (
                <React.Fragment key={metric.key}>
                  <TouchableOpacity
                    style={styles.habitRow}
                    onPress={() => handleMoodStateToggle(metric.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.colorDot, { backgroundColor: metric.color }]} />
                    <Text style={styles.habitLabel}>{metric.label}</Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  {index < arr.length - 1 && <View style={styles.moodDivider} />}
                </React.Fragment>
              );
            })}
          </View>
        )}
      </View>



      {/* Habits Tracking Toggle */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Track Habits</Text>
            <Text style={styles.rowSub}>
              {appSettings.habitsEnabled
                ? 'Habits will be included in your wellness score.'
                : 'Habits are optional and not included in your wellness score.'}
            </Text>
          </View>
          <Switch
            value={appSettings.habitsEnabled}
            onValueChange={handleHabitsEnabledToggle}
            trackColor={{ false: '#ddd', true: '#5B7FFF' }}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
          />
        </View>
      </View>

      {/* Habit Scoring Method */}
      {appSettings.habitsEnabled && (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Habit Scoring Method</Text>
              <Text style={styles.rowSub}>
                {appSettings.habitScoringMethod === 'intent'
                  ? 'Intent mode: tap once for half credit (intent), again for full credit (done).'
                  : 'Standard mode: habits are either done or not done.'}
              </Text>
            </View>
            <Switch
              value={appSettings.habitScoringMethod === 'intent'}
              onValueChange={handleHabitScoringMethodToggle}
              trackColor={{ false: '#ddd', true: '#5B7FFF' }}
              thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
            />
          </View>
        </View>
      )}

      {/* Habits to Track */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setExpandedHabits(!expandedHabits)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.dropdownTitle}>Habits to Track</Text>
            <Text style={styles.rowSub}>Select which habits you want to log each day</Text>
          </View>
          <Text style={styles.dropdownArrow}>{expandedHabits ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {expandedHabits && (
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
        )}
      </View>

      {/* Wellness Label Mode Toggle */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Use Wellness Labels</Text>
            <Text style={styles.rowSub}>
              {appSettings.wellnessLabelMode === 'default'
                ? 'Default: Very Low, Low, Moderate, High, Very High'
                : 'Supportive: Needing Support, Below Baseline, Steady, Strong, Flourishing'}
            </Text>
          </View>
          <Switch
            value={appSettings.wellnessLabelMode === 'supportive'}
            onValueChange={handleWellnessLabelToggle}
            trackColor={{ false: '#ddd', true: '#5B7FFF' }}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
          />
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
    dropdownHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    dropdownTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 4,
    },
    dropdownArrow: {
      fontSize: 16,
      color: c.textMuted,
      marginLeft: 8,
    },
    moodSectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    colorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    moodDivider: {
      height: 1,
      backgroundColor: c.divider,
      marginVertical: 8,
    },
  });
}
