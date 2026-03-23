import React, { useEffect, useState } from 'react';
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
import {
  initializeIAP,
  startPurchaseListeners,
  disconnectIAP,
} from '../src/services/iap';

// Color palette
const COLORS = {
  gold: '#F5A623',
  goldLight: 'rgba(245, 166, 35, 0.15)',
  greenDark: '#16a34a',
  greenLight: 'rgba(22, 163, 74, 0.12)',
  blueDark: '#0f6ea8',
  blueLight: 'rgba(15, 110, 168, 0.12)',
  eliteDark: '#d4a017',
  eliteLight: 'rgba(212, 160, 23, 0.12)',
  redDeep: '#ef4444',
  redLight: 'rgba(239, 68, 68, 0.15)',
  grayDark: '#f5f5f5',
  grayMedium: '#e0e0e0',
  grayLight: '#555555',
  white: '#ffffff',
  background: '#f5f5f5',
  textDark: '#1a1a1a',
};

const PRIVACY_URL = 'https://sites.google.com/view/migalleria-privacidad';
const TERMS_URL = 'https://sites.google.com/view/migalleria-terminos';
const SUPPORT_URL = 'https://sites.google.com/view/migalleria-soporte';

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  // Estados para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [editingGalleria, setEditingGalleria] = useState(user?.nombre || '');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Estado para desplegar Configuración
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const setupIAP = async () => {
      const connected = await initializeIAP();

      if (connected && isMounted) {
        startPurchaseListeners(
          async (purchase) => {
            console.log('Compra exitosa:', purchase);
            Alert.alert(
              'Compra exitosa',
              'Tu suscripción premium fue procesada correctamente.'
            );
          },
          (error) => {
            console.log('Error en compra:', error);
            Alert.alert(
              'Error en la compra',
              error?.message || 'No se pudo completar la suscripción.'
            );
          }
        );
      }
    };

    setupIAP();

    return () => {
      isMounted = false;
      disconnectIAP();
    };
  }, []);

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

  const handleSelectPlan = (plan: 'criador' | 'plus' | 'elite') => {
    setShowPlansModal(false);

    if (plan === 'criador') {
      Alert.alert('Plan Criador', 'Aquí conectaremos la compra del plan Criador.');
      return;
    }

    if (plan === 'plus') {
      Alert.alert('Plan Criador Plus', 'Aquí conectaremos la compra del plan Criador Plus.');
      return;
    }

    Alert.alert('Plan Criador Elite', 'Aquí conectaremos la compra del plan Criador Elite.');
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      setShowLogoutConfirm(true);
    } else {
      Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres cerrar sesión?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: confirmLogout,
        },
      ]);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;

    Alert.alert(
      'Eliminar cuenta',
      'Esta acción eliminará tu cuenta permanentemente junto con tus datos asociados. ¿Deseas continuar?',
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
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'No se pudo eliminar la cuenta');
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

  const handleChangePin = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      Alert.alert('Error', 'El PIN debe tener entre 4 y 6 dígitos');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'Los PINs no coinciden');
      return;
    }

    setSaving(true);
    try {
      await api.put('/auth/change-pin', {
        current_pin: currentPin,
        new_pin: newPin,
      });
      setShowPinModal(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      Alert.alert('Éxito', 'PIN actualizado correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cambiar el PIN');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      if (refreshUser) {
        await refreshUser();
      }
      Alert.alert('Éxito', 'Datos sincronizados correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await api.get('/export/data');
      Alert.alert(
        'Exportar Datos',
        'Esta función generará un archivo PDF/CSV con todos tus datos.\n\n' +
          `Total de aves: ${response.aves || 0}\n` +
          `Total de cruces: ${response.cruces || 0}\n` +
          `Total de camadas: ${response.camadas || 0}\n` +
          `Total de peleas: ${response.peleas || 0}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Descargar PDF',
            onPress: () => {
              Alert.alert('Info', 'La descarga de PDF estará disponible próximamente');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo exportar los datos');
    } finally {
      setExporting(false);
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
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={50} color={COLORS.gold} />
            </View>
            <Text style={styles.userName}>{user?.nombre || 'Mi Galleria'}</Text>
            <Text style={styles.userRole}>Criador de Gallos de Pelea</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Premium</Text>

            <View style={styles.premiumCard}>
              <View style={styles.premiumHeader}>
                <View style={styles.premiumIconBox}>
                  <Ionicons name="diamond" size={24} color={COLORS.gold} />
                </View>
                <View style={styles.premiumTextBox}>
                  <Text style={styles.premiumTitle}>Mi Galleria Premium</Text>
                  <Text style={styles.premiumSubtitle}>
                    Desbloquea funciones premium y amplía el uso de tu app.
                  </Text>
                </View>
              </View>

              <View style={styles.premiumFeatures}>
                <View style={styles.premiumFeatureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.greenDark} />
                  <Text style={styles.premiumFeatureText}>Más capacidad de registros</Text>
                </View>

                <View style={styles.premiumFeatureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.greenDark} />
                  <Text style={styles.premiumFeatureText}>Acceso a funciones avanzadas</Text>
                </View>

                <View style={styles.premiumFeatureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.greenDark} />
                  <Text style={styles.premiumFeatureText}>Planes premium desde la app</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.premiumButton}
                onPress={() => setShowPlansModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="diamond-outline" size={20} color={COLORS.white} />
                <Text style={styles.premiumButtonText}>Hazte Premium</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Personal</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="call" size={20} color={COLORS.gold} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{formatPhoneNumber(user?.telefono)}</Text>
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

          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => setConfigOpen((v) => !v)}
              style={styles.configHeader}
              activeOpacity={0.8}
            >
              <Text style={styles.sectionTitle}>Configuración</Text>
              <Ionicons
                name={configOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.grayLight}
                style={{ marginTop: -2 }}
              />
            </TouchableOpacity>

            {configOpen && (
              <View style={{ marginTop: 8 }}>
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

                <TouchableOpacity style={styles.actionItem} onPress={() => setShowPinModal(true)}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="lock-closed" size={20} color={COLORS.gold} />
                  </View>
                  <Text style={styles.actionText}>Cambiar PIN</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleSyncData}
                  disabled={syncing}
                >
                  <View style={styles.actionIcon}>
                    {syncing ? (
                      <ActivityIndicator size="small" color={COLORS.gold} />
                    ) : (
                      <Ionicons name="sync" size={20} color={COLORS.gold} />
                    )}
                  </View>
                  <Text style={styles.actionText}>Sincronizar Datos</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleExportData}
                  disabled={exporting}
                >
                  <View style={styles.actionIcon}>
                    {exporting ? (
                      <ActivityIndicator size="small" color={COLORS.gold} />
                    ) : (
                      <Ionicons name="download" size={20} color={COLORS.gold} />
                    )}
                  </View>
                  <Text style={styles.actionText}>Exportar Datos (PDF/CSV)</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
                </TouchableOpacity>
              </View>
            )}
          </View>

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

            <TouchableOpacity style={styles.actionItem} onPress={() => openUrl(SUPPORT_URL)}>
              <View style={styles.actionIcon}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Soporte</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={22} color={COLORS.redDeep} />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteContainer}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
              activeOpacity={0.7}
            >
              {deletingAccount ? (
                <ActivityIndicator size="small" color={COLORS.redDeep} />
              ) : (
                <Text style={styles.deleteText}>Eliminar cuenta permanentemente</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appName}>Mi Galleria</Text>
            <Text style={styles.appVersion}>Versión 1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showPlansModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPlansModal(false)}
      >
        <View style={styles.plansOverlay}>
          <View style={styles.plansModalContainer}>
            <View style={styles.plansHeader}>
              <Text style={styles.plansModalTitle}>Membresías</Text>
              <TouchableOpacity onPress={() => setShowPlansModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.plansScrollContent}
            >
              <View style={styles.clubCard}>
                <Text style={styles.clubTitle}>GALLERO</Text>
                <View style={styles.clubFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.textDark} />
                  <Text style={styles.clubFeatureText}>Hasta 20 registros en total</Text>
                </View>
                <View style={styles.clubFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.textDark} />
                  <Text style={styles.clubFeatureText}>
                    Acceso a todas las funciones principales
                  </Text>
                </View>
                <View style={styles.clubFooter}>
                  <Text style={styles.clubFooterText}>ERES UN GALLERO ACTIVO GRATIS</Text>
                </View>
              </View>

              <Text style={styles.upgradeText}>
                Actualiza para disfrutar de todos los beneficios:
              </Text>

              <View style={styles.planCardGreen}>
                <Text style={styles.planTitleGreen}>CRIADOR</Text>
                <Text style={styles.planPrice}>USD 29.99/año</Text>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.greenDark} />
                  <Text style={styles.planFeatureLabel}>350 registros/año</Text>
                </View>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.greenDark} />
                  <Text style={styles.planFeatureLabel}>1 dispositivo</Text>
                </View>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.greenDark} />
                  <Text style={styles.planFeatureLabel}>
                    <Text style={styles.boldText}>Copia de seguridad</Text> diaria de datos
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.planButtonGreen}
                  onPress={() => handleSelectPlan('criador')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.planButtonLabelWhite}>Activar Criador Por USD 29.99/año</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.planCardBlue}>
                <Text style={styles.planTitleBlue}>CRIADOR PLUS</Text>
                <Text style={styles.planPrice}>USD 59.99/año</Text>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.blueDark} />
                  <Text style={styles.planFeatureLabel}>550 registros/año</Text>
                </View>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.blueDark} />
                  <Text style={styles.planFeatureLabel}>2 dispositivos</Text>
                </View>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.blueDark} />
                  <Text style={styles.planFeatureLabel}>Fotos ilimitadas</Text>
                </View>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.blueDark} />
                  <Text style={styles.planFeatureLabel}>
                    <Text style={styles.boldText}>Copia de seguridad</Text> diaria de datos
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.planButtonBlue}
                  onPress={() => handleSelectPlan('plus')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.planButtonLabelWhite}>Activar Criador Plus Por USD 59.99/año</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.planCardElite}>
                <Text style={styles.planTitleElite}>CRIADOR ELITE</Text>
                <Text style={styles.planPrice}>USD 89.99/año</Text>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.eliteDark} />
                  <Text style={styles.planFeatureLabel}>Registros ilimitados</Text>
                </View>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.eliteDark} />
                  <Text style={styles.planFeatureLabel}>Dispositivos ilimitados</Text>
                </View>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.eliteDark} />
                  <Text style={styles.planFeatureLabel}>Fotos ilimitadas</Text>
                </View>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.eliteDark} />
                  <Text style={styles.planFeatureLabel}>
                    <Text style={styles.boldText}>Copia de seguridad</Text> diaria de datos
                  </Text>
                </View>

                <View style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={24} color={COLORS.eliteDark} />
                  <Text style={styles.planFeatureLabel}>
                    Soporte <Text style={styles.boldText}>prioritario</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.planButtonElite}
                  onPress={() => handleSelectPlan('elite')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.planButtonLabelWhite}>Activar Criador Elite Por USD 89.99/año</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
            <Text style={styles.logoutModalText}>¿Estás seguro de que quieres cerrar sesión?</Text>

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

      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.logoutModalIcon}>
              <Ionicons name="lock-closed" size={40} color={COLORS.gold} />
            </View>
            <Text style={styles.modalTitle}>Cambiar PIN</Text>

            <Text style={styles.modalLabel}>PIN Actual</Text>
            <TextInput
              style={styles.modalInput}
              value={currentPin}
              onChangeText={setCurrentPin}
              placeholder="Ingresa tu PIN actual"
              placeholderTextColor={COLORS.grayLight}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />

            <Text style={styles.modalLabel}>Nuevo PIN (4-6 dígitos)</Text>
            <TextInput
              style={styles.modalInput}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="Ingresa tu nuevo PIN"
              placeholderTextColor={COLORS.grayLight}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />

            <Text style={styles.modalLabel}>Confirmar Nuevo PIN</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Confirma tu nuevo PIN"
              placeholderTextColor={COLORS.grayLight}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowPinModal(false);
                  setCurrentPin('');
                  setNewPin('');
                  setConfirmPin('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleChangePin}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.modalConfirmText}>Cambiar</Text>
                )}
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
    color: COLORS.textDark,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.gold,
    marginTop: 4,
    fontWeight: '500',
  },
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
  premiumCard: {
    backgroundColor: '#fff7e6',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f5d08a',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  premiumIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: COLORS.grayLight,
    marginTop: 4,
    lineHeight: 20,
  },
  premiumFeatures: {
    marginBottom: 16,
    gap: 10,
  },
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumFeatureText: {
    fontSize: 14,
    color: COLORS.textDark,
    marginLeft: 8,
  },
  premiumButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
    color: COLORS.textDark,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.grayMedium,
    marginHorizontal: 14,
  },
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
    color: COLORS.textDark,
    marginLeft: 14,
  },
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
  deleteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 13,
    color: COLORS.redDeep,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
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

  plansOverlay: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  plansModalContainer: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  plansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  plansModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  plansScrollContent: {
    paddingBottom: 40,
  },
  clubCard: {
    borderWidth: 1.5,
    borderColor: '#222',
    borderRadius: 22,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    marginBottom: 20,
  },
  clubTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
  },
  clubFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  clubFeatureText: {
    fontSize: 16,
    color: COLORS.textDark,
    marginLeft: 10,
    fontWeight: '500',
  },
  clubFooter: {
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  clubFooterText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  upgradeText: {
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 18,
  },

  planCardGreen: {
    borderWidth: 2,
    borderColor: COLORS.greenDark,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  planCardBlue: {
    borderWidth: 2,
    borderColor: COLORS.blueDark,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  planCardElite: {
    borderWidth: 2,
    borderColor: COLORS.eliteDark,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  planTitleGreen: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.greenDark,
    marginBottom: 6,
  },
  planTitleBlue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.blueDark,
    marginBottom: 6,
  },
  planTitleElite: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.eliteDark,
    marginBottom: 6,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 18,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planFeatureLabel: {
    fontSize: 17,
    color: COLORS.textDark,
    marginLeft: 12,
    flex: 1,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '800',
  },
  planButtonGreen: {
    backgroundColor: COLORS.greenDark,
    borderRadius: 999,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  planButtonBlue: {
    backgroundColor: COLORS.greenDark,
    borderRadius: 999,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  planButtonElite: {
    backgroundColor: COLORS.greenDark,
    borderRadius: 999,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  planButtonLabelWhite: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 17,
  },

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
    color: COLORS.textDark,
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
    color: COLORS.textDark,
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
  premiumButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '700',
  },
});