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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

import { RoosterLogo } from '../../src/components/RoosterLogo';
import {
  TrophyIcon,
  UserIcon,
} from '../../src/components/BirdIcons';

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
    router.push(`/ave/detail/${aveId}`);
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
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Bienvenido,</Text>
          <Text style={styles.userName}>
            {formatUserName(user?.nombre)}
          </Text>
          <RoosterLogo size={72} />
        </View>

        {/* ALERTA */}
        {(data?.recordatorios_salud || 0) > 0 && (
          <View style={[styles.alertCard, { backgroundColor: alertStatus.bg }]}>
            <Ionicons
              name={alertStatus.icon as any}
              size={20}
              color={alertStatus.color}
            />
            <Text style={{ color: alertStatus.color }}>
              {alertStatus.text}
            </Text>
          </View>
        )}

        {/* SEARCH */}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          value={searchQuery}
          onChangeText={handleSearch}
        />

        {/* RESULTADOS */}
        {showSearchResults &&
          searchResults.map((ave) => (
            <TouchableOpacity
              key={ave.id}
              onPress={() => handleSelectAve(ave.id)}
            >
              <Text>{ave.codigo}</Text>
            </TouchableOpacity>
          ))}

        {/* BOTÓN */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowAddMenu(true)}
        >
          <Ionicons name="add" size={30} />
        </TouchableOpacity>

        {/* MODAL */}
        <Modal visible={showAddMenu} transparent>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowAddMenu(false)}
          >
            <View style={styles.addMenuContainer}>
              <TouchableOpacity onPress={() => router.push('/ave/new')}>
                <Text>Animal</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerContainer: { alignItems: 'center', marginBottom: 20 },

  welcomeText: { fontSize: 14, color: COLORS.grayLight },
  userName: { fontSize: 18, fontWeight: 'bold' },

  alertCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
  },

  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.gold,
    padding: 15,
    borderRadius: 50,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  addMenuContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});