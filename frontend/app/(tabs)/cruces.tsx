import React, { useState, useEffect, useCallback } from 'react';
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

interface Cruce {
  id: string;
  padre_id: string;
  madre_id: string;
  fecha: string;
  objetivo?: string;
  estado: string;
  consanguinidad_estimado?: number;
}

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
}

export default function CrucesScreen() {
  const router = useRouter();
  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [aves, setAves] = useState<Record<string, Ave>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterEstado && filterEstado !== 'todos' && filterEstado !== 'repetidos') {
        params.estado = filterEstado;
      }
      
      const [crucesData, avesData] = await Promise.all([
        api.get('/cruces', params),
        api.get('/aves'),
      ]);
      
      // Filtrar cruces repetidos (mismos padres)
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
    if (!value || value < 10) return '#22c55e';
    if (value < 25) return '#f59e0b';
    return '#ef4444';
  };

  const renderCruce = ({ item }: { item: Cruce }) => {
    const padre = aves[item.padre_id];
    const madre = aves[item.madre_id];

    return (
      <TouchableOpacity
        style={styles.cruceCard}
        onPress={() => router.push(`/cruce/${item.id}`)}
      >
        <View style={styles.cruceHeader}>
          <View style={styles.estadoBadge}>
            <Text style={styles.estadoText}>
              {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
            </Text>
          </View>
          <Text style={styles.cruceFecha}>{item.fecha}</Text>
        </View>

        <View style={styles.padresContainer}>
          <View style={styles.padreInfo}>
            <View style={styles.padreIcon}>
              <Ionicons name="fitness" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.padreCodigo}>
              {padre?.codigo || 'No asignado'}
            </Text>
          </View>

          <View style={styles.cruceIcon}>
            <Ionicons name="git-merge" size={24} color="#f59e0b" />
          </View>

          <View style={styles.padreInfo}>
            <View style={[styles.padreIcon, styles.madreIcon]}>
              <Ionicons name="egg" size={20} color="#ec4899" />
            </View>
            <Text style={styles.padreCodigo}>
              {madre?.codigo || 'No asignado'}
            </Text>
          </View>
        </View>

        {item.consanguinidad_estimado !== undefined && (
          <View style={styles.consanguinidadRow}>
            <Text style={styles.consanguinidadLabel}>Consanguinidad:</Text>
            <View
              style={[
                styles.consanguinidadBadge,
                { backgroundColor: getConsanguinidadColor(item.consanguinidad_estimado) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.consanguinidadValue,
                  { color: getConsanguinidadColor(item.consanguinidad_estimado) },
                ]}
              >
                {item.consanguinidad_estimado.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        {item.objetivo && (
          <Text style={styles.objetivo} numberOfLines={1}>
            {item.objetivo}
          </Text>
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
        {['planeado', 'hecho', 'cancelado', 'repetidos'].map((estado) => (
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
              {estado === 'planeado' ? 'Planeado' : estado === 'hecho' ? 'Hecho' : estado === 'cancelado' ? 'Cancelado' : 'Repetidos'}
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
                Planea tu primer cruce para comenzar
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
    paddingVertical: 12,
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
  },
  cruceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cruceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  estadoText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  cruceFecha: {
    fontSize: 14,
    color: '#555555',
  },
  padresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  padreInfo: {
    flex: 1,
    alignItems: 'center',
  },
  padreIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  madreIcon: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  padreCodigo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cruceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consanguinidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  objetivo: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
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
