import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';

interface Cruce {
  id: string;
  padre_id: string;
  madre_id: string;
  padre_externo?: string;
  madre_externo?: string;
  fecha: string;
  objetivo?: string;
  estado: string;
  consanguinidad_estimado?: number;
  cantidad_huevos_pollitos?: number;
  cantidad_registrada?: number;
  criador_id?: string;
  criador_nombre?: string;
  marca_nacimiento?: string;
  marca_lado?: string;
  marca_color?: string;
  sin_marca?: boolean;
  marcas_nacimiento?: string[];
}

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  foto?: string;
  imagen?: string;
  image_url?: string;
}

const galloDefaultImg = require('../../assets/images/gallo.png');
const gallinaDefaultImg = require('../../assets/images/gallina.png');
const pieIzquierdoImg = require('../../assets/images/pie_izquierdo.png');
const pieDerechoImg = require('../../assets/images/pie_derecho.png');
const narizImg = require('../../assets/images/nariz.png');

type FootPointKey =
  | 'izquierda'
  | 'derecha'
  | 'centro'
  | 'arriba'
  | 'abajo'
  | 'superior_izquierda'
  | 'superior_derecha';

type NosePointKey = 'izquierda' | 'derecha' | 'centro' | 'arriba' | 'abajo';

type MarcaKey =
  | 'pie_izquierdo_izquierda'
  | 'pie_izquierdo_derecha'
  | 'pie_derecho_izquierda'
  | 'pie_derecho_derecha'
  | 'nariz_izquierda'
  | 'nariz_derecha'
  | 'marca_casera';

/**
 * IMPORTANTE:
 * Estas coordenadas son SOLO para el pie izquierdo.
 */
const LEFT_FOOT_MARK_POINTS: Record<FootPointKey, { x: number; y: number }> = {
  izquierda: { x: 45, y: 45 },
  derecha: { x: 56, y: 46 },
  centro: { x: 48, y: 52 },
  arriba: { x: 48, y: 28 },
  abajo: { x: 48, y: 78 },
  superior_izquierda: { x: 34, y: 32 },
  superior_derecha: { x: 62, y: 32 },
};

/**
 * IMPORTANTE:
 * Estas coordenadas son SOLO para el pie derecho.
 */
const RIGHT_FOOT_MARK_POINTS: Record<FootPointKey, { x: number; y: number }> = {
  izquierda: { x: 49, y: 42 },
  derecha: { x: 60, y: 43 },
  centro: { x: 44, y: 52 },
  arriba: { x: 44, y: 28 },
  abajo: { x: 44, y: 78 },
  superior_izquierda: { x: 28, y: 32 },
  superior_derecha: { x: 56, y: 32 },
};

const NOSE_MARK_POINTS: Record<NosePointKey, { x: number; y: number }> = {
  izquierda: { x: 38, y: 35 },
  derecha: { x: 53, y: 35 },
  centro: { x: 50, y: 54 },
  arriba: { x: 50, y: 50 },
  abajo: { x: 50, y: 72 },
};

function normalizeText(value?: string | null) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getNormalizedMarcaLado(value?: string | null): string {
  const lado = normalizeText(value);

  if (!lado) return '';

  if (
    lado.includes('superior izquierda') ||
    lado.includes('arriba izquierda') ||
    lado.includes('arriba-izquierda')
  ) {
    return 'superior_izquierda';
  }

  if (
    lado.includes('superior derecha') ||
    lado.includes('arriba derecha') ||
    lado.includes('arriba-derecha')
  ) {
    return 'superior_derecha';
  }

  if (lado.includes('izquierda')) return 'izquierda';
  if (lado.includes('derecha')) return 'derecha';
  if (lado.includes('centro')) return 'centro';
  if (lado.includes('arriba')) return 'arriba';
  if (lado.includes('abajo')) return 'abajo';

  return lado;
}

