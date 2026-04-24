import React from 'react';
import { Platform, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface TabIconProps {
  name: string;
  size: number;
  color: string;
}

// SVG icon components for web
const HeartOutlineIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BookOutlineIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const TrendingUpIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 17" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const SettingsOutlineIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
  </svg>
);

export default function TabIcon({ name, size, color }: TabIconProps) {
  if (Platform.OS === 'web') {
    // Use SVG icons for web
    const iconMap: Record<string, React.FC<{ size: number; color: string }>> = {
      'heart-outline': HeartOutlineIcon,
      'book-outline': BookOutlineIcon,
      'trending-up': TrendingUpIcon,
      'settings-outline': SettingsOutlineIcon,
    };

    const IconComponent = iconMap[name];
    return IconComponent ? <IconComponent size={size} color={color} /> : <View />;
  }

  // On mobile (iOS/Android), use Ionicons vector graphics
  return <Ionicons name={name} size={size} color={color} />;
}
