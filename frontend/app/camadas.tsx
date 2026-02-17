import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/services/api';
import { CamadaLogo } from '../src/components/CamadaLogo';

interface Camada {
  id: string;
  cruce_id: string;
  fecha_puesta_inicio?: string;
  cantidad_huevos?: number;
  fecha_incubacion_inicio?: string;
  metodo: string;
  fecha_nacimiento?: string;
  cantidad_nacidos?: number;
  notas?: string;
  created_at: string;
}

interface Cruce {
  id: string;
  padre_id?: string;
  madre_id?: string;
  padre_externo?: string;
  madre_externo?: string;
}

const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  background: '#1a1a1a',
  cardBg: '#242424',
  border: '#333333',
  white: '#ffffff',
  grayLight: '#a0a0a0',
  green: '#22c55e',
  greenLight: 'rgba(34, 197, 94, 0.15)',
  blue: '#3b82f6',
  blueLight: 'rgba(59, 130, 246, 0.15)',
};

export default function CamadasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [camadas, setCamadas] = useState<Camada[]>([]);
  const [cruces, setCruces] = useState<Cruce[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [camadasData, crucesData] = await Promise.all([
        api.get('/camadas'),
        api.get('/cruces'),
      ]);
      setCamadas(camadasData);
      setCruces(crucesData);
    } catch (error) {
      console.error('Error fetching camadas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getCruceInfo = (cruceId: string) => {
    return cruces.find(c => c.id === cruceId);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getEstadoCamada = (camada: Camada) => {
    if (camada.cantidad_nacidos && camada.cantidad_nacidos > 0) {
      return { label: 'Nacidos', color: COLORS.green, bg: COLORS.greenLight };
    }
    if (camada.fecha_incubacion_inicio) {
      return { label: 'Incubando', color: COLORS.blue, bg: COLORS.blueLight };
    }
    if (camada.fecha_puesta_inicio) {
      return { label: 'En puesta', color: COLORS.gold, bg: COLORS.goldLight };
    }
    return { label: 'Registrada', color: COLORS.grayLight, bg: 'rgba(160, 160, 160, 0.15)' };
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camadas</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/camada/new')}
        >
          <Ionicons name="add" size={24} color={COLORS.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
        }
      >
        {camadas.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CamadaLogo size={72} />
            </View>
            <Text style={styles.emptyTitle}>Sin camadas registradas</Text>
            <Text style={styles.emptySubtitle}>
              Las camadas se crean a partir de un cruce realizado
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/camada/new')}
            >
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.emptyButtonText}>Nueva Camada</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Logo Header */}
            <View style={styles.logoHeader}>
              <CamadaLogo size={80} />
            </View>

            {/* Resumen */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{camadas.length}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {camadas.filter(c => c.fecha_incubacion_inicio && !c.cantidad_nacidos).length}
                </Text>
                <Text style={styles.summaryLabel}>Incubando</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {camadas.reduce((acc, c) => acc + (c.cantidad_nacidos || 0), 0)}
                </Text>
                <Text style={styles.summaryLabel}>Nacidos</Text>
              </View>
            </View>

            {/* Lista de Camadas */}
            <Text style={styles.sectionTitle}>Todas las Camadas</Text>
            {camadas.map((camada) => {
              const estado = getEstadoCamada(camada);
              const cruce = getCruceInfo(camada.cruce_id);
              
              return (
                <TouchableOpacity
                  key={camada.id}
                  style={styles.camadaCard}
                  onPress={() => router.push(`/camada/${camada.id}`)}
                >
                  <View style={styles.camadaHeader}>
                    <View style={styles.camadaIconContainer}>
                      <Ionicons name="egg" size={24} color={COLORS.gold} />
                    </View>
                    <View style={styles.camadaInfo}>
                      <Text style={styles.camadaTitle}>
                        Camada del {formatDate(camada.fecha_puesta_inicio || camada.created_at)}
                      </Text>
                      <Text style={styles.camadaSubtitle}>
                        Método: {camada.metodo === 'gallina' ? 'Gallina' : 'Incubadora'}
                      </Text>
                    </View>
                    <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
                      <Text style={[styles.estadoText, { color: estado.color }]}>
                        {estado.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.camadaDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="layers-outline" size={16} color={COLORS.grayLight} />
                      <Text style={styles.detailText}>
                        {camada.cantidad_huevos || 0} huevos
                      </Text>
                    </View>
                    {camada.cantidad_nacidos !== undefined && camada.cantidad_nacidos > 0 && (
                      <View style={styles.detailItem}>
                        <Ionicons name="happy-outline" size={16} color={COLORS.green} />
                        <Text style={[styles.detailText, { color: COLORS.green }]}>
                          {camada.cantidad_nacidos} nacidos
                        </Text>
                      </View>
                    )}
                    {camada.fecha_nacimiento && (
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={16} color={COLORS.grayLight} />
                        <Text style={styles.detailText}>
                          Nac: {formatDate(camada.fecha_nacimiento)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {camada.notas && (
                    <View style={styles.camadaNotas}>
                      <Ionicons name="document-text-outline" size={14} color={COLORS.grayLight} />
                      <Text style={styles.notasText} numberOfLines={1}>
                        {camada.notas}
                      </Text>
                    </View>
                  )}

                  <View style={styles.camadaFooter}>
                    <Text style={styles.footerText}>Ver detalles</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.gold} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
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
  logoHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.goldLight,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.grayLight,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
  },
  // Camada Card
  camadaCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  camadaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  camadaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camadaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  camadaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  camadaSubtitle: {
    fontSize: 13,
    color: COLORS.grayLight,
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  camadaDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.grayLight,
  },
  camadaNotas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notasText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.grayLight,
    fontStyle: 'italic',
  },
  camadaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: '500',
  },
});