function getMarcaKeys(item: Cruce): MarcaKey[] {
  if (Array.isArray(item.marcas_nacimiento) && item.marcas_nacimiento.length > 0) {
    return item.marcas_nacimiento.filter(Boolean) as MarcaKey[];
  }

  const marca = normalizeText(item.marca_nacimiento);
  const lado = getNormalizedMarcaLado(item.marca_lado);

  if (marca === 'marca_casera') {
    return ['marca_casera'];
  }

  if (
    (marca === 'pie_izquierdo' || marca === 'pie_derecho' || marca === 'nariz') &&
    lado
  ) {
    return [`${marca}_${lado}` as MarcaKey];
  }

  return [];
}

function getMarcaTexto(item: Cruce) {
  if (item.sin_marca) return 'Sin marca';

  const marcaKeys = getMarcaKeys(item);

  if (marcaKeys.length > 0) {
    const textos = marcaKeys.map((key) => {
      if (key === 'marca_casera') {
        return item.marca_color ? `Marca casera (${item.marca_color})` : 'Marca casera';
      }

      const parts = key.split('_');
      if (parts.length < 3) return key;

      const tipo = `${parts[0]}_${parts[1]}`;
      const lado = parts[2];

      let base = tipo;
      if (tipo === 'pie_izquierdo') base = 'Pie izquierdo';
      else if (tipo === 'pie_derecho') base = 'Pie derecho';
      else if (tipo === 'nariz') base = 'Nariz';

      return `${base} - ${lado}`;
    });

    return textos.join(', ');
  }

  if (!item.marca_nacimiento) return 'No registrada';

  let base = '';
  if (item.marca_nacimiento === 'pie_izquierdo') base = 'Pie izquierdo';
  else if (item.marca_nacimiento === 'pie_derecho') base = 'Pie derecho';
  else if (item.marca_nacimiento === 'nariz') base = 'Nariz';
  else if (item.marca_nacimiento === 'marca_casera') base = 'Marca casera';
  else base = item.marca_nacimiento;

  if (item.marca_nacimiento === 'marca_casera' && item.marca_color) {
    return `${base} (${item.marca_color})`;
  }

  if (item.marca_lado) {
    return `${base} - ${item.marca_lado}`;
  }

  return base;
}

function MarkDot({
  x,
  y,
  color = '#9ca3af',
}: {
  x: number;
  y: number;
  color?: string;
}) {
  return (
    <View
      style={[
        styles.markDot,
        {
          left: `${x}%`,
          top: `${y}%`,
          backgroundColor: color,
        },
      ]}
    />
  );
}

function FootMarkCard({
  title,
  imageSource,
  activePoints,
}: {
  title: string;
  imageSource: any;
  activePoints: string[];
}) {
  const pointsMap =
    title === 'PIE IZQUIERDO'
      ? LEFT_FOOT_MARK_POINTS
      : RIGHT_FOOT_MARK_POINTS;

  return (
    <View style={styles.markCard}>
      <View style={styles.markImageBox}>
        <Image
          source={imageSource}
          style={[
            styles.markImage,
            title === 'PIE IZQUIERDO' && {
              width: '111%',
              height: '117%',
              marginTop: -4,
            },
          ]}
          resizeMode="contain"
        />

        {activePoints.map((pointKey) => {
          const point = pointsMap[pointKey as FootPointKey];
          if (!point) return null;

          return (
            <MarkDot
              key={`${title}-${pointKey}`}
              x={point.x}
              y={point.y}
            />
          );
        })}
      </View>

      <Text style={styles.markCardLabel}>{title}</Text>
    </View>
  );
}

function NoseMarkCard({
  activePoints,
}: {
  activePoints: string[];
}) {
  return (
    <View style={styles.markCard}>
      <View style={styles.markImageBox}>
        <Image source={narizImg} style={styles.markImage} resizeMode="contain" />

        {activePoints.map((pointKey) => {
          const point = NOSE_MARK_POINTS[pointKey as NosePointKey];
          if (!point) return null;

          return (
            <MarkDot
              key={`nariz-${pointKey}`}
              x={point.x}
              y={point.y}
            />
          );
        })}
      </View>

      <Text style={styles.markCardLabel}>Nariz</Text>
    </View>
  );
}

