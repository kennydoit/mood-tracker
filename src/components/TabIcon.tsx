import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface TabIconProps {
  name: string;
  size: number;
  color: string;
}

/**
 * Tab icon component using Ionicons vector graphics
 * Renders consistent outline-style icons across all platforms
 */
export default function TabIcon({ name, size, color }: TabIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
