import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';

interface Camada {
  id: string;
  cruce_id: string;
  fecha_puesta_inicio?: string;
  cantidad_huevos?: number;
  fecha_incubacion_inicio?: string;
  metodo?: string;
  fecha_nacimiento?: string;
  cantidad_nacidos?: number;
  pollitos_nacidos?: number;
  criador_nombre?: string;
  criador?: string;
  notas?: string;
  created_at?: string;
  cruce?: {
    id?: string;
    padre_id?: string;
    madre_id?: string;
    padre_externo?: string;
    madre_externo?: string;
    fecha?: string;
    estado?: string;
  };
}

interface Cruce {
  id: string;
  padre_id?: string;
  madre_id?: string;
  padre_externo?: string;
  madre_externo?: string;
  fecha?: string;
  estado?: string;
}

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  tipo: string;
  estado?: string;
  color?: string;
  color_placa?: string;
  cresta?: string;
  linea?: string;
  foto_principal?: string;
  foto?: string;
  imagen?: string;
  image_url?: string;
  fecha_nacimiento?: string;
  castado_por?: string;
  padre_id?: string;
  madre_id?: string;
  padre_externo?: string;
  madre_externo?: string;
  camada_id?: string;
  cruce_id?: string;
}

const defaultGalloImg = require('../../../assets/images/gallo.png');
const defaultGallinaImg = require('../../../assets/images/gallina.png');

const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  background: '#f5f5f5',
  cardBg: '#ffffff',
  border: '#e0e0e0',
  text: '#1a1a1a',
  textSoft: '#555555',
  textMuted: '#9ca3af',
  green: '#22c55e',
  greenLight: 'rgba(34, 197, 94, 0.12)',
  blue: '#3b82f6',
  blueLight: 'rgba(59, 130, 246, 0.12)',
  red: '#ef4444',
};

function getDefaultAnimalImage(tipo: 'gallo' | 'gallina') {
  return tipo === 'gallo' ? defaultGalloImg : defaultGallinaImg;
}