function MarcaVisualSection({ item }: { item: Cruce }) {
  if (item.sin_marca) {
    return (
      <View style={styles.marcaSection}>
        <Text style={styles.marcaSectionTitle}>Marca de nacimiento</Text>
        <View style={styles.sinMarcaBox}>
          <Ionicons name="ban-outline" size={18} color="#9ca3af" />
          <Text style={styles.sinMarcaText}>Sin marca</Text>
        </View>
      </View>
    );
  }

  const marcaKeys = getMarcaKeys(item);

  const pieIzquierdoPoints = marcaKeys
    .filter((key) => key.startsWith('pie_izquierdo_'))
    .map((key) => key.replace('pie_izquierdo_', ''));

  const pieDerechoPoints = marcaKeys
    .filter((key) => key.startsWith('pie_derecho_'))
    .map((key) => key.replace('pie_derecho_', ''));

  const narizPoints = marcaKeys
    .filter((key) => key.startsWith('nariz_'))
    .map((key) => key.replace('nariz_', ''));

  const isMarcaCasera = marcaKeys.includes('marca_casera');

  const hasAnyVisualMarks =
    pieIzquierdoPoints.length > 0 ||
    pieDerechoPoints.length > 0 ||
    narizPoints.length > 0 ||
    isMarcaCasera;

  return (
    <View style={styles.marcaSection}>
      <Text style={styles.marcaSectionTitle}>Marca de nacimiento</Text>

      <View style={styles.marksRow}>
        <FootMarkCard
          title="PIE IZQUIERDO"
          imageSource={pieIzquierdoImg}
          activePoints={pieIzquierdoPoints}
        />

        <FootMarkCard
          title="PIE DERECHO"
          imageSource={pieDerechoImg}
          activePoints={pieDerechoPoints}
        />

        <NoseMarkCard activePoints={narizPoints} />
      </View>

      {isMarcaCasera ? (
        <View style={styles.customMarkBox}>
          <View
            style={[
              styles.customMarkDot,
              {
                backgroundColor: item.marca_color || '#dc2626',
              },
            ]}
          />
          <Text style={styles.customMarkText}>
            Marca casera{item.marca_color ? ` (${item.marca_color})` : ''}
          </Text>
        </View>
      ) : null}

      {!hasAnyVisualMarks ? (
        <Text style={styles.marcaFallbackText}>{getMarcaTexto(item)}</Text>
      ) : null}
    </View>
  );
}

