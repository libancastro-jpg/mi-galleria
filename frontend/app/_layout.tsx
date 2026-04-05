import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const API_URL = 'https://mi-galleria-backend.onrender.com/api';

// URL de la app en cada tienda
const STORE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/id6760793399'
    : 'market://details?id=com.migalleria.app';

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();

  // ── Check de versión al abrir la app ──────────────────────
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch(`${API_URL}/app/version`);
        if (!res.ok) return;

        const data = await res.json();

        const currentVersion: string =
          Constants.expoConfig?.version ?? '0.0.0';

        const parseVersion = (v: string) =>
          v.split('.').map(Number);

        const [cMaj, cMin, cPat] = parseVersion(currentVersion);
        const [mMaj, mMin, mPat] = parseVersion(data.minimum_version ?? '0.0.0');

        const isBelowMinimum =
          cMaj < mMaj ||
          (cMaj === mMaj && cMin < mMin) ||
          (cMaj === mMaj && cMin === mMin && cPat < mPat);

        if (data.force_update && isBelowMinimum) {
          // Modal BLOQUEANTE — no se puede cerrar
          Alert.alert(
            '🔄 Actualización requerida',
            data.message ||
              'Hay una nueva versión disponible. Debes actualizar para continuar.',
            [
              {
                text: 'Actualizar ahora',
                onPress: () => Linking.openURL(STORE_URL),
              },
            ],
            { cancelable: false }
          );
        } else if (isBelowMinimum) {
          // Modal opcional — se puede ignorar
          Alert.alert(
            '✨ Nueva versión disponible',
            data.message || 'Hay una actualización disponible con mejoras.',
            [
              { text: 'Ahora no', style: 'cancel' },
              {
                text: 'Actualizar',
                onPress: () => Linking.openURL(STORE_URL),
              },
            ]
          );
        }
      } catch {
        // Si falla el check, la app sigue funcionando normal
      }
    };

    checkVersion();
  }, []);
  // ── Fin check de versión ──────────────────────────────────

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' },
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
