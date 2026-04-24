import React from 'react';
import { Platform, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface TabIconProps {
  name: string;
  size: number;
  color: string;
}

/**
 * Cross-platform tab icon component
 * Uses emoji on web (where vector-icons fonts don't load),
 * and actual Ionicon names on native platforms
 */
export default function TabIcon({ name, size, color }: TabIconProps) {
  if (Platform.OS === 'web') {
    // Use emoji icons for web since vector-icons fonts don't load reliably
    const emojiMap: Record<string, string> = {
      'heart': '❤️',
      'heart-outline': '🤍',
      'book': '📖',
      'book-outline': '📕',
      'trending-up': '📈',
      'settings': '⚙️',
      'settings-outline': '⚙️',
    };

    const emoji = emojiMap[name] || '•';
    return (
      <Text
        style={{
          fontSize: size,
          color,
          lineHeight: size,
        }}
      >
        {emoji}
      </Text>
    );
  }

  // On native platforms, use vector-icons
  return <Ionicons name={name} size={size} color={color} />;
}
