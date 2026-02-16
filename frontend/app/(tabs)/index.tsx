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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f59e0b"
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola{user?.nombre ? `, ${user.nombre}` : ''}!</Text>
            <Text style={styles.subtitle}>Resumen de tu criadero</Text>
          </View>
          <View style={styles.logoSmall}>
            <Ionicons name="fitness" size={32} color="#f59e0b" />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, styles.statCardPrimary]}
            onPress={() => router.push('/(tabs)/aves')}
          >
            <Ionicons name="fitness" size={28} color="#f59e0b" />
            <Text style={styles.statNumber}>{data?.aves.total_activas || 0}</Text>
            <Text style={styles.statLabel}>Aves Activas</Text>
            <View style={styles.statSubRow}>
              <Text style={styles.statSub}>{data?.aves.gallos || 0} gallos</Text>
              <Text style={styles.statSub}>{data?.aves.gallinas || 0} gallinas</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/peleas')}
          >
            <Ionicons name="trophy" size={28} color="#22c55e" />
            <Text style={styles.statNumber}>
              {data?.peleas.ganadas || 0}/{data?.peleas.total || 0}
            </Text>
            <Text style={styles.statLabel}>Victorias</Text>
            <Text style={styles.statPercent}>
              {data?.peleas.porcentaje_victorias || 0}%
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/cruces')}
          >
            <Ionicons name="git-merge" size={28} color="#3b82f6" />
            <Text style={styles.statNumber}>{data?.cruces_planeados || 0}</Text>
            <Text style={styles.statLabel}>Cruces Planeados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard}>
            <Ionicons name="egg" size={28} color="#a855f7" />
            <Text style={styles.statNumber}>{data?.camadas_activas || 0}</Text>
            <Text style={styles.statLabel}>Camadas Activas</Text>
          </TouchableOpacity>
        </View>

        {/* Health Reminders */}
        {(data?.recordatorios_salud || 0) > 0 && (
          <TouchableOpacity style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <Ionicons name="notifications" size={24} color="#ef4444" />
            </View>
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>Recordatorios de Salud</Text>
              <Text style={styles.reminderText}>
                {data?.recordatorios_salud} tratamientos próximos esta semana
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}

        {/* Recent Fights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimas Peleas</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/peleas')}>
              <Text style={styles.sectionLink}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {data?.peleas.recientes && data.peleas.recientes.length > 0 ? (
            data.peleas.recientes.map((pelea) => (
              <View key={pelea.id} style={styles.fightItem}>
                <View
                  style={[
                    styles.fightResult,
                    pelea.resultado === 'GANO' ? styles.fightWin : styles.fightLoss,
                  ]}
                >
                  <Text style={styles.fightResultText}>
                    {pelea.resultado === 'GANO' ? 'G' : 'P'}
                  </Text>
                </View>
                <View style={styles.fightInfo}>
                  <Text style={styles.fightCode}>
                    {pelea.ave_codigo || 'Sin código'}
                  </Text>
                  <Text style={styles.fightDate}>{pelea.fecha}</Text>
                </View>
                <View style={styles.fightRating}>
                  <Text style={styles.fightRatingText}>
                    {pelea.calificacion?.charAt(0) || '-'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={40} color="#4b5563" />
              <Text style={styles.emptyText}>Sin peleas registradas</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/ave/new')}
            >
              <Ionicons name="add-circle" size={24} color="#f59e0b" />
              <Text style={styles.actionText}>Nueva Ave</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/cruce/new')}
            >
              <Ionicons name="git-merge" size={24} color="#3b82f6" />
              <Text style={styles.actionText}>Nuevo Cruce</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/pelea/new')}
            >
              <Ionicons name="trophy" size={24} color="#22c55e" />
              <Text style={styles.actionText}>Nueva Pelea</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 4,
  },
  logoSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statCardPrimary: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  statSubRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statSub: {
    fontSize: 12,
    color: '#6b7280',
  },
  statPercent: {
    fontSize: 14,
    color: '#22c55e',
    marginTop: 4,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  reminderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderContent: {
    flex: 1,
    marginLeft: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reminderText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 2,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  sectionLink: {
    fontSize: 14,
    color: '#f59e0b',
  },
  fightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  fightResult: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fightWin: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  fightLoss: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  fightResultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  fightInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fightCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fightDate: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  fightRating: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fightRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#141414',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  actionText: {
    fontSize: 13,
    color: '#fff',
    marginTop: 8,
  },
});
