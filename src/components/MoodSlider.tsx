import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface Props {
  label: string;
  value: number;
  color: string;
  onChange: (value: number) => void;
}

export default function MoodSlider({ label, value, color, onChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.valueText, { color }]}>{value}</Text>
      </View>
      <View style={styles.buttonRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const selected = n === value;
          return (
            <TouchableOpacity
              key={n}
              onPress={() => onChange(n)}
              style={[
                styles.numButton,
                selected && { backgroundColor: color, borderColor: color },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.numText, selected && styles.numTextSelected]}>
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>Not at all</Text>
        <Text style={styles.scaleLabel}>Extremely</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  numText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  numTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  scaleLabel: {
    fontSize: 10,
    color: '#aaa',
  },
});
