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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { RoosterIcon } from '../../src/components/BirdIcons';

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  foto_principal?: string;
  color?: string;
  linea?: string;
}

interface Trabajo {
  numero: number;
  tiempo_minutos: number | null;
  completado: boolean;
  fecha_completado: string | null;
  notas: string | null;
}

interface Cuido {
  id: string;
  ave_id: string;
  ave_codigo?: string;
  ave_nombre?: string;
  ave_foto?: string;
  ave_color?: string;
  ave_linea?: string;
  fecha_inicio: string;
  estado: string;
  tope1_completado: boolean;
  tope1_fecha?: string;
  tope1_notas?: string;
  tope2_completado: boolean;
  tope2_fecha?: string;
  tope2_notas?: string;
  trabajos: Trabajo[];
  en_descanso: boolean;
  dias_descanso?: number;
  fecha_inicio_descanso?: string;
  fecha_fin_descanso?: string;
  notas?: string;
}

export default function CuidoDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [cuido, setCuido] = useState<Cuido | null>(null);
  const [gallos, setGallos] = useState<Ave[]>([]);
  const [showGalloList, setShowGalloList] = useState(false);
  const [selectedGallo, setSelectedGallo] = useState<string>('');
  const [showTrabajoModal, setShowTrabajoModal] = useState(false);
  const [selectedTrabajo, setSelectedTrabajo] = useState<number | null>(null);
  const [trabajoTiempo, setTrabajoTiempo] = useState('');
  const [showDescansoModal, setShowDescansoModal] = useState(false);
  const [diasDescanso, setDiasDescanso] = useState('');

  useEffect(() => {
    if (!isNew) {
      fetchCuido();
    }
    fetchGallos();
  }, [id]);

  const fetchCuido = async () => {
    try {
      const data = await api.get(`/cuido/${id}`);
      setCuido(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGallos = async () => {
    try {
      const data = await api.get('/aves', { tipo: 'gallo', estado: 'activo' });
      setGallos(data);
    } catch (error) {
      console.error('Error fetching gallos:', error);
    }
  };

  const handleCreateCuido = async () => {
    if (!selectedGallo) {
      Alert.alert('Error', 'Debes seleccionar un gallo');
      return;
    }

    setSaving(true);
    try {
      await api.post('/cuido', { ave_id: selectedGallo });
      Alert.alert('Éxito', 'Cuido creado correctamente');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTope = async (topeNum: 1 | 2) => {
    if (!cuido) return;

    try {
      await api.post(`/cuido/${cuido.id}/tope?tope_numero=${topeNum}`);
      fetchCuido();
      Alert.alert('Éxito', `Tope ${topeNum} registrado`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleTrabajo = async () => {
    if (!cuido || !selectedTrabajo || !trabajoTiempo) return;

    const tiempo = parseInt(trabajoTiempo);
    if (isNaN(tiempo) || tiempo < 1) {
      Alert.alert('Error', 'Ingresa un tiempo válido en minutos');
      return;
    }

    try {
      await api.post(`/cuido/${cuido.id}/trabajo?trabajo_numero=${selectedTrabajo}&tiempo_minutos=${tiempo}`);
      setShowTrabajoModal(false);
      setSelectedTrabajo(null);
      setTrabajoTiempo('');
      fetchCuido();
      Alert.alert('Éxito', `Trabajo ${selectedTrabajo} registrado`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDescanso = async () => {
    if (!cuido || !diasDescanso) return;

    const dias = parseInt(diasDescanso);
    if (isNaN(dias) || dias < 1 || dias > 20) {
      Alert.alert('Error', 'Los días deben ser entre 1 y 20');
      return;
    }

    try {
      await api.post(`/cuido/${cuido.id}/descanso?dias=${dias}`);
      setShowDescansoModal(false);
      setDiasDescanso('');
      fetchCuido();
      Alert.alert('Éxito', `Descanso de ${dias} días iniciado`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleFinalizarDescanso = async () => {
    if (!cuido) return;

    try {
      await api.post(`/cuido/${cuido.id}/finalizar-descanso`);
      fetchCuido();
      Alert.alert('Éxito', 'Descanso finalizado');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleFinalizar = () => {
    Alert.alert(
      'Finalizar Cuido',
      '¿Estás seguro de finalizar este cuido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            try {
              await api.post(`/cuido/${cuido?.id}/finalizar`);
              Alert.alert('Éxito', 'Cuido finalizado');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
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

  // New Cuido Form
  if (isNew) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo Cuido</Text>
          <TouchableOpacity
            onPress={handleCreateCuido}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveButtonText}>Crear</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Seleccionar Gallo</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowGalloList(!showGalloList)}
          >
            <View style={styles.selectButtonContent}>
              <RoosterIcon size={24} color="#f59e0b" />
              <Text style={styles.selectButtonText}>
                {selectedGallo
                  ? gallos.find(g => g.id === selectedGallo)?.codigo || 'Seleccionado'
                  : 'Seleccionar gallo'}
              </Text>
            </View>
            <Ionicons
              name={showGalloList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>

          {showGalloList && (
            <View style={styles.selectList}>
              {gallos.length === 0 ? (
                <Text style={styles.noDataText}>No hay gallos activos</Text>
              ) : (
                gallos.map((gallo) => (
                  <TouchableOpacity
                    key={gallo.id}
                    style={[
                      styles.selectItem,
                      selectedGallo === gallo.id && styles.selectItemActive,
                    ]}
                    onPress={() => {
                      setSelectedGallo(gallo.id);
                      setShowGalloList(false);
                    }}
                  >
                    <View style={styles.galloItemContent}>
                      {gallo.foto_principal ? (
                        <Image source={{ uri: gallo.foto_principal }} style={styles.galloPhoto} />
                      ) : (
                        <View style={styles.galloPhotoPlaceholder}>
                          <RoosterIcon size={20} color="#6b7280" />
                        </View>
                      )}
                      <View style={styles.galloInfo}>
                        <Text style={styles.galloCodigo}>{gallo.codigo}</Text>
                        {gallo.nombre && <Text style={styles.galloNombre}>{gallo.nombre}</Text>}
                      </View>
                    </View>
                    {selectedGallo === gallo.id && (
                      <Ionicons name="checkmark" size={20} color="#f59e0b" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <Text style={styles.infoText}>
              Al crear un cuido podrás registrar topes, trabajos con tiempos y periodos de descanso para preparar al gallo.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Cuido Detail View
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuido</Text>
        <TouchableOpacity onPress={handleFinalizar} style={styles.finalizarButton}>
          <Text style={styles.finalizarText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Gallo Info */}
        <View style={styles.galloCard}>
          {cuido?.ave_foto ? (
            <Image source={{ uri: cuido.ave_foto }} style={styles.galloDetailPhoto} />
          ) : (
            <View style={styles.galloDetailPhotoPlaceholder}>
              <RoosterIcon size={40} color="#f59e0b" />
            </View>
          )}
          <View style={styles.galloDetailInfo}>
            <Text style={styles.galloDetailCodigo}>{cuido?.ave_codigo}</Text>
            {cuido?.ave_nombre && <Text style={styles.galloDetailNombre}>{cuido.ave_nombre}</Text>}
            <View style={styles.galloDetailTags}>
              {cuido?.ave_color && <Text style={styles.galloDetailTag}>{cuido.ave_color}</Text>}
              {cuido?.ave_linea && <Text style={styles.galloDetailTag}>{cuido.ave_linea}</Text>}
            </View>
          </View>
          {cuido?.en_descanso && (
            <View style={styles.descansoIndicator}>
              <Ionicons name="bed" size={20} color="#3b82f6" />
              <Text style={styles.descansoIndicatorText}>En descanso</Text>
            </View>
          )}
        </View>

        {/* Descanso Info */}
        {cuido?.en_descanso && (
          <View style={styles.descansoCard}>
            <View style={styles.descansoHeader}>
              <Ionicons name="bed" size={24} color="#3b82f6" />
              <Text style={styles.descansoTitle}>Período de Descanso</Text>
            </View>
            <Text style={styles.descansoInfo}>
              {cuido.dias_descanso} días de descanso
            </Text>
            <Text style={styles.descansoFecha}>
              Finaliza: {cuido.fecha_fin_descanso}
            </Text>
            <TouchableOpacity
              style={styles.finalizarDescansoButton}
              onPress={handleFinalizarDescanso}
            >
              <Text style={styles.finalizarDescansoText}>Terminar Descanso</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Topes Section */}
        <Text style={styles.sectionTitle}>Topes</Text>
        <View style={styles.topesContainer}>
          <TouchableOpacity
            style={[
              styles.topeCard,
              cuido?.tope1_completado && styles.topeCardCompleted,
            ]}
            onPress={() => !cuido?.tope1_completado && handleTope(1)}
            disabled={cuido?.tope1_completado || cuido?.en_descanso}
          >
            <View style={[
              styles.topeIcon,
              cuido?.tope1_completado && styles.topeIconCompleted,
            ]}>
              {cuido?.tope1_completado ? (
                <Ionicons name="checkmark" size={24} color="#000" />
              ) : (
                <Text style={styles.topeNumber}>1</Text>
              )}
            </View>
            <Text style={[
              styles.topeLabel,
              cuido?.tope1_completado && styles.topeLabelCompleted,
            ]}>
              Tope 1
            </Text>
            {cuido?.tope1_fecha && (
              <Text style={styles.topeFecha}>{cuido.tope1_fecha}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.topeCard,
              cuido?.tope2_completado && styles.topeCardCompleted,
            ]}
            onPress={() => !cuido?.tope2_completado && handleTope(2)}
            disabled={cuido?.tope2_completado || cuido?.en_descanso}
          >
            <View style={[
              styles.topeIcon,
              cuido?.tope2_completado && styles.topeIconCompleted,
            ]}>
              {cuido?.tope2_completado ? (
                <Ionicons name="checkmark" size={24} color="#000" />
              ) : (
                <Text style={styles.topeNumber}>2</Text>
              )}
            </View>
            <Text style={[
              styles.topeLabel,
              cuido?.tope2_completado && styles.topeLabelCompleted,
            ]}>
              Tope 2
            </Text>
            {cuido?.tope2_fecha && (
              <Text style={styles.topeFecha}>{cuido.tope2_fecha}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Trabajos Section */}
        <Text style={styles.sectionTitle}>Trabajos</Text>
        <View style={styles.trabajosContainer}>
          {[1, 2, 3, 4, 5].map((num) => {
            const trabajo = cuido?.trabajos?.find(t => t.numero === num);
            return (
              <TouchableOpacity
                key={num}
                style={[
                  styles.trabajoCard,
                  trabajo?.completado && styles.trabajoCardCompleted,
                ]}
                onPress={() => {
                  if (!trabajo?.completado && !cuido?.en_descanso) {
                    setSelectedTrabajo(num);
                    setShowTrabajoModal(true);
                  }
                }}
                disabled={trabajo?.completado || cuido?.en_descanso}
              >
                <View style={[
                  styles.trabajoIcon,
                  trabajo?.completado && styles.trabajoIconCompleted,
                ]}>
                  {trabajo?.completado ? (
                    <Ionicons name="checkmark" size={20} color="#000" />
                  ) : (
                    <Text style={styles.trabajoNumber}>{num}</Text>
                  )}
                </View>
                <Text style={[
                  styles.trabajoLabel,
                  trabajo?.completado && styles.trabajoLabelCompleted,
                ]}>
                  Trabajo {num}
                </Text>
                {trabajo?.completado && trabajo.tiempo_minutos && (
                  <Text style={styles.trabajoTiempo}>{trabajo.tiempo_minutos} min</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Descanso Section */}
        {!cuido?.en_descanso && (
          <>
            <Text style={styles.sectionTitle}>Descanso</Text>
            <TouchableOpacity
              style={styles.descansoButton}
              onPress={() => setShowDescansoModal(true)}
            >
              <Ionicons name="bed" size={24} color="#3b82f6" />
              <Text style={styles.descansoButtonText}>Iniciar Período de Descanso</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Trabajo Modal */}
      {showTrabajoModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Registrar Trabajo {selectedTrabajo}</Text>
            <Text style={styles.modalLabel}>Tiempo (minutos)</Text>
            <TextInput
              style={styles.modalInput}
              value={trabajoTiempo}
              onChangeText={setTrabajoTiempo}
              keyboardType="numeric"
              placeholder="Ej: 15, 30, 45"
              placeholderTextColor="#6b7280"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowTrabajoModal(false);
                  setSelectedTrabajo(null);
                  setTrabajoTiempo('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleTrabajo}
              >
                <Text style={styles.modalConfirmText}>Registrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Descanso Modal */}
      {showDescansoModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Iniciar Descanso</Text>
            <Text style={styles.modalLabel}>Días de descanso (1-20)</Text>
            <TextInput
              style={styles.modalInput}
              value={diasDescanso}
              onChangeText={setDiasDescanso}
              keyboardType="numeric"
              placeholder="Ej: 5, 10, 15"
              placeholderTextColor="#6b7280"
            />
            <View style={styles.diasButtons}>
              {[5, 7, 10, 14, 20].map((dias) => (
                <TouchableOpacity
                  key={dias}
                  style={[
                    styles.diasButton,
                    diasDescanso === dias.toString() && styles.diasButtonActive,
                  ]}
                  onPress={() => setDiasDescanso(dias.toString())}
                >
                  <Text style={[
                    styles.diasButtonText,
                    diasDescanso === dias.toString() && styles.diasButtonTextActive,
                  ]}>
                    {dias}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowDescansoModal(false);
                  setDiasDescanso('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleDescanso}
              >
                <Text style={styles.modalConfirmText}>Iniciar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  headerTitle: {
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
  finalizarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  finalizarText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  selectList: {
    backgroundColor: '#141414',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    maxHeight: 300,
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  selectItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  galloItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  galloPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  galloPhotoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galloInfo: {
    marginLeft: 12,
  },
  galloCodigo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  galloNombre: {
    fontSize: 13,
    color: '#6b7280',
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  galloCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  galloDetailPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  galloDetailPhotoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galloDetailInfo: {
    flex: 1,
    marginLeft: 16,
  },
  galloDetailCodigo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  galloDetailNombre: {
    fontSize: 15,
    color: '#9ca3af',
    marginTop: 2,
  },
  galloDetailTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  galloDetailTag: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  descansoIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 10,
    borderRadius: 12,
  },
  descansoIndicatorText: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 4,
  },
  descansoCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  descansoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  descansoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  descansoInfo: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  descansoFecha: {
    fontSize: 13,
    color: '#9ca3af',
  },
  finalizarDescansoButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  finalizarDescansoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  topesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  topeCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  topeCardCompleted: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  topeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  topeIconCompleted: {
    backgroundColor: '#22c55e',
  },
  topeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  topeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  topeLabelCompleted: {
    color: '#22c55e',
  },
  topeFecha: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  trabajosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  trabajoCard: {
    width: '31%',
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  trabajoCardCompleted: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  trabajoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trabajoIconCompleted: {
    backgroundColor: '#22c55e',
  },
  trabajoNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  trabajoLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  trabajoLabelCompleted: {
    color: '#22c55e',
  },
  trabajoTiempo: {
    fontSize: 11,
    color: '#22c55e',
    marginTop: 4,
    fontWeight: '600',
  },
  descansoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  descansoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  diasButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  diasButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  diasButtonActive: {
    backgroundColor: '#3b82f6',
  },
  diasButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  diasButtonTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
});
