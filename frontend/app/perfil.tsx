import React, { useEffect, useMemo, useState } from 'react';
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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { api } from '../src/services/api';

const COLORS = {
  gold: '#F5A623',
  goldLight: 'rgba(245, 166, 35, 0.15)',
  greenDark: '#22c55e',
  redDeep: '#ef4444',
  redLight: 'rgba(239, 68, 68, 0.15)',
  grayDark: '#111827',
  grayMedium: '#6b7280',
  grayLight: '#9ca3af',
  grayBorder: '#e5e7eb',
  white: '#ffffff',
  background: '#f5f5f5',
  card: '#ffffff',
  blue: '#2563eb',
};

const PRIVACY_URL = 'https://sites.google.com/view/migalleria-privacidad';
const TERMS_URL = 'https://sites.google.com/view/migalleria-terminos';
const SUPPORT_URL = 'https://sites.google.com/view/migalleria-soporte';

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  tipo?: string;
  color?: string;
  linea?: string;
  estado?: string;
  fecha_nacimiento?: string;
  notas?: string;
  padre_id?: string;
  madre_id?: string;
  padre_externo?: string;
  madre_externo?: string;
}

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [editingGalleria, setEditingGalleria] = useState(user?.nombre || '');
  const [editingEmail, setEditingEmail] = useState(user?.email || '');
  const [editingPhone, setEditingPhone] = useState(user?.telefono || '');

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [aves, setAves] = useState<Ave[]>([]);
  const [loadingAves, setLoadingAves] = useState(false);
  const [searchPlaca, setSearchPlaca] = useState('');
  const [selectedAves, setSelectedAves] = useState<string[]>([]);


  useEffect(() => {
    setEditingGalleria(user?.nombre || '');
    setEditingEmail(user?.email || '');
    setEditingPhone(user?.telefono || '');
  }, [user]);

  useEffect(() => {
    refreshUser?.();
  }, [refreshUser]);


  const userPhone = useMemo(() => {
    return user?.telefono || 'No disponible';
  }, [user]);

  const userEmail = useMemo(() => {
    return user?.email || 'No disponible';
  }, [user]);

  const userName = useMemo(() => {
    return user?.nombre || 'Mi Galleria';
  }, [user]);

  const plan: 'gratis' | 'premium' = user?.plan === 'premium' ? 'premium' : 'gratis';

  const filteredAves = useMemo(() => {
    const term = searchPlaca.trim().toLowerCase();

    if (!term) return aves;

    return aves.filter((ave) => {
      const codigo = ave.codigo?.toLowerCase() || '';
      const nombre = ave.nombre?.toLowerCase() || '';
      const color = ave.color?.toLowerCase() || '';
      const linea = ave.linea?.toLowerCase() || '';

      return (
        codigo.includes(term) ||
        nombre.includes(term) ||
        color.includes(term) ||
        linea.includes(term)
      );
    });
  }, [aves, searchPlaca]);

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

  const handleSaveProfile = async () => {
    const nombre = editingGalleria.trim();
    const email = editingEmail.trim();
    const telefono = editingPhone.trim();

    if (!nombre) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'El correo no puede estar vacío.');
      return;
    }

    if (!telefono) {
      Alert.alert('Error', 'El teléfono no puede estar vacío.');
      return;
    }

    try {
      setSaving(true);
      await api.put('/auth/profile', {
        nombre,
        email,
        telefono,
      });
      await refreshUser?.();
      setShowEditModal(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePin = async () => {
    if (!currentPin.trim() || !newPin.trim() || !confirmPin.trim()) {
      Alert.alert('Error', 'Completa todos los campos.');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'La confirmación del PIN no coincide.');
      return;
    }

    if (newPin.length < 4) {
      Alert.alert('Error', 'El nuevo PIN debe tener al menos 4 dígitos.');
      return;
    }

    try {
      setSaving(true);
      await api.put('/auth/change-pin', {
        current_pin: currentPin,
        new_pin: newPin,
      });

      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setShowPinModal(false);

      Alert.alert('Éxito', 'PIN actualizado correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo cambiar el PIN.');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await api.post('/sync/upload');
      await api.post('/sync/download');
      Alert.alert('Éxito', 'Sincronización completada.');
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        'No se pudo sincronizar la información.';
      Alert.alert('Error', message);
    } finally {
      setSyncing(false);
    }
  };

  const loadAvesForExport = async () => {
    try {
      setLoadingAves(true);
      setSearchPlaca('');
      setSelectedAves([]);

      try {
        await api.post('/sync/upload');
        await api.post('/sync/download');
      } catch {
        // seguimos aunque sync falle
      }

      const result = await api.get('/aves', {
        limit: '200',
      });

      const rawArray: any[] = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      const normalizedAves: Ave[] = rawArray
        .map((item: any) => ({
          id: String(item?.id || item?._id || ''),
          codigo: String(item?.codigo || ''),
          nombre: item?.nombre || '',
          tipo: item?.tipo || '',
          color: item?.color || '',
          linea: item?.linea || '',
          estado: item?.estado || '',
          fecha_nacimiento: item?.fecha_nacimiento || '',
          notas: item?.notas || '',
          padre_id: item?.padre_id || '',
          madre_id: item?.madre_id || '',
          padre_externo: item?.padre_externo || '',
          madre_externo: item?.madre_externo || '',
        }))
        .filter((ave: Ave) => ave.id || ave.codigo || ave.nombre);

      setAves(normalizedAves);
      setShowExportModal(true);

      if (!normalizedAves.length) {
        Alert.alert('Aviso', 'No se encontraron aves para exportar.');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.detail || 'No se pudo cargar la lista de aves.';
      Alert.alert('Error', message);
    } finally {
      setLoadingAves(false);
    }
  };

  const getParentName = (id?: string, externo?: string) => {
    if (externo) return externo;

    const ave = aves.find((a) => a.id === id);
    if (!ave) return 'N/D';

    return ave.nombre ? `${ave.codigo} - ${ave.nombre}` : ave.codigo || 'N/D';
  };

  const formatAveText = (ave: Ave) => {
    return [
      `Placa: ${ave.codigo || 'N/D'}`,
      `Nombre: ${ave.nombre || 'N/D'}`,
      `Tipo: ${ave.tipo || 'N/D'}`,
      `Color: ${ave.color || 'N/D'}`,
      `Línea: ${ave.linea || 'N/D'}`,
      `Estado: ${ave.estado || 'N/D'}`,
      `Padre: ${getParentName(ave.padre_id, ave.padre_externo)}`,
      `Madre: ${getParentName(ave.madre_id, ave.madre_externo)}`,
      `Fecha de nacimiento: ${ave.fecha_nacimiento || 'N/D'}`,
      `Notas: ${ave.notas || 'N/D'}`,
    ].join('\n');
  };

  const toggleSelectAve = (id: string) => {
    setSelectedAves((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const exportSelectedAves = async () => {
    try {
      if (!selectedAves.length) {
        Alert.alert('Aviso', 'Selecciona al menos una ave.');
        return;
      }

      setExporting(true);

      const avesToExport = aves.filter((a) => selectedAves.includes(a.id));

      const content = avesToExport
        .map((ave, i) => `AVE ${i + 1}\n${formatAveText(ave)}`)
        .join('\n\n------------------\n\n');

      await Share.share({
        title: 'Exportar seleccionadas',
        message: content,
      });

      setSelectedAves([]);
      setShowExportModal(false);
      setSearchPlaca('');
    } catch {
      Alert.alert('Error', 'No se pudo exportar.');
    } finally {
      setExporting(false);
    }
  };

  const exportAllAves = async () => {
    try {
      if (!aves.length) {
        Alert.alert('Aviso', 'No hay aves registradas para exportar.');
        return;
      }

      setExporting(true);

      const content = aves
        .map((ave, index) => `AVE ${index + 1}\n${formatAveText(ave)}`)
        .join('\n\n-----------------------------\n\n');

      await Share.share({
        title: 'Exportar todas las aves',
        message: `Listado completo de aves registradas\n\n${content}`,
      });

      setShowExportModal(false);
      setSearchPlaca('');
      setSelectedAves([]);
    } catch {
      Alert.alert('Error', 'No se pudo exportar la información.');
    } finally {
      setExporting(false);
    }
  };

  const exportSingleAve = async (ave: Ave) => {
    try {
      setExporting(true);

      const content = `Ficha individual del ave\n\n${formatAveText(ave)}`;

      await Share.share({
        title: `Ave ${ave.codigo || ''}`,
        message: content,
      });

      setShowExportModal(false);
      setSearchPlaca('');
      setSelectedAves([]);
    } catch {
      Alert.alert('Error', 'No se pudo exportar el ave.');
    } finally {
      setExporting(false);
    }
  };

  const handleExport = async () => {
    await loadAvesForExport();
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      await logout();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      setShowLogoutConfirm(true);
      return;
    }

    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: confirmLogout,
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;

    Alert.alert(
      'Eliminar cuenta',
      'Esta acción eliminará tu cuenta y toda tu información permanentemente.',
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
              Alert.alert('Error', 'No se pudo eliminar la cuenta.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const renderActionItem = (
    icon: keyof typeof Ionicons.glyphMap,
    iconColor: string,
    title: string,
    onPress: () => void,
    loading?: boolean
  ) => (
    <TouchableOpacity
      style={styles.actionItem}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={loading}
    >
      <View style={styles.actionLeft}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.actionText}>{title}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.gold} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Mi Perfil',
          headerShadowVisible: false,
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 5 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={34} color={COLORS.gold} />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileSubtext}>Teléfono: {userPhone}</Text>
              <Text style={styles.profileSubtext}>Correo: {userEmail}</Text>
            </View>
          </View>

          {plan === 'premium' ? (
            <TouchableOpacity
              style={[styles.premiumCard, styles.premiumCardActive]}
              onPress={() => router.push('/premium' as any)}
              activeOpacity={0.9}
            >
              <Text style={[styles.premiumTitle, styles.premiumTitleActive]}>
                👑 NIVEL ELITE ACTIVO
              </Text>

              <View style={[styles.premiumInnerButton, styles.premiumInnerButtonActive]}>
                <Text style={styles.premiumInnerButtonText}>
                  ACCESO COMPLETO DESBLOQUEADO
                </Text>
              </View>

              <Text style={[styles.premiumSubtext, styles.premiumSubtextActive]}>
                Disfruta todas las funciones sin límites
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.premiumCard}
              onPress={() => router.push('/premium' as any)}
              activeOpacity={0.9}
            >
              <Text style={styles.premiumTitle}>Mi Membresía</Text>

              <View style={styles.premiumInnerButton}>
                <Text style={styles.premiumInnerButtonText}>
                  👑SUBE A NIVEL ELITE👑
                </Text>
              </View>

              <Text style={styles.premiumSubtext}>
                Acceso completo + Más registros, + más funciones
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuenta</Text>

            {renderActionItem(
              'create-outline',
              COLORS.gold,
              'Editar perfil',
              () => setShowEditModal(true)
            )}

            {renderActionItem(
              'lock-closed-outline',
              COLORS.gold,
              'Cambiar PIN',
              () => setShowPinModal(true)
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos</Text>

            {renderActionItem(
              'sync-outline',
              COLORS.greenDark,
              'Sincronizar información',
              handleSync,
              syncing
            )}

            {renderActionItem(
              'download-outline',
              COLORS.greenDark,
              'Exportar datos',
              handleExport,
              exporting || loadingAves
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>

            {renderActionItem(
              'document-text-outline',
              COLORS.gold,
              'Política de Privacidad',
              () => openUrl(PRIVACY_URL)
            )}

            {renderActionItem(
              'document-outline',
              COLORS.gold,
              'Términos y Condiciones',
              () => openUrl(TERMS_URL)
            )}

            {renderActionItem(
              'help-circle-outline',
              COLORS.gold,
              'Soporte',
              () => openUrl(SUPPORT_URL)
            )}
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteContainer}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator size="small" color={COLORS.redDeep} />
            ) : (
              <Text style={styles.deleteText}>Eliminar cuenta permanentemente</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar perfil</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={editingGalleria}
              onChangeText={setEditingGalleria}
              placeholderTextColor="#9ca3af"
            />

            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={editingEmail}
              onChangeText={setEditingEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />

            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              value={editingPhone}
              onChangeText={setEditingPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowEditModal(false)}
                disabled={saving}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cambiar PIN</Text>

            <TextInput
              style={styles.input}
              placeholder="PIN actual"
              value={currentPin}
              onChangeText={setCurrentPin}
              secureTextEntry
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />

            <TextInput
              style={styles.input}
              placeholder="Nuevo PIN"
              value={newPin}
              onChangeText={setNewPin}
              secureTextEntry
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar nuevo PIN"
              value={confirmPin}
              onChangeText={setConfirmPin}
              secureTextEntry
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowPinModal(false)}
                disabled={saving}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleChangePin}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showExportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.exportModalCard]}>
            <Text style={styles.modalTitle}>Exportar aves</Text>

            <View style={styles.exportHeaderActions}>
              <View style={styles.selectedInfoBox}>
                <Text style={styles.selectedInfoLabel}>Seleccionadas</Text>
                <Text style={styles.selectedInfoCount}>{selectedAves.length}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.sendSelectedButton,
                  (exporting || selectedAves.length === 0) && styles.disabledButton,
                ]}
                onPress={exportSelectedAves}
                disabled={exporting || selectedAves.length === 0}
              >
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.sendSelectedButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.exportAllButton}
              onPress={exportAllAves}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.exportAllButtonText}>Exportar todas las aves</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.exportSectionLabel}>Exportar individual</Text>

            <TextInput
              style={styles.input}
              placeholder="Buscar por número de placa"
              value={searchPlaca}
              onChangeText={setSearchPlaca}
              placeholderTextColor="#9ca3af"
            />

            <ScrollView
              style={styles.exportList}
              contentContainerStyle={styles.exportListContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredAves.length === 0 ? (
                <Text style={styles.emptyExportText}>
                  No se encontraron aves con esa búsqueda.
                </Text>
              ) : (
                filteredAves.map((ave) => {
                  const selected = selectedAves.includes(ave.id);

                  return (
                    <View key={ave.id} style={styles.exportAveItem}>
                      <TouchableOpacity
                        style={styles.checkboxButton}
                        onPress={() => toggleSelectAve(ave.id)}
                        disabled={exporting}
                      >
                        <Ionicons
                          name={selected ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={selected ? COLORS.greenDark : '#999'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.exportAveInfo}
                        onPress={() => exportSingleAve(ave)}
                        disabled={exporting}
                      >
                        <Text style={styles.exportAveCode}>
                          {ave.codigo || 'Sin placa'}
                        </Text>

                        <Text style={styles.exportAveName}>
                          {ave.nombre || 'Sin nombre'}
                        </Text>

                        <Text style={styles.exportAveParentText}>
                          Padre: {getParentName(ave.padre_id, ave.padre_externo)}
                        </Text>

                        <Text style={styles.exportAveParentText}>
                          Madre: {getParentName(ave.madre_id, ave.madre_externo)}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => exportSingleAve(ave)}
                        disabled={exporting}
                      >
                        <Ionicons name="share-social" size={20} color={COLORS.gold} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setShowExportModal(false);
                  setSearchPlaca('');
                  setSelectedAves([]);
                }}
                disabled={exporting}
              >
                <Text style={styles.secondaryButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cerrar Sesión</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que deseas cerrar sesión?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dangerButton} onPress={confirmLogout}>
                <Text style={styles.dangerButtonText}>Cerrar Sesión</Text>
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
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 32,
  },

  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.grayDark,
    marginBottom: 4,
  },
  profileSubtext: {
    fontSize: 14,
    color: COLORS.grayMedium,
    marginBottom: 2,
  },

  premiumCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: '#22c55e',
  },
  premiumCardActive: {
    backgroundColor: '#022c22',
    borderColor: '#16a34a',
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.grayDark,
    textAlign: 'center',
    marginBottom: 14,
  },
  premiumTitleActive: {
    color: '#4ade80',
  },
  premiumInnerButton: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  premiumInnerButtonActive: {
    backgroundColor: '#16a34a',
  },
  premiumInnerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  premiumSubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  premiumSubtextActive: {
    color: '#4ade80',
  },

  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 13,
    color: COLORS.grayMedium,
    marginBottom: 10,
    marginLeft: 4,
    fontWeight: '600',
  },

  actionItem: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.grayDark,
  },

  logoutButton: {
    backgroundColor: COLORS.redLight,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  logoutText: {
    color: COLORS.redDeep,
    fontSize: 17,
    fontWeight: '600',
  },

  deleteContainer: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 4,
  },
  deleteText: {
    color: COLORS.redDeep,
    textDecorationLine: 'underline',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.grayDark,
    marginBottom: 14,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.grayMedium,
    marginBottom: 18,
    lineHeight: 22,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    color: COLORS.grayDark,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
  },
  secondaryButtonText: {
    color: COLORS.grayDark,
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    minWidth: 96,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  dangerButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.redDeep,
    minWidth: 120,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },

  exportModalCard: {
    maxHeight: '85%',
  },
  exportHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  selectedInfoBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  selectedInfoLabel: {
    fontSize: 12,
    color: COLORS.grayMedium,
    marginBottom: 2,
  },
  selectedInfoCount: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.grayDark,
  },
  sendSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: 120,
  },
  sendSelectedButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  exportAllButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  exportAllButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  exportSectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.grayDark,
    marginBottom: 10,
  },
  exportList: {
    maxHeight: 280,
    marginTop: 4,
  },
  exportListContent: {
    paddingBottom: 8,
  },
  exportAveItem: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxButton: {
    marginRight: 12,
    paddingVertical: 4,
  },
  exportAveInfo: {
    flex: 1,
    marginRight: 12,
  },
  exportAveCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.grayDark,
    marginBottom: 2,
  },
  exportAveName: {
    fontSize: 13,
    color: COLORS.grayMedium,
    marginBottom: 4,
  },
  exportAveParentText: {
    fontSize: 12,
    color: '#666',
  },
  shareButton: {
    paddingLeft: 8,
    paddingVertical: 6,
  },
  emptyExportText: {
    textAlign: 'center',
    color: COLORS.grayMedium,
    paddingVertical: 20,
    fontSize: 14,
  },
});