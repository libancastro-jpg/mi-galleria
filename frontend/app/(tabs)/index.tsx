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
import { TrophyIcon, GeneticsIcon, EggIcon, UserIcon, RoosterIcon, HenIcon, RoosterHeadIcon, BirdIcon, AvesIcon, PedigreeIcon } from '../../src/components/BirdIcons';
import { CamadaLogo } from '../../src/components/CamadaLogo';
import { GalloLineaIcon } from '../../src/components/GalloLineaIcon';

interface DashboardData {
  aves: {
    total_activas: number;
    gallos: number;
    gallinas: number;
  };
  cruces_planeados: number;
  camadas_activas: number;
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

// Color palette - Tema Claro
const COLORS = {
  gold: '#d4a017',             // Dorado principal
  goldLight: 'rgba(212, 160, 23, 0.15)',
  greenDark: '#22c55e',        // Verde éxito
  greenLight: 'rgba(34, 197, 94, 0.12)',
  redDeep: '#ef4444',          // Rojo alertas
  redLight: 'rgba(239, 68, 68, 0.12)',
  grayDark: '#ffffff',         // Blanco (tarjetas)
  grayMedium: '#e0e0e0',       // Gris claro (bordes)
  grayLight: '#555555',        // Gris oscuro (texto secundario)
  white: '#1a1a1a',            // Texto oscuro
  background: '#f5f5f5',       // Fondo claro
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para búsqueda y menú
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

  // Función de búsqueda por placa
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setSearching(true);
    try {
      const aves = await api.get('/aves');
      const filtered = aves.filter((ave: any) => 
        ave.codigo?.toLowerCase().includes(query.toLowerCase()) ||
        ave.nombre?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 5)); // Máximo 5 resultados
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
    router.push(`/ave/detail/${aveId}`);
  };

  const getAlertStatus = () => {
    const count = data?.recordatorios_salud || 0;
    if (count === 0) return { color: COLORS.greenDark, bg: COLORS.greenLight, text: 'Todo al día', icon: 'checkmark-circle' };
    if (count <= 3) return { color: COLORS.gold, bg: COLORS.goldLight, text: `${count} recordatorio${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''}`, icon: 'alert-circle' };
    return { color: COLORS.redDeep, bg: COLORS.redLight, text: `${count} alertas - Atención requerida`, icon: 'warning' };
  };

