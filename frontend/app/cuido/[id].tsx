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
  Modal,
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

interface Actividad {
  id: string;
  tipo: 'tope' | 'trabajo';
  numero: number;
  tiempo_minutos?: number;
  fecha: string;
  notas?: string;
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
  actividades: Actividad[];
  en_descanso: boolean;
  dias_descanso?: number;
  fecha_inicio_descanso?: string;
  fecha_fin_descanso?: string;
  notas?: string;
}

const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  greenDark: '#1a5d3a',
  greenLight: 'rgba(26, 93, 58, 0.15)',
  redDeep: '#8b1a1a',
  redLight: 'rgba(139, 26, 26, 0.15)',
  blue: '#3b82f6',
  blueLight: 'rgba(59, 130, 246, 0.15)',
  grayDark: '#1a1a1a',
  grayMedium: '#333333',
  grayLight: '#6b7280',
  white: '#ffffff',
  background: '#1a1a1a',
  green: '#22c55e',
};

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
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [actividadTipo, setActividadTipo] = useState<'tope' | 'trabajo' | null>(null);
  const [actividadTiempo, setActividadTiempo] = useState('');
  const [actividadFecha, setActividadFecha] = useState(new Date().toISOString().split('T')[0]);
  const [actividadNotas, setActividadNotas] = useState('');
  
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
      // Transform old format to new format if needed
      const actividades: Actividad[] = data.actividades || [];
      
      // Migrate old tope fields if present
      if (data.tope1_completado && !actividades.find(a => a.tipo === 'tope' && a.numero === 1)) {
        actividades.push({
          id: 'tope1',
          tipo: 'tope',
          numero: 1,
          fecha: data.tope1_fecha || data.fecha_inicio,
          notas: data.tope1_notas,
        });
      }
      if (data.tope2_completado && !actividades.find(a => a.tipo === 'tope' && a.numero === 2)) {
        actividades.push({
          id: 'tope2',
          tipo: 'tope',
          numero: 2,
          fecha: data.tope2_fecha || data.fecha_inicio,
          notas: data.tope2_notas,
        });
      }
      
      // Migrate old trabajos if present
      if (data.trabajos && Array.isArray(data.trabajos)) {
        data.trabajos.forEach((t: any) => {
          if (t.completado && !actividades.find(a => a.tipo === 'trabajo' && a.numero === t.numero)) {
            actividades.push({
              id: `trabajo${t.numero}`,
              tipo: 'trabajo',
              numero: t.numero,
              tiempo_minutos: t.tiempo_minutos,
              fecha: t.fecha_completado || data.fecha_inicio,
              notas: t.notas,
            });
          }
        });
      }
      
      setCuido({ ...data, actividades });
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

  const handleAddActividad = async () => {
    if (!cuido || !actividadTipo) return;

    const topeCount = cuido.actividades.filter(a => a.tipo === 'tope').length;
    const trabajoCount = cuido.actividades.filter(a => a.tipo === 'trabajo').length;
    const numero = actividadTipo === 'tope' ? topeCount + 1 : trabajoCount + 1;

    if (actividadTipo === 'trabajo' && !actividadTiempo) {
      Alert.alert('Error', 'Ingresa el tiempo del trabajo');
      return;
    }

    try {
      if (actividadTipo === 'tope') {
        await api.post(`/cuido/${cuido.id}/tope?tope_numero=${numero}`);
      } else {
        const tiempo = parseInt(actividadTiempo);
        await api.post(`/cuido/${cuido.id}/trabajo?trabajo_numero=${numero}&tiempo_minutos=${tiempo}`);
      }
      
      // Actualizar localmente
      const newActividad: Actividad = {
        id: `${actividadTipo}${numero}`,
        tipo: actividadTipo,
        numero,
        tiempo_minutos: actividadTipo === 'trabajo' ? parseInt(actividadTiempo) : undefined,
        fecha: actividadFecha,
        notas: actividadNotas || undefined,
      };
      
      setCuido({
        ...cuido,
        actividades: [...cuido.actividades, newActividad],
      });
      
      resetAddModal();
      Alert.alert('Éxito', `${actividadTipo === 'tope' ? 'Tope' : 'Trabajo'} ${numero} registrado`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const resetAddModal = () => {
    setShowAddModal(false);
    setActividadTipo(null);
    setActividadTiempo('');
    setActividadFecha(new Date().toISOString().split('T')[0]);
    setActividadNotas('');
  };

  const handleDescanso = async () => {
    if (!cuido || !diasDescanso) return;

    const dias = parseInt(diasDescanso);
    if (isNaN(dias) || dias < 1 || dias > 30) {
      Alert.alert('Error', 'Los días deben ser entre 1 y 30');
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
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

  // New Cuido Form
  if (isNew) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
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
              <RoosterIcon size={24} color={COLORS.gold} />
              <Text style={styles.selectButtonText}>
                {selectedGallo
                  ? gallos.find(g => g.id === selectedGallo)?.codigo || 'Seleccionado'
                  : 'Seleccionar gallo'}
              </Text>
            </View>
            <Ionicons
              name={showGalloList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.grayLight}
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
                          <RoosterIcon size={20} color={COLORS.grayLight} />
                        </View>
                      )}
                      <View style={styles.galloInfo}>
                        <Text style={styles.galloCodigo}>{gallo.codigo}</Text>
                        {gallo.nombre && <Text style={styles.galloNombre}>{gallo.nombre}</Text>}
                      </View>
                    </View>
                    {selectedGallo === gallo.id && (
                      <Ionicons name="checkmark" size={20} color={COLORS.gold} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={COLORS.blue} />
            <Text style={styles.infoText}>
              Al crear un cuido podrás agregar topes, trabajos y periodos de descanso según las necesidades del gallo.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Cuido Detail View
  const topes = cuido?.actividades.filter(a => a.tipo === 'tope') || [];
  const trabajos = cuido?.actividades.filter(a => a.tipo === 'trabajo') || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
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
              <RoosterIcon size={40} color={COLORS.gold} />
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
              <Ionicons name="bed" size={20} color={COLORS.blue} />
              <Text style={styles.descansoIndicatorText}>Descansando</Text>
            </View>
          )}
        </View>

        {/* Descanso Info */}
        {cuido?.en_descanso && (
          <View style={styles.descansoCard}>
            <View style={styles.descansoHeader}>
              <Ionicons name="bed" size={24} color={COLORS.blue} />
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

        {/* Actividades Section - Topes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Topes ({topes.length})</Text>
          {!cuido?.en_descanso && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setActividadTipo('tope');
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={22} color={COLORS.gold} />
            </TouchableOpacity>
          )}
        </View>
        
        {topes.length === 0 ? (
          <View style={styles.emptyActividad}>
            <Ionicons name="flash-outline" size={32} color={COLORS.grayLight} />
            <Text style={styles.emptyActividadText}>Sin topes registrados</Text>
            <Text style={styles.emptyActividadHint}>Presiona + para agregar</Text>
          </View>
        ) : (
          <View style={styles.actividadesGrid}>
            {topes.sort((a, b) => a.numero - b.numero).map((tope) => (
              <View key={tope.id} style={styles.actividadCard}>
                <View style={styles.actividadIconCompleted}>
                  <Ionicons name="flash" size={20} color="#000" />
                </View>
                <Text style={styles.actividadLabel}>Tope {tope.numero}</Text>
                <Text style={styles.actividadFecha}>{formatDate(tope.fecha)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actividades Section - Trabajos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trabajos ({trabajos.length})</Text>
          {!cuido?.en_descanso && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setActividadTipo('trabajo');
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={22} color={COLORS.gold} />
            </TouchableOpacity>
          )}
        </View>
        
        {trabajos.length === 0 ? (
          <View style={styles.emptyActividad}>
            <Ionicons name="barbell-outline" size={32} color={COLORS.grayLight} />
            <Text style={styles.emptyActividadText}>Sin trabajos registrados</Text>
            <Text style={styles.emptyActividadHint}>Presiona + para agregar</Text>
          </View>
        ) : (
          <View style={styles.actividadesGrid}>
            {trabajos.sort((a, b) => a.numero - b.numero).map((trabajo) => (
              <View key={trabajo.id} style={styles.actividadCard}>
                <View style={styles.actividadIconCompleted}>
                  <Ionicons name="barbell" size={20} color="#000" />
                </View>
                <Text style={styles.actividadLabel}>Trabajo {trabajo.numero}</Text>
                {trabajo.tiempo_minutos && (
                  <Text style={styles.actividadTiempo}>{trabajo.tiempo_minutos} min</Text>
                )}
                <Text style={styles.actividadFecha}>{formatDate(trabajo.fecha)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Descanso Section */}
        {!cuido?.en_descanso && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Descanso</Text>
            <TouchableOpacity
              style={styles.descansoButton}
              onPress={() => setShowDescansoModal(true)}
            >
              <Ionicons name="bed" size={24} color={COLORS.blue} />
              <Text style={styles.descansoButtonText}>Iniciar Período de Descanso</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Actividad Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={resetAddModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Agregar {actividadTipo === 'tope' ? 'Tope' : 'Trabajo'}
            </Text>
            
            {actividadTipo === null && (
              <>
                <Text style={styles.modalLabel}>Tipo de actividad</Text>
                <View style={styles.tipoButtons}>
                  <TouchableOpacity
                    style={[styles.tipoButton, actividadTipo === 'tope' && styles.tipoButtonActive]}
                    onPress={() => setActividadTipo('tope')}
                  >
                    <Ionicons name="flash" size={24} color={COLORS.gold} />
                    <Text style={styles.tipoButtonText}>Tope</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tipoButton, actividadTipo === 'trabajo' && styles.tipoButtonActive]}
                    onPress={() => setActividadTipo('trabajo')}
                  >
                    <Ionicons name="barbell" size={24} color={COLORS.gold} />
                    <Text style={styles.tipoButtonText}>Trabajo</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            {actividadTipo === 'trabajo' && (
              <>
                <Text style={styles.modalLabel}>Tiempo (minutos)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={actividadTiempo}
                  onChangeText={setActividadTiempo}
                  keyboardType="numeric"
                  placeholder="Ej: 15, 30, 45"
                  placeholderTextColor={COLORS.grayLight}
                />
                <View style={styles.tiempoButtons}>
                  {[10, 15, 20, 30, 45].map((min) => (
                    <TouchableOpacity
                      key={min}
                      style={[
                        styles.tiempoButton,
                        actividadTiempo === min.toString() && styles.tiempoButtonActive,
                      ]}
                      onPress={() => setActividadTiempo(min.toString())}
                    >
                      <Text style={[
                        styles.tiempoButtonText,
                        actividadTiempo === min.toString() && styles.tiempoButtonTextActive,
                      ]}>
                        {min}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.modalLabel}>Fecha</Text>
            <TextInput
              style={styles.modalInput}
              value={actividadFecha}
              onChangeText={setActividadFecha}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.grayLight}
            />
            
            <Text style={styles.modalLabel}>Notas (opcional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              value={actividadNotas}
              onChangeText={setActividadNotas}
              placeholder="Observaciones..."
              placeholderTextColor={COLORS.grayLight}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={resetAddModal}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAddActividad}
              >
                <Text style={styles.modalConfirmText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Descanso Modal */}
      <Modal
        visible={showDescansoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDescansoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Iniciar Descanso</Text>
            <Text style={styles.modalLabel}>Días de descanso (1-30)</Text>
            <TextInput
              style={styles.modalInput}
              value={diasDescanso}
              onChangeText={setDiasDescanso}
              keyboardType="numeric"
              placeholder="Ej: 5, 10, 15"
              placeholderTextColor={COLORS.grayLight}
            />
            <View style={styles.diasButtons}>
              {[5, 7, 10, 14, 21].map((dias) => (
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
      </Modal>
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
    borderBottomColor: COLORS.grayMedium,
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
    color: COLORS.white,
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
  finalizarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  finalizarText: {
    fontSize: 14,
    color: COLORS.redDeep,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: COLORS.white,
  },
  selectList: {
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
    maxHeight: 300,
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayMedium,
  },
  selectItemActive: {
    backgroundColor: COLORS.goldLight,
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
    backgroundColor: COLORS.grayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galloInfo: {
    marginLeft: 12,
  },
  galloCodigo: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  galloNombre: {
    fontSize: 13,
    color: COLORS.grayLight,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.grayLight,
    textAlign: 'center',
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.blueLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.grayLight,
    lineHeight: 20,
  },
  galloCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayDark,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
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
    backgroundColor: COLORS.grayMedium,
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
    color: COLORS.white,
  },
  galloDetailNombre: {
    fontSize: 15,
    color: COLORS.grayLight,
    marginTop: 2,
  },
  galloDetailTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  galloDetailTag: {
    fontSize: 12,
    color: COLORS.grayLight,
    backgroundColor: COLORS.grayMedium,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  descansoIndicator: {
    alignItems: 'center',
    backgroundColor: COLORS.blueLight,
    padding: 10,
    borderRadius: 12,
  },
  descansoIndicatorText: {
    fontSize: 11,
    color: COLORS.blue,
    marginTop: 4,
  },
  descansoCard: {
    backgroundColor: COLORS.blueLight,
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
    color: COLORS.blue,
  },
  descansoInfo: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 4,
  },
  descansoFecha: {
    fontSize: 13,
    color: COLORS.grayLight,
  },
  finalizarDescansoButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  finalizarDescansoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Actividades Grid
  actividadesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actividadCard: {
    width: '31%',
    backgroundColor: COLORS.greenLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  actividadIconCompleted: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actividadLabel: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '600',
  },
  actividadTiempo: {
    fontSize: 11,
    color: COLORS.green,
    marginTop: 2,
  },
  actividadFecha: {
    fontSize: 10,
    color: COLORS.grayLight,
    marginTop: 4,
  },
  emptyActividad: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
    borderStyle: 'dashed',
  },
  emptyActividadText: {
    fontSize: 14,
    color: COLORS.grayLight,
    marginTop: 8,
  },
  emptyActividadHint: {
    fontSize: 12,
    color: COLORS.gold,
    marginTop: 4,
  },
  descansoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blueLight,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  descansoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
  },
  // Modal Styles
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
    color: COLORS.white,
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
    color: COLORS.white,
    marginBottom: 16,
  },
  modalInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  tipoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tipoButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.grayMedium,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.grayMedium,
  },
  tipoButtonActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldLight,
  },
  tipoButtonText: {
    fontSize: 14,
    color: COLORS.white,
    marginTop: 8,
    fontWeight: '600',
  },
  tiempoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tiempoButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.grayMedium,
  },
  tiempoButtonActive: {
    backgroundColor: COLORS.gold,
  },
  tiempoButtonText: {
    fontSize: 14,
    color: COLORS.grayLight,
    fontWeight: '600',
  },
  tiempoButtonTextActive: {
    color: '#000',
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
    backgroundColor: COLORS.grayMedium,
  },
  diasButtonActive: {
    backgroundColor: COLORS.blue,
  },
  diasButtonText: {
    fontSize: 14,
    color: COLORS.grayLight,
    fontWeight: '600',
  },
  diasButtonTextActive: {
    color: COLORS.white,
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
});
