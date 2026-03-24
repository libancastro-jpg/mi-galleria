import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  Alert,
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
  foto?: string;
  imagen?: string;
  image_url?: string;
  color?: string;
  linea?: string;
  estado: string;
}

const galloDefaultImg = require('../../assets/images/gallo.png');
const gallinaDefaultImg = require('../../assets/images/gallina.png');

export default function AvesScreen() {
  const router = useRouter();

  const [aves, setAves] = useState<Ave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<string | null>('activo');
  const [errorMessage, setErrorMessage] = useState('');

  const isFetchingRef = useRef(false);

  const getAveImageSource = (ave: Ave) => {
    if (ave.foto_principal) return { uri: ave.foto_principal };
    if (ave.foto) return { uri: ave.foto };
    if (ave.imagen) return { uri: ave.imagen };
    if (ave.image_url) return { uri: ave.image_url };
    return ave.tipo === 'gallo' ? galloDefaultImg : gallinaDefaultImg;
  };

  const fetchAves = useCallback(
    async (isManualRefresh = false) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        if (isManualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage('');

        const params: Record<string, string> = {};
        if (filterTipo) params.tipo = filterTipo;
        if (filterEstado) params.estado = filterEstado;

        const result = await api.get('/aves', params);

        const avesData: Ave[] = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];

        setAves(avesData);
      } catch (error) {
        console.error('Error fetching aves:', error);
        setErrorMessage('No se pudieron cargar las aves. Intenta nuevamente.');

        if (isManualRefresh) {
          Alert.alert('Error', 'No se pudieron actualizar las aves.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [filterTipo, filterEstado]
  );

  useFocusEffect(
    useCallback(() => {
      fetchAves(false);
    }, [fetchAves])
  );

  const onRefresh = useCallback(() => {
    fetchAves(true);
  }, [fetchAves]);

  const filteredAves = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return aves;

    return aves.filter((ave) => {
      const codigo = ave.codigo?.toLowerCase() || '';
      const nombre = ave.nombre?.toLowerCase() || '';
      const color = ave.color?.toLowerCase() || '';
      const linea = ave.linea?.toLowerCase() || '';

      return (
        codigo.includes(query) ||
        nombre.includes(query) ||
        color.includes(query) ||
        linea.includes(query)
      );
    });
  }, [aves, searchQuery]);

  const renderAve = ({ item }: { item: Ave }) => (
    <TouchableOpacity
      style={styles.aveCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/ave/detail/${item.id}`)}
    >
      <View style={styles.aveImageContainer}>
        <Image
          source={getAveImageSource(item)}
          style={styles.aveImage}
          resizeMode="cover"
        />
        <View
          style={[
            styles.tipoIndicator,
            item.tipo === 'gallo' ? styles.galloIndicator : styles.gallinaIndicator,
          ]}
        />
      </View>

      <View style={styles.aveInfo}>
        <Text style={styles.aveCodigo}>{item.codigo}</Text>
        {item.nombre ? <Text style={styles.aveNombre}>{item.nombre}</Text> : null}

        <View style={styles.aveDetails}>
          {item.color ? (
            <View style={styles.detailTag}>
              <Text style={styles.detailText}>{item.color}</Text>
            </View>
          ) : null}

          {item.linea ? (
            <View style={styles.detailTag}>
              <Text style={styles.detailText}>{item.linea}</Text>
            </View>
          ) : null}
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
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#555555" />
          </TouchableOpacity>
        ) : null}
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
          <Text style={styles.loadingText}>Cargando aves...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAves}
          renderItem={renderAve}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f59e0b"
            />
          }
          ListHeaderComponent={
            errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={64} color="#4b5563" />
              <Text style={styles.emptyTitle}>Sin aves</Text>
              <Text style={styles.emptyText}>
                Agrega tu primera ave para comenzar a llevar el control de tu galleria.
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
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#555555',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
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
    backgroundColor: '#e0e0e0',
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
    color: '#6b7280',
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
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
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
    lineHeight: 20,
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