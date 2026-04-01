import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { loadEntriesSorted } from '../storage/moodStorage';
import { POSITIVE_METRICS, NEGATIVE_METRICS } from '../constants/moods';
import { MoodEntry, MoodMetric } from '../types';
import { calculateWellnessScore, wellnessColor } from '../utils/wellness';
import { useTheme, ThemeColors } from '../theme';

const WELLNESS_KEY = 'wellness';
const ALL_METRICS = [...POSITIVE_METRICS, ...NEGATIVE_METRICS];
const SCREEN_WIDTH = Dimensions.get('window').width;

function MetricChart({
  metric,
  entries,
}: {
  metric: MoodMetric | { key: string; label: string; color: string };
  entries: MoodEntry[];
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const isWellness = metric.key === WELLNESS_KEY;

  const relevant = entries
    .filter((e) =>
      isWellness
        ? true
        : e.values[metric.key] !== undefined,
    )
    .slice(0, 14)
    .reverse();

  if (relevant.length < 2) {
    return (
      <View style={styles.chartPlaceholder}>
        <Text style={styles.placeholderText}>Not enough data yet (need 2+ entries)</Text>
      </View>
    );
  }

  const chartData = isWellness
    ? relevant.map((e) => calculateWellnessScore(e.values, e.habits, new Set(Object.keys(e.values))))
    : relevant.map((e) => e.values[metric.key]);

  const data = {
    labels: relevant.map((e) => format(new Date(e.date), 'M/d')),
    datasets: [
      {
        data: chartData,
        color: () => metric.color,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <LineChart
      data={data}
      width={SCREEN_WIDTH - 40}
      height={160}
      yAxisSuffix={isWellness ? '' : ''}
      yAxisInterval={1}
      fromZero
      segments={isWellness ? 10 : 5}
      chartConfig={{
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        decimalPlaces: 0,
        color: () => metric.color,
        labelColor: () => colors.textMuted,
        propsForDots: { r: '4', strokeWidth: '2', stroke: metric.color },
        propsForBackgroundLines: { stroke: colors.borderLight },
      }}
      bezier
      style={styles.chartStyle}
    />
  );
}

export default function TrendsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>(WELLNESS_KEY);

  useFocusEffect(
    useCallback(() => {
      loadEntriesSorted().then(setEntries);
    }, []),
  );

  const isWellness = selectedKey === WELLNESS_KEY;
  const selectedMetric = isWellness
    ? { key: WELLNESS_KEY, label: 'Wellness Score', color: '#00BCD4' }
    : ALL_METRICS.find((m) => m.key === selectedKey)!;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Wellness Score selector (top, prominent) */}
      <TouchableOpacity
        onPress={() => setSelectedKey(WELLNESS_KEY)}
        style={[
          styles.wellnessChip,
          isWellness && styles.wellnessChipActive,
        ]}
        activeOpacity={0.8}
      >
        <Text style={[styles.wellnessChipText, isWellness && styles.wellnessChipTextActive]}>
          🌿 Wellness Score
        </Text>
        <Text style={[styles.wellnessChipSub, isWellness && { color: '#fff' }]}>
          Weighted average of all metrics
        </Text>
      </TouchableOpacity>

      {/* Individual metric selectors */}
      <Text style={styles.sectionLabel}>Positive</Text>
      <View style={styles.chipRow}>
        {POSITIVE_METRICS.map((m) => {
          const active = m.key === selectedKey;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => setSelectedKey(m.key)}
              style={[
                styles.metricChip,
                active && { backgroundColor: m.color, borderColor: m.color },
              ]}
            >
              <Text style={[styles.metricChipText, active && styles.metricChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Negative</Text>
      <View style={styles.chipRow}>
        {NEGATIVE_METRICS.map((m) => {
          const active = m.key === selectedKey;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => setSelectedKey(m.key)}
              style={[
                styles.metricChip,
                active && { backgroundColor: m.color, borderColor: m.color },
              ]}
            >
              <Text style={[styles.metricChipText, active && styles.metricChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: selectedMetric.color }]}>
          {selectedMetric.label} — Last 14 Entries
        </Text>
        <MetricChart metric={selectedMetric} entries={entries} />
      </View>

      {/* Stats */}
      {entries.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Stats for {selectedMetric.label}</Text>
          {(() => {
            const vals = isWellness
              ? entries.map((e) => calculateWellnessScore(e.values, e.habits, new Set(Object.keys(e.values))))
              : entries.map((e) => e.values[selectedKey]).filter((v) => v !== undefined);
            if (vals.length === 0) return null;
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            const max = Math.max(...vals);
            const min = Math.min(...vals);
            return (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{avg.toFixed(isWellness ? 0 : 1)}</Text>
                  <Text style={styles.statLabel}>Average</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: selectedMetric.color }]}>{max}</Text>
                  <Text style={styles.statLabel}>Highest</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{min}</Text>
                  <Text style={styles.statLabel}>Lowest</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{vals.length}</Text>
                  <Text style={styles.statLabel}>Entries</Text>
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 40 },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
      marginTop: 8,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 4,
    },
    metricChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    metricChipText: {
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: '500',
    },
    metricChipTextActive: {
      color: '#fff',
      fontWeight: '700',
    },
    chartCard: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 14,
      marginTop: 16,
      shadowColor: c.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    chartTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 10,
    },
    chartStyle: {
      borderRadius: 8,
      marginLeft: -8,
    },
    chartPlaceholder: {
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontSize: 13,
      color: c.textHint,
      fontStyle: 'italic',
    },
    statsCard: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 14,
      marginTop: 12,
      shadowColor: c.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    statsTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      color: c.textSecondary,
    },
    statLabel: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    wellnessChip: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: '#00BCD4',
      padding: 14,
      marginBottom: 14,
      shadowColor: c.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    wellnessChipActive: {
      backgroundColor: '#00BCD4',
    },
    wellnessChipText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#00BCD4',
    },
    wellnessChipTextActive: {
      color: '#fff',
    },
    wellnessChipSub: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 1,
    },
  });
}
