import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTheme } from '../theme';

import LogScreen from '../screens/LogScreen';
import HistoryScreen from '../screens/HistoryScreen';
import TrendsScreen from '../screens/TrendsScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootTabParamList = {
  Log: undefined;
  History: undefined;
  Trends: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const icons: Record<string, string> = {
  Log: '📝',
  History: '📋',
  Trends: '📈',
  Settings: '⚙️',
};

export default function AppNavigator() {
  const { mode, colors } = useTheme();
  const navTheme = mode === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.bg, card: colors.card, border: colors.borderLight } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.card, border: colors.borderLight } };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 19, opacity: focused ? 1 : 0.7 }}>
              {icons[route.name]}
            </Text>
          ),
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.borderLight,
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: colors.card,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: colors.textPrimary,
          },
        })}
      >
        <Tab.Screen name="Log" component={LogScreen} options={{ title: "Today's Mood" }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
        <Tab.Screen name="Trends" component={TrendsScreen} options={{ title: 'Trends' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
