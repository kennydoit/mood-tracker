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
import { POSITIVE_METRICS, NEGATIVE_METRICS } from '../constants/moods';

const ALL_METRICS = [...POSITIVE_METRICS, ...NEGATIVE_METRICS];

function EntryCard({
  entry,
  onDelete,
}: {
  entry: MoodEntry;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.date);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardDate}>{format(date, 'EEEE, MMM d yyyy')}</Text>
          <Text style={styles.cardTime}>{format(date, 'h:mm a')}</Text>
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
        </>
      )}
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
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

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fafafa',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    color: '#111',
  },
  cardTime: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 1,
  },
  deleteIcon: {
    fontSize: 14,
    color: '#bbb',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipLabel: {
    fontSize: 9,
    color: '#aaa',
    textTransform: 'uppercase',
  },
  chipValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  emptySubText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 6,
  },
});
