import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '../utils/screenUtils';

interface ResponsiveContainerProps {
  children: ReactNode;
}

export default function ResponsiveContainer({ children }: ResponsiveContainerProps) {
  const { screenWidth, shouldConstrainWidth, containerMaxWidth, paddingHorizontal } =
    useResponsiveLayout();

  const containerWidth =
    screenWidth <= containerMaxWidth
      ? screenWidth - paddingHorizontal * 2
      : containerMaxWidth;

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      width: containerWidth,
      alignSelf: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}
