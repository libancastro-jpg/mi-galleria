import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/services/api';

const COLORS = {
  background: '#0a0a0a',
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  grayDark: '#141414',
  grayMedium: '#2a2a2a',
  grayLight: '#6b7280',
  white: '#ffffff',
  blue: '#3b82f6',
  pink: '#ec4899',
};

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  tipo: string;
  color?: string;
  linea?: string;
  foto_principal?: string;
  padre_id?: string;
  madre_id?: string;
}

interface PedigriNode {
  ave: Ave | null;
  padre?: PedigriNode;
  madre?: PedigriNode;
}

export default function PedigriScreen() {
  const router = useRouter();
  const [aves, setAves] = useState<Ave[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAve, setSelectedAve] = useState<Ave | null>(null);
  const [pedigri, setPedigri] = useState<PedigriNode | null>(null);
  const [loadingPedigri, setLoadingPedigri] = useState(false);

  useEffect(() => {
    fetchAves();
  }, []);

  const fetchAves = async () => {
    try {
      const data = await api.get('/aves');
      setAves(data);
    } catch (error) {
      console.error('Error fetching aves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPedigri = async (aveId: string) => {
    setLoadingPedigri(true);
    try {
      const data = await api.get(`/aves/${aveId}/pedigri`);
      setPedigri(data);
    } catch (error) {
      console.error('Error fetching pedigri:', error);
      setPedigri(null);
    } finally {
      setLoadingPedigri(false);
    }
  };

  const handleSelectAve = (ave: Ave) => {
    setSelectedAve(ave);
    fetchPedigri(ave.id);
  };

  const renderPedigriNode = (node: PedigriNode | null | undefined, level: number = 0, position: string = 'center') => {
    if (!node || !node.ave) {
      return (
        <View style={[styles.pedigriNode, styles.pedigriNodeEmpty]}>
          <Text style={styles.pedigriNodeEmptyText}>Desconocido</Text>
        </View>
      );
    }

    const isGallo = node.ave.tipo === 'gallo';

    return (
      <View style={styles.pedigriNodeContainer}>
        <TouchableOpacity
          style={[
            styles.pedigriNode,
            { borderColor: isGallo ? COLORS.blue : COLORS.pink }
          ]}
          onPress={() => router.push(`/ave/detail/${node.ave?.id}`)}
        >
          <View style={[styles.pedigriNodeIcon, { backgroundColor: isGallo ? 'rgba(59, 130, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)' }]}>
            <Ionicons
              name={isGallo ? 'male' : 'female'}
              size={16}
              color={isGallo ? COLORS.blue : COLORS.pink}
            />
          </View>
          <Text style={styles.pedigriNodeCode} numberOfLines={1}>{node.ave.codigo}</Text>
          {node.ave.nombre && (
            <Text style={styles.pedigriNodeName} numberOfLines={1}>{node.ave.nombre}</Text>
          )}
        </TouchableOpacity>

        {level < 2 && (node.padre || node.madre) && (
          <View style={styles.pedigriChildren}>
            {renderPedigriNode(node.padre, level + 1, 'left')}
            {renderPedigriNode(node.madre, level + 1, 'right')}
          </View>
        )}
      </View>
    );
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedigrí</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Lista de Aves */}
        <Text style={styles.sectionTitle}>Selecciona un Ave</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avesList}>
          {aves.map((ave) => (
            <TouchableOpacity
              key={ave.id}
              style={[
                styles.aveCard,
                selectedAve?.id === ave.id && styles.aveCardSelected
              ]}
              onPress={() => handleSelectAve(ave)}
            >
              {ave.foto_principal ? (
                <Image source={{ uri: ave.foto_principal }} style={styles.avePhoto} />
              ) : (
                <View style={styles.avePhotoPlaceholder}>
                  <Ionicons
                    name={ave.tipo === 'gallo' ? 'male' : 'female'}
                    size={24}
                    color={ave.tipo === 'gallo' ? COLORS.blue : COLORS.pink}
                  />
                </View>
              )}
              <Text style={styles.aveCodigo} numberOfLines={1}>{ave.codigo}</Text>
              {ave.nombre && (
                <Text style={styles.aveNombre} numberOfLines={1}>{ave.nombre}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Árbol Genealógico */}
        {selectedAve && (
          <View style={styles.pedigriSection}>
            <Text style={styles.sectionTitle}>
              Árbol Genealógico de {selectedAve.codigo}
            </Text>
            
            {loadingPedigri ? (
              <View style={styles.loadingPedigri}>
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={styles.loadingText}>Cargando pedigrí...</Text>
              </View>
            ) : pedigri ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pedigriTree}>
                  {renderPedigriNode(pedigri)}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.emptyPedigri}>
                <Ionicons name="git-branch-outline" size={48} color={COLORS.grayLight} />
                <Text style={styles.emptyText}>Sin información de pedigrí</Text>
              </View>
            )}
          </View>
        )}

        {!selectedAve && aves.length > 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="git-branch-outline" size={64} color={COLORS.grayLight} />
            <Text style={styles.emptyStateTitle}>Selecciona un ave</Text>
            <Text style={styles.emptyStateText}>
              Toca una de las aves de arriba para ver su árbol genealógico
            </Text>
          </View>
        )}

        {aves.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color={COLORS.grayLight} />
            <Text style={styles.emptyStateTitle}>No hay aves registradas</Text>
            <Text style={styles.emptyStateText}>
              Registra tus aves para ver su pedigrí
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/ave/new')}
            >
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.addButtonText}>Nueva Ave</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayMedium,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
  },
  avesList: {
    marginBottom: 24,
  },
  aveCard: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  aveCardSelected: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldLight,
  },
  avePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  avePhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.grayMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  aveCodigo: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  aveNombre: {
    fontSize: 10,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginTop: 2,
  },
  pedigriSection: {
    marginTop: 8,
  },
  loadingPedigri: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: COLORS.grayLight,
    marginTop: 12,
  },
  pedigriTree: {
    padding: 16,
    minWidth: '100%',
  },
  pedigriNodeContainer: {
    alignItems: 'center',
  },
  pedigriNode: {
    backgroundColor: COLORS.grayDark,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 2,
  },
  pedigriNodeEmpty: {
    borderColor: COLORS.grayMedium,
    borderStyle: 'dashed',
  },
  pedigriNodeEmptyText: {
    fontSize: 10,
    color: COLORS.grayLight,
  },
  pedigriNodeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pedigriNodeCode: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  pedigriNodeName: {
    fontSize: 9,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginTop: 2,
  },
  pedigriChildren: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  emptyPedigri: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.grayDark,
    borderRadius: 16,
  },
  emptyText: {
    color: COLORS.grayLight,
    marginTop: 12,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
