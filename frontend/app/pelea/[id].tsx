import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  tipo: string;
}

export default function PeleaFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const MEMBERSHIP_PLANS_ROUTE = '/planes';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gallos, setGallos] = useState<Ave[]>([]);
  const [showAveList, setShowAveList] = useState(false);

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalTitle, setPremiumModalTitle] = useState('Límite alcanzado');
  const [premiumModalMessage, setPremiumModalMessage] = useState(
    'Has alcanzado el límite de tu plan. Ve a Planes de membresía para continuar.'
  );

  const [formData, setFormData] = useState({
    ave_id: '',
    fecha: new Date().toISOString().split('T')[0],
    lugar: '',
    resultado: '',
    calificacion: '',
    notas: '',
  });

  useEffect(() => {
    fetchGallos();
    if (isEdit) {
      fetchPelea();
    }
  }, [id]);

  const extractErrorMessage = (error: any) => {
    return (
      error?.response?.data?.detail?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Ocurrió un error'
    );
  };

  const isPremiumLimitError = (error: any) => {
    const code =
      error?.response?.data?.detail?.code ||
      error?.response?.data?.code ||
      error?.code;

    const message = String(
      error?.response?.data?.detail?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        ''
    ).toLowerCase();

    return (
      code === 'PREMIUM_REQUIRED' ||
      code === 'FREE_PLAN_LIMIT_REACHED' ||
      code === 'TRIAL_EXPIRED' ||
      code === 'PLAN_REQUIRED' ||
      message.includes('premium') ||
      message.includes('membres') ||
      message.includes('trial') ||
      message.includes('prueba gratis') ||
      message.includes('límite') ||
      message.includes('limite') ||
      message.includes('plan requerido')
    );
  };

  const openPremiumModalFromError = (error: any) => {
    const title =
      error?.response?.data?.detail?.title ||
      error?.response?.data?.title ||
      'Límite alcanzado';

    const message =
      error?.response?.data?.detail?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      'Has alcanzado el límite de tu plan. Ve a Planes de membresía para continuar.';

    setPremiumModalTitle(title);
    setPremiumModalMessage(message);
    setShowPremiumModal(true);
  };

  const goToMembershipPlans = () => {
    setShowPremiumModal(false);
    router.push(MEMBERSHIP_PLANS_ROUTE as any);
  };

  const fetchGallos = async () => {
    try {
      const aves = await api.get('/aves', { tipo: 'gallo', estado: 'activo' });
      const gallosData = Array.isArray(aves)
        ? aves
        : Array.isArray(aves?.data)
          ? aves.data
          : [];
      setGallos(gallosData);
    } catch (error) {
      console.error('Error fetching gallos:', error);
      setGallos([]);
    }
  };

  const fetchPelea = async () => {
    setLoading(true);
    try {
      const pelea = await api.get(`/peleas/${id}`);
      setFormData({
        ave_id: pelea.ave_id || '',
        fecha: pelea.fecha || '',
        lugar: pelea.lugar || '',
        resultado: pelea.resultado || '',
        calificacion: pelea.calificacion || '',
        notas: pelea.notas || '',
      });
    } catch (error: any) {
      Alert.alert('Error', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.ave_id) {
      Alert.alert('Error', 'Debes seleccionar un gallo');
      return;
    }
    if (!formData.resultado) {
      Alert.alert('Error', 'Debes seleccionar un resultado');
      return;
    }
    if (!formData.calificacion) {
      Alert.alert('Error', 'Debes seleccionar una calificación');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/peleas/${id}`, formData);
        Alert.alert('Éxito', 'Pelea actualizada correctamente');
      } else {
        await api.post('/peleas', formData);
        Alert.alert('Éxito', 'Pelea registrada correctamente');
      }
      router.back();
    } catch (error: any) {
      if (isPremiumLimitError(error)) {
        openPremiumModalFromError(error);
      } else {
        Alert.alert('Error', extractErrorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#d4a017" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Editar Pelea' : 'Nueva Pelea'}</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          <Text style={styles.label}>Gallo *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowAveList(!showAveList)}
          >
            <View style={styles.selectButtonContent}>
              <Ionicons name="fitness" size={20} color="#f59e0b" />
              <Text style={styles.selectButtonText}>
                {formData.ave_id
                  ? gallos.find((g) => g.id === formData.ave_id)?.codigo || 'Seleccionado'
                  : 'Seleccionar gallo'}
              </Text>
            </View>
            <Ionicons
              name={showAveList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>

          {showAveList && (
            <View style={styles.selectList}>
              {gallos.length === 0 ? (
                <Text style={styles.noAvesText}>No hay gallos activos</Text>
              ) : (
                gallos.map((gallo) => (
                  <TouchableOpacity
                    key={gallo.id}
                    style={[
                      styles.selectItem,
                      formData.ave_id === gallo.id && styles.selectItemActive,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, ave_id: gallo.id });
                      setShowAveList(false);
                    }}
                  >
                    <Text style={styles.selectItemText}>
                      {gallo.codigo} {gallo.nombre ? `- ${gallo.nombre}` : ''}
                    </Text>
                    {formData.ave_id === gallo.id && (
                      <Ionicons name="checkmark" size={20} color="#f59e0b" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <Text style={styles.label}>Fecha *</Text>
          <TextInput
            style={styles.input}
            value={formData.fecha}
            onChangeText={(text) => setFormData({ ...formData, fecha: text })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#555555"
          />

          <Text style={styles.label}>Lugar (opcional)</Text>
          <TextInput
            style={styles.input}
            value={formData.lugar}
            onChangeText={(text) => setFormData({ ...formData, lugar: text })}
            placeholder="Lugar del evento"
            placeholderTextColor="#555555"
          />

          <Text style={styles.label}>Resultado *</Text>
          <View style={styles.resultadoContainer}>
            <TouchableOpacity
              style={[
                styles.resultadoButton,
                formData.resultado === 'GANO' && styles.resultadoGanoActive,
              ]}
              onPress={() => setFormData({ ...formData, resultado: 'GANO' })}
            >
              <Ionicons
                name="trophy"
                size={28}
                color={formData.resultado === 'GANO' ? '#000' : '#22c55e'}
              />
              <Text
                style={[
                  styles.resultadoText,
                  formData.resultado === 'GANO' && styles.resultadoTextActive,
                ]}
              >
                GANÓ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resultadoButton,
                formData.resultado === 'PERDIO' && styles.resultadoPerdioActive,
              ]}
              onPress={() => setFormData({ ...formData, resultado: 'PERDIO' })}
            >
              <Ionicons
                name="close-circle"
                size={28}
                color={formData.resultado === 'PERDIO' ? '#000' : '#ef4444'}
              />
              <Text
                style={[
                  styles.resultadoText,
                  formData.resultado === 'PERDIO' && styles.resultadoTextActive,
                ]}
              >
                PERDIÓ
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Calificación *</Text>
          <View style={styles.calificacionContainer}>
            {[
              { value: 'EXTRAORDINARIA', label: 'Extraordinaria', color: '#f59e0b' },
              { value: 'BUENA', label: 'Buena', color: '#22c55e' },
              { value: 'REGULAR', label: 'Regular', color: '#555555' },
              { value: 'MALA', label: 'Mala', color: '#ef4444' },
            ].map((cal) => (
              <TouchableOpacity
                key={cal.value}
                style={[
                  styles.calificacionButton,
                  formData.calificacion === cal.value && {
                    backgroundColor: cal.color,
                    borderColor: cal.color,
                  },
                ]}
                onPress={() => setFormData({ ...formData, calificacion: cal.value })}
              >
                <View
                  style={[
                    styles.calificacionDot,
                    { backgroundColor: cal.color },
                    formData.calificacion === cal.value && { backgroundColor: '#000' },
                  ]}
                />
                <Text
                  style={[
                    styles.calificacionText,
                    formData.calificacion === cal.value && styles.calificacionTextActive,
                  ]}
                >
                  {cal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notas}
            onChangeText={(text) => setFormData({ ...formData, notas: text })}
            placeholder="Observaciones de la pelea..."
            placeholderTextColor="#555555"
            multiline
            numberOfLines={4}
          />

          <View style={{ height: 40 }} />
        </ScrollView>

        <Modal
          visible={showPremiumModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPremiumModal(false)}
        >
          <View style={styles.premiumModalOverlay}>
            <View style={styles.premiumModal}>
              <View style={styles.premiumIconWrap}>
                <Ionicons name="lock-closed" size={30} color="#d4a017" />
              </View>

              <Text style={styles.premiumTitle}>{premiumModalTitle}</Text>
              <Text style={styles.premiumMessage}>{premiumModalMessage}</Text>

              <TouchableOpacity
                style={styles.premiumPrimaryButton}
                onPress={goToMembershipPlans}
              >
                <Text style={styles.premiumPrimaryButtonText}>Ver planes de membresía</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.premiumSecondaryButton}
                onPress={() => setShowPremiumModal(false)}
              >
                <Text style={styles.premiumSecondaryButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  selectList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  selectItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  noAvesText: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    padding: 16,
  },
  resultadoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  resultadoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  resultadoGanoActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  resultadoPerdioActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  resultadoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  resultadoTextActive: {
    color: '#000',
  },
  calificacionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calificacionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  calificacionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  calificacionText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  calificacionTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  premiumModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  premiumIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 160, 23, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
  },
  premiumMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 22,
  },
  premiumPrimaryButton: {
    width: '100%',
    backgroundColor: '#d4a017',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumPrimaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  premiumSecondaryButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  premiumSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555555',
  },
});