  const formatUserName = (name: string | undefined) => {
    if (!name) return 'Castador';
    return name.charAt(0).toUpperCase() + name.slice(1);
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

  const alertStatus = getAlertStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gold}
          />
        }
      >
        {/* Header con Logo Central */}
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

        {/* Alertas Section - Solo mostrar si hay recordatorios pendientes */}
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

        {/* Barra de Búsqueda */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.grayLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por placa o nombre..."
              placeholderTextColor={COLORS.grayLight}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}>
                <Ionicons name="close-circle" size={20} color={COLORS.grayLight} />
              </TouchableOpacity>
            )}
            {searching && <ActivityIndicator size="small" color={COLORS.gold} />}
          </View>
          
          {/* Resultados de búsqueda */}
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
          
          {showSearchResults && searchQuery.length > 0 && searchResults.length === 0 && !searching && (
            <View style={styles.searchNoResults}>
              <Text style={styles.searchNoResultsText}>No se encontraron aves con "{searchQuery}"</Text>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Aves Activas */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/aves')}
          >
            {/* Icono grande arriba */}
            <View style={styles.avesLogoContainer}>
              <GalloLineaIcon size={70} />
            </View>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Aves Activas</Text>
            </View>
            {(data?.aves.total_activas || 0) > 0 ? (
              <>
                <Text style={styles.statNumber}>{data?.aves.total_activas || 0}</Text>
                <View style={styles.statDetails}>
                  <View style={styles.statDetailRow}>
                    <Ionicons name="male" size={14} color="#3b82f6" />
                    <Text style={styles.statDetailText}>Gallos: {data?.aves.gallos || 0}</Text>
                  </View>
                  <View style={styles.statDetailRow}>
                    <Ionicons name="female" size={14} color="#ec4899" />
                    <Text style={styles.statDetailText}>Gallinas: {data?.aves.gallinas || 0}</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.emptyCardText}>Aún no tienes aves registradas.</Text>
            )}
          </TouchableOpacity>

          {/* Rendimiento */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/peleas')}
          >
            <View style={styles.statHeader}>
              <TrophyIcon size={24} color={COLORS.gold} />
              <Text style={styles.statTitle}>Rendimiento</Text>
            </View>
            {(data?.peleas.total || 0) > 0 ? (
              <>
                <View style={styles.rendimientoStats}>
                  <View style={styles.rendimientoRow}>
                    <Text style={[styles.rendimientoLabel, { color: COLORS.greenDark }]}>Ganadas:</Text>
                    <Text style={[styles.rendimientoValue, { color: COLORS.greenDark }]}>{data?.peleas.ganadas || 0}</Text>
                  </View>
                  <View style={styles.rendimientoRow}>
                    <Text style={[styles.rendimientoLabel, { color: COLORS.redDeep }]}>Perdidas:</Text>
                    <Text style={[styles.rendimientoValue, { color: COLORS.redDeep }]}>{data?.peleas.perdidas || 0}</Text>
                  </View>
                  <View style={styles.rendimientoRow}>
                    <Text style={styles.rendimientoLabel}>Efectividad:</Text>
                    <Text style={[styles.rendimientoValue, { color: COLORS.gold }]}>{data?.peleas.porcentaje_victorias || 0}%</Text>
                  </View>
                </View>
                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${data?.peleas.porcentaje_victorias || 0}%` }
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
          {/* Cruces */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/cruces')}
          >
            <View style={styles.statHeader}>
              <GeneticsIcon size={24} color={COLORS.gold} />
              <Text style={styles.statTitle}>Cruces</Text>
            </View>
            {(data?.cruces_planeados || 0) > 0 ? (
              <View style={styles.cruceStats}>
                <View style={styles.cruceRow}>
                  <Text style={styles.cruceLabel}>Planeados:</Text>
                  <Text style={styles.cruceValue}>{data?.cruces_planeados || 0}</Text>
                </View>
                <View style={styles.cruceRow}>
                  <Text style={styles.cruceLabel}>Activos:</Text>
                  <Text style={styles.cruceValue}>0</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyCardText}>No hay cruces activos.</Text>
            )}
          </TouchableOpacity>

          {/* Camadas */}
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/camadas')}>
            <View style={styles.camadaLogoContainer}>
              <CamadaLogo size={140} />
            </View>
            <Text style={styles.camadaTitle}>Camadas</Text>
            {(data?.camadas_activas || 0) > 0 ? (
              <View style={styles.camadaStats}>
                <View style={styles.camadaRow}>
                  <Text style={styles.camadaLabel}>Activas:</Text>
                  <Text style={styles.camadaValue}>{data?.camadas_activas || 0}</Text>
                </View>
                <View style={styles.camadaRow}>
                  <Text style={styles.camadaLabel}>En incubación:</Text>
                  <Text style={styles.camadaValue}>0</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyCardText}>No hay camadas activas.</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón Flotante + */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowAddMenu(true)}
      >
        <Ionicons name="add" size={32} color="#000" />
      </TouchableOpacity>

      {/* Modal de Menú */}
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
                router.push('/cruce/new');
              }}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <GeneticsIcon size={24} color="#ec4899" />
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
                router.push('/ave/new');
              }}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: COLORS.goldLight }]}>
                <AvesIcon size={24} />
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
                router.push('/camada/new');
              }}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: COLORS.greenLight }]}>
                <EggIcon size={24} color={COLORS.greenDark} />
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
  // Header con Logo Central
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
  // Alerts
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
  // Stats Grid
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
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.grayLight,
    fontWeight: '600',
  },
  statNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  statDetails: {
    gap: 6,
  },
  statDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  // Rendimiento
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
  // Cruces
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
  // Camadas
  camadaLogoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  // Aves Logo Container
  avesLogoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  camadaTitle: {
    fontSize: 14,
    color: COLORS.grayLight,
    fontWeight: '600',
    textAlign: 'center',
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
  // Section
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  // Actions
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.grayDark,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Search Section
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
  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
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
  // Add Menu Modal
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
  addMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
