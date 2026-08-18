// FILE: mobile/src/navigation/MainTabNavigator.js
// Modern bottom tab — Dark Mode aware footer styling, colored active icons, pill highlight

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Bot,
  ShoppingBag,
  User,
} from 'lucide-react-native';
import DashboardScreen from '../screens/main/DashboardScreen';
import MealLogsScreen from '../screens/main/MealLogsScreen';
import NiaScreen from '../screens/main/NiaScreen';
import StoreScreen from '../screens/main/StoreScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONT_SIZES } from '../constants/theme';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = {
  Dashboard: { Icon: LayoutDashboard, label: 'Home',    color: COLORS.primary },
  MealLogs:  { Icon: UtensilsCrossed, label: 'Meals',   color: '#F59E0B' },
  Nia:       { Icon: Bot,             label: 'Nia AI',  color: '#8B5CF6' },
  Store:     { Icon: ShoppingBag,     label: 'Store',   color: '#0EA5E9' },
  Profile:   { Icon: User,            label: 'Profile', color: '#EC4899' },
};

function TabIcon({ name, focused, isDark }) {
  const cfg = TAB_CONFIG[name];
  if (!cfg) return null;
  const { Icon, color } = cfg;

  return (
    <View style={[tabStyles.iconWrap, focused && { backgroundColor: `${color}1A` }]}>
      <Icon
        size={focused ? 22 : 21}
        color={focused ? color : (isDark ? '#64748B' : '#94A3B8')}
        strokeWidth={focused ? 2.5 : 1.8}
      />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 44,
  },
});

export default function MainTabNavigator() {
  const { isDark, colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: TAB_CONFIG[route.name]?.color || COLORS.primary,
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.xs - 1,
          fontWeight: '700',
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 82 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bgCard,
          elevation: 16,
          shadowColor: isDark ? '#000000' : '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.35 : 0.07,
          shadowRadius: 16,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} isDark={isDark} />
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="MealLogs"
        component={MealLogsScreen}
        options={{ tabBarLabel: 'Meals' }}
      />
      <Tab.Screen
        name="Nia"
        component={NiaScreen}
        options={{ tabBarLabel: 'Nia AI' }}
      />
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        options={{ tabBarLabel: 'Store' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
