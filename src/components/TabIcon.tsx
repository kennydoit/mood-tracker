import React from 'react';
import { Platform, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface TabIconProps {
  name: string;
  size: number;
  color: string;
}

/**
 * Tab icon component using outline-style vector graphics
 * Uses emoji on web (where vector-icons fonts don't load),
 * and Ionicons on native platforms
 */
export default function TabIcon({ name, size, color }: TabIconProps) {
  if (Platform.OS === 'web') {
    // Use outline-style emoji for web
    const emojiMap: Record<string, string> = {
      'heart-outline': '❤️',
      'book-outline': '📖',
      'trending-up': '📈',
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
