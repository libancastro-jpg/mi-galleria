import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { RoosterLogo } from '../../src/components/RoosterLogo';
import { UserIcon } from '../../src/components/BirdIcons';
import { CamadaLogo } from '../../src/components/CamadaLogo';
import { GalloLineaIcon } from '../../src/components/GalloLineaIcon';
import { CrucesIcon } from '../../src/components/CrucesIcon';

interface DashboardData {
  aves: {
    total_activas: number;
    gallos: number;
    gallinas: number;
  };
  cruces_planeados: number;
  cruces_total?: number;
  camadas_activas: number;
  camadas_total?: number;
  peleas: {
    total: number;
    ganadas: number;
    perdidas: number;
    porcentaje_victorias: number;
    recientes: Array<{
      id: string;
      fecha: string;
      resultado: string;
      calificacion: string;
      ave_codigo: string;
      ave_nombre: string;
    }>;
  };
  recordatorios_salud: number;
}

interface SearchAve {
  id: string;
  tipo: string;
  codigo: string;
  nombre?: string;
}

const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  greenDark: '#22c55e',
  greenLight: 'rgba(34, 197, 94, 0.12)',
  redDeep: '#ef4444',
  redLight: 'rgba(239, 68, 68, 0.12)',
  grayDark: '#ffffff',
  grayMedium: '#e0e0e0',
  grayLight: '#555555',
  white: '#1a1a1a',
  background: '#f5f5f5',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchAve[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const isFetchingDashboardRef = useRef(false);
  const avesCacheRef = useRef<SearchAve[] | null>(null);
  const dashboardLoadedRef = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchDashboard = useCallback(async (manualRefresh = false) => {
    if (isFetchingDashboardRef.current) return;

    isFetchingDashboardRef.current = true;

    try {
      if (manualRefresh) {
        setRefreshing(true);
      } else if (!dashboardLoadedRef.current) {
        setLoading(true);
      }

      const result = await api.get('/dashboard');
      setData(result);
      dashboardLoadedRef.current = true;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingDashboardRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard(false);
    }, [fetchDashboard])
  );

  const onRefresh = useCallback(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  const loadAvesForSearch = useCallback(async () => {
    if (avesCacheRef.current) return avesCacheRef.current;

    const aves = await api.get('/aves');
    const normalized = Array.isArray(aves) ? aves : [];
    avesCacheRef.current = normalized;
    return normalized;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      if (!debouncedSearchQuery) {
        setSearchResults([]);
        setShowSearchResults(false);
        setSearching(false);
        return;
      }

      setSearching(true);

      try {
        const aves = await loadAvesForSearch();

        if (cancelled) return;

        const query = debouncedSearchQuery.toLowerCase();

        const filtered = aves.filter((ave: SearchAve) => {
          const codigo = ave.codigo?.toLowerCase() || '';
          const nombre = ave.nombre?.toLowerCase() || '';
          return codigo.includes(query) || nombre.includes(query);
        });

        setSearchResults(filtered.slice(0, 5));
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    };

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery, loadAvesForSearch]);

  const handleSelectAve = useCallback(
    (aveId: string) => {
      setSearchQuery('');
      setDebouncedSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      router.push(`/ave/detail/${aveId}`);
    },
    [router]
  );

  const getAlertStatus = useCallback(() => {
    const count = data?.recordatorios_salud || 0;
    if (count === 0) {
      return {
        color: COLORS.greenDark,
        bg: COLORS.greenLight,
        text: 'Todo al día',
        icon: 'checkmark-circle',
      };
    }
    if (count <= 3) {
      return {
        color: COLORS.gold,
        bg: COLORS.goldLight,
        text: `${count} recordatorio${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''}`,
        icon: 'alert-circle',
      };
    }
    return {
      color: COLORS.redDeep,
      bg: COLORS.redLight,
      text: `${count} alertas - Atención requerida`,
      icon: 'warning',
    };
  }, [data?.recordatorios_salud]);

  const formatUserName = useCallback((name: string | undefined) => {
    if (!name) return 'Castador';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, []);

  const alertStatus = useMemo(() => getAlertStatus(), [getAlertStatus]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gold}
          />
        }
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.welcomeText}>Bienvenido,</Text>
              <Text style={styles.userName}>{formatUserName(user?.nombre)}</Text>
            </View>

            <View style={styles.headerCenter}>
              <RoosterLogo size={72} />
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => router.push('/perfil')}
              >
                <UserIcon size={32} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.subtitle}>Panel General del Criadero</Text>
        </View>

        {(data?.recordatorios_salud || 0) > 0 && (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: alertStatus.bg }]}
            onPress={() => router.push('/(tabs)/ajustes')}
          >
            <View style={[styles.alertIconContainer, { backgroundColor: alertStatus.color }]}>
              <Ionicons name={alertStatus.icon as any} size={22} color={COLORS.white} />
            </View>

            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Recordatorios</Text>
              <Text style={[styles.alertText, { color: alertStatus.color }]}>
                {alertStatus.text}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={alertStatus.color} />
          </TouchableOpacity>
        )}

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.grayLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por placa o nombre..."
              placeholderTextColor={COLORS.grayLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.grayLight} />
              </TouchableOpacity>
            )}

            {searching && <ActivityIndicator size="small" color={COLORS.gold} />}
          </View>

          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((ave) => (
                <TouchableOpacity
                  key={ave.id}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectAve(ave.id)}
                >
                  <View style={styles.searchResultIcon}>
                    <Ionicons
                      name={ave.tipo === 'gallo' ? 'male' : 'female'}
                      size={18}
                      color={ave.tipo === 'gallo' ? '#3b82f6' : '#ec4899'}
                    />
                  </View>

                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultPlaca}>Placa: {ave.codigo}</Text>
                    {ave.nombre && (
                      <Text style={styles.searchResultName}>{ave.nombre}</Text>
                    )}
                  </View>

                  <View style={styles.searchResultAction}>
                    <Text style={styles.searchResultActionText}>Ver pedigrí</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.gold} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showSearchResults &&
            debouncedSearchQuery.length > 0 &&
            searchResults.length === 0 &&
            !searching && (
              <View style={styles.searchNoResults}>
                <Text style={styles.searchNoResultsText}>
                  No se encontraron aves con "{debouncedSearchQuery}"
                </Text>
              </View>
            )}
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCardCompact}
            onPress={() => router.push('/(tabs)/aves')}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={require('../../assets/images/aves_activas.png')}
                style={{ width: 95, height: 95, marginBottom: 10 }}
                resizeMode="contain"
              />

              <Text style={styles.statTitleCentered}>Aves Activas</Text>

              {(data?.aves?.total_activas || 0) > 0 ? (
                <View style={{ alignItems: 'center', marginTop: 6 }}>
                  <Text style={styles.statNumber}>{data?.aves?.total_activas || 0}</Text>

                  <Text style={styles.statDetailText}>
                    Gallos: {data?.aves?.gallos || 0}
                  </Text>

                  <Text style={styles.statDetailText}>
                    Gallinas: {data?.aves?.gallinas || 0}
                  </Text>
                </View>
              ) : (
                <Text style={styles.emptyCardText}>Sin aves registradas.</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/peleas')}
          >
            <View style={styles.statHeader}>
              <Ionicons name="trophy" size={24} color={COLORS.gold} />
              <Text style={styles.statTitle}>Rendimiento</Text>
            </View>

            {(data?.peleas.total || 0) > 0 ? (
              <>
                <View style={styles.rendimientoStats}>
                  <View style={styles.rendimientoRow}>
                    <Text style={[styles.rendimientoLabel, { color: COLORS.greenDark }]}>
                      Ganadas:
                    </Text>
                    <Text style={[styles.rendimientoValue, { color: COLORS.greenDark }]}>
                      {data?.peleas.ganadas || 0}
                    </Text>
                  </View>

                  <View style={styles.rendimientoRow}>
                    <Text style={[styles.rendimientoLabel, { color: COLORS.redDeep }]}>
                      Perdidas:
                    </Text>
                    <Text style={[styles.rendimientoValue, { color: COLORS.redDeep }]}>
                      {data?.peleas.perdidas || 0}
                    </Text>
                  </View>

                  <View style={styles.rendimientoRow}>
                    <Text style={styles.rendimientoLabel}>Efectividad:</Text>
                    <Text style={[styles.rendimientoValue, { color: COLORS.gold }]}>
                      {data?.peleas.porcentaje_victorias || 0}%
                    </Text>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${data?.peleas.porcentaje_victorias || 0}%` },
                      ]}
                    />
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.emptyCardText}>Sin peleas registradas.</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCardCompact}
            onPress={() => router.push('/(tabs)/cruces')}
          >
            <View style={styles.crucesLogoContainer}>
              <CrucesIcon size={80} />
            </View>
            <Text style={styles.statTitleCentered}>Cruces</Text>

            {(data?.cruces_total || data?.cruces_planeados || 0) > 0 ? (
              <View style={styles.cruceStats}>
                <View style={styles.cruceRow}>
                  <Text style={styles.cruceLabel}>Total:</Text>
                  <Text style={styles.cruceValue}>
                    {data?.cruces_total || data?.cruces_planeados || 0}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyCardText}>Sin cruces registrados.</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCardCompact} onPress={() => router.push('/camadas')}>
            <View style={styles.camadaLogoContainer}>
              <CamadaLogo size={66} />
            </View>
            <Text style={styles.statTitleCentered}>Camadas</Text>

            {(data?.camadas_total || data?.camadas_activas || 0) > 0 ? (
              <View style={styles.camadaStats}>
                <View style={styles.camadaRow}>
                  <Text style={styles.camadaLabel}>Total:</Text>
                  <Text style={styles.camadaValue}>
                    {data?.camadas_total || data?.camadas_activas || 0}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyCardText}>Sin camadas registradas.</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowAddMenu(true)}
      >
        <Ionicons name="add" size={32} color="#000" />
      </TouchableOpacity>

      <Modal
        visible={showAddMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddMenu(false)}
        >
          <View style={styles.addMenuContainer}>
            <View style={styles.addMenuHeader}>
              <Text style={styles.addMenuTitle}>Registrar</Text>
              <TouchableOpacity onPress={() => setShowAddMenu(false)}>
                <Ionicons name="close" size={24} color={COLORS.grayLight} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addMenuItem}
              onPress={() => {
                setShowAddMenu(false);
                router.push('/ave/new');
              }}
            >
              <View style={[styles.addMenuIconLarge, { backgroundColor: COLORS.goldLight }]}>
                <GalloLineaIcon size={44} />
              </View>
              <View style={styles.addMenuItemContent}>
                <Text style={styles.addMenuItemTitle}>Animal Individual</Text>
                <Text style={styles.addMenuItemDesc}>Agregar ave nueva al inventario</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addMenuItem}
              onPress={() => {
                setShowAddMenu(false);
                router.push('/cruce/new');
              }}
            >
              <View style={[styles.addMenuIconLarge, { backgroundColor: COLORS.goldLight }]}>
                <CrucesIcon size={48} />
              </View>
              <View style={styles.addMenuItemContent}>
                <Text style={styles.addMenuItemTitle}>Registrar Encaste</Text>
                <Text style={styles.addMenuItemDesc}>Planificar cruce entre aves</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addMenuItem}
              onPress={() => {
                setShowAddMenu(false);
                router.push('/camada/new');
              }}
            >
              <View style={[styles.addMenuIconLarge, { backgroundColor: COLORS.goldLight }]}>
                <CamadaLogo size={48} />
              </View>
              <View style={styles.addMenuItemContent}>
                <Text style={styles.addMenuItemTitle}>Registrar Camada</Text>
                <Text style={styles.addMenuItemDesc}>Nueva camada de un cruce</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayMedium,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.grayLight,
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gold,
    marginTop: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  profileButton: {
    padding: 4,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 13,
    color: COLORS.grayLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.grayDark,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
    minHeight: 140,
  },
  statCardCompact: {
    flex: 1,
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statTitleCentered: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  statDetailText: {
    fontSize: 13,
    color: COLORS.grayLight,
  },
  emptyCardText: {
    fontSize: 13,
    color: COLORS.grayLight,
    fontStyle: 'italic',
    marginTop: 8,
  },
  rendimientoStats: {
    gap: 6,
    marginBottom: 12,
  },
  rendimientoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rendimientoLabel: {
    fontSize: 13,
    color: COLORS.grayLight,
  },
  rendimientoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.grayMedium,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 3,
  },
  cruceStats: {
    gap: 8,
    marginTop: 8,
  },
  cruceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cruceLabel: {
    fontSize: 13,
    color: COLORS.grayLight,
  },
  cruceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  camadaLogoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  crucesLogoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  camadaStats: {
    gap: 8,
    marginTop: 8,
  },
  camadaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  camadaLabel: {
    fontSize: 13,
    color: COLORS.grayLight,
  },
  camadaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.white,
    paddingVertical: 4,
  },
  searchResults: {
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayMedium,
  },
  searchResultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultPlaca: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  searchResultName: {
    fontSize: 13,
    color: COLORS.grayLight,
    marginTop: 2,
  },
  searchResultAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchResultActionText: {
    fontSize: 12,
    color: COLORS.gold,
    fontWeight: '500',
  },
  searchNoResults: {
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  searchNoResultsText: {
    fontSize: 14,
    color: COLORS.grayLight,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  addMenuContainer: {
    backgroundColor: COLORS.grayDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  addMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayMedium,
  },
  addMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayMedium,
  },
  addMenuIconLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMenuItemContent: {
    flex: 1,
    marginLeft: 14,
  },
  addMenuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  addMenuItemDesc: {
    fontSize: 13,
    color: COLORS.grayLight,
    marginTop: 2,
  },
});