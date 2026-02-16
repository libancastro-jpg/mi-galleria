import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

export default function AjustesScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.get('/sync/download');
      setSyncStatus('synced');
      Alert.alert('Éxito', 'Datos sincronizados correctamente');
    } catch (error: any) {
      setSyncStatus('pending');
      Alert.alert('Error', error.message || 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

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

  const MenuItem = ({
    icon,
    label,
    value,
    onPress,
    danger,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.menuIcon,
          danger && styles.menuIconDanger,
        ]}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? '#ef4444' : '#f59e0b'}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
          {label}
        </Text>
        {value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ajustes</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={32} color="#f59e0b" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.nombre || 'Sin nombre'}
              </Text>
              <Text style={styles.profilePhone}>{user?.telefono}</Text>
              {user?.email && (
                <Text style={styles.profileEmail}>{user.email}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => router.push('/profile/edit')}>
              <Ionicons name="pencil" size={20} color="#f59e0b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sincronización</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSync}
              disabled={syncing}
            >
              <View style={styles.menuIcon}>
                {syncing ? (
                  <ActivityIndicator size="small" color="#f59e0b" />
                ) : (
                  <Ionicons name="sync" size={20} color="#f59e0b" />
                )}
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Sincronizar Ahora</Text>
                <Text style={styles.menuValue}>
                  {syncing
                    ? 'Sincronizando...'
                    : syncStatus === 'synced'
                    ? 'Sincronizado'
                    : 'Toca para sincronizar'}
                </Text>
              </View>
              {syncStatus === 'synced' && (
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="download-outline"
              label="Exportar Datos"
              value="CSV, PDF"
              onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="cloud-upload-outline"
              label="Backup"
              value="Último: Hoy"
              onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="information-circle-outline"
              label="Versión"
              value="1.0.0"
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="help-circle-outline"
              label="Ayuda"
              onPress={() => Alert.alert('Ayuda', 'Contacta a soporte para obtener ayuda')}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              label="Cerrar Sesión"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Castador Pro</Text>
          <Text style={styles.footerSubtext}>Gestión de Gallos de Pelea</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  profilePhone: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: '#fff',
  },
  menuLabelDanger: {
    color: '#ef4444',
  },
  menuValue: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: 68,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  footerSubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
});
