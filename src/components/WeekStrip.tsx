import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { toDateKey } from '../storage/moodStorage';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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
  onSelectDate: (date: Date) => void;
}

export default function WeekStrip({
  selectedDateKey,
  entryDateKeys,
  onSelectDate,
}: Props) {
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
              style={[styles.dot, isSelected && styles.dotSelected]}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  circleToday: {
    borderColor: '#5B7FFF',
    backgroundColor: '#EEF1FF',
  },
  circleSelected: {
    backgroundColor: '#5B7FFF',
    borderColor: '#5B7FFF',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  dayNumberToday: {
    color: '#5B7FFF',
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: '#fff',
    fontWeight: '800',
  },
  dayLetter: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 4,
    fontWeight: '500',
  },
  dayLetterToday: {
    color: '#5B7FFF',
    fontWeight: '700',
  },
  dayLetterSelected: {
    color: '#5B7FFF',
    fontWeight: '700',
  },
  dotRow: {
    height: 6,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#5B7FFF',
  },
  dotSelected: {
    backgroundColor: '#5B7FFF',
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
});
