import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { RoosterLogo } from '../../src/components/RoosterLogo';
import { TrophyIcon, GeneticsIcon, EggIcon, UserIcon, RoosterIcon, HenIcon, RoosterHeadIcon, BirdIcon } from '../../src/components/BirdIcons';

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

// Color palette - Professional
const COLORS = {
  gold: '#F5A623',           // Dorado principal
  goldLight: 'rgba(245, 166, 35, 0.15)',
  greenDark: '#22c55e',      // Verde éxito
  greenLight: 'rgba(34, 197, 94, 0.15)',
  redDeep: '#ef4444',        // Rojo alertas
  redLight: 'rgba(239, 68, 68, 0.15)',
  grayDark: '#1a1a1a',       // Gris oscuro
  grayMedium: '#2a2a2a',     // Gris medio
  grayLight: '#6b7280',      // Gris claro
  white: '#ffffff',
  background: '#0a0a0a',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Aves Activas */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/aves')}
          >
            <View style={styles.statHeader}>
              <RoosterIcon size={24} color={COLORS.gold} />
              <Text style={styles.statTitle}>Aves Activas</Text>
            </View>
            {(data?.aves.total_activas || 0) > 0 ? (
              <>
                <Text style={styles.statNumber}>{data?.aves.total_activas || 0}</Text>
                <View style={styles.statDetails}>
                  <View style={styles.statDetailRow}>
                    <RoosterIcon size={14} color={COLORS.gold} />
                    <Text style={styles.statDetailText}>Gallos: {data?.aves.gallos || 0}</Text>
                  </View>
                  <View style={styles.statDetailRow}>
                    <HenIcon size={14} color={COLORS.gold} />
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
          <TouchableOpacity style={styles.statCard}>
            <View style={styles.statHeader}>
              <EggIcon size={24} color={COLORS.gold} />
              <Text style={styles.statTitle}>Camadas</Text>
            </View>
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

        {/* Acciones Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/pelea/new')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.goldLight }]}>
                <TrophyIcon size={26} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Nueva Pelea</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/ave/new')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.goldLight }]}>
                <BirdIcon size={26} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Nueva Ave</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/cruce/new')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.goldLight }]}>
                <GeneticsIcon size={26} color={COLORS.gold} />
              </View>
              <Text style={styles.actionText}>Nuevo Cruce</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
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
});
