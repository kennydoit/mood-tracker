import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { MoodEntry } from '../types';
import { loadEntriesSorted, deleteEntry } from '../storage/moodStorage';
import { POSITIVE_METRICS, NEGATIVE_METRICS, AVAILABLE_HABITS } from '../constants/moods';
import { calculateWellnessScore, calculateHabitScore, wellnessColor, wellnessLabel } from '../utils/wellness';
import { useTheme, ThemeColors } from '../theme';

const ALL_METRICS = [...POSITIVE_METRICS, ...NEGATIVE_METRICS];

function EntryCard({
  entry,
  onDelete,
}: {
  entry: MoodEntry;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.date);
  const score = calculateWellnessScore(entry.values, entry.habits);
  const scoreColor = wellnessColor(score);
  const scoreLabel = wellnessLabel(score);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: scoreColor, borderLeftWidth: 4 }]}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardDate}>{format(date, 'EEEE, MMM d yyyy')}</Text>
          <Text style={styles.cardTime}>{format(date, 'h:mm a')}</Text>
        </View>
        <View style={styles.wellnessBadge}>
          <Text style={[styles.wellnessBadgeScore, { color: scoreColor }]}>{score}</Text>
          <Text style={[styles.wellnessBadgeLabel, { color: scoreColor }]}>{scoreLabel}</Text>
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 8 }}>
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Quick summary row – positive avg */}
      <View style={styles.summaryRow}>
        {POSITIVE_METRICS.map((m) => (
          <View key={m.key} style={styles.chip}>
            <Text style={styles.chipLabel}>{m.label.slice(0, 3)}</Text>
            <Text style={[styles.chipValue, { color: m.color }]}>
              {entry.values[m.key] ?? '-'}
            </Text>
          </View>
        ))}
      </View>

      {expanded && (
        <>
          <View style={styles.divider} />
          <Text style={styles.groupLabel}>Negative States</Text>
          <View style={styles.summaryRow}>
            {NEGATIVE_METRICS.map((m) => (
              <View key={m.key} style={styles.chip}>
                <Text style={styles.chipLabel}>{m.label.slice(0, 3)}</Text>
                <Text style={[styles.chipValue, { color: m.color }]}>
                  {entry.values[m.key] ?? '-'}
                </Text>
              </View>
            ))}
          </View>
          {entry.notes ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{entry.notes}</Text>
            </>
          ) : null}
          {entry.habits && Object.keys(entry.habits).length > 0 ? (() => {
            const trackedKeys = AVAILABLE_HABITS.filter((h) => entry.habits![h.key] !== undefined).map((h) => h.key);
            const habitScore = calculateHabitScore(entry.habits, trackedKeys);
            const checkedHabits = AVAILABLE_HABITS.filter((h) => entry.habits![h.key] === true);
            const uncheckedHabits = AVAILABLE_HABITS.filter(
              (h) => entry.habits![h.key] === false,
            );
            return (
              <>
                <View style={styles.divider} />
                <View style={styles.habitsHeader}>
                  <Text style={styles.groupLabel}>Habits</Text>
                  <Text style={styles.habitScore}>{habitScore}% ({checkedHabits.length}/{trackedKeys.length})</Text>
                </View>
                <View style={styles.habitChips}>
                  {checkedHabits.map((h) => (
                    <View key={h.key} style={styles.habitChipOn}>
                      <Text style={styles.habitChipText}>{h.emoji} {h.label}</Text>
                    </View>
                  ))}
                  {uncheckedHabits.map((h) => (
                    <View key={h.key} style={styles.habitChipOff}>
                      <Text style={styles.habitChipTextOff}>{h.emoji} {h.label}</Text>
                    </View>
                  ))}
                </View>
              </>
            );
          })() : null}
        </>
      )}
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const data = await loadEntriesSorted();
    setEntries(data);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(id);
          load();
        },
      },
    ]);
  };

  if (entries.length === 0 && !refreshing) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No entries yet.</Text>
        <Text style={styles.emptySubText}>Log your mood from the Home tab!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <EntryCard entry={item} onDelete={() => handleDelete(item.id)} />
      )}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={load} />
      }
    />
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    list: {
      padding: 16,
      paddingBottom: 32,
      backgroundColor: c.bg,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      shadowColor: c.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    wellnessBadge: {
      alignItems: 'flex-end',
      marginRight: 4,
    },
    wellnessBadgeScore: {
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 24,
    },
    wellnessBadgeLabel: {
      fontSize: 9,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    cardDate: {
      fontSize: 15,
      fontWeight: '700',
      color: c.textPrimary,
    },
    cardTime: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 1,
    },
    deleteIcon: {
      fontSize: 14,
      color: c.textHint,
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      alignItems: 'center',
      backgroundColor: c.cardAlt,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    chipLabel: {
      fontSize: 9,
      color: c.textMuted,
      textTransform: 'uppercase',
    },
    chipValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    divider: {
      height: 1,
      backgroundColor: c.borderLight,
      marginVertical: 10,
    },
    groupLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textHint,
      marginBottom: 6,
    },
    notesLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textHint,
      marginBottom: 4,
    },
    notesText: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 18,
    },
    habitsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    habitScore: {
      fontSize: 12,
      fontWeight: '700',
      color: c.accent,
    },
    habitChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    habitChipOn: {
      backgroundColor: c.accentBg,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: c.accent,
    },
    habitChipText: {
      fontSize: 12,
      color: c.accent,
      fontWeight: '600',
    },
    habitChipOff: {
      backgroundColor: c.cardAlt,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    habitChipTextOff: {
      fontSize: 12,
      color: c.textHint,
      fontWeight: '500',
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.bg,
      padding: 32,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
    },
    emptySubText: {
      fontSize: 14,
      color: c.textMuted,
      marginTop: 6,
    },
  });
}