export default function CrucesScreen() {
  const router = useRouter();
  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [aves, setAves] = useState<Record<string, Ave>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string | null>(null);
  const [expandedCruceId, setExpandedCruceId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterEstado && filterEstado !== 'todos' && filterEstado !== 'repetidos') {
        params.estado = filterEstado;
      }

      const [crucesDataRaw, avesDataRaw] = await Promise.all([
        api.get('/cruces', params),
        api.get('/aves'),
      ]);

      const crucesData: Cruce[] = Array.isArray(crucesDataRaw)
        ? crucesDataRaw
        : Array.isArray(crucesDataRaw?.data)
          ? crucesDataRaw.data
          : [];

      const avesData: Ave[] = Array.isArray(avesDataRaw)
        ? avesDataRaw
        : Array.isArray(avesDataRaw?.data)
          ? avesDataRaw.data
          : [];

      let filteredCruces = crucesData;

      if (filterEstado === 'repetidos') {
        const parejasCount: Record<string, number> = {};
        crucesData.forEach((c: Cruce) => {
          const key = `${c.padre_id || c.padre_externo}-${c.madre_id || c.madre_externo}`;
          parejasCount[key] = (parejasCount[key] || 0) + 1;
        });

        filteredCruces = crucesData.filter((c: Cruce) => {
          const key = `${c.padre_id || c.padre_externo}-${c.madre_id || c.madre_externo}`;
          return parejasCount[key] > 1;
        });
      }

      setCruces(filteredCruces);

      const avesMap: Record<string, Ave> = {};
      avesData.forEach((ave: Ave) => {
        avesMap[ave.id] = ave;
      });
      setAves(avesMap);
    } catch (error) {
      console.error('Error fetching cruces:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [filterEstado])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [filterEstado]);

  const getConsanguinidadColor = (value?: number) => {
    if (value === undefined || value === null || value < 10) return '#22c55e';
    if (value < 25) return '#f59e0b';
    return '#ef4444';
  };

  const getEstadoLabel = (estado: string) => {
    if (estado === 'planeado') return 'Planeado';
    if (estado === 'hecho') return 'Hecho';
    if (estado === 'cancelado') return 'Cancelado';
    return estado;
  };

  const getAveImageSource = (ave: Ave | undefined, tipo: 'gallo' | 'gallina') => {
    if (ave?.foto) return { uri: ave.foto };
    if (ave?.imagen) return { uri: ave.imagen };
    if (ave?.image_url) return { uri: ave.image_url };
    return tipo === 'gallo' ? galloDefaultImg : gallinaDefaultImg;
  };

  const getCantidadCamada = (item: Cruce) => {
    if (item.cantidad_huevos_pollitos !== undefined && item.cantidad_huevos_pollitos !== null) {
      return item.cantidad_huevos_pollitos;
    }
    if (item.cantidad_registrada !== undefined && item.cantidad_registrada !== null) {
      return item.cantidad_registrada;
    }
    return 0;
  };

  const handleThreeDots = (item: Cruce) => {
    Alert.alert('', '', [
      {
        text: 'Repetir',
        onPress: () => router.push(`/cruce/new?repeat_id=${item.id}`),
      },
      {
        text: 'Editar',
        onPress: () => router.push(`/cruce/${item.id}`),
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/cruces/${item.id}`);
            if (expandedCruceId === item.id) {
              setExpandedCruceId(null);
            }
            fetchData();
          } catch (error) {
            console.error('Error deleting cruce:', error);
            Alert.alert('Error', 'No se pudo eliminar el cruce');
          }
        },
      },
      {
        text: 'Cancelar',
        style: 'cancel',
      },
    ]);
  };

  const renderCruce = ({ item }: { item: Cruce }) => {
    const padre = aves[item.padre_id];
    const madre = aves[item.madre_id];
    const isExpanded = expandedCruceId === item.id;
    const consangValue = item.consanguinidad_estimado ?? 0;
    const consangColor = getConsanguinidadColor(item.consanguinidad_estimado);
    const cantidadCamada = getCantidadCamada(item);

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        style={styles.cruceCard}
        onPress={() => setExpandedCruceId((prev) => (prev === item.id ? null : item.id))}
      >
        <View style={styles.cruceHeader}>
          <View style={styles.estadoBadge}>
            <Text style={styles.estadoText}>{getEstadoLabel(item.estado)}</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.cruceFecha}>{item.fecha}</Text>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => handleThreeDots(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.padresContainer}>
          <View style={styles.padreInfo}>
            <View style={styles.aveImageCircle}>
              <Image
                source={getAveImageSource(padre, 'gallo')}
                style={styles.aveImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.padreCodigo}>
              {padre?.codigo || item.padre_externo || 'No asignado'}
            </Text>
          </View>

          <View style={styles.centerWrap}>
            <View style={styles.cruceIcon}>
              <Ionicons name="git-merge" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.centerCountText}>{cantidadCamada}</Text>
          </View>

          <View style={styles.padreInfo}>
            <View style={styles.aveImageCircle}>
              <Image
                source={getAveImageSource(madre, 'gallina')}
                style={styles.aveImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.padreCodigo}>
              {madre?.codigo || item.madre_externo || 'No asignado'}
            </Text>
          </View>
        </View>

        <View style={styles.consanguinidadRow}>
          <Text style={styles.consanguinidadLabel}>Consanguinidad:</Text>
          <View
            style={[
              styles.consanguinidadBadge,
              { backgroundColor: `${consangColor}20` },
            ]}
          >
            <Text style={[styles.consanguinidadValue, { color: consangColor }]}>
              {consangValue.toFixed(1)}%
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <MarcaVisualSection item={item} />

            {item.criador_nombre ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Criador:</Text>
                <View style={styles.detailValueBox}>
                  <Text style={styles.detailValue}>{item.criador_nombre}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cantidad registrada:</Text>
              <View style={styles.detailValueBox}>
                <Text style={styles.detailValue}>{cantidadCamada}</Text>
              </View>
            </View>

            <View style={styles.progressBlock}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Barra de consanguinidad</Text>
                <Text style={[styles.progressPercent, { color: consangColor }]}>
                  {consangValue.toFixed(1)}%
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(consangValue, 100)}%`,
                      backgroundColor: consangColor,
                    },
                  ]}
                />
              </View>
            </View>

            {item.objetivo ? (
              <View style={styles.objetivoBox}>
                <Text style={styles.detailLabel}>Objetivo:</Text>
                <Text style={styles.objetivoExpanded}>{item.objetivo}</Text>
              </View>
            ) : null}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cruces</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/cruce/new')}
        >
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            (filterEstado === null || filterEstado === 'todos') && styles.filterActive,
          ]}
          onPress={() => setFilterEstado(null)}
        >
          <Text
            style={[
              styles.filterText,
              (filterEstado === null || filterEstado === 'todos') && styles.filterTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        {['hecho', 'repetidos'].map((estado) => (
          <TouchableOpacity
            key={estado}
            style={[
              styles.filterButton,
              filterEstado === estado && styles.filterActive,
            ]}
            onPress={() => setFilterEstado(filterEstado === estado ? null : estado)}
          >
            <Text
              style={[
                styles.filterText,
                filterEstado === estado && styles.filterTextActive,
              ]}
            >
              {estado === 'hecho' ? 'Hechos' : 'Repetidos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <FlatList
          data={cruces}
          renderItem={renderCruce}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f59e0b"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="git-merge-outline" size={64} color="#4b5563" />
              <Text style={styles.emptyTitle}>Sin cruces registrados</Text>
              <Text style={styles.emptyText}>
                Controla el registro de pollitos desde su marca fisica inicial antes de emplacar.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/cruce/new')}
              >
                <Ionicons name="add" size={20} color="#000" />
                <Text style={styles.emptyButtonText}>Iniciar Cruces</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterActive: {
    backgroundColor: '#f59e0b',
  },
  filterText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  filterTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  cruceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cruceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  estadoText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  cruceFecha: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 6,
  },
  menuButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  padresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  padreInfo: {
    flex: 1,
    alignItems: 'center',
  },
  aveImageCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  aveImage: {
    width: '100%',
    height: '100%',
  },
  padreCodigo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  centerWrap: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cruceIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCountText: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  consanguinidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  consanguinidadLabel: {
    fontSize: 13,
    color: '#555555',
  },
  consanguinidadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  consanguinidadValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  marcaSection: {
    marginBottom: 10,
  },
  marcaSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  marksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  markCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eceff3',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  markImageBox: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  markImage: {
    width: '86%',
    height: '86%',
  },
  markCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  markDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 999,
    marginLeft: -5,
    marginTop: -5,
    borderWidth: 2,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  customMarkBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customMarkDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  customMarkText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  sinMarcaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  sinMarcaText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  marcaFallbackText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  detailValueBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailValue: {
    textAlign: 'right',
    fontSize: 14,
    color: '#111827',
  },
  progressBlock: {
    marginTop: 4,
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  objetivoBox: {
    marginTop: 6,
  },
  objetivoExpanded: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#555555',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});