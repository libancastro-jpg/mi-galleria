import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';

interface Pelea {
  id: string;
  ave_id: string;
  fecha: string;
  lugar?: string;
  resultado: string;
  calificacion: string;
  notas?: string;
}

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
}

interface Estadisticas {
  total: number;
  ganadas: number;
  perdidas: number;
  porcentaje_victorias: number;
  calificaciones: Record<string, number>;
  racha_actual: number;
  racha_tipo: string | null;
}

export default function PeleasScreen() {
  const router = useRouter();
  const [peleas, setPeleas] = useState<Pelea[]>([]);
  const [aves, setAves] = useState<Record<string, Ave>>({});
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [peleasData, avesData, statsData] = await Promise.all([
        api.get('/peleas'),
        api.get('/aves'),
        api.get('/peleas/estadisticas'),
      ]);

      setPeleas(peleasData);
      setStats(statsData);

      const avesMap: Record<string, Ave> = {};
      avesData.forEach((ave: Ave) => {
        avesMap[ave.id] = ave;
      });
      setAves(avesMap);
    } catch (error) {
      console.error('Error fetching peleas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getCalificacionColor = (cal: string) => {
    switch (cal) {
      case 'EXTRAORDINARIA':
        return '#f59e0b';
      case 'BUENA':
        return '#22c55e';
      case 'REGULAR':
        return '#6b7280';
      case 'MALA':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderPelea = ({ item }: { item: Pelea }) => {
    const ave = aves[item.ave_id];

    return (
      <TouchableOpacity
        style={styles.peleaCard}
        onPress={() => router.push(`/pelea/${item.id}`)}
      >
        <View
          style={[
            styles.resultadoIndicator,
            item.resultado === 'GANO' ? styles.resultadoGano : styles.resultadoPerdio,
          ]}
        >
          <Text style={styles.resultadoText}>
            {item.resultado === 'GANO' ? 'G' : 'P'}
          </Text>
        </View>

        <View style={styles.peleaInfo}>
          <Text style={styles.aveCodigo}>
            {ave?.codigo || 'Ave desconocida'}
          </Text>
          <Text style={styles.peleaFecha}>{item.fecha}</Text>
          {item.lugar && (
            <Text style={styles.peleaLugar}>{item.lugar}</Text>
          )}
        </View>

        <View
          style={[
            styles.calificacionBadge,
            { backgroundColor: getCalificacionColor(item.calificacion) + '20' },
          ]}
        >
          <Text
            style={[
              styles.calificacionText,
              { color: getCalificacionColor(item.calificacion) },
            ]}
          >
            {item.calificacion?.charAt(0) || '-'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Peleas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/pelea/new')}
        >
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      {stats && stats.total > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.ganadas}</Text>
              <Text style={styles.statLabel}>Ganadas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.perdidas}</Text>
              <Text style={styles.statLabel}>Perdidas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#22c55e' }]}>
                {stats.porcentaje_victorias}%
              </Text>
              <Text style={styles.statLabel}>Victorias</Text>
            </View>
          </View>

          {stats.racha_actual > 0 && (
            <View style={styles.rachaContainer}>
              <Ionicons
                name={stats.racha_tipo === 'GANO' ? 'flame' : 'trending-down'}
                size={16}
                color={stats.racha_tipo === 'GANO' ? '#f59e0b' : '#ef4444'}
              />
              <Text style={styles.rachaText}>
                Racha de {stats.racha_actual} {stats.racha_tipo === 'GANO' ? 'victorias' : 'derrotas'}
              </Text>
            </View>
          )}

          <View style={styles.calificacionesRow}>
            {Object.entries(stats.calificaciones).map(([cal, count]) => (
              <View key={cal} style={styles.calItem}>
                <View
                  style={[
                    styles.calDot,
                    { backgroundColor: getCalificacionColor(cal) },
                  ]}
                />
                <Text style={styles.calCount}>{count}</Text>
                <Text style={styles.calLabel}>{cal.charAt(0)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <FlatList
          data={peleas}
          renderItem={renderPelea}
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
              <Ionicons name="trophy-outline" size={64} color="#4b5563" />
              <Text style={styles.emptyTitle}>Sin peleas</Text>
              <Text style={styles.emptyText}>
                Registra tu primera pelea
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/pelea/new')}
              >
                <Ionicons name="add" size={20} color="#000" />
                <Text style={styles.emptyButtonText}>Registrar Pelea</Text>
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
    backgroundColor: '#1a1a1a',
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
  statsContainer: {
    backgroundColor: '#141414',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2a2a2a',
  },
  rachaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 6,
  },
  rachaText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  calificacionesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  calItem: {
    alignItems: 'center',
  },
  calDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  calCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  calLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  peleaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  resultadoIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultadoGano: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  resultadoPerdio: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  resultadoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  peleaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  aveCodigo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  peleaFecha: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  peleaLugar: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  calificacionBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calificacionText: {
    fontSize: 16,
    fontWeight: 'bold',
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
