import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';

interface Cruce {
  id: string;
  padre_id?: string;
  madre_id?: string;
  padre_externo?: string;
  madre_externo?: string;
  fecha: string;
  estado: string;
}

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  tipo: string;
}

const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  background: '#f5f5f5',
  cardBg: '#ffffff',
  border: '#e0e0e0',
  white: '#1a1a1a',
  grayLight: '#555555',
  green: '#22c55e',
  blue: '#3b82f6',
};

export default function CamadaFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [aves, setAves] = useState<Ave[]>([]);
  const [showCruceList, setShowCruceList] = useState(false);

  const [formData, setFormData] = useState({
    cruce_id: '',
    fecha_puesta_inicio: new Date().toISOString().split('T')[0],
    cantidad_huevos: '',
    fecha_incubacion_inicio: '',
    metodo: 'gallina',
    fecha_nacimiento: '',
    cantidad_nacidos: '',
    notas: '',
  });

  useEffect(() => {
    fetchCruces();
    if (isEdit) {
      fetchCamada();
    }
  }, [id]);

  const fetchCruces = async () => {
    try {
      // Obtener cruces y aves
      const [crucesData, avesData] = await Promise.all([
        api.get('/cruces'),
        api.get('/aves'),
      ]);
      setCruces(crucesData);
      setAves(avesData);
    } catch (error) {
      console.error('Error fetching cruces:', error);
    }
  };

  const fetchCamada = async () => {
    try {
      const data = await api.get(`/camadas/${id}`);
      setFormData({
        cruce_id: data.cruce_id || '',
        fecha_puesta_inicio: data.fecha_puesta_inicio || '',
        cantidad_huevos: data.cantidad_huevos?.toString() || '',
        fecha_incubacion_inicio: data.fecha_incubacion_inicio || '',
        metodo: data.metodo || 'gallina',
        fecha_nacimiento: data.fecha_nacimiento || '',
        cantidad_nacidos: data.cantidad_nacidos?.toString() || '',
        notas: data.notas || '',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.cruce_id) {
      Alert.alert('Error', 'Debes seleccionar un cruce');
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        cruce_id: formData.cruce_id,
        fecha_puesta_inicio: formData.fecha_puesta_inicio || null,
        cantidad_huevos: formData.cantidad_huevos ? parseInt(formData.cantidad_huevos) : null,
        fecha_incubacion_inicio: formData.fecha_incubacion_inicio || null,
        metodo: formData.metodo,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        cantidad_nacidos: formData.cantidad_nacidos ? parseInt(formData.cantidad_nacidos) : null,
        notas: formData.notas || null,
      };

      if (isEdit) {
        await api.put(`/camadas/${id}`, dataToSend);
        Alert.alert('Éxito', 'Camada actualizada correctamente');
      } else {
        await api.post('/camadas', dataToSend);
        Alert.alert('Éxito', 'Camada creada correctamente');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCruceLabel = (cruce: Cruce) => {
    // Obtener información del padre
    let padreLabel = 'Desconocido';
    if (cruce.padre_id) {
      const padre = aves.find(a => a.id === cruce.padre_id);
      padreLabel = padre ? `Placa ${padre.codigo}` : 'Desconocido';
    } else if (cruce.padre_externo) {
      padreLabel = `Ext. ${cruce.padre_externo.split(' (')[0]}`;
    }

    // Obtener información de la madre
    let madreLabel = 'Desconocida';
    if (cruce.madre_id) {
      const madre = aves.find(a => a.id === cruce.madre_id);
      madreLabel = madre ? `Placa ${madre.codigo}` : 'Desconocida';
    } else if (cruce.madre_externo) {
      madreLabel = `Ext. ${cruce.madre_externo.split(' (')[0]}`;
    }

    return `Gallo ${padreLabel} x Gallina ${madreLabel}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
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
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isNew ? 'Nueva Camada' : 'Editar Camada'}</Text>
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

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Selección de Cruce */}
          <Text style={styles.label}>Cruce de origen *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCruceList(!showCruceList)}
          >
            <View style={styles.selectButtonContent}>
              <Ionicons name="git-merge" size={20} color={COLORS.gold} />
              <Text style={styles.selectButtonText}>
                {formData.cruce_id
                  ? formatCruceLabel(cruces.find(c => c.id === formData.cruce_id)!)
                  : 'Seleccionar cruce'}
              </Text>
            </View>
            <Ionicons
              name={showCruceList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.grayLight}
            />
          </TouchableOpacity>

          {showCruceList && (
            <View style={styles.selectList}>
              {/* Opción de crear nuevo cruce */}
              <TouchableOpacity
                style={styles.nuevoCruceOption}
                onPress={() => {
                  setShowCruceList(false);
                  router.push('/cruce/new');
                }}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.gold} />
                <View style={styles.nuevoCruceContent}>
                  <Text style={styles.nuevoCruceText}>Registrar nuevo cruce</Text>
                  <Text style={styles.nuevoCruceSubtext}>Si los padres no aparecen en la lista</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.grayLight} />
              </TouchableOpacity>

              {cruces.length === 0 ? (
                <Text style={styles.noDataText}>No hay cruces registrados</Text>
              ) : (
                cruces.map((cruce) => (
                  <TouchableOpacity
                    key={cruce.id}
                    style={[
                      styles.selectItem,
                      formData.cruce_id === cruce.id && styles.selectItemActive,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, cruce_id: cruce.id });
                      setShowCruceList(false);
                    }}
                  >
                    <Text style={styles.selectItemText}>{formatCruceLabel(cruce)}</Text>
                    {formData.cruce_id === cruce.id && (
                      <Ionicons name="checkmark" size={20} color={COLORS.gold} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Información de Puesta */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="egg" size={20} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>Información de Puesta</Text>
            </View>

            <Text style={styles.inputLabel}>Fecha inicio de puesta</Text>
            <TextInput
              style={styles.input}
              value={formData.fecha_puesta_inicio}
              onChangeText={(text) => setFormData({ ...formData, fecha_puesta_inicio: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.grayLight}
            />

            <Text style={styles.inputLabel}>Cantidad de huevos</Text>
            <TextInput
              style={styles.input}
              value={formData.cantidad_huevos}
              onChangeText={(text) => setFormData({ ...formData, cantidad_huevos: text })}
              placeholder="Ej: 12"
              placeholderTextColor={COLORS.grayLight}
              keyboardType="numeric"
            />
          </View>

          {/* Incubación */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="thermometer" size={20} color={COLORS.blue} />
              <Text style={styles.sectionTitle}>Incubación</Text>
            </View>

            <Text style={styles.inputLabel}>Método de incubación</Text>
            <View style={styles.metodoContainer}>
              <TouchableOpacity
                style={[
                  styles.metodoButton,
                  formData.metodo === 'gallina' && styles.metodoButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, metodo: 'gallina' })}
              >
                <Ionicons 
                  name="egg" 
                  size={20} 
                  color={formData.metodo === 'gallina' ? '#000' : COLORS.grayLight} 
                />
                <Text style={[
                  styles.metodoText,
                  formData.metodo === 'gallina' && styles.metodoTextActive,
                ]}>
                  Gallina
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.metodoButton,
                  formData.metodo === 'incubadora' && styles.metodoButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, metodo: 'incubadora' })}
              >
                <Ionicons 
                  name="cube" 
                  size={20} 
                  color={formData.metodo === 'incubadora' ? '#000' : COLORS.grayLight} 
                />
                <Text style={[
                  styles.metodoText,
                  formData.metodo === 'incubadora' && styles.metodoTextActive,
                ]}>
                  Incubadora
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Fecha inicio incubación</Text>
            <TextInput
              style={styles.input}
              value={formData.fecha_incubacion_inicio}
              onChangeText={(text) => setFormData({ ...formData, fecha_incubacion_inicio: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.grayLight}
            />
          </View>

          {/* Nacimiento */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="happy" size={20} color={COLORS.green} />
              <Text style={styles.sectionTitle}>Nacimiento</Text>
            </View>

            <Text style={styles.inputLabel}>Fecha de nacimiento</Text>
            <TextInput
              style={styles.input}
              value={formData.fecha_nacimiento}
              onChangeText={(text) => setFormData({ ...formData, fecha_nacimiento: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.grayLight}
            />

            <Text style={styles.inputLabel}>Cantidad de nacidos</Text>
            <TextInput
              style={styles.input}
              value={formData.cantidad_nacidos}
              onChangeText={(text) => setFormData({ ...formData, cantidad_nacidos: text })}
              placeholder="Ej: 8"
              placeholderTextColor={COLORS.grayLight}
              keyboardType="numeric"
            />
          </View>

          {/* Notas */}
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notas}
            onChangeText={(text) => setFormData({ ...formData, notas: text })}
            placeholder="Observaciones adicionales..."
            placeholderTextColor={COLORS.grayLight}
            multiline
            numberOfLines={4}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.grayLight,
    marginBottom: 8,
    marginTop: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 200,
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectItemActive: {
    backgroundColor: COLORS.goldLight,
  },
  selectItemText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.grayLight,
    textAlign: 'center',
    padding: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.grayLight,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  metodoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metodoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metodoButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  metodoText: {
    fontSize: 14,
    color: COLORS.grayLight,
    fontWeight: '500',
  },
  metodoTextActive: {
    color: '#000',
  },
});
