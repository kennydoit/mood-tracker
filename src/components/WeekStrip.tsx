import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { toDateKey } from '../utils/dateUtils';
import { useTheme, ThemeColors } from '../theme';

const DAY_LETTERS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
const ITEM_WIDTH = 44;
const ITEM_MARGIN = 5;
const DAYS_BACK = 89; // show 90 days total (today = index 89)

interface DayItem {
  date: Date;
  dateKey: string;
  dayNumber: number;
  dayLetter: string;
  isToday: boolean;
}

function buildDays(): DayItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: DayItem[] = [];
  for (let i = DAYS_BACK; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      date: d,
      dateKey: toDateKey(d),
      dayNumber: d.getDate(),
      dayLetter: DAY_LETTERS[d.getDay()],
      isToday: i === 0,
    });
  }
  return days;
}

interface Props {
  selectedDateKey: string;
  entryDateKeys: Set<string>;
  entryDotColors?: Record<string, string>;
  onSelectDate: (date: Date) => void;
  liveSelectedDotColor?: string;
}
export function WeekStrip({
  selectedDateKey,
  entryDateKeys,
  entryDotColors = {},
  onSelectDate,
  liveSelectedDotColor,
}: Props) {
  const theme = useTheme();
  const { colors, mode } = theme;
  const styles = makeStyles(colors, mode);
  const days = buildDays();
  const listRef = useRef<FlatList>(null);

  // On mount scroll to today (last item)
  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const renderItem = ({ item }: { item: DayItem }) => {
    const isSelected = item.dateKey === selectedDateKey;
    const hasEntry = entryDateKeys.has(item.dateKey);

    // Use dynamic color if available
    let dotColor = entryDotColors[item.dateKey] || '#ddd';
    // If this is the selected date, use the live color if provided
    if (item.dateKey === selectedDateKey && liveSelectedDotColor) {
      dotColor = liveSelectedDotColor;
    }
    return (
      <TouchableOpacity
        style={styles.dayWrapper}
        onPress={() => onSelectDate(item.date)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.circle,
            item.isToday && !isSelected && styles.circleToday,
            isSelected && styles.circleSelected,
          ]}
        >
          <Text
            style={[
              styles.dayNumber,
              item.isToday && !isSelected && styles.dayNumberToday,
              isSelected && styles.dayNumberSelected,
            ]}
          >
            {item.dayNumber}
          </Text>
        </View>
        <Text
          style={[
            styles.dayLetter,
            item.isToday && styles.dayLetterToday,
            isSelected && styles.dayLetterSelected,
          ]}
        >
          {item.dayLetter}
        </Text>
        {/* Entry dot */}
        <View style={styles.dotRow}>
          {hasEntry ? (
            <View
              style={[
                styles.dot,
                // Always use wellness color, never accent, even if selected
                { backgroundColor: dotColor },
              ]}
            />
          ) : (
            <View style={styles.dotPlaceholder} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={days}
        keyExtractor={(item) => item.dateKey}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + ITEM_MARGIN * 2,
          offset: (ITEM_WIDTH + ITEM_MARGIN * 2) * index,
          index,
        })}
      />
    </View>
  );
}

function makeStyles(c: ThemeColors, mode?: string) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.card,
      paddingVertical: 10, // Restore to original, space is now below dot
      borderBottomWidth: 1,
      borderBottomColor: c.borderLight,
    },
    list: {
      paddingHorizontal: 8,
    },
    dayWrapper: {
      alignItems: 'center',
      marginHorizontal: ITEM_MARGIN,
      width: ITEM_WIDTH,
    },
    circle: {
      width: ITEM_WIDTH,
      height: ITEM_WIDTH,
      borderRadius: ITEM_WIDTH / 2,
      backgroundColor: c.cardAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    circleToday: {
      borderColor: c.accent,
      backgroundColor: c.accentBg,
    },
    circleSelected: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    dayNumber: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textSecondary,
    },
    dayNumberToday: {
      color: c.accent,
      fontWeight: '700',
    },
    dayNumberSelected: {
      color: '#fff', // Always white for visibility on solid accent
      fontWeight: '800',
    },
    dayLetter: {
      fontSize: 11,
      color: c.textHint,
      marginTop: 4,
      fontWeight: '500',
    },
    dayLetterToday: {
      color: c.accent,
      fontWeight: '700',
    },
    dayLetterSelected: {
      color: c.accent,
      fontWeight: '700',
    },
    dotRow: {
      height: 16,
      marginTop: 2,
      marginBottom: 8, // Add space below the dot to prevent truncation
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      // backgroundColor is set dynamically
    },
    dotPlaceholder: {
      width: 10,
      height: 10,
    },
  });
}
