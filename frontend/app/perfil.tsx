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
  Linking,
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

const PRIVACY_URL = 'https://sites.google.com/view/migalleria-privacidad';
const TERMS_URL = 'https://sites.google.com/view/migalleria-terminos';
const SUPPORT_URL = 'https://sites.google.com/view/migalleria-soporte'; // 🔥 NUEVO

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingGalleria, setEditingGalleria] = useState(user?.nombre || '');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Error', 'No se pudo abrir el enlace.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Ocurrió un error al abrir el enlace.');
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      setShowLogoutConfirm(true);
    } else {
      Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: confirmLogout },
      ]);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;

    Alert.alert(
      'Eliminar cuenta',
      'Esta acción eliminará tu cuenta permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAccount(true);
              await api.delete('/auth/delete-account');
              await logout();
              router.replace('/(auth)/login');
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la cuenta');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Mi Perfil' }} />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

          {/* LEGAL */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>

            <TouchableOpacity style={styles.actionItem} onPress={() => openUrl(PRIVACY_URL)}>
              <View style={styles.actionIcon}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Política de Privacidad</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => openUrl(TERMS_URL)}>
              <View style={styles.actionIcon}>
                <Ionicons name="document-outline" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Términos y Condiciones</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>

            {/* 🔥 BOTÓN SOPORTE */}
            <TouchableOpacity style={styles.actionItem} onPress={() => openUrl(SUPPORT_URL)}>
              <View style={styles.actionIcon}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Soporte</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>
          </View>

          {/* LOGOUT */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteContainer} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Eliminar cuenta permanentemente</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  content: { padding: 16 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, color: '#555', marginBottom: 12 },

  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionIcon: { marginRight: 12 },
  actionText: { flex: 1 },

  logoutButton: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#ef4444' },

  deleteContainer: { marginTop: 10, alignItems: 'center' },
  deleteText: { color: '#ef4444', textDecorationLine: 'underline' },
});