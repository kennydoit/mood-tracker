import React from 'react';
import { Text } from 'react-native';

interface TabIconProps {
  name: string;
  size: number;
  color: string;
}

/**
 * Tab icon component using emoji
 * Works reliably across all platforms (web, iOS, Android)
 */
export default function TabIcon({ name, size, color }: TabIconProps) {
  // Use outline-style emoji for all platforms
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
