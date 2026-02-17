import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { AvesIcon } from '../../src/components/BirdIcons';

interface Ave {
  id: string;
  tipo: string;
  codigo: string;
  nombre?: string;
  foto_principal?: string;
  color?: string;
  linea?: string;
  estado: string;
}

export default function AvesScreen() {
  const router = useRouter();
  const [aves, setAves] = useState<Ave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<string | null>('activo');

  const fetchAves = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterTipo) params.tipo = filterTipo;
      if (filterEstado) params.estado = filterEstado;
      const result = await api.get('/aves', params);
      setAves(result);
    } catch (error) {
      console.error('Error fetching aves:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAves();
    }, [filterTipo, filterEstado])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAves();
  }, [filterTipo, filterEstado]);

  const filteredAves = aves.filter((ave) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ave.codigo.toLowerCase().includes(query) ||
      ave.nombre?.toLowerCase().includes(query) ||
      ave.color?.toLowerCase().includes(query) ||
      ave.linea?.toLowerCase().includes(query)
    );
  });

  const renderAve = ({ item }: { item: Ave }) => (
    <TouchableOpacity
      style={styles.aveCard}
      onPress={() => router.push(`/ave/detail/${item.id}`)}
    >
      <View style={styles.aveImageContainer}>
        {item.foto_principal ? (
          <Image source={{ uri: item.foto_principal }} style={styles.aveImage} />
        ) : (
          <View style={styles.avePlaceholder}>
            <Ionicons
              name={item.tipo === 'gallo' ? 'fitness' : 'egg'}
              size={32}
              color="#555555"
            />
          </View>
        )}
        <View
          style={[
            styles.tipoIndicator,
            item.tipo === 'gallo' ? styles.galloIndicator : styles.gallinaIndicator,
          ]}
        />
      </View>
      <View style={styles.aveInfo}>
        <Text style={styles.aveCodigo}>{item.codigo}</Text>
        {item.nombre && <Text style={styles.aveNombre}>{item.nombre}</Text>}
        <View style={styles.aveDetails}>
          {item.color && (
            <View style={styles.detailTag}>
              <Text style={styles.detailText}>{item.color}</Text>
            </View>
          )}
          {item.linea && (
            <View style={styles.detailTag}>
              <Text style={styles.detailText}>{item.linea}</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#555555" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Aves</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/ave/new')}
        >
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#555555" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por placa, nombre, color..."
          placeholderTextColor="#555555"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#555555" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filterTipo === null && styles.filterActive]}
          onPress={() => setFilterTipo(null)}
        >
          <Text style={[styles.filterText, filterTipo === null && styles.filterTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterTipo === 'gallo' && styles.filterActive]}
          onPress={() => setFilterTipo('gallo')}
        >
          <AvesIcon size={18} />
          <Text style={[styles.filterText, filterTipo === 'gallo' && styles.filterTextActive]}>
            Gallos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterTipo === 'gallina' && styles.filterActive]}
          onPress={() => setFilterTipo('gallina')}
        >
          <AvesIcon size={18} />
          <Text style={[styles.filterText, filterTipo === 'gallina' && styles.filterTextActive]}>
            Gallinas
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.estadoFilters}>
        {['activo', 'vendido', 'retirado'].map((estado) => (
          <TouchableOpacity
            key={estado}
            style={[
              styles.estadoChip,
              filterEstado === estado && styles.estadoChipActive,
            ]}
            onPress={() => setFilterEstado(filterEstado === estado ? null : estado)}
          >
            <Text
              style={[
                styles.estadoText,
                filterEstado === estado && styles.estadoTextActive,
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
          data={filteredAves}
          renderItem={renderAve}
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
              <Ionicons name="fitness-outline" size={64} color="#4b5563" />
              <Text style={styles.emptyTitle}>Sin aves</Text>
              <Text style={styles.emptyText}>
                Agrega tu primer ave para comenzar
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/ave/new')}
              >
                <Ionicons name="add" size={20} color="#000" />
                <Text style={styles.emptyButtonText}>Agregar Ave</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 6,
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
  estadoFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  estadoChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  estadoChipActive: {
    backgroundColor: '#22c55e',
  },
  estadoText: {
    fontSize: 12,
    color: '#555555',
  },
  estadoTextActive: {
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
  aveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  aveImageContainer: {
    position: 'relative',
  },
  aveImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  avePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipoIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  galloIndicator: {
    backgroundColor: '#3b82f6',
  },
  gallinaIndicator: {
    backgroundColor: '#ec4899',
  },
  aveInfo: {
    flex: 1,
    marginLeft: 12,
  },
  aveCodigo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  aveNombre: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  aveDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  detailTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  detailText: {
    fontSize: 12,
    color: '#9ca3af',
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
