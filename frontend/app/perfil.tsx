import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';

// Color palette
const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  greenDark: '#1a5d3a',
  greenLight: 'rgba(26, 93, 58, 0.15)',
  redDeep: '#8b1a1a',
  redLight: 'rgba(139, 26, 26, 0.15)',
  grayDark: '#1a1a1a',
  grayMedium: '#2a2a2a',
  grayLight: '#6b7280',
  white: '#ffffff',
  background: '#0a0a0a',
};

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const formatPhoneNumber = (phone: string | undefined) => {
    if (!phone) return 'No registrado';
    return phone;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Mi Perfil',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.white,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={50} color={COLORS.gold} />
            </View>
            <Text style={styles.userName}>{user?.nombre || 'Criador'}</Text>
            <Text style={styles.userRole}>Criador de Gallos de Pelea</Text>
          </View>

          {/* User Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="call" size={20} color={COLORS.gold} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{formatPhoneNumber(user?.phone_number)}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="mail" size={20} color={COLORS.gold} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Correo Electrónico</Text>
                  <Text style={styles.infoValue}>{user?.email || 'No registrado'}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="person" size={20} color={COLORS.gold} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nombre</Text>
                  <Text style={styles.infoValue}>{user?.nombre || 'No registrado'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración</Text>
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="create" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Editar Perfil</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="lock-closed" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Cambiar PIN</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="sync" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Sincronizar Datos</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="download" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Exportar Datos (PDF/CSV)</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={22} color={COLORS.redDeep} />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appName}>Castador Pro</Text>
            <Text style={styles.appVersion}>Versión 1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.gold,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.gold,
    marginTop: 4,
    fontWeight: '500',
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.grayLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  // Info Card
  infoCard: {
    backgroundColor: COLORS.grayDark,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.grayLight,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.grayMedium,
    marginHorizontal: 14,
  },
  // Action Items
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.white,
    marginLeft: 14,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redLight,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.redDeep,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.redDeep,
  },
  // App Info
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  appVersion: {
    fontSize: 13,
    color: COLORS.grayLight,
    marginTop: 4,
  },
});
