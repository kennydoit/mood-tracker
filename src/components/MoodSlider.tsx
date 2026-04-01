import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme, ThemeColors } from '../theme';

interface Props {
  label: string;
  value: number | undefined;
  color: string;
  onChange: (value: number | undefined) => void;
  startLabel?: string;
  endLabel?: string;
}

export default function MoodSlider({ label, value, color, onChange, startLabel = 'Not at all', endLabel = 'Extremely' }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {value !== undefined && <Text style={[styles.valueText, { color }]}>{value}</Text>}
      </View>
      <View style={styles.buttonRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n, index) => {
          const selected = n === value;
          return (
            <View key={n} style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => onChange(selected ? undefined : n)}
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
              {index < 9 && <View style={styles.divider} />}
            </View>
          );
        })}
      </View>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>{startLabel}</Text>
        <Text style={styles.scaleLabel}>{endLabel}</Text>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
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
      color: c.textPrimary,
    },
    valueText: {
      fontSize: 18,
      fontWeight: '700',
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    buttonContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    numButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 0,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.cardAlt,
    },
    divider: {
      height: 16,
      width: 1,
      backgroundColor: c.divider,
      marginLeft: 4,
    },
    numText: {
      fontSize: 12,
      color: c.textSecondary,
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
      color: c.textMuted,
    },
  });
}
