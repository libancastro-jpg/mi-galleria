import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

export default function ResetScreen() {
  const router = useRouter();

  useEffect(() => {
    const clearAll = async () => {
      try {
        // Clear AsyncStorage
        await AsyncStorage.clear();
        
        // For web, also clear localStorage
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        console.log('Session cleared successfully');
        
        // Wait a moment then redirect
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 1500);
      } catch (error) {
        console.error('Error clearing session:', error);
        router.replace('/(auth)/login');
      }
    };

    clearAll();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F5A623" />
      <Text style={styles.text}>Limpiando sesión...</Text>
      <Text style={styles.subtext}>Serás redirigido al login</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
  subtext: {
    color: '#a0a0a0',
    fontSize: 14,
    marginTop: 8,
  },
});
