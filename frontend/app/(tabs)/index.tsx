import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

import { RoosterLogo } from '../../src/components/RoosterLogo';
import { TrophyIcon, UserIcon } from '../../src/components/BirdIcons';
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

const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  greenDark: '#22c55e',
  greenLight: 'rgba(34, 197, 94, 0.12)',
  redDeep: '#ef4444',
  redLight: 'rgba(239, 68, 68, 0.12)',
  grayDark: '#1f2937',
  grayMedium: '#6b7280',
  grayLight: '#9ca3af',
  white: '#ffffff',
  background: '#f5f5f5',
  cardBorder: '#e5e7eb',
  black: '#111827',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);

  const [showAddMenu, setShowAddMenu] = useState(false);

  const fetchDashboard = async () => {
    try {
      const result = await api.get('/dashboard');
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearching(true);

    try {
      const aves = await api.get('/aves');

      const filtered = aves.filter((ave: any) => {
        const codigo = ave.codigo?.toLowerCase?.() || '';
        const nombre = ave.nombre?.toLowerCase?.() || '';
        const q = query.toLowerCase();

        return codigo.includes(q) || nombre.includes(q);
      });

      setSearchResults(filtered.slice(0, 5));
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectAve = (aveId: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    router.push(`/ave/detail/${aveId}` as any);
  };

  const closeAddMenuAndNavigate = (path: string) => {
    setShowAddMenu(false);
    router.push(path as any);
  };

  const getAlertStatus = () => {
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
  };

  const formatUserName = (name?: string) => {
    if (!name) return 'Castador';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const totalAves = data?.aves?.total_activas || 0;
  const totalGallos = data?.aves?.gallos || 0;
  const totalGallinas = data?.aves?.gallinas || 0;

  const totalGanadas = data?.peleas?.ganadas || 0;
  const totalPerdidas = data?.peleas?.perdidas || 0;
  const efectividad = data?.peleas?.porcentaje_victorias || 0;

  const totalCruces = data?.cruces_total ?? data?.cruces_planeados ?? 0;
  const totalCamadas = data?.camadas_total ?? data?.camadas_activas ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </SafeAreaView>
    );
  }

  const alertStatus = getAlertStatus();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
<View style={styles.headerTopRow}>
  <View style={styles.headerTextBlock}>
    <Text style={styles.welcomeText}>Bienvenido,</Text>
    <Text style={styles.userName}>
      {formatUserName(user?.nombre)}
    </Text>
  </View>

  <View style={styles.rightSection}>
    <View style={styles.logoWrapper}>
      <RoosterLogo size={84} />
    </View>

    <TouchableOpacity
  style={styles.profileButtonPremium}
  onPress={() => router.push('/perfil' as any)}
  activeOpacity={0.85}
>
  <View style={styles.profileInner}>
  <UserIcon size={24} color="#fff" />
  </View>

  <View style={styles.premiumBadge}>
  <Text style={styles.premiumBadgeText}>👑 PRO</Text>
</View>
</TouchableOpacity>
  </View>
</View>

          <Text style={styles.dashboardTitle}>Panel General del Criadero</Text>
          <View style={styles.divider} />

          {(data?.recordatorios_salud || 0) > 0 && (
            <TouchableOpacity
              style={[styles.alertCard, { backgroundColor: alertStatus.bg }]}
              onPress={() => router.push('/(tabs)/salud' as any)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={alertStatus.icon as any}
                size={20}
                color={alertStatus.color}
              />
              <Text style={[styles.alertText, { color: alertStatus.color }]}>
                {alertStatus.text}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={22}
              color={COLORS.grayMedium}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por placa o nombre..."
              placeholderTextColor={COLORS.grayLight}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searching && (
              <ActivityIndicator
                size="small"
                color={COLORS.gold}
                style={styles.searchLoader}
              />
            )}
          </View>

          {showSearchResults && (
            <View style={styles.searchResultsBox}>
              {searchResults.length > 0 ? (
                searchResults.map((ave) => (
                  <TouchableOpacity
                    key={ave.id}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectAve(ave.id)}
                  >
                    <Text style={styles.searchResultTitle}>
                      {ave.nombre || 'Sin nombre'}
                    </Text>
                    <Text style={styles.searchResultSubtitle}>
                      {ave.codigo || 'Sin código'}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptySearchText}>No se encontraron aves.</Text>
              )}
            </View>
          )}

          <View style={styles.grid}>
            <TouchableOpacity
              style={[styles.card, styles.cardLarge]}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/aves' as any)}
            >
              <View style={styles.cardIconCenter}>
                <GalloLineaIcon size={54} color={COLORS.black} />
              </View>

              <Text style={styles.cardTitleCenter}>Aves Activas</Text>
              <Text style={styles.bigNumber}>{totalAves}</Text>

              <Text style={styles.smallInfo}>Gallos: {totalGallos}</Text>
              <Text style={styles.smallInfo}>Gallinas: {totalGallinas}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, styles.cardLarge]}
              activeOpacity={0.9}
              onPress={() => router.push('/peleas' as any)}
            >
              <View style={styles.cardHeaderInline}>
                <TrophyIcon size={22} color={COLORS.gold} />
                <Text style={styles.cardTitleInline}>Rendimiento</Text>
              </View>

              {data?.peleas?.total ? (
                <>
                  <View style={styles.statsRow}>
                    <Text style={styles.statLabelGreen}>Ganadas:</Text>
                    <Text style={styles.statValueGreen}>{totalGanadas}</Text>
                  </View>

                  <View style={styles.statsRow}>
                    <Text style={styles.statLabelRed}>Perdidas:</Text>
                    <Text style={styles.statValueRed}>{totalPerdidas}</Text>
                  </View>

                  <View style={styles.statsRow}>
                    <Text style={styles.statLabel}>Efectividad:</Text>
                    <Text style={styles.statValueGold}>{efectividad}%</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.max(0, Math.min(100, efectividad))}%` },
                      ]}
                    />
                  </View>
                </>
              ) : (
                <Text style={styles.emptyPerformanceText}>Sin peleas registradas.</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, styles.cardSmall]}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/cruces' as any)}
            >
              <View style={styles.cardIconCenter}>
                <CrucesIcon size={48} />
              </View>

              <Text style={styles.cardTitleCenter}>Cruces</Text>
              <Text style={styles.cardSubtitle}>Total: {totalCruces}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, styles.cardSmall]}
              activeOpacity={0.9}
              onPress={() => router.push('/camadas' as any)}
            >
              <View style={styles.cardIconCenter}>
                <CamadaLogo size={48} />
              </View>

              <Text style={styles.cardTitleCenter}>Camadas</Text>
              <Text style={styles.cardSubtitle}>
                {totalCamadas > 0 ? `Total: ${totalCamadas}` : 'Sin camadas registradas.'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowAddMenu(true)}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={38} color="#000" />
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
            <TouchableOpacity
              activeOpacity={1}
              style={styles.addMenuContainer}
              onPress={() => {}}
            >
              <View style={styles.addMenuHeader}>
                <Text style={styles.addMenuTitle}>Registrar</Text>

                <TouchableOpacity onPress={() => setShowAddMenu(false)}>
                  <Ionicons name="close" size={28} color="#555" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.addMenuItemRow}
                onPress={() => closeAddMenuAndNavigate('/ave/new')}
              >
                <View style={styles.iconCircle}>
                  <GalloLineaIcon size={45} color={COLORS.black} />
                </View>

                <View style={styles.addMenuTextBlock}>
                  <Text style={styles.addMenuItemTitle}>Animal Individual</Text>
                  <Text style={styles.addMenuItemSubtitle}>
                    Agregar ave nueva al inventario
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={24} color="#8c8c8c" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addMenuItemRow}
                onPress={() => closeAddMenuAndNavigate('/cruce/new')}
              >
                <View style={styles.iconCircle}>
                  <CrucesIcon size={45} />
                </View>

                <View style={styles.addMenuTextBlock}>
                  <Text style={styles.addMenuItemTitle}>Registrar Encaste</Text>
                  <Text style={styles.addMenuItemSubtitle}>
                    Planificar cruce entre aves
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={24} color="#8c8c8c" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addMenuItemRow, styles.addMenuItemRowLast]}
                onPress={() => closeAddMenuAndNavigate('/camada/new')}
              >
                <View style={styles.iconCircle}>
                  <CamadaLogo size={45} />
                </View>

                <View style={styles.addMenuTextBlock}>
                  <Text style={styles.addMenuItemTitle}>Registrar Camada</Text>
                  <Text style={styles.addMenuItemSubtitle}>
                    Nueva camada de un cruce
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={24} color="#8c8c8c" />
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  
  rightSection: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  logoWrapper: {
    transform: [{ translateX: -115 }], // mueve el logo hacia la izquierda
  },
  
  headerTextBlock: {
    flex: 1,
  },

  welcomeText: {
    fontSize: 18,
    color: 'rgba(38, 37, 37, 0.72)',
    marginBottom: 2,
  },

  userName: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.black,
  },

  profileButton: {
    width: 44,
    alignItems: 'flex-end',
  },

  dashboardTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gold,
    marginTop: 14,
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: '#dddddd',
    marginBottom: 16,
  },

  alertCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  alertText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  searchContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 58,
    marginBottom: 12,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 18,
    color: COLORS.black,
  },

  searchLoader: {
    marginLeft: 8,
  },

  searchResultsBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 14,
    overflow: 'hidden',
  },

  searchResultItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  searchResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },

  searchResultSubtitle: {
    fontSize: 13,
    color: COLORS.grayMedium,
    marginTop: 2,
  },

  emptySearchText: {
    padding: 14,
    color: COLORS.grayMedium,
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  cardLarge: {
    width: '48.2%',
    minHeight: 177,
    justifyContent: 'center',
  },

  cardSmall: {
    width: '48.2%',
    minHeight: 150,
    justifyContent: 'center',
  },

  cardIconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  cardTitleCenter: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 8,
  },

  bigNumber: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: 6,
  },

  smallInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.grayDark,
    marginBottom: 2,
  },

  cardHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },

  cardTitleInline: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.black,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  statLabel: {
    fontSize: 15,
    color: COLORS.grayDark,
  },

  statValueGold: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gold,
  },

  statLabelGreen: {
    fontSize: 15,
    color: COLORS.greenDark,
  },

  statValueGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.greenDark,
  },

  statLabelRed: {
    fontSize: 15,
    color: COLORS.redDeep,
  },

  statValueRed: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.redDeep,
  },

  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.goldLight,
    marginTop: 12,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 8,
  },

  cardSubtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: COLORS.grayDark,
    marginTop: 4,
  },

  emptyPerformanceText: {
    fontSize: 16,
    color: COLORS.grayMedium,
    marginTop: 8,
    fontStyle: 'italic',
  },

  floatingButton: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#f0b323',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  addMenuContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 34,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: 430,
  },

  addMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  addMenuTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.black,
  },

  addMenuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  addMenuItemRowLast: {
    borderBottomWidth: 0,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(206, 151, 13, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addMenuTextBlock: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },

  addMenuItemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.black,
  },

  addMenuItemSubtitle: {
    fontSize: 14,
    color: COLORS.grayMedium,
    marginTop: 3,
  },
  profileButtonPremium: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  
  profileInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(197, 17, 17, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  premiumBadge: {
    position: 'absolute',
    top: -9,
    right: -6,
    backgroundColor: 'rgba(18, 129, 49, 0.68)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.68)',
  },
  
  premiumBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});