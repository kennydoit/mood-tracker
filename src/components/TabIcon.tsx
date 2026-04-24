import React from 'react';
import { Platform, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface TabIconProps {
  name: string;
  size: number;
  color: string;
}

/**
 * Tab icon component using Ionicons on mobile, emoji on web
 */
export default function TabIcon({ name, size, color }: TabIconProps) {
  if (Platform.OS === 'web') {
    // Use outline-style emoji for web since vector-icons fonts don't load
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

  // On mobile (iOS/Android), use Ionicons vector graphics
  return <Ionicons name={name} size={size} color={color} />;
}