export default function CamadaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [camada, setCamada] = useState<Camada | null>(null);
  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [aves, setAves] = useState<Ave[]>([]);

  const extractErrorMessage = (error: any) => {
    return (
      error?.response?.data?.detail?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Ocurrió un error'
    );
  };

  const fetchData = useCallback(async (manualRefresh = false) => {
    if (!id) return;

    try {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [camadaRaw, crucesRaw, avesRaw] = await Promise.all([
        api.get(`/camadas/${id}`),
        api.get('/cruces'),
        api.get('/aves'),
      ]);

      const camadaData = Array.isArray(camadaRaw)
        ? camadaRaw[0]
        : Array.isArray((camadaRaw as any)?.data)
        ? (camadaRaw as any).data[0]
        : (camadaRaw as any)?.data || camadaRaw;

      const crucesData = Array.isArray(crucesRaw)
        ? crucesRaw
        : Array.isArray((crucesRaw as any)?.data)
        ? (crucesRaw as any).data
        : [];

      const avesData = Array.isArray(avesRaw)
        ? avesRaw
        : Array.isArray((avesRaw as any)?.data)
        ? (avesRaw as any).data
        : [];

      setCamada(camadaData || null);
      setCruces(crucesData);
      setAves(avesData);
    } catch (error: any) {
      console.error('Error fetching camada detail:', error);
      Alert.alert('Error', extractErrorMessage(error));
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      fetchData(false);
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Eliminar camada',
      '¿Seguro que quieres eliminar esta camada? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/camadas/${id}`);
              Alert.alert('Éxito', 'Camada eliminada correctamente');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', extractErrorMessage(error));
            }
          },
        },
      ]
    );
  }, [id, router]);
  
  const selectedCruce = useMemo(() => {
    if (camada?.cruce) {
      return {
        id: camada.cruce.id || camada.cruce_id,
        padre_id: camada.cruce.padre_id,
        madre_id: camada.cruce.madre_id,
        padre_externo: camada.cruce.padre_externo,
        madre_externo: camada.cruce.madre_externo,
        fecha: camada.cruce.fecha,
        estado: camada.cruce.estado,
      } as Cruce;
    }

    if (!camada?.cruce_id) return null;
    return cruces.find((c) => c.id === camada.cruce_id) || null;
  }, [cruces, camada]);

  const padreAve = useMemo(() => {
    if (!selectedCruce?.padre_id) return null;
    return aves.find((a) => a.id === selectedCruce.padre_id) || null;
  }, [selectedCruce, aves]);

  const madreAve = useMemo(() => {
    if (!selectedCruce?.madre_id) return null;
    return aves.find((a) => a.id === selectedCruce.madre_id) || null;
  }, [selectedCruce, aves]);

  const cruceDisplay = useMemo(() => {
    const padre = padreAve?.codigo || selectedCruce?.padre_externo || '---';
    const madre = madreAve?.codigo || selectedCruce?.madre_externo || '---';

    if (!selectedCruce && !camada?.cruce_id) return '-';

    return `${padre} x ${madre}`;
  }, [padreAve, madreAve, selectedCruce, camada?.cruce_id]);

  const criadorDisplay = useMemo(() => {
    return camada?.criador || camada?.criador_nombre || '-';
  }, [camada]);

  const avesDeLaCamada = useMemo(() => {
    if (!camada) return [];

    const porCamadaId = aves.filter(
      (ave) => String(ave.camada_id || '') === String(camada.id)
    );

    if (porCamadaId.length > 0) {
      return porCamadaId;
    }

    if (!selectedCruce) return [];

    return aves.filter((ave) => {
      const mismaFecha =
        String(ave.fecha_nacimiento || '') === String(camada.fecha_nacimiento || '');

      const mismoPadre =
        String(ave.padre_id || '') === String(selectedCruce.padre_id || '') &&
        String(ave.padre_externo || '') === String(selectedCruce.padre_externo || '');

      const mismaMadre =
        String(ave.madre_id || '') === String(selectedCruce.madre_id || '') &&
        String(ave.madre_externo || '') === String(selectedCruce.madre_externo || '');

      return mismaFecha && mismoPadre && mismaMadre;
    });
  }, [aves, camada, selectedCruce]);

  const getAnimalImageSource = (animal: Ave) => {
    const imageUri =
      animal.foto_principal || animal.foto || animal.imagen || animal.image_url;

    if (imageUri) {
      return { uri: imageUri };
    }

    return getDefaultAnimalImage(animal.tipo as 'gallo' | 'gallina');
  };

  const getEstadoCamada = (item: Camada | null) => {
    if (!item) {
      return { label: 'Registrada', color: COLORS.textSoft, bg: 'rgba(160,160,160,0.15)' };
    }

    if ((item.cantidad_nacidos || 0) > 0 || (item.pollitos_nacidos || 0) > 0) {
      return { label: 'Nacidos', color: COLORS.green, bg: COLORS.greenLight };
    }

    if (item.fecha_incubacion_inicio) {
      return { label: 'Incubando', color: COLORS.blue, bg: COLORS.blueLight };
    }

    if (item.fecha_puesta_inicio) {
      return { label: 'En puesta', color: COLORS.gold, bg: COLORS.goldLight };
    }

    return { label: 'Registrada', color: COLORS.textSoft, bg: 'rgba(160,160,160,0.15)' };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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

  const estado = getEstadoCamada(camada);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
    <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
  </TouchableOpacity>

  <Text style={styles.headerTitle}>Detalle Camada</Text>

  <View style={styles.headerActions}>
    <TouchableOpacity
      style={styles.editButton}
      onPress={() => router.push(`/camada/${id}`)}
    >
      <Ionicons name="create-outline" size={22} color={COLORS.gold} />
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.deleteButton}
      onPress={handleDelete}
    >
      <Ionicons name="trash-outline" size={22} color={COLORS.red} />
    </TouchableOpacity>
  </View>
