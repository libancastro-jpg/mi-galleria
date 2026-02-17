import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { api } from '../src/services/api';

// Color palette
const COLORS = {
  gold: '#F5A623',
  goldLight: 'rgba(245, 166, 35, 0.15)',
  greenDark: '#22c55e',
  greenLight: 'rgba(34, 197, 94, 0.15)',
  redDeep: '#ef4444',
  redLight: 'rgba(239, 68, 68, 0.15)',
  grayDark: '#f5f5f5',
  grayMedium: '#e0e0e0',
  grayLight: '#555555',
  white: '#ffffff',
  background: '#f5f5f5',
};

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  
  // Estados para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingGalleria, setEditingGalleria] = useState(user?.nombre || '');
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    // En web, usar modal personalizado en lugar de Alert
    if (Platform.OS === 'web') {
      setShowLogoutConfirm(true);
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que quieres cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: confirmLogout,
          },
        ]
      );
    }
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSaveGalleria = async () => {
    if (!editingGalleria.trim()) {
      Alert.alert('Error', 'El nombre de la galleria no puede estar vacío');
      return;
    }

    setSaving(true);
    try {
      await api.put('/auth/profile', { nombre: editingGalleria.trim() });
      if (refreshUser) {
        await refreshUser();
      }
      setShowEditModal(false);
      if (Platform.OS !== 'web') {
        Alert.alert('Éxito', 'Galleria actualizada correctamente');
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        console.error('Error:', error.message);
      } else {
        Alert.alert('Error', error.message || 'No se pudo actualizar');
      }
    } finally {
      setSaving(false);
    }
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
              <Ionicons name="arrow-back" size={24} color="#d4a017" />
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
            <Text style={styles.userName}>{user?.nombre || 'Mi Galleria'}</Text>
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
              
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => {
                  setEditingGalleria(user?.nombre || '');
                  setShowEditModal(true);
                }}
              >
                <View style={styles.infoIcon}>
                  <Ionicons name="home" size={20} color={COLORS.gold} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Galleria</Text>
                  <Text style={styles.infoValue}>{user?.nombre || 'No registrado'}</Text>
                </View>
                <Ionicons name="create-outline" size={20} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración</Text>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => {
                setEditingGalleria(user?.nombre || '');
                setShowEditModal(true);
              }}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="create" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Editar Galleria</Text>
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

      {/* Modal para editar Galleria */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Editar Galleria</Text>
            
            <Text style={styles.modalLabel}>Nombre de la Galleria</Text>
            <TextInput
              style={styles.modalInput}
              value={editingGalleria}
              onChangeText={setEditingGalleria}
              placeholder="Ej: Galleria El Campeón"
              placeholderTextColor={COLORS.grayLight}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSaveGalleria}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.modalConfirmText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de Logout (para web) */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.logoutModalIcon}>
              <Ionicons name="log-out" size={40} color={COLORS.redDeep} />
            </View>
            <Text style={styles.modalTitle}>Cerrar Sesión</Text>
            <Text style={styles.logoutModalText}>
              ¿Estás seguro de que quieres cerrar sesión?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: COLORS.redDeep }]}
                onPress={confirmLogout}
              >
                <Text style={styles.modalConfirmText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    color: '#1a1a1a',
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
    color: '#1a1a1a',
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
    color: '#1a1a1a',
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: COLORS.grayDark,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: COLORS.grayLight,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.grayMedium,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.grayMedium,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.grayLight,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  logoutModalIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutModalText: {
    fontSize: 14,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginBottom: 24,
  },
});
