import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useResponsiveLayout } from '../utils/screenUtils';

interface ResponsiveContainerProps {
  children: ReactNode;
}

export default function ResponsiveContainer({ children }: ResponsiveContainerProps) {
  const { screenWidth, containerMaxWidth, paddingHorizontal } = useResponsiveLayout();

  const containerWidth =
    screenWidth <= containerMaxWidth
      ? screenWidth - paddingHorizontal * 2
      : containerMaxWidth;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: containerWidth,
      alignSelf: 'center',
    },
  });

  return <View style={styles.container}>{children}</View>;
}
