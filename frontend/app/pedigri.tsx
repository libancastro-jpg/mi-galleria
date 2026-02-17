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
  background: '#f5f5f5',
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  grayDark: '#ffffff',
  grayMedium: '#e0e0e0',
  grayLight: '#555555',
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
  cresta?: string;
  linea?: string;
  castado_por?: string;
  fecha_nacimiento?: string;
  estado?: string;
  foto_principal?: string;
  padre_id?: string;
  madre_id?: string;
  padre_externo?: string;
  madre_externo?: string;
  notas?: string;
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
  const [aveDetails, setAveDetails] = useState<Ave | null>(null);
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

  const fetchAveDetails = async (aveId: string) => {
    try {
      const data = await api.get(`/aves/${aveId}`);
      setAveDetails(data);
    } catch (error) {
      console.error('Error fetching ave details:', error);
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
    fetchAveDetails(ave.id);
    fetchPedigri(ave.id);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return '#22c55e';
      case 'vendido': return '#3b82f6';
      case 'retirado': return '#f59e0b';
      default: return '#555555';
    }
  };

  const renderPedigriNode = (node: PedigriNode | null | undefined, level: number = 0) => {
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
            {renderPedigriNode(node.padre, level + 1)}
            {renderPedigriNode(node.madre, level + 1)}
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

        {/* Detalles del Ave Seleccionada */}
        {selectedAve && aveDetails && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Detalles de {aveDetails.codigo}</Text>
            
            <View style={styles.detailsCard}>
              {/* Foto y datos principales */}
              <View style={styles.detailsHeader}>
                {aveDetails.foto_principal ? (
                  <Image source={{ uri: aveDetails.foto_principal }} style={styles.detailPhoto} />
                ) : (
                  <View style={styles.detailPhotoPlaceholder}>
                    <Ionicons
                      name={aveDetails.tipo === 'gallo' ? 'male' : 'female'}
                      size={40}
                      color={aveDetails.tipo === 'gallo' ? COLORS.blue : COLORS.pink}
                    />
                  </View>
                )}
                <View style={styles.detailsMain}>
                  <Text style={styles.detailCodigo}>{aveDetails.codigo}</Text>
                  {aveDetails.nombre && (
                    <Text style={styles.detailNombre}>{aveDetails.nombre}</Text>
                  )}
                  <View style={[styles.tipoBadge, { backgroundColor: aveDetails.tipo === 'gallo' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)' }]}>
                    <Ionicons
                      name={aveDetails.tipo === 'gallo' ? 'male' : 'female'}
                      size={14}
                      color={aveDetails.tipo === 'gallo' ? COLORS.blue : COLORS.pink}
                    />
                    <Text style={[styles.tipoBadgeText, { color: aveDetails.tipo === 'gallo' ? COLORS.blue : COLORS.pink }]}>
                      {aveDetails.tipo === 'gallo' ? 'Gallo' : 'Gallina'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Info Grid */}
              <View style={styles.infoGrid}>
                {aveDetails.color && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Color</Text>
                    <Text style={styles.infoValue}>{aveDetails.color}</Text>
                  </View>
                )}
                {aveDetails.cresta && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Cresta</Text>
                    <Text style={styles.infoValue}>{aveDetails.cresta}</Text>
                  </View>
                )}
                {aveDetails.linea && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Línea</Text>
                    <Text style={styles.infoValue}>{aveDetails.linea}</Text>
                  </View>
                )}
                {aveDetails.castado_por && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Castado Por</Text>
                    <Text style={styles.infoValue}>{aveDetails.castado_por}</Text>
                  </View>
                )}
                {aveDetails.fecha_nacimiento && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Nacimiento</Text>
                    <Text style={styles.infoValue}>{aveDetails.fecha_nacimiento}</Text>
                  </View>
                )}
                {aveDetails.estado && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Estado</Text>
                    <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(aveDetails.estado) + '20' }]}>
                      <Text style={[styles.estadoText, { color: getEstadoColor(aveDetails.estado) }]}>
                        {aveDetails.estado.charAt(0).toUpperCase() + aveDetails.estado.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Padres */}
              <View style={styles.parentsSection}>
                <Text style={styles.parentsTitle}>Padres</Text>
                <View style={styles.parentsRow}>
                  <View style={styles.parentItem}>
                    <View style={[styles.parentIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons name="male" size={16} color={COLORS.blue} />
                    </View>
                    <Text style={styles.parentLabel}>Padre</Text>
                    <Text style={styles.parentValue}>
                      {aveDetails.padre_externo || 
                       (aveDetails.padre_id ? aves.find(a => a.id === aveDetails.padre_id)?.codigo : 'Desconocido') ||
                       'Desconocido'}
                    </Text>
                    {aveDetails.padre_externo && (
                      <Text style={styles.externalLabel}>Externo</Text>
                    )}
                  </View>
                  <View style={styles.parentItem}>
                    <View style={[styles.parentIcon, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                      <Ionicons name="female" size={16} color={COLORS.pink} />
                    </View>
                    <Text style={styles.parentLabel}>Madre</Text>
                    <Text style={styles.parentValue}>
                      {aveDetails.madre_externo || 
                       (aveDetails.madre_id ? aves.find(a => a.id === aveDetails.madre_id)?.codigo : 'Desconocida') ||
                       'Desconocida'}
                    </Text>
                    {aveDetails.madre_externo && (
                      <Text style={styles.externalLabel}>Externa</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Notas */}
              {aveDetails.notas && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Notas</Text>
                  <Text style={styles.notesText}>{aveDetails.notas}</Text>
                </View>
              )}

              {/* Botón ver más */}
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => router.push(`/ave/detail/${aveDetails.id}`)}
              >
                <Text style={styles.viewMoreText}>Ver detalle completo</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Árbol Genealógico */}
        {selectedAve && (
          <View style={styles.pedigriSection}>
            <Text style={styles.sectionTitle}>Árbol Genealógico</Text>
            
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
              Toca una de las aves de arriba para ver sus detalles y árbol genealógico
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
    width: 90,
    alignItems: 'center',
    padding: 10,
    marginRight: 10,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 6,
  },
  avePhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.grayMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  aveCodigo: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  aveNombre: {
    fontSize: 9,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginTop: 2,
  },
  // Detalles del ave
  detailsSection: {
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: COLORS.grayDark,
    borderRadius: 16,
    padding: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailPhoto: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  detailPhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.grayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsMain: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  detailCodigo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  detailNombre: {
    fontSize: 14,
    color: COLORS.grayLight,
    marginTop: 2,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  tipoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  infoItem: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.grayLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  parentsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayMedium,
  },
  parentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
  },
  parentsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  parentItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  parentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  parentLabel: {
    fontSize: 11,
    color: COLORS.grayLight,
    marginBottom: 4,
  },
  parentValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  externalLabel: {
    fontSize: 9,
    color: COLORS.gold,
    marginTop: 4,
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayMedium,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 13,
    color: COLORS.grayLight,
    lineHeight: 20,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    gap: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gold,
  },
  // Pedigrí
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
