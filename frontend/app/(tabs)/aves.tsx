import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  memo,
  useEffect,
} from 'react';
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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { AvesIcon } from '../../src/components/BirdIcons';
import { useAuth } from '../../src/context/AuthContext';

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

const getOptimizedImage = (url?: string, width: number = 300) => {
  if (!url) return undefined;
  if (!url.includes('/image/upload/')) return url;
  return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width}/`);
};

const getAveImageSource = (ave: Ave) => {
  const url = ave.foto_principal || ave.foto || ave.imagen || ave.image_url;
  if (url) return { uri: getOptimizedImage(url, 300) };
  return ave.tipo === 'gallo' ? galloDefaultImg : gallinaDefaultImg;
};

const AveCard = memo(function AveCard({
  item,
  onPress,
}: {
  item: Ave;
  onPress: (id: string) => void;
}) {
  const imageSource = useMemo(() => getAveImageSource(item), [item]);

  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);

  return (
    <TouchableOpacity style={styles.aveCard} activeOpacity={0.85} onPress={handlePress}>
      <View style={styles.aveImageContainer}>
        <Image
          source={imageSource}
          style={styles.aveImage}
          resizeMode="cover"
          fadeDuration={0}
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
});

export default function AvesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [aves, setAves] = useState<Ave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isFetchingRef = useRef(false);
  const firstLoadDoneRef = useRef(false);
  const mountedRef = useRef(true);
  const lastRequestIdRef = useRef(0);
  const cacheRef = useRef<Record<string, Ave[]>>({});
  const lastFetchAtRef = useRef<Record<string, number>>({});

  const cacheKey = useMemo(
    () => `${filterTipo ?? 'todos'}__${filterEstado ?? 'todos'}`,
    [filterTipo, filterEstado]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleAddAve = useCallback(() => {
    router.push('/ave/new' as any);
  }, [router]);

  const fetchAves = useCallback(
    async (isManualRefresh = false, silent = false) => {
      if (isFetchingRef.current) return;

      const now = Date.now();
      const cachedData = cacheRef.current[cacheKey];
      const lastFetchAt = lastFetchAtRef.current[cacheKey] || 0;
      const cacheIsFresh = now - lastFetchAt < 15000;

      if (!isManualRefresh && cachedData && cacheIsFresh) {
        setAves(cachedData);
        setErrorMessage('');
        setLoading(false);
        firstLoadDoneRef.current = true;
        return;
      }

      isFetchingRef.current = true;
      const requestId = ++lastRequestIdRef.current;

      try {
        if (isManualRefresh) {
          setRefreshing(true);
        } else if (!silent && !firstLoadDoneRef.current) {
          setLoading(true);
        }

        setErrorMessage('');

        const params: Record<string, string> = {};
        if (filterTipo) params.tipo = filterTipo;
        if (filterEstado) params.estado = filterEstado;

        const start = Date.now();
        console.log('⏱️ INICIO fetch /aves');

        const result = await api.get('/aves', { ...params });

        console.log('⏱️ FIN fetch /aves:', Date.now() - start, 'ms');

        const avesData: Ave[] = Array.isArray((result as any)?.data)
          ? (result as any).data
          : Array.isArray(result)
            ? result
            : [];

        if (!mountedRef.current || requestId !== lastRequestIdRef.current) return;

        cacheRef.current[cacheKey] = avesData;
        lastFetchAtRef.current[cacheKey] = Date.now();
        setAves(avesData);
        setErrorMessage('');
        firstLoadDoneRef.current = true;
      } catch (error) {
        if (!mountedRef.current || requestId !== lastRequestIdRef.current) return;
        console.error('Error fetching aves:', error);
        setErrorMessage('No se pudieron cargar las aves. Intenta nuevamente.');
        if (isManualRefresh) {
          Alert.alert('Error', 'No se pudieron actualizar las aves.');
        }
      } finally {
        if (mountedRef.current && requestId === lastRequestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
        isFetchingRef.current = false;
      }
    },
    [cacheKey, filterTipo, filterEstado]
  );

  useFocusEffect(
    useCallback(() => {
      lastFetchAtRef.current[cacheKey] = 0;
      fetchAves(false, firstLoadDoneRef.current);
    }, [fetchAves, cacheKey])
  );

  const onRefresh = useCallback(() => {
    lastFetchAtRef.current[cacheKey] = 0;
    fetchAves(true, false);
  }, [cacheKey, fetchAves]);

  const filteredAves = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
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
  }, [aves, debouncedSearchQuery]);

  const handleOpenAve = useCallback(
    (id: string) => {
      router.push(`/ave/detail/${id}` as any);
    },
    [router]
  );

  const renderAve = useCallback(
    ({ item }: { item: Ave }) => <AveCard item={item} onPress={handleOpenAve} />,
    [handleOpenAve]
  );

  const keyExtractor = useCallback((item: Ave) => item.id, []);

  const listHeader = useMemo(() => {
    if (!errorMessage) return null;
    return (
      <View style={styles.errorBox}>
        <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }, [errorMessage]);

  const listEmptyTitle = errorMessage ? 'No se pudieron mostrar las aves' : 'Sin aves';
  const listEmptyText = errorMessage
    ? 'Intenta nuevamente o desliza hacia abajo para refrescar.'
    : 'Agrega tu primera ave para comenzar a llevar el control de tu galleria.';
  const showEmptyButton = !errorMessage;

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="fitness-outline" size={64} color="#4b5563" />
        <Text style={styles.emptyTitle}>{listEmptyTitle}</Text>
        <Text style={styles.emptyText}>{listEmptyText}</Text>
        {showEmptyButton ? (
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddAve}>
            <Ionicons name="add" size={20} color="#000" />
            <Text style={styles.emptyButtonText}>Agregar Ave</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ),
    [handleAddAve, listEmptyText, listEmptyTitle, showEmptyButton]
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Aves</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddAve}>
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
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
              <Ionicons name="close-circle" size={20} color="#555555" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filterTipo === null && styles.filterActive]}
            onPress={() => { setFilterTipo(null); Keyboard.dismiss(); }}
          >
            <Text style={[styles.filterText, filterTipo === null && styles.filterTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterTipo === 'gallo' && styles.filterActive]}
            onPress={() => { setFilterTipo('gallo'); Keyboard.dismiss(); }}
          >
            <AvesIcon size={18} />
            <Text style={[styles.filterText, filterTipo === 'gallo' && styles.filterTextActive]}>
              Gallos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterTipo === 'gallina' && styles.filterActive]}
            onPress={() => { setFilterTipo('gallina'); Keyboard.dismiss(); }}
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
              onPress={() => { setFilterEstado(filterEstado === estado ? null : estado); Keyboard.dismiss(); }}
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

        {loading && aves.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text style={styles.loadingText}>Cargando aves...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAves}
            renderItem={renderAve}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#f59e0b"
              />
            }
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
            updateCellsBatchingPeriod={60}
            removeClippedSubviews={false}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={listEmpty}
          />
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    minHeight: 88,
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
