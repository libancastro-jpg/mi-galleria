import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { RoosterIcon } from '../../src/components/BirdIcons';

// Color palette
const COLORS = {
  gold: '#d4a017',
  grayDark: '#141414',
  grayMedium: '#2a2a2a',
  grayLight: '#6b7280',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.grayDark,
          borderTopColor: COLORS.grayMedium,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.grayLight,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="aves"
        options={{
          title: 'Aves',
          tabBarIcon: ({ color, size }) => (
            <RoosterIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cuido"
        options={{
          title: 'Cuido',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="timer" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="peleas"
        options={{
          title: 'Peleas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Salud',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cruces"
        options={{
          title: 'Cruces',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-merge" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
