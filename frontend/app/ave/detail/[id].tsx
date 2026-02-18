import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';

interface Ave {
  id: string;
  tipo: string;
  codigo: string;
  nombre?: string;
  foto_principal?: string;
  fecha_nacimiento?: string;
  color?: string;
  linea?: string;
  estado: string;
  notas?: string;
  padre_id?: string;
  madre_id?: string;
}

interface Pelea {
  id: string;
  fecha: string;
  resultado: string;
  calificacion: string;
  lugar?: string;
}

interface Salud {
  id: string;
  tipo: string;
  producto: string;
  fecha: string;
  proxima_fecha?: string;
}

export default function AveDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ave, setAve] = useState<Ave | null>(null);
  const [peleas, setPeleas] = useState<Pelea[]>([]);
  const [salud, setSalud] = useState<Salud[]>([]);
  const [hijos, setHijos] = useState<Ave[]>([]);
  const [pedigri, setPedigri] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pedigri');
  const [padre, setPadre] = useState<Ave | null>(null);
  const [madre, setMadre] = useState<Ave | null>(null);

  const tabs = [
    { key: 'pedigri', label: 'Pedigrí', icon: 'git-branch' },
    { key: 'peleas', label: 'Peleas', icon: 'trophy' },
    { key: 'salud', label: 'Salud', icon: 'medical' },
    { key: 'hijos', label: 'Hijos', icon: 'people' },
  ];

  const fetchData = async () => {
    try {
      const [aveData, peleasData, saludData, hijosData, pedigriData] = await Promise.all([
        api.get(`/aves/${id}`),
        api.get('/peleas', { ave_id: id }),
        api.get('/salud', { ave_id: id }),
        api.get(`/aves/${id}/hijos`),
        api.get(`/aves/${id}/pedigri`),
      ]);

      setAve(aveData);
      setPeleas(peleasData);
      setSalud(saludData);
      setHijos(hijosData);
      setPedigri(pedigriData);

      // Fetch parent info
      if (aveData.padre_id) {
        try {
          const padreData = await api.get(`/aves/${aveData.padre_id}`);
          setPadre(padreData);
        } catch (e) {}
      }
      if (aveData.madre_id) {
        try {
          const madreData = await api.get(`/aves/${aveData.madre_id}`);
          setMadre(madreData);
        } catch (e) {}
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Ave',
      '¿Estás seguro? Esta acción afectará el pedigrí y cruces relacionados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/aves/${id}`);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return '#22c55e';
      case 'vendido': return '#3b82f6';
      case 'muerto': return '#a0a0a0';
      case 'retirado': return '#f59e0b';
      default: return '#a0a0a0';
    }
  };

  const renderPedigriNode = (node: any, level: number = 0) => {
    if (!node || level > 4) return null;
    
    return (
      <View style={[styles.pedigriNode, { marginLeft: level * 8 }]}>
        <TouchableOpacity
          style={[
            styles.pedigriCard,
            node.unknown && styles.pedigriCardUnknown,
            level === 0 && styles.pedigriCardMain,
          ]}
          onPress={() => !node.unknown && node.id !== id && router.push(`/ave/detail/${node.id}`)}
          disabled={node.unknown || node.id === id}
        >
          {node.foto_principal ? (
            <Image source={{ uri: node.foto_principal }} style={styles.pedigriPhoto} />
          ) : (
            <View style={styles.pedigriPhotoPlaceholder}>
              <Ionicons
                name={node.tipo === 'gallo' ? 'fitness' : 'egg'}
                size={16}
                color={node.unknown ? '#4b5563' : '#f59e0b'}
              />
            </View>
          )}
          <View style={styles.pedigriInfo}>
            <Text style={styles.pedigriCode} numberOfLines={1}>
              {node.unknown ? '?' : node.codigo}
            </Text>
            {node.color && <Text style={styles.pedigriDetail}>{node.color}</Text>}
            {node.linea && <Text style={styles.pedigriDetail}>{node.linea}</Text>}
          </View>
        </TouchableOpacity>

        {(node.padre || node.madre) && (
          <View style={styles.pedigriChildren}>
            {node.padre && renderPedigriNode(node.padre, level + 1)}
            {node.madre && renderPedigriNode(node.madre, level + 1)}
          </View>
        )}
      </View>
    );
  };

  // Nuevo renderizado del árbol genealógico conectado
  const renderConnectedTree = () => {
    if (!pedigri) return null;

    const renderTreeNode = (node: any, label: string, isMain: boolean = false) => {
      if (!node) return (
        <View style={styles.treeNodeContainer}>
          <Text style={styles.treeLabel}>{label}</Text>
          <View style={[styles.treeNode, styles.treeNodeUnknown]}>
            <Text style={styles.treeNodeUnknownText}>?</Text>
          </View>
        </View>
      );

      return (
        <TouchableOpacity 
          style={styles.treeNodeContainer}
          onPress={() => !node.unknown && node.id !== id && router.push(`/ave/detail/${node.id}`)}
          disabled={node.unknown || node.id === id}
        >
          <Text style={styles.treeLabel}>{label}</Text>
          <View style={[
            styles.treeNode, 
            isMain && styles.treeNodeMain,
            node.unknown && styles.treeNodeUnknown
          ]}>
            {node.foto_principal ? (
              <Image source={{ uri: node.foto_principal }} style={styles.treePhoto} />
            ) : (
              <View style={styles.treePhotoPlaceholder}>
                <Ionicons
                  name={node.tipo === 'gallo' ? 'male' : 'female'}
                  size={isMain ? 24 : 16}
                  color={node.tipo === 'gallo' ? '#3b82f6' : '#ec4899'}
                />
              </View>
            )}
            <Text style={[styles.treeCode, isMain && styles.treeCodeMain]} numberOfLines={1}>
              {node.unknown ? '?' : node.codigo}
            </Text>
            {node.nombre && (
              <Text style={styles.treeName} numberOfLines={1}>{node.nombre}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.treeContainer}>
        {/* Nivel 0: Ave Principal */}
        <View style={styles.treeLevel}>
          {renderTreeNode(pedigri, '', true)}
        </View>

        {/* Conector vertical */}
        <View style={styles.treeConnectorVertical} />

        {/* Conector horizontal */}
        <View style={styles.treeConnectorHorizontal} />

        {/* Nivel 1: Padres */}
        <View style={styles.treeLevel}>
          <View style={styles.treeBranch}>
            {renderTreeNode(pedigri?.padre, 'Padre')}
          </View>
          <View style={styles.treeBranch}>
            {renderTreeNode(pedigri?.madre, 'Madre')}
          </View>
        </View>

        {/* Conectores a abuelos */}
        <View style={styles.treeGrandparentConnectors}>
          <View style={styles.treeConnectorVerticalSmall} />
          <View style={styles.treeConnectorVerticalSmall} />
        </View>

        {/* Conectores horizontales abuelos */}
        <View style={styles.treeGrandparentHorizontal}>
          <View style={styles.treeConnectorHorizontalSmall} />
          <View style={styles.treeConnectorHorizontalSmall} />
        </View>

        {/* Nivel 2: Abuelos */}
        <View style={styles.treeLevelGrandparents}>
          {/* Abuelos paternos */}
          <View style={styles.treeGrandparentPair}>
            {renderTreeNode(pedigri?.padre?.padre, 'Abuelo P.')}
            {renderTreeNode(pedigri?.padre?.madre, 'Abuela P.')}
          </View>
          {/* Abuelos maternos */}
          <View style={styles.treeGrandparentPair}>
            {renderTreeNode(pedigri?.madre?.padre, 'Abuelo M.')}
            {renderTreeNode(pedigri?.madre?.madre, 'Abuela M.')}
          </View>
        </View>
      </View>
    );
  };

  const renderPedigriTab = () => (
    <View style={styles.tabContent}>
      {/* Información del Ave */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tipo</Text>
          <View style={styles.infoValueRow}>
            <Ionicons
              name={ave?.tipo === 'gallo' ? 'fitness' : 'egg'}
              size={18}
              color={ave?.tipo === 'gallo' ? '#3b82f6' : '#ec4899'}
            />
            <Text style={styles.infoValue}>
              {ave?.tipo === 'gallo' ? 'Gallo' : 'Gallina'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Placa</Text>
          <Text style={styles.infoValue}>{ave?.codigo}</Text>
        </View>

        {ave?.nombre && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre</Text>
            <Text style={styles.infoValue}>{ave.nombre}</Text>
          </View>
        )}

        {ave?.color && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Color</Text>
            <Text style={styles.infoValue}>{ave.color}</Text>
          </View>
        )}

        {ave?.linea && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Línea</Text>
            <Text style={styles.infoValue}>{ave.linea}</Text>
          </View>
        )}

        {ave?.fecha_nacimiento && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nacimiento</Text>
            <Text style={styles.infoValue}>{ave.fecha_nacimiento}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado</Text>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(ave?.estado || '') + '20' }]}>
            <Text style={[styles.estadoText, { color: getEstadoColor(ave?.estado || '') }]}>
              {ave?.estado?.charAt(0).toUpperCase() + (ave?.estado?.slice(1) || '')}
            </Text>
          </View>
        </View>
      </View>

      {/* Padres */}
      <Text style={styles.sectionTitle}>Padres</Text>
      <View style={styles.parentsRow}>
        <TouchableOpacity
          style={styles.parentCard}
          onPress={() => padre && router.push(`/ave/detail/${padre.id}`)}
          disabled={!padre && !ave?.padre_externo}
        >
          <View style={[styles.parentIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="male" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.parentLabel}>Padre</Text>
          <Text style={styles.parentCode}>
            {padre?.codigo || ave?.padre_externo || 'Desconocido'}
          </Text>
          {ave?.padre_externo && !padre && (
            <Text style={styles.parentExternal}>Externo</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.parentCard}
          onPress={() => madre && router.push(`/ave/detail/${madre.id}`)}
          disabled={!madre && !ave?.madre_externo}
        >
          <View style={[styles.parentIcon, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
            <Ionicons name="female" size={20} color="#ec4899" />
          </View>
          <Text style={styles.parentLabel}>Madre</Text>
          <Text style={styles.parentCode}>
            {madre?.codigo || ave?.madre_externo || 'Desconocida'}
          </Text>
          {ave?.madre_externo && !madre && (
            <Text style={styles.parentExternal}>Externa</Text>
          )}
        </TouchableOpacity>
      </View>

      {ave?.notas && (
        <>
          <Text style={styles.sectionTitle}>Notas</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{ave.notas}</Text>
          </View>
        </>
      )}

      {/* Árbol de Pedigrí */}
      <Text style={styles.sectionTitle}>Árbol Genealógico</Text>
      <ScrollView horizontal style={styles.pedigriScroll}>
        <View style={styles.pedigriContainer}>
          {pedigri ? renderPedigriNode(pedigri) : (
            <Text style={styles.emptyText}>Sin información de pedigrí</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );

  const renderPeleasTab = () => (
    <View style={styles.tabContent}>
      {peleas.length > 0 ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {peleas.filter(p => p.resultado === 'GANO').length}
              </Text>
              <Text style={styles.statLabel}>Ganadas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {peleas.filter(p => p.resultado === 'PERDIO').length}
              </Text>
              <Text style={styles.statLabel}>Perdidas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>
                {peleas.length > 0
                  ? Math.round((peleas.filter(p => p.resultado === 'GANO').length / peleas.length) * 100)
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>Victoria</Text>
            </View>
          </View>

          {peleas.map((pelea) => (
            <View key={pelea.id} style={styles.peleaItem}>
              <View
                style={[
                  styles.peleaResult,
                  pelea.resultado === 'GANO' ? styles.peleaWin : styles.peleaLoss,
                ]}
              >
                <Text style={styles.peleaResultText}>
                  {pelea.resultado === 'GANO' ? 'G' : 'P'}
                </Text>
              </View>
              <View style={styles.peleaInfo}>
                <Text style={styles.peleaDate}>{pelea.fecha}</Text>
                {pelea.lugar && <Text style={styles.peleaPlace}>{pelea.lugar}</Text>}
              </View>
              <View style={styles.peleaRating}>
                <Text style={styles.peleaRatingText}>{pelea.calificacion?.charAt(0)}</Text>
              </View>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color="#4b5563" />
          <Text style={styles.emptyText}>Sin peleas registradas</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/pelea/new')}
          >
            <Text style={styles.emptyButtonText}>Registrar Pelea</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSaludTab = () => (
    <View style={styles.tabContent}>
      {salud.length > 0 ? (
        salud.map((record) => (
          <View key={record.id} style={styles.saludItem}>
            <View style={styles.saludIcon}>
              <Ionicons
                name={record.tipo === 'vacuna' ? 'shield-checkmark' : 'flask'}
                size={20}
                color="#f59e0b"
              />
            </View>
            <View style={styles.saludInfo}>
              <Text style={styles.saludProduct}>{record.producto}</Text>
              <Text style={styles.saludType}>
                {record.tipo.charAt(0).toUpperCase() + record.tipo.slice(1)}
              </Text>
              <Text style={styles.saludDate}>{record.fecha}</Text>
            </View>
            {record.proxima_fecha && (
              <View style={styles.saludNext}>
                <Text style={styles.saludNextLabel}>Próxima</Text>
                <Text style={styles.saludNextDate}>{record.proxima_fecha}</Text>
              </View>
            )}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="medical-outline" size={48} color="#4b5563" />
          <Text style={styles.emptyText}>Sin registros de salud</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push(`/salud/new?ave_id=${id}`)}
          >
            <Text style={styles.emptyButtonText}>Agregar Registro</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderHijosTab = () => (
    <View style={styles.tabContent}>
      {/* Botón para registrar nuevo hijo */}
      <TouchableOpacity
        style={styles.registerChildButton}
        onPress={() => router.push(`/ave/new?padre_id=${ave?.tipo === 'gallo' ? id : ''}&madre_id=${ave?.tipo === 'gallina' ? id : ''}`)}
      >
        <Ionicons name="add-circle" size={24} color="#f59e0b" />
        <Text style={styles.registerChildText}>Registrar Nuevo Hijo</Text>
      </TouchableOpacity>

      {hijos.length > 0 ? (
        hijos.map((hijo) => (
          <TouchableOpacity
            key={hijo.id}
            style={styles.hijoItem}
            onPress={() => router.push(`/ave/detail/${hijo.id}`)}
          >
            {hijo.foto_principal ? (
              <Image source={{ uri: hijo.foto_principal }} style={styles.hijoPhoto} />
            ) : (
              <View style={styles.hijoPhotoPlaceholder}>
                <Ionicons
                  name={hijo.tipo === 'gallo' ? 'fitness' : 'egg'}
                  size={24}
                  color="#a0a0a0"
                />
              </View>
            )}
            <View style={styles.hijoInfo}>
              <Text style={styles.hijoCodigo}>{hijo.codigo}</Text>
              {hijo.nombre && <Text style={styles.hijoNombre}>{hijo.nombre}</Text>}
              <View style={styles.hijoDetails}>
                {hijo.color && <Text style={styles.hijoDetail}>{hijo.color}</Text>}
                {hijo.linea && <Text style={styles.hijoDetail}>{hijo.linea}</Text>}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a0a0a0" />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#4b5563" />
          <Text style={styles.emptyText}>Sin hijos registrados</Text>
          <Text style={styles.emptySubtext}>Usa el botón de arriba para registrar un hijo</Text>
        </View>
      )}
    </View>
  );

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#d4a017" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ave?.codigo}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push(`/ave/${id}`)} style={styles.headerButton}>
            <Ionicons name="pencil" size={20} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {ave?.foto_principal ? (
            <Image source={{ uri: ave.foto_principal }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Ionicons
                name={ave?.tipo === 'gallo' ? 'fitness' : 'egg'}
                size={48}
                color="#a0a0a0"
              />
            </View>
          )}
          <Text style={styles.profileCodigo}>{ave?.codigo}</Text>
          {ave?.nombre && <Text style={styles.profileNombre}>{ave.nombre}</Text>}
          <View style={[styles.profileEstado, { backgroundColor: getEstadoColor(ave?.estado || '') }]}>
            <Text style={styles.profileEstadoText}>
              {ave?.estado?.charAt(0).toUpperCase() + (ave?.estado?.slice(1) || '')}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={activeTab === tab.key ? '#f59e0b' : '#a0a0a0'}
                />
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {activeTab === 'pedigri' && renderPedigriTab()}
        {activeTab === 'peleas' && renderPeleasTab()}
        {activeTab === 'salud' && renderSaludTab()}
        {activeTab === 'hijos' && renderHijosTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
    borderBottomColor: '#333333',
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
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileCodigo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileNombre: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 4,
  },
  profileEstado: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  profileEstadoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b',
  },
  tabText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  tabTextActive: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#242424',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  infoLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  parentsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  parentCard: {
    flex: 1,
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  parentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  parentLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  parentCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  parentExternal: {
    fontSize: 10,
    color: '#f59e0b',
    marginTop: 4,
    fontWeight: '500',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notesCard: {
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  notesText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  pedigriScroll: {
    flex: 1,
  },
  pedigriContainer: {
    padding: 16,
    minWidth: '100%',
  },
  pedigriNode: {
    marginBottom: 8,
  },
  pedigriCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 4,
  },
  pedigriCardMain: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  pedigriCardUnknown: {
    opacity: 0.5,
  },
  pedigriPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  pedigriPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedigriInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pedigriCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  pedigriDetail: {
    fontSize: 11,
    color: '#a0a0a0',
  },
  pedigriChildren: {
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#333333',
    paddingLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 4,
  },
  peleaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  peleaResult: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peleaWin: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  peleaLoss: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  peleaResultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  peleaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  peleaDate: {
    fontSize: 14,
    color: '#fff',
  },
  peleaPlace: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  peleaRating: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peleaRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  saludItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  saludIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saludInfo: {
    flex: 1,
    marginLeft: 12,
  },
  saludProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  saludType: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  saludDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  saludNext: {
    alignItems: 'flex-end',
  },
  saludNextLabel: {
    fontSize: 11,
    color: '#a0a0a0',
  },
  saludNextDate: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '500',
  },
  hijoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  hijoPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  hijoPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hijoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hijoCodigo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  hijoNombre: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  hijoDetails: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  hijoDetail: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  registerChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  registerChildText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f59e0b',
  },
});
