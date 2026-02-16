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
import { RoosterIcon } from '../../src/components/BirdIcons';

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
  tope2_completado: boolean;
  trabajos: Array<{ numero: number; completado: boolean; tiempo_minutos?: number }>;
  en_descanso: boolean;
  dias_descanso?: number;
  fecha_fin_descanso?: string;
}

export default function CuidoScreen() {
  const router = useRouter();
  const [cuidos, setCuidos] = useState<Cuido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string | null>('activo');

  const fetchCuidos = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterEstado) params.estado = filterEstado;
      const result = await api.get('/cuido', params);
      setCuidos(result);
    } catch (error) {
      console.error('Error fetching cuidos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCuidos();
    }, [filterEstado])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCuidos();
  }, [filterEstado]);

  const getCompletedTrabajos = (trabajos: Cuido['trabajos']) => {
    return trabajos?.filter(t => t.completado).length || 0;
  };

  const renderCuido = ({ item }: { item: Cuido }) => {
    const completedTrabajos = getCompletedTrabajos(item.trabajos);
    const topesCompletados = (item.tope1_completado ? 1 : 0) + (item.tope2_completado ? 1 : 0);

    return (
      <TouchableOpacity
        style={styles.cuidoCard}
        onPress={() => router.push(`/cuido/${item.id}`)}
      >
        <View style={styles.cuidoHeader}>
          {item.ave_foto ? (
            <Image source={{ uri: item.ave_foto }} style={styles.avePhoto} />
          ) : (
            <View style={styles.avePhotoPlaceholder}>
              <RoosterIcon size={28} color="#f59e0b" />
            </View>
          )}
          <View style={styles.aveInfo}>
            <Text style={styles.aveCodigo}>{item.ave_codigo || 'Sin placa'}</Text>
            {item.ave_nombre && <Text style={styles.aveNombre}>{item.ave_nombre}</Text>}
            <View style={styles.aveDetails}>
              {item.ave_color && <Text style={styles.aveDetail}>{item.ave_color}</Text>}
              {item.ave_linea && <Text style={styles.aveDetail}>{item.ave_linea}</Text>}
            </View>
          </View>
          {item.en_descanso && (
            <View style={styles.descansoTag}>
              <Ionicons name="bed" size={14} color="#3b82f6" />
              <Text style={styles.descansoText}>
                {item.dias_descanso}d
              </Text>
            </View>
          )}
        </View>

        <View style={styles.progressSection}>
          {/* Topes */}
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Topes</Text>
            <View style={styles.progressDots}>
              <View style={[styles.dot, item.tope1_completado && styles.dotCompleted]}>
                <Text style={styles.dotText}>T1</Text>
              </View>
              <View style={[styles.dot, item.tope2_completado && styles.dotCompleted]}>
                <Text style={styles.dotText}>T2</Text>
              </View>
            </View>
            <Text style={styles.progressCount}>{topesCompletados}/2</Text>
          </View>

          {/* Trabajos */}
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Trabajos</Text>
            <View style={styles.progressDots}>
              {[1, 2, 3, 4, 5].map((num) => {
                const trabajo = item.trabajos?.find(t => t.numero === num);
                return (
                  <View
                    key={num}
                    style={[styles.dot, styles.dotSmall, trabajo?.completado && styles.dotCompleted]}
                  >
                    <Text style={styles.dotTextSmall}>{num}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.progressCount}>{completedTrabajos}/5</Text>
          </View>
        </View>

        <View style={styles.cuidoFooter}>
          <Text style={styles.fechaInicio}>Inicio: {item.fecha_inicio}</Text>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gallos en Cuido</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/cuido/new')}
        >
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {['activo', 'descanso', 'finalizado'].map((estado) => (
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
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
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
          data={cuidos}
          renderItem={renderCuido}
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
              <Ionicons name="timer-outline" size={64} color="#4b5563" />
              <Text style={styles.emptyTitle}>Sin gallos en cuido</Text>
              <Text style={styles.emptyText}>
                Agrega un gallo para iniciar su preparación
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/cuido/new')}
              >
                <Ionicons name="add" size={20} color="#000" />
                <Text style={styles.emptyButtonText}>Nuevo Cuido</Text>
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
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
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
  },
  cuidoCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cuidoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avePhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avePhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aveInfo: {
    flex: 1,
    marginLeft: 12,
  },
  aveCodigo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  aveNombre: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  aveDetails: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  aveDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  descansoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  descansoText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  progressSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
    width: 60,
  },
  progressDots: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dotCompleted: {
    backgroundColor: '#22c55e',
  },
  dotText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
  dotTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  progressCount: {
    fontSize: 13,
    color: '#9ca3af',
    width: 40,
    textAlign: 'right',
  },
  cuidoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  fechaInicio: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
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
