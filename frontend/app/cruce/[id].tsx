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

interface Consanguinidad {
  porcentaje_estimado: number;
  nivel: string;
  ancestros_comunes: Array<{
    id: string;
    codigo: string;
    nombre?: string;
    closest_generation: number;
  }>;
  total_comunes: number;
}

export default function CruceFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gallos, setGallos] = useState<Ave[]>([]);
  const [gallinas, setGallinas] = useState<Ave[]>([]);
  const [showPadreList, setShowPadreList] = useState(false);
  const [showMadreList, setShowMadreList] = useState(false);
  const [consanguinidad, setConsanguinidad] = useState<Consanguinidad | null>(null);
  const [calculatingConsang, setCalculatingConsang] = useState(false);

  const [formData, setFormData] = useState({
    padre_id: '',
    madre_id: '',
    fecha: new Date().toISOString().split('T')[0],
    objetivo: '',
    notas: '',
    estado: 'planeado',
  });

  useEffect(() => {
    fetchAves();
    if (isEdit) {
      fetchCruce();
    }
  }, [id]);

  useEffect(() => {
    if (formData.padre_id && formData.madre_id) {
      calculateConsanguinidad();
    } else {
      setConsanguinidad(null);
    }
  }, [formData.padre_id, formData.madre_id]);

  const fetchAves = async () => {
    try {
      const aves = await api.get('/aves');
      setGallos(aves.filter((a: Ave) => a.tipo === 'gallo'));
      setGallinas(aves.filter((a: Ave) => a.tipo === 'gallina'));
    } catch (error) {
      console.error('Error fetching aves:', error);
    }
  };

  const fetchCruce = async () => {
    setLoading(true);
    try {
      const cruce = await api.get(`/cruces/${id}`);
      setFormData({
        padre_id: cruce.padre_id || '',
        madre_id: cruce.madre_id || '',
        fecha: cruce.fecha || '',
        objetivo: cruce.objetivo || '',
        notas: cruce.notas || '',
        estado: cruce.estado || 'planeado',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateConsanguinidad = async () => {
    setCalculatingConsang(true);
    try {
      const result = await api.get('/consanguinidad', {
        padre_id: formData.padre_id,
        madre_id: formData.madre_id,
      });
      setConsanguinidad(result);
    } catch (error) {
      console.error('Error calculating consanguinidad:', error);
    } finally {
      setCalculatingConsang(false);
    }
  };

  const handleSave = async () => {
    if (!formData.padre_id) {
      Alert.alert('Error', 'Debes seleccionar un padre');
      return;
    }
    if (!formData.madre_id) {
      Alert.alert('Error', 'Debes seleccionar una madre');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/cruces/${id}`, formData);
        Alert.alert('Éxito', 'Cruce actualizado correctamente');
      } else {
        await api.post('/cruces', formData);
        Alert.alert('Éxito', 'Cruce creado correctamente');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const getConsangColor = (nivel: string) => {
    switch (nivel) {
      case 'bajo':
        return '#22c55e';
      case 'medio':
        return '#f59e0b';
      case 'alto':
        return '#ef4444';
      default:
        return '#6b7280';
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
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Editar Cruce' : 'Nuevo Cruce'}</Text>
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
          {/* Parents Selection */}
          <View style={styles.parentsContainer}>
            {/* Padre */}
            <View style={styles.parentBox}>
              <View style={styles.parentIcon}>
                <Ionicons name="fitness" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.parentLabel}>Padre (Gallo)</Text>
              <TouchableOpacity
                style={styles.parentSelect}
                onPress={() => setShowPadreList(!showPadreList)}
              >
                <Text style={styles.parentSelectText}>
                  {formData.padre_id
                    ? gallos.find((g) => g.id === formData.padre_id)?.codigo || 'Seleccionado'
                    : 'Seleccionar'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.cruceIconContainer}>
              <Ionicons name="git-merge" size={28} color="#f59e0b" />
            </View>

            {/* Madre */}
            <View style={styles.parentBox}>
              <View style={[styles.parentIcon, styles.parentIconMadre]}>
                <Ionicons name="egg" size={24} color="#ec4899" />
              </View>
              <Text style={styles.parentLabel}>Madre (Gallina)</Text>
              <TouchableOpacity
                style={styles.parentSelect}
                onPress={() => setShowMadreList(!showMadreList)}
              >
                <Text style={styles.parentSelectText}>
                  {formData.madre_id
                    ? gallinas.find((g) => g.id === formData.madre_id)?.codigo || 'Seleccionada'
                    : 'Seleccionar'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Padre List */}
          {showPadreList && (
            <View style={styles.selectList}>
              {gallos.length === 0 ? (
                <Text style={styles.noAvesText}>No hay gallos registrados</Text>
              ) : (
                gallos.map((gallo) => (
                  <TouchableOpacity
                    key={gallo.id}
                    style={[
                      styles.selectItem,
                      formData.padre_id === gallo.id && styles.selectItemActive,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, padre_id: gallo.id });
                      setShowPadreList(false);
                    }}
                  >
                    <Text style={styles.selectItemText}>
                      {gallo.codigo} {gallo.nombre ? `- ${gallo.nombre}` : ''}
                    </Text>
                    {formData.padre_id === gallo.id && (
                      <Ionicons name="checkmark" size={20} color="#f59e0b" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Madre List */}
          {showMadreList && (
            <View style={styles.selectList}>
              {gallinas.length === 0 ? (
                <Text style={styles.noAvesText}>No hay gallinas registradas</Text>
              ) : (
                gallinas.map((gallina) => (
                  <TouchableOpacity
                    key={gallina.id}
                    style={[
                      styles.selectItem,
                      formData.madre_id === gallina.id && styles.selectItemActive,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, madre_id: gallina.id });
                      setShowMadreList(false);
                    }}
                  >
                    <Text style={styles.selectItemText}>
                      {gallina.codigo} {gallina.nombre ? `- ${gallina.nombre}` : ''}
                    </Text>
                    {formData.madre_id === gallina.id && (
                      <Ionicons name="checkmark" size={20} color="#f59e0b" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Consanguinidad */}
          {(consanguinidad || calculatingConsang) && (
            <View style={styles.consanguinidadCard}>
              <Text style={styles.consanguinidadTitle}>Consanguinidad Estimada</Text>
              {calculatingConsang ? (
                <ActivityIndicator size="small" color="#f59e0b" />
              ) : consanguinidad ? (
                <>
                  <View style={styles.consanguinidadRow}>
                    <Text
                      style={[
                        styles.consanguinidadValue,
                        { color: getConsangColor(consanguinidad.nivel) },
                      ]}
                    >
                      {consanguinidad.porcentaje_estimado.toFixed(1)}%
                    </Text>
                    <View
                      style={[
                        styles.nivelBadge,
                        { backgroundColor: getConsangColor(consanguinidad.nivel) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.nivelText,
                          { color: getConsangColor(consanguinidad.nivel) },
                        ]}
                      >
                        {consanguinidad.nivel.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {consanguinidad.total_comunes > 0 && (
                    <View style={styles.ancestrosComunes}>
                      <Text style={styles.ancestrosTitle}>
                        Ancestros en común ({consanguinidad.total_comunes}):
                      </Text>
                      {consanguinidad.ancestros_comunes.slice(0, 3).map((anc) => (
                        <Text key={anc.id} style={styles.ancestroItem}>
                          • {anc.codigo} (Gen {anc.closest_generation})
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              ) : null}
            </View>
          )}

          {/* Fecha */}
          <Text style={styles.label}>Fecha</Text>
          <TextInput
            style={styles.input}
            value={formData.fecha}
            onChangeText={(text) => setFormData({ ...formData, fecha: text })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#6b7280"
          />

          {/* Estado */}
          <Text style={styles.label}>Estado</Text>
          <View style={styles.estadoContainer}>
            {['planeado', 'hecho', 'cancelado'].map((estado) => (
              <TouchableOpacity
                key={estado}
                style={[
                  styles.estadoButton,
                  formData.estado === estado && styles.estadoButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, estado })}
              >
                <Text
                  style={[
                    styles.estadoText,
                    formData.estado === estado && styles.estadoTextActive,
                  ]}
                >
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Objetivo */}
          <Text style={styles.label}>Objetivo del cruce</Text>
          <TextInput
            style={styles.input}
            value={formData.objetivo}
            onChangeText={(text) => setFormData({ ...formData, objetivo: text })}
            placeholder="Ej: Mejorar resistencia, color..."
            placeholderTextColor="#6b7280"
          />

          {/* Notas */}
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notas}
            onChangeText={(text) => setFormData({ ...formData, notas: text })}
            placeholder="Notas adicionales..."
            placeholderTextColor="#6b7280"
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
    backgroundColor: '#0a0a0a',
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
    borderBottomColor: '#2a2a2a',
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
    color: '#fff',
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
  parentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  parentBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  parentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  parentIconMadre: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  parentLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  parentSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  parentSelectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cruceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  selectList: {
    backgroundColor: '#141414',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    maxHeight: 200,
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  selectItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  selectItemText: {
    fontSize: 16,
    color: '#fff',
  },
  noAvesText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
  consanguinidadCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  consanguinidadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
  },
  consanguinidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consanguinidadValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  nivelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nivelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ancestrosComunes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  ancestrosTitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
  },
  ancestroItem: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  estadoContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  estadoButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#141414',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  estadoButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  estadoText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  estadoTextActive: {
    color: '#000',
    fontWeight: '600',
  },
});
