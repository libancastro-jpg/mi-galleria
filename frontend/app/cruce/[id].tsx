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
  const [showPadreExterno, setShowPadreExterno] = useState(false);
  const [showMadreExterno, setShowMadreExterno] = useState(false);
  const [padreGalleria, setPadreGalleria] = useState('');
  const [madreGalleria, setMadreGalleria] = useState('');
  const [consanguinidad, setConsanguinidad] = useState<Consanguinidad | null>(null);
  const [calculatingConsang, setCalculatingConsang] = useState(false);

  const [formData, setFormData] = useState({
    padre_id: '',
    madre_id: '',
    padre_externo: '',
    madre_externo: '',
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
        padre_externo: cruce.padre_externo || '',
        madre_externo: cruce.madre_externo || '',
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
    // Validar que haya al menos padre interno o externo
    if (!formData.padre_id && !formData.padre_externo) {
      Alert.alert('Error', 'Debes seleccionar o agregar un padre');
      return;
    }
    // Validar que haya al menos madre interna o externa
    if (!formData.madre_id && !formData.madre_externo) {
      Alert.alert('Error', 'Debes seleccionar o agregar una madre');
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        ...formData,
        padre_id: formData.padre_id || null,
        madre_id: formData.madre_id || null,
        padre_externo: formData.padre_externo || null,
        madre_externo: formData.madre_externo || null,
      };

      if (isEdit) {
        await api.put(`/cruces/${id}`, dataToSend);
        if (Platform.OS !== 'web') {
          Alert.alert('Éxito', 'Cruce actualizado correctamente');
        }
      } else {
        await api.post('/cruces', dataToSend);
        if (Platform.OS !== 'web') {
          Alert.alert('Éxito', 'Cruce creado correctamente');
        }
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
        return '#a0a0a0';
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
          {/* Sección Padre */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconMale}>
                <Ionicons name="male" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.sectionTitle}>Padre (Gallo)</Text>
            </View>

            {/* Mostrar selección actual */}
            {(formData.padre_id || formData.padre_externo) && (
              <View style={styles.selectedParent}>
                <View style={styles.selectedInfo}>
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  <Text style={styles.selectedText}>
                    {formData.padre_externo
                      ? `Externo: ${formData.padre_externo}`
                      : gallos.find((g) => g.id === formData.padre_id)?.codigo || 'Seleccionado'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setFormData({ ...formData, padre_id: '', padre_externo: '' });
                    setPadreGalleria('');
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            {/* Opciones de selección */}
            {!formData.padre_id && !formData.padre_externo && (
              <View style={styles.selectionOptions}>
                {/* Botón seleccionar de mi gallería */}
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    setShowPadreList(!showPadreList);
                    setShowPadreExterno(false);
                  }}
                >
                  <Ionicons name="list" size={20} color="#3b82f6" />
                  <Text style={styles.optionButtonText}>Seleccionar de mi Gallería</Text>
                  <Ionicons name={showPadreList ? 'chevron-up' : 'chevron-down'} size={18} color="#a0a0a0" />
                </TouchableOpacity>

                {/* Lista de gallos */}
                {showPadreList && (
                  <View style={styles.optionsList}>
                    {gallos.length === 0 ? (
                      <Text style={styles.noAvesText}>No hay gallos registrados</Text>
                    ) : (
                      gallos.map((gallo) => (
                        <TouchableOpacity
                          key={gallo.id}
                          style={styles.optionItem}
                          onPress={() => {
                            setFormData({ ...formData, padre_id: gallo.id, padre_externo: '' });
                            setPadreGalleria('');
                            setShowPadreList(false);
                          }}
                        >
                          <Text style={styles.optionItemText}>
                            {gallo.codigo} {gallo.nombre ? `- ${gallo.nombre}` : ''}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}

                {/* Botón agregar externo */}
                <TouchableOpacity
                  style={[styles.optionButton, styles.optionButtonExternal]}
                  onPress={() => {
                    setShowPadreExterno(!showPadreExterno);
                    setShowPadreList(false);
                  }}
                >
                  <Ionicons name="add-circle" size={20} color="#f59e0b" />
                  <Text style={[styles.optionButtonText, { color: '#f59e0b' }]}>Agregar Padre Externo</Text>
                  <Ionicons name={showPadreExterno ? 'chevron-up' : 'chevron-down'} size={18} color="#a0a0a0" />
                </TouchableOpacity>

                {/* Formulario externo */}
                {showPadreExterno && (
                  <View style={styles.externalForm}>
                    <TextInput
                      style={styles.externalInput}
                      value={formData.padre_externo.split(' (')[0]}
                      onChangeText={(text) => setFormData({ ...formData, padre_externo: text, padre_id: '' })}
                      placeholder="Placa del padre externo"
                      placeholderTextColor="#707070"
                    />
                    <TextInput
                      style={styles.externalInput}
                      value={padreGalleria}
                      onChangeText={setPadreGalleria}
                      placeholder="Gallería / Criador (opcional)"
                      placeholderTextColor="#707070"
                    />
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => {
                        if (formData.padre_externo) {
                          const placaConGalleria = padreGalleria
                            ? `${formData.padre_externo} (${padreGalleria})`
                            : formData.padre_externo;
                          setFormData({ ...formData, padre_externo: placaConGalleria, padre_id: '' });
                        }
                        setShowPadreExterno(false);
                      }}
                    >
                      <Text style={styles.confirmButtonText}>Confirmar Padre</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Icono de cruce central */}
          <View style={styles.cruceIconCenter}>
            <Ionicons name="git-merge" size={32} color="#f59e0b" />
          </View>

          {/* Sección Madre */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconFemale}>
                <Ionicons name="female" size={20} color="#ec4899" />
              </View>
              <Text style={styles.sectionTitle}>Madre (Gallina)</Text>
            </View>

            {/* Mostrar selección actual */}
            {(formData.madre_id || formData.madre_externo) && (
              <View style={styles.selectedParent}>
                <View style={styles.selectedInfo}>
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  <Text style={styles.selectedText}>
                    {formData.madre_externo
                      ? `Externa: ${formData.madre_externo}`
                      : gallinas.find((g) => g.id === formData.madre_id)?.codigo || 'Seleccionada'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setFormData({ ...formData, madre_id: '', madre_externo: '' });
                    setMadreGalleria('');
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            {/* Opciones de selección */}
            {!formData.madre_id && !formData.madre_externo && (
              <View style={styles.selectionOptions}>
                {/* Botón seleccionar de mi gallería */}
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    setShowMadreList(!showMadreList);
                    setShowMadreExterno(false);
                  }}
                >
                  <Ionicons name="list" size={20} color="#ec4899" />
                  <Text style={styles.optionButtonText}>Seleccionar de mi Gallería</Text>
                  <Ionicons name={showMadreList ? 'chevron-up' : 'chevron-down'} size={18} color="#a0a0a0" />
                </TouchableOpacity>

                {/* Lista de gallinas */}
                {showMadreList && (
                  <View style={styles.optionsList}>
                    {gallinas.length === 0 ? (
                      <Text style={styles.noAvesText}>No hay gallinas registradas</Text>
                    ) : (
                      gallinas.map((gallina) => (
                        <TouchableOpacity
                          key={gallina.id}
                          style={styles.optionItem}
                          onPress={() => {
                            setFormData({ ...formData, madre_id: gallina.id, madre_externo: '' });
                            setMadreGalleria('');
                            setShowMadreList(false);
                          }}
                        >
                          <Text style={styles.optionItemText}>
                            {gallina.codigo} {gallina.nombre ? `- ${gallina.nombre}` : ''}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}

                {/* Botón agregar externo */}
                <TouchableOpacity
                  style={[styles.optionButton, styles.optionButtonExternal]}
                  onPress={() => {
                    setShowMadreExterno(!showMadreExterno);
                    setShowMadreList(false);
                  }}
                >
                  <Ionicons name="add-circle" size={20} color="#f59e0b" />
                  <Text style={[styles.optionButtonText, { color: '#f59e0b' }]}>Agregar Madre Externa</Text>
                  <Ionicons name={showMadreExterno ? 'chevron-up' : 'chevron-down'} size={18} color="#a0a0a0" />
                </TouchableOpacity>

                {/* Formulario externo */}
                {showMadreExterno && (
                  <View style={styles.externalForm}>
                    <TextInput
                      style={styles.externalInput}
                      value={formData.madre_externo.split(' (')[0]}
                      onChangeText={(text) => setFormData({ ...formData, madre_externo: text, madre_id: '' })}
                      placeholder="Placa de la madre externa"
                      placeholderTextColor="#707070"
                    />
                    <TextInput
                      style={styles.externalInput}
                      value={madreGalleria}
                      onChangeText={setMadreGalleria}
                      placeholder="Gallería / Criador (opcional)"
                      placeholderTextColor="#707070"
                    />
                    <TouchableOpacity
                      style={[styles.confirmButton, { backgroundColor: '#ec4899' }]}
                      onPress={() => {
                        if (formData.madre_externo) {
                          const placaConGalleria = madreGalleria
                            ? `${formData.madre_externo} (${madreGalleria})`
                            : formData.madre_externo;
                          setFormData({ ...formData, madre_externo: placaConGalleria, madre_id: '' });
                        }
                        setShowMadreExterno(false);
                      }}
                    >
                      <Text style={styles.confirmButtonText}>Confirmar Madre</Text>
                    </TouchableOpacity>
                  </View>
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
            placeholderTextColor="#a0a0a0"
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
            placeholderTextColor="#a0a0a0"
          />

          {/* Notas */}
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notas}
            onChangeText={(text) => setFormData({ ...formData, notas: text })}
            placeholder="Notas adicionales..."
            placeholderTextColor="#a0a0a0"
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
    backgroundColor: '#1a1a1a',
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
    borderBottomColor: '#333333',
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
  // Nuevo diseño de secciones
  sectionCard: {
    backgroundColor: '#242424',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconMale: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIconFemale: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  selectedParent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedText: {
    fontSize: 15,
    color: '#22c55e',
    fontWeight: '500',
    marginLeft: 8,
  },
  selectionOptions: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  optionButtonExternal: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderStyle: 'dashed',
  },
  optionButtonText: {
    fontSize: 15,
    color: '#fff',
    flex: 1,
    marginLeft: 10,
  },
  optionsList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    maxHeight: 180,
    overflow: 'hidden',
  },
  optionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  optionItemText: {
    fontSize: 15,
    color: '#fff',
  },
  externalForm: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  externalInput: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333333',
  },
  confirmButton: {
    backgroundColor: '#f59e0b',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  cruceIconCenter: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  noAvesText: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    padding: 16,
  },
  consanguinidadCard: {
    backgroundColor: '#242424',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#333333',
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
    borderTopColor: '#333333',
  },
  ancestrosTitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
  },
  ancestroItem: {
    fontSize: 13,
    color: '#a0a0a0',
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
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333333',
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
    backgroundColor: '#242424',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
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
