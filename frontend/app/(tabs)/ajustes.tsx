import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

// Color palette
const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  greenDark: '#1a5d3a',
  greenLight: 'rgba(26, 93, 58, 0.15)',
  redDeep: '#8b1a1a',
  redLight: 'rgba(139, 26, 26, 0.15)',
  blueDark: '#1a3d5d',
  blueLight: 'rgba(26, 61, 93, 0.15)',
  grayDark: '#f5f5f5',
  grayMedium: '#e0e0e0',
  grayLight: '#555555',
  white: '#ffffff',
  background: '#f5f5f5',
};

interface SaludRecord {
  id: string;
  ave_id: string;
  ave_codigo?: string;
  ave_nombre?: string;
  tipo: string;
  producto: string;
  dosis?: string;
  fecha: string;
  proxima_fecha?: string;
  notas?: string;
}

interface Recordatorio {
  id: string;
  ave_id: string;
  ave_codigo?: string;
  ave_nombre?: string;
  tipo: string;
  producto: string;
  proxima_fecha: string;
}

export default function SaludScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'recordatorios' | 'historial'>('recordatorios');
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [historial, setHistorial] = useState<SaludRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const fetchData = async () => {
    try {
      const [recordatoriosData, historialData] = await Promise.all([
        api.get('/salud/recordatorios'),
        api.get('/salud'),
      ]);
      setRecordatorios(recordatoriosData);
      setHistorial(historialData);
    } catch (error) {
      console.error('Error fetching salud data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'vitamina':
        return { icon: 'flask', color: COLORS.gold };
      case 'vacuna':
        return { icon: 'shield-checkmark', color: COLORS.greenDark };
      case 'desparasitante':
        return { icon: 'bug', color: COLORS.redDeep };
      case 'tratamiento':
        return { icon: 'medkit', color: COLORS.blueDark };
      default:
        return { icon: 'medical', color: COLORS.grayLight };
    }
  };

  const renderRecordatorios = () => (
    <View style={styles.tabContent}>
      {recordatorios.length > 0 ? (
        recordatorios.map((item) => {
          const tipoStyle = getTipoIcon(item.tipo);
          return (
            <View key={item.id} style={styles.recordatorioCard}>
              <View style={[styles.recordatorioIcon, { backgroundColor: tipoStyle.color + '20' }]}>
                <Ionicons name={tipoStyle.icon as any} size={22} color={tipoStyle.color} />
              </View>
              <View style={styles.recordatorioInfo}>
                <Text style={styles.recordatorioProducto}>{item.producto}</Text>
                <Text style={styles.recordatorioAve}>
                  {item.ave_codigo || item.ave_nombre || 'Ave'}
                </Text>
                <Text style={styles.recordatorioTipo}>
                  {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                </Text>
              </View>
              <View style={styles.recordatorioFecha}>
                <Text style={styles.recordatorioFechaLabel}>Próxima</Text>
                <Text style={styles.recordatorioFechaValue}>{item.proxima_fecha}</Text>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: COLORS.greenLight }]}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.greenDark} />
          </View>
          <Text style={styles.emptyTitle}>Todo al día</Text>
          <Text style={styles.emptySubtitle}>
            No hay recordatorios pendientes para esta semana.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/salud/new')}
      >
        <Ionicons name="add" size={24} color={COLORS.white} />
        <Text style={styles.addButtonText}>Nuevo Registro de Salud</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistorial = () => (
    <View style={styles.tabContent}>
      {historial.length > 0 ? (
        historial.slice(0, 20).map((item) => {
          const tipoStyle = getTipoIcon(item.tipo);
          return (
            <View key={item.id} style={styles.historialCard}>
              <View style={[styles.historialIcon, { backgroundColor: tipoStyle.color + '20' }]}>
                <Ionicons name={tipoStyle.icon as any} size={18} color={tipoStyle.color} />
              </View>
              <View style={styles.historialInfo}>
                <Text style={styles.historialProducto}>{item.producto}</Text>
                <Text style={styles.historialDetails}>
                  {item.ave_codigo || 'Ave'} • {item.fecha}
                </Text>
              </View>
              <Text style={[styles.historialTipo, { color: tipoStyle.color }]}>
                {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
              </Text>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: COLORS.goldLight }]}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.gold} />
          </View>
          <Text style={styles.emptyTitle}>Sin registros</Text>
          <Text style={styles.emptySubtitle}>
            Aún no hay registros de salud. Comienza agregando vitaminas o vacunas.
          </Text>
        </View>
      )}
    </View>
  );

  const renderConfig = () => (
    <View style={styles.tabContent}>
      <View style={styles.configSection}>
        <Text style={styles.configSectionTitle}>Cuenta</Text>
        <TouchableOpacity style={styles.configItem}>
          <View style={styles.configItemIcon}>
            <Ionicons name="person" size={20} color={COLORS.gold} />
          </View>
          <Text style={styles.configItemText}>Editar Perfil</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.configItem}>
          <View style={styles.configItemIcon}>
            <Ionicons name="sync" size={20} color={COLORS.gold} />
          </View>
          <Text style={styles.configItemText}>Sincronizar Datos</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.configSection}>
        <Text style={styles.configSectionTitle}>Datos</Text>
        <TouchableOpacity style={styles.configItem}>
          <View style={styles.configItemIcon}>
            <Ionicons name="download" size={20} color={COLORS.gold} />
          </View>
          <Text style={styles.configItemText}>Exportar (PDF/CSV)</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.configItem}>
          <View style={styles.configItemIcon}>
            <Ionicons name="cloud-upload" size={20} color={COLORS.gold} />
          </View>
          <Text style={styles.configItemText}>Backup</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.configSection}>
        <Text style={styles.configSectionTitle}>Sesión</Text>
        <TouchableOpacity style={[styles.configItem, styles.configItemDanger]} onPress={handleLogout}>
          <View style={[styles.configItemIcon, { backgroundColor: COLORS.redLight }]}>
            <Ionicons name="log-out" size={20} color={COLORS.redDeep} />
          </View>
          <Text style={[styles.configItemText, { color: COLORS.redDeep }]}>Cerrar Sesión</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.redDeep} />
        </TouchableOpacity>
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appName}>Mi Galleria</Text>
        <Text style={styles.appVersion}>Versión 1.0.0</Text>
      </View>
    </View>
  );

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
        <Text style={styles.title}>Salud</Text>
      </View>

      {/* Resumen de Recordatorios */}
      <View style={[
        styles.alertSummary, 
        { backgroundColor: recordatorios.length > 0 
          ? (recordatorios.length > 3 ? COLORS.redLight : COLORS.goldLight) 
          : COLORS.greenLight 
        }
      ]}>
        <View style={[
          styles.alertSummaryIcon, 
          { backgroundColor: recordatorios.length > 0 
            ? (recordatorios.length > 3 ? COLORS.redDeep : COLORS.gold) 
            : COLORS.greenDark 
          }
        ]}>
          <Ionicons 
            name={recordatorios.length > 0 
              ? (recordatorios.length > 3 ? 'warning' : 'alert-circle') 
              : 'checkmark-circle'
            } 
            size={22} 
            color={COLORS.white} 
          />
        </View>
        <View style={styles.alertSummaryContent}>
          <Text style={styles.alertSummaryTitle}>Estado de Recordatorios</Text>
          <Text style={[
            styles.alertSummaryText, 
            { color: recordatorios.length > 0 
              ? (recordatorios.length > 3 ? COLORS.redDeep : COLORS.gold) 
              : COLORS.greenDark 
            }
          ]}>
            {recordatorios.length === 0 
              ? 'Todo al día - Sin pendientes' 
              : `${recordatorios.length} recordatorio${recordatorios.length > 1 ? 's' : ''} pendiente${recordatorios.length > 1 ? 's' : ''}`
            }
          </Text>
        </View>
      </View>

      {/* Tabs - Solo Recordatorios e Historial */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recordatorios' && styles.tabActive]}
          onPress={() => setActiveTab('recordatorios')}
        >
          <Ionicons
            name="notifications"
            size={18}
            color={activeTab === 'recordatorios' ? COLORS.gold : COLORS.grayLight}
          />
          <Text style={[styles.tabText, activeTab === 'recordatorios' && styles.tabTextActive]}>
            Recordatorios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'historial' && styles.tabActive]}
          onPress={() => setActiveTab('historial')}
        >
          <Ionicons
            name="time"
            size={18}
            color={activeTab === 'historial' ? COLORS.gold : COLORS.grayLight}
          />
          <Text style={[styles.tabText, activeTab === 'historial' && styles.tabTextActive]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>

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
        {activeTab === 'recordatorios' && renderRecordatorios()}
        {activeTab === 'historial' && renderHistorial()}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayMedium,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  // Alert Summary
  alertSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
  },
  alertSummaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertSummaryContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  alertSummaryText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.grayDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayMedium,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.grayLight,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  // Recordatorios
  recordatorioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  recordatorioIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordatorioInfo: {
    flex: 1,
    marginLeft: 14,
  },
  recordatorioProducto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  recordatorioAve: {
    fontSize: 13,
    color: COLORS.grayLight,
    marginTop: 2,
  },
  recordatorioTipo: {
    fontSize: 12,
    color: COLORS.gold,
    marginTop: 4,
  },
  recordatorioFecha: {
    alignItems: 'flex-end',
  },
  recordatorioFechaLabel: {
    fontSize: 11,
    color: COLORS.grayLight,
  },
  recordatorioFechaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gold,
    marginTop: 2,
  },
  // Historial
  historialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayDark,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  historialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historialInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historialProducto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  historialDetails: {
    fontSize: 12,
    color: COLORS.grayLight,
    marginTop: 2,
  },
  historialTipo: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: COLORS.grayDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.grayLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.grayDark,
  },
  // Config
  configSection: {
    marginBottom: 24,
  },
  configSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.grayLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  configItemDanger: {
    borderColor: COLORS.redLight,
  },
  configItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configItemText: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  appVersion: {
    fontSize: 13,
    color: COLORS.grayLight,
    marginTop: 4,
  },
});