</View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="egg" size={28} color={COLORS.gold} />
            </View>

            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>
                Camada del {formatDate(camada?.fecha_puesta_inicio || camada?.created_at)}
              </Text>
              <Text style={styles.heroSubtitle}>
                {camada?.metodo === 'gallina' ? 'Método: Gallina' : 'Método: Incubadora'}
              </Text>
            </View>

            <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
              <Text style={[styles.estadoText, { color: estado.color }]}>
                {estado.label}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{camada?.cantidad_huevos || 0}</Text>
              <Text style={styles.statLabel}>Huevos</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {camada?.cantidad_nacidos || camada?.pollitos_nacidos || avesDeLaCamada.length || 0}
              </Text>
              <Text style={styles.statLabel}>Nacidos</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{avesDeLaCamada.length}</Text>
              <Text style={styles.statLabel}>Aves registradas</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la camada</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
              <Text style={styles.infoValue}>{formatDate(camada?.fecha_nacimiento)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Criador</Text>
              <Text style={styles.infoValue}>{criadorDisplay}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cruce</Text>
              <Text style={styles.infoValue}>{cruceDisplay}</Text>
            </View>

            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Notas</Text>
              <Text style={styles.infoValue}>{camada?.notas || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Padres</Text>

          <View style={styles.parentCard}>
            <View style={[styles.parentIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.14)' }]}>
              <Ionicons name="male" size={26} color={COLORS.blue} />
            </View>
            <View style={styles.parentTextWrap}>
              <Text style={styles.parentTitle}>Padre</Text>
              <Text style={styles.parentValue}>
                {padreAve?.codigo || selectedCruce?.padre_externo || 'No asignado'}
              </Text>
            </View>
          </View>

          <View style={styles.parentCard}>
            <View style={[styles.parentIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.14)' }]}>
              <Ionicons name="female" size={26} color={COLORS.green} />
            </View>
            <View style={styles.parentTextWrap}>
              <Text style={styles.parentTitle}>Madre</Text>
              <Text style={styles.parentValue}>
                {madreAve?.codigo || selectedCruce?.madre_externo || 'No asignada'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Aves registradas</Text>
            <TouchableOpacity
              style={styles.addButtonSmall}
              onPress={() => router.push(`/camada/${id}`)}
            >
              <Ionicons name="add" size={18} color="#000" />
              <Text style={styles.addButtonSmallText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {avesDeLaCamada.length === 0 ? (
            <View style={styles.emptyAnimalsCard}>
              <Ionicons name="albums-outline" size={38} color={COLORS.textMuted} />
              <Text style={styles.emptyAnimalsTitle}>No hay aves en esta camada</Text>
              <Text style={styles.emptyAnimalsText}>
                Entra a editar la camada y agrega las aves registradas.
              </Text>
            </View>
          ) : (
            avesDeLaCamada.map((animal) => (
              <TouchableOpacity
                key={animal.id}
                style={styles.animalCard}
                onPress={() => router.push(`/ave/detail/${animal.id}`)}
              >
                <Image
                  source={getAnimalImageSource(animal)}
                  style={styles.animalImage}
                  resizeMode="cover"
                />

                <View style={styles.animalInfo}>
                  <Text style={styles.animalCode}>{animal.codigo}</Text>

                  <Text style={styles.animalMeta}>
                    {animal.tipo === 'gallo' ? 'Macho' : 'Hembra'}
                    {animal.color ? ` • ${animal.color}` : ''}
                    {animal.estado ? ` • ${animal.estado}` : ''}
                  </Text>

                  <View style={styles.animalTagsRow}>
                    {animal.color_placa ? (
                      <View style={styles.tagChip}>
                        <Text style={styles.tagText}>{animal.color_placa}</Text>
                      </View>
                    ) : null}

                    {animal.cresta ? (
                      <View style={styles.tagChip}>
                        <Text style={styles.tagText}>{animal.cresta}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.goldLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSoft,
    marginTop: 3,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gold,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSoft,
    marginTop: 4,
  },
  section: {
    marginTop: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  addButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonSmallText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSoft,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  parentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  parentIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  parentTextWrap: {
    flex: 1,
  },
  parentTitle: {
    fontSize: 14,
    color: COLORS.textSoft,
    marginBottom: 4,
  },
  parentValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyAnimalsCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 26,
    alignItems: 'center',
  },
  emptyAnimalsTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyAnimalsText: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: 'center',
  },
  animalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  animalImage: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#eee',
  },
  animalInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  animalCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  animalMeta: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSoft,
  },
  animalTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: COLORS.goldLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
});