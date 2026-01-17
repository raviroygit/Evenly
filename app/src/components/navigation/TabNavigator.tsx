import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { HomeScreen } from '../../features/home/HomeScreen';
import { GroupsScreen } from '../../features/groups/GroupsScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';

export type TabParamList = {
  Home: undefined;
  Groups: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  const { colors, theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Groups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'android' 
            ? (theme === 'dark' ? '#1A1A1A' : '#FFFFFF')
            : (theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'),
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'android' ? 12 : 8,
          paddingTop: Platform.OS === 'android' ? 12 : 8,
          height: Platform.OS === 'android' ? 80 : 88,
          elevation: Platform.OS === 'android' ? 8 : 0,
          shadowColor: Platform.OS === 'android' ? '#000' : undefined,
          shadowOffset: Platform.OS === 'android' ? { width: 0, height: -2 } : undefined,
          shadowOpacity: Platform.OS === 'android' ? 0.1 : undefined,
          shadowRadius: Platform.OS === 'android' ? 4 : undefined,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarLabel: 'Groups',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};
