import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  TextInput,
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

const PedigriNodeCard = React.memo(function PedigriNodeCard({
  node,
  label,
  nodeKey,
  isParent = false,
  isExpanded,
  isDuplicate,
  isCurrentAve,
  onToggle,
  onOpen,
}: {
  node: any;
  label: string;
  nodeKey: string;
  isParent?: boolean;
  isExpanded: boolean;
  isDuplicate: boolean;
  isCurrentAve: boolean;
  onToggle: (key: string) => void;
  onOpen: (nodeId: string) => void;
}) {
  const isExternal = node?.externo || (!node?.id && node?.codigo);

  if (!node) {
    return (
      <View style={[styles.treeNodeContainer, isParent && styles.treeNodeContainerParent]}>
        <Text style={[styles.treeLabel, isParent && styles.treeLabelParent]}>{label}</Text>
        <View style={[styles.treeNode, styles.treeNodeUnknown, isParent && styles.treeNodeParent]}>
          <Text style={styles.treeNodeUnknownText}>?</Text>
          <Text style={styles.treeNodeUnknownSubtext}>Desconocido</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.treeNodeContainer, isParent && styles.treeNodeContainerParent]}>
      <Text style={[styles.treeLabel, isParent && styles.treeLabelParent]}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.treeNode,
          isParent && styles.treeNodeParent,
          isDuplicate && styles.treeNodeDuplicate,
          isExpanded && styles.treeNodeExpanded,
        ]}
        onPress={() => onToggle(nodeKey)}
        activeOpacity={0.9}
      >
        {isDuplicate ? (
          <View style={styles.duplicateBadge}>
            <Ionicons name="git-merge" size={10} color="#fff" />
          </View>
        ) : null}

        {node.foto_principal ? (
          <Image
            source={{ uri: node.foto_principal }}
            style={[styles.treePhoto, isParent && styles.treePhotoParent]}
          />
        ) : (
          <View
            style={[
              styles.treePhotoPlaceholder,
              isParent && styles.treePhotoPlaceholderParent,
              isDuplicate && styles.treePhotoPlaceholderDuplicate,
            ]}
          >
            <Ionicons
              name={node.tipo === 'gallo' ? 'male' : 'female'}
              size={isParent ? 24 : 18}
              color={isDuplicate ? '#f59e0b' : node.tipo === 'gallo' ? '#3b82f6' : '#ec4899'}
            />
          </View>
        )}

        <Text
          style={[
            styles.treeCode,
            isParent && styles.treeCodeParent,
            isDuplicate && styles.treeCodeDuplicate,
          ]}
          numberOfLines={1}
        >
          PL: {node.codigo}
        </Text>

        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="#9ca3af"
          style={{ marginTop: 4 }}
        />
      </TouchableOpacity>

      {isExpanded ? (
        <View style={styles.expandedPanel}>
          {node.nombre ? (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Nombre:</Text>
              <Text style={styles.expandedValue}>{node.nombre}</Text>
            </View>
          ) : null}

          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>Placa:</Text>
            <Text style={styles.expandedValue}>{node.codigo}</Text>
          </View>

          {node.galleria ? (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Gallería:</Text>
              <Text style={styles.expandedValue}>{node.galleria}</Text>
            </View>
          ) : null}

          {node.color ? (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Color:</Text>
              <Text style={styles.expandedValue}>{node.color}</Text>
            </View>
          ) : null}

          {node.linea ? (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Línea:</Text>
              <Text style={styles.expandedValue}>{node.linea}</Text>
            </View>
          ) : null}

          {isExternal ? (
            <View style={styles.expandedExternalBadge}>
              <Ionicons name="globe-outline" size={12} color="#f59e0b" />
              <Text style={styles.expandedExternalText}>Ave Externa</Text>
            </View>
          ) : null}

          {!isExternal && node.id && !isCurrentAve ? (
            <TouchableOpacity
              style={styles.expandedViewBtn}
              onPress={() => onOpen(node.id)}
            >
              <Text style={styles.expandedViewBtnText}>Ver Perfil Completo</Text>
              <Ionicons name="arrow-forward" size={14} color="#f59e0b" />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const AbueloNodeCard = React.memo(function AbueloNodeCard({
  node,
  label,
  nodeKey,
  parentKey,
  isExpanded,
  isDuplicate,
  isEditing,
  abueloForm,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onSave,
  onChangeForm,
  onOpen,
  currentId,
}: {
  node: any;
  label: string;
  nodeKey: string;
  parentKey: string;
  isExpanded: boolean;
  isDuplicate: boolean;
  isEditing: boolean;
  abueloForm: {
    codigo: string;
    galleria: string;
    nombre: string;
    color: string;
    linea: string;
  };
  onToggle: (key: string) => void;
  onStartEdit: (key: string) => void;
  onCancelEdit: () => void;
  onSave: (nodeKey: string, parentKey: string, tipo: string) => void;
  onChangeForm: (patch: Partial<{
    codigo: string;
    galleria: string;
    nombre: string;
    color: string;
    linea: string;
  }>) => void;
  onOpen: (nodeId: string) => void;
  currentId: string;
}) {
  const tipo = label.includes('Abuelo') ? 'gallo' : 'gallina';
  const isExternal = node?.externo || (!node?.id && node?.codigo);

  if (!node) {
    return (
      <View style={styles.abueloNodeContainer}>
        <Text style={styles.abueloLabel}>{label}</Text>

        {isEditing ? (
          <View style={styles.abueloEditForm}>
            <TextInput
              style={styles.abueloInput}
              placeholder="Placa *"
              placeholderTextColor="#666"
              value={abueloForm.codigo}
              onChangeText={(text) => onChangeForm({ codigo: text })}
            />
            <TextInput
              style={styles.abueloInput}
              placeholder="Gallería"
              placeholderTextColor="#666"
              value={abueloForm.galleria}
              onChangeText={(text) => onChangeForm({ galleria: text })}
            />
            <TextInput
              style={styles.abueloInput}
              placeholder="Nombre"
              placeholderTextColor="#666"
              value={abueloForm.nombre}
              onChangeText={(text) => onChangeForm({ nombre: text })}
            />
            <TextInput
              style={styles.abueloInput}
              placeholder="Color"
              placeholderTextColor="#666"
              value={abueloForm.color}
              onChangeText={(text) => onChangeForm({ color: text })}
            />
            <TextInput
              style={styles.abueloInput}
              placeholder="Línea"
              placeholderTextColor="#666"
              value={abueloForm.linea}
              onChangeText={(text) => onChangeForm({ linea: text })}
            />
            <View style={styles.abueloFormButtons}>
              <TouchableOpacity style={styles.abueloCancelBtn} onPress={onCancelEdit}>
                <Text style={styles.abueloCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.abueloSaveBtn,
                  !abueloForm.codigo.trim() && styles.abueloSaveBtnDisabled,
                ]}
                disabled={!abueloForm.codigo.trim()}
                onPress={() => onSave(nodeKey, parentKey, tipo)}
              >
                <Text style={styles.abueloSaveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.abueloAddBtn}
            onPress={() => onStartEdit(nodeKey)}
          >
            <Ionicons name="add" size={18} color="#9ca3af" />
            <Text style={styles.abueloAddText}>Agregar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.abueloNodeContainer}>
      <Text style={styles.abueloLabel}>{label}</Text>

      <TouchableOpacity
        style={[styles.abueloNode, isDuplicate && styles.abueloNodeDuplicate]}
        onPress={() => onToggle(nodeKey)}
        activeOpacity={0.9}
      >
        <View
          style={[
            styles.abueloIcon,
            {
              backgroundColor:
                node.tipo === 'gallo'
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'rgba(236, 72, 153, 0.15)',
            },
          ]}
        >
          <Ionicons
            name={node.tipo === 'gallo' ? 'male' : 'female'}
            size={14}
            color={isDuplicate ? '#f59e0b' : node.tipo === 'gallo' ? '#3b82f6' : '#ec4899'}
          />
        </View>

        <Text style={[styles.abueloCode, isDuplicate && { color: '#f59e0b' }]} numberOfLines={1}>
          {node.codigo}
        </Text>

        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#9ca3af"
        />
      </TouchableOpacity>

      {isExpanded ? (
        <View style={styles.abueloExpandedPanel}>
          {node.nombre ? <Text style={styles.abueloExpandedText}>📛 {node.nombre}</Text> : null}
          <Text style={styles.abueloExpandedText}>🏷️ PL: {node.codigo}</Text>
          {node.galleria ? <Text style={styles.abueloExpandedText}>🏢 {node.galleria}</Text> : null}
          {node.color ? <Text style={styles.abueloExpandedText}>🎨 {node.color}</Text> : null}
          {node.linea ? <Text style={styles.abueloExpandedText}>🧬 {node.linea}</Text> : null}
          {isExternal ? <Text style={styles.abueloExpandedExternal}>🌐 Externo</Text> : null}
          {!isExternal && node.id && node.id !== currentId ? (
            <TouchableOpacity
              style={styles.abueloViewBtn}
              onPress={() => onOpen(node.id)}
            >
              <Text style={styles.abueloViewBtnText}>Ver Perfil</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

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
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [showAbuelos, setShowAbuelos] = useState(false);

  const [editingAbuelo, setEditingAbuelo] = useState<string | null>(null);
  const [abueloForm, setAbueloForm] = useState({
    codigo: '',
    galleria: '',
    nombre: '',
    color: '',
    linea: '',
  });

  const isFetchingRef = useRef(false);

  const tabs = useMemo(
    () => [
      { key: 'pedigri', label: 'Pedigrí', icon: 'git-branch' },
      { key: 'peleas', label: 'Peleas', icon: 'trophy' },
      { key: 'salud', label: 'Salud', icon: 'medical' },
      { key: 'hijos', label: 'Hijos', icon: 'people' },
    ],
    []
  );

  const fetchData = useCallback(
    async (manualRefresh = false) => {
      if (!id || isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        if (manualRefresh) {
          setRefreshing(true);
        } else if (!ave) {
          setLoading(true);
        }

        const [aveData, peleasData, saludData, hijosData, pedigriData] = await Promise.all([
          api.get(`/aves/${id}`),
          api.get('/peleas', { ave_id: id }),
          api.get('/salud', { ave_id: id }),
          api.get(`/aves/${id}/hijos`),
          api.get(`/aves/${id}/pedigri`, { generations: '3' }),
        ]);

        setAve(aveData);
        setPeleas(Array.isArray(peleasData) ? peleasData : []);
        setSalud(Array.isArray(saludData) ? saludData : []);
        setHijos(Array.isArray(hijosData) ? hijosData : []);
        setPedigri(pedigriData ?? null);
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'No se pudo cargar el detalle');
      } finally {
        setLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [id, ave]
  );

  useFocusEffect(
    useCallback(() => {
      fetchData(false);
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const handleDelete = useCallback(() => {
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
              Alert.alert('Error', error?.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  }, [id, router]);

  const getEstadoColor = useCallback((estado: string) => {
    switch (estado) {
      case 'activo':
        return '#22c55e';
      case 'vendido':
        return '#3b82f6';
      case 'muerto':
        return '#a0a0a0';
      case 'retirado':
        return '#f59e0b';
      default:
        return '#a0a0a0';
    }
  }, []);

  const getBaseGeneticaItems = useCallback(() => {
    const linea = ave?.linea?.trim();
    if (!linea) return [];
    return linea
      .split(/[\/,+-]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [ave?.linea]);

  const lineasBase = useMemo(() => getBaseGeneticaItems(), [getBaseGeneticaItems]);

  const duplicateIds = useMemo(() => {
    if (!pedigri) return new Set<string>();

    const ids = new Map<string, number>();

    const collectIds = (node: any) => {
      if (!node || node.unknown) return;
      const identifier = node.id || (node.externo && node.codigo ? `ext_${node.codigo}` : null);
      if (identifier) {
        ids.set(identifier, (ids.get(identifier) || 0) + 1);
      }
      if (node.padre) collectIds(node.padre);
      if (node.madre) collectIds(node.madre);
    };

    collectIds(pedigri);

    const duplicates = new Set<string>();
    ids.forEach((count, identifier) => {
      if (count > 1) duplicates.add(identifier);
    });

    return duplicates;
  }, [pedigri]);

  const hasConsanguinidad = duplicateIds.size > 0;

  const toggleExpandedNode = useCallback((key: string) => {
    setExpandedNode((prev) => (prev === key ? null : key));
  }, []);

  const handleOpenNode = useCallback(
    (nodeId: string) => {
      if (!nodeId || nodeId === id) return;
      router.push(`/ave/detail/${nodeId}`);
    },
    [id, router]
  );

  const handleStartEditAbuelo = useCallback((nodeKey: string) => {
    setAbueloForm({
      codigo: '',
      galleria: '',
      nombre: '',
      color: '',
      linea: '',
    });
    setEditingAbuelo(nodeKey);
  }, []);

  const handleCancelEditAbuelo = useCallback(() => {
    setEditingAbuelo(null);
    setAbueloForm({
      codigo: '',
      galleria: '',
      nombre: '',
      color: '',
      linea: '',
    });
  }, []);

  const updateAbueloForm = useCallback(
    (patch: Partial<typeof abueloForm>) => {
      setAbueloForm((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const handleSaveAbuelo = useCallback(
    async (nodeKey: string, parentKey: string, tipo: string) => {
      const codigo = abueloForm.codigo.trim();
      if (!codigo) return;

      try {
        const updateData: any = {};

        if (parentKey === 'padre') {
          if (nodeKey === 'abuelo_p') {
            updateData.abuelo_paterno_padre = codigo;
            updateData.abuelo_paterno_padre_galleria = abueloForm.galleria.trim();
          } else {
            updateData.abuelo_paterno_madre = codigo;
            updateData.abuelo_paterno_madre_galleria = abueloForm.galleria.trim();
          }
        } else {
          if (nodeKey === 'abuelo_m') {
            updateData.abuelo_materno_padre = codigo;
            updateData.abuelo_materno_padre_galleria = abueloForm.galleria.trim();
          } else {
            updateData.abuelo_materno_madre = codigo;
            updateData.abuelo_materno_madre_galleria = abueloForm.galleria.trim();
          }
        }

        await api.put(`/aves/${id}`, updateData);

        const newAbuelo = {
          codigo,
          galleria: abueloForm.galleria.trim(),
          nombre: abueloForm.nombre.trim(),
          color: abueloForm.color.trim(),
          linea: abueloForm.linea.trim(),
          tipo,
          externo: true,
        };

        setPedigri((prev: any) => {
          const next = JSON.parse(JSON.stringify(prev || {}));

          if (parentKey === 'padre') {
            if (!next.padre) next.padre = {};
            if (nodeKey === 'abuelo_p') {
              next.padre.padre = newAbuelo;
            } else {
              next.padre.madre = newAbuelo;
            }
          } else {
            if (!next.madre) next.madre = {};
            if (nodeKey === 'abuelo_m') {
              next.madre.padre = newAbuelo;
            } else {
              next.madre.madre = newAbuelo;
            }
          }

          return next;
        });

        handleCancelEditAbuelo();
        Alert.alert('Éxito', 'Abuelo agregado correctamente');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'No se pudo guardar');
      }
    },
    [abueloForm, handleCancelEditAbuelo, id]
  );

  const renderBaseGenetica = useCallback(() => {
    return (
      <View style={styles.geneticaCard}>
        <View style={styles.geneticaHeader}>
          <View style={styles.geneticaHeaderLeft}>
            <Ionicons name="flask-outline" size={18} color="#f59e0b" />
            <Text style={styles.geneticaTitle}>Base genética</Text>
          </View>
        </View>

        {lineasBase.length > 0 ? (
          <>
            {lineasBase.map((linea, index) => (
              <View
                key={`${linea}-${index}`}
                style={[
                  styles.geneticaRow,
                  index === lineasBase.length - 1 && styles.geneticaRowLast,
                ]}
              >
                <Text style={styles.geneticaLine}>{linea}</Text>
                <Text style={styles.geneticaPercent}>
                  {lineasBase.length === 1 ? '100%' : `${Math.round(100 / lineasBase.length)}% base`}
                </Text>
              </View>
            ))}
            <Text style={styles.geneticaNote}>
              Base inicial tomada del campo línea del ave.
            </Text>
          </>
        ) : (
          <Text style={styles.geneticaEmpty}>
            Esta ave aún no tiene línea genética registrada.
          </Text>
        )}
      </View>
    );
  }, [lineasBase]);

  const renderConnectedTree = useCallback(() => {
    if (!pedigri) return null;

    return (
      <View style={styles.treeContainer}>
        {hasConsanguinidad ? (
          <View style={styles.consanguinidadAlert}>
            <Ionicons name="warning" size={16} color="#f59e0b" />
            <Text style={styles.consanguinidadText}>
              Consanguinidad detectada - Aves repetidas marcadas en dorado
            </Text>
          </View>
        ) : null}

        <View style={styles.treeConnectorVerticalLong} />
        <View style={styles.treeConnectorHorizontal} />

        <View style={styles.treeLevel}>
          <View style={styles.treeBranch}>
            <PedigriNodeCard
              node={pedigri?.padre}
              label="Padre"
              nodeKey="padre"
              isParent
              isExpanded={expandedNode === 'padre'}
              isDuplicate={
                !!(pedigri?.padre?.id || pedigri?.padre?.codigo) &&
                duplicateIds.has(
                  pedigri?.padre?.id || `ext_${pedigri?.padre?.codigo}`
                )
              }
              isCurrentAve={false}
              onToggle={toggleExpandedNode}
              onOpen={handleOpenNode}
            />
          </View>

          <View style={styles.treeBranch}>
            <PedigriNodeCard
              node={pedigri?.madre}
              label="Madre"
              nodeKey="madre"
              isParent
              isExpanded={expandedNode === 'madre'}
              isDuplicate={
                !!(pedigri?.madre?.id || pedigri?.madre?.codigo) &&
                duplicateIds.has(
                  pedigri?.madre?.id || `ext_${pedigri?.madre?.codigo}`
                )
              }
              isCurrentAve={false}
              onToggle={toggleExpandedNode}
              onOpen={handleOpenNode}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.toggleAbuelosBtn}
          onPress={() => setShowAbuelos((prev) => !prev)}
        >
          <Ionicons
            name={showAbuelos ? 'chevron-up-circle' : 'add-circle'}
            size={24}
            color="#f59e0b"
          />
          <Text style={styles.toggleAbuelosText}>
            {showAbuelos ? 'Ocultar Abuelos' : 'Ver Abuelos'}
          </Text>
        </TouchableOpacity>

        {showAbuelos ? (
          <View style={styles.abuelosContainer}>
            <View style={styles.treeGrandparentConnectors}>
              <View style={styles.treeConnectorVerticalSmall} />
              <View style={styles.treeConnectorVerticalSmall} />
            </View>

            <View style={styles.treeGrandparentHorizontal}>
              <View style={styles.treeConnectorHorizontalSmall} />
              <View style={styles.treeConnectorHorizontalSmall} />
            </View>

            <View style={styles.treeLevelGrandparents}>
              <View style={styles.treeGrandparentPair}>
                <AbueloNodeCard
                  node={pedigri?.padre?.padre}
                  label="Abuelo P."
                  nodeKey="abuelo_p"
                  parentKey="padre"
                  isExpanded={expandedNode === 'abuelo_p'}
                  isDuplicate={
                    !!(pedigri?.padre?.padre?.id || pedigri?.padre?.padre?.codigo) &&
                    duplicateIds.has(
                      pedigri?.padre?.padre?.id || `ext_${pedigri?.padre?.padre?.codigo}`
                    )
                  }
                  isEditing={editingAbuelo === 'abuelo_p'}
                  abueloForm={abueloForm}
                  onToggle={toggleExpandedNode}
                  onStartEdit={handleStartEditAbuelo}
                  onCancelEdit={handleCancelEditAbuelo}
                  onSave={handleSaveAbuelo}
                  onChangeForm={updateAbueloForm}
                  onOpen={handleOpenNode}
                  currentId={id || ''}
                />
                <AbueloNodeCard
                  node={pedigri?.padre?.madre}
                  label="Abuela P."
                  nodeKey="abuela_p"
                  parentKey="padre"
                  isExpanded={expandedNode === 'abuela_p'}
                  isDuplicate={
                    !!(pedigri?.padre?.madre?.id || pedigri?.padre?.madre?.codigo) &&
                    duplicateIds.has(
                      pedigri?.padre?.madre?.id || `ext_${pedigri?.padre?.madre?.codigo}`
                    )
                  }
                  isEditing={editingAbuelo === 'abuela_p'}
                  abueloForm={abueloForm}
                  onToggle={toggleExpandedNode}
                  onStartEdit={handleStartEditAbuelo}
                  onCancelEdit={handleCancelEditAbuelo}
                  onSave={handleSaveAbuelo}
                  onChangeForm={updateAbueloForm}
                  onOpen={handleOpenNode}
                  currentId={id || ''}
                />
              </View>

              <View style={styles.treeGrandparentPair}>
                <AbueloNodeCard
                  node={pedigri?.madre?.padre}
                  label="Abuelo M."
                  nodeKey="abuelo_m"
                  parentKey="madre"
                  isExpanded={expandedNode === 'abuelo_m'}
                  isDuplicate={
                    !!(pedigri?.madre?.padre?.id || pedigri?.madre?.padre?.codigo) &&
                    duplicateIds.has(
                      pedigri?.madre?.padre?.id || `ext_${pedigri?.madre?.padre?.codigo}`
                    )
                  }
                  isEditing={editingAbuelo === 'abuelo_m'}
                  abueloForm={abueloForm}
                  onToggle={toggleExpandedNode}
                  onStartEdit={handleStartEditAbuelo}
                  onCancelEdit={handleCancelEditAbuelo}
                  onSave={handleSaveAbuelo}
                  onChangeForm={updateAbueloForm}
                  onOpen={handleOpenNode}
                  currentId={id || ''}
                />
                <AbueloNodeCard
                  node={pedigri?.madre?.madre}
                  label="Abuela M."
                  nodeKey="abuela_m"
                  parentKey="madre"
                  isExpanded={expandedNode === 'abuela_m'}
                  isDuplicate={
                    !!(pedigri?.madre?.madre?.id || pedigri?.madre?.madre?.codigo) &&
                    duplicateIds.has(
                      pedigri?.madre?.madre?.id || `ext_${pedigri?.madre?.madre?.codigo}`
                    )
                  }
                  isEditing={editingAbuelo === 'abuela_m'}
                  abueloForm={abueloForm}
                  onToggle={toggleExpandedNode}
                  onStartEdit={handleStartEditAbuelo}
                  onCancelEdit={handleCancelEditAbuelo}
                  onSave={handleSaveAbuelo}
                  onChangeForm={updateAbueloForm}
                  onOpen={handleOpenNode}
                  currentId={id || ''}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  }, [
    pedigri,
    hasConsanguinidad,
    expandedNode,
    duplicateIds,
    toggleExpandedNode,
    handleOpenNode,
    showAbuelos,
    editingAbuelo,
    abueloForm,
    handleStartEditAbuelo,
    handleCancelEditAbuelo,
    handleSaveAbuelo,
    updateAbueloForm,
    id,
  ]);

  const renderPedigriTab = useCallback(() => {
    return (
      <View style={styles.tabContent}>
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

          {ave?.nombre ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{ave.nombre}</Text>
            </View>
          ) : null}

          {ave?.color ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color</Text>
              <Text style={styles.infoValue}>{ave.color}</Text>
            </View>
          ) : null}

          {ave?.linea ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Línea</Text>
              <Text style={styles.infoValue}>{ave.linea}</Text>
            </View>
          ) : null}

          {ave?.fecha_nacimiento ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nacimiento</Text>
              <Text style={styles.infoValue}>{ave.fecha_nacimiento}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado</Text>
            <View
              style={[
                styles.estadoBadge,
                { backgroundColor: getEstadoColor(ave?.estado || '') + '20' },
              ]}
            >
              <Text
                style={[
                  styles.estadoText,
                  { color: getEstadoColor(ave?.estado || '') },
                ]}
              >
                {ave?.estado?.charAt(0).toUpperCase() + (ave?.estado?.slice(1) || '')}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Genética</Text>
        {renderBaseGenetica()}

        {ave?.notas ? (
          <>
            <Text style={styles.sectionTitle}>Notas</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{ave.notas}</Text>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Árbol Genealógico</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pedigriScroll}>
          <View style={styles.pedigriContainer}>
            {pedigri ? renderConnectedTree() : (
              <Text style={styles.emptyText}>Sin información de pedigrí</Text>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }, [ave, getEstadoColor, renderBaseGenetica, pedigri, renderConnectedTree]);

  const renderPeleasTab = useCallback(() => {
    return (
      <View style={styles.tabContent}>
        {peleas.length > 0 ? (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {peleas.filter((p) => p.resultado === 'GANO').length}
                </Text>
                <Text style={styles.statLabel}>Ganadas</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {peleas.filter((p) => p.resultado === 'PERDIO').length}
                </Text>
                <Text style={styles.statLabel}>Perdidas</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#22c55e' }]}>
                  {peleas.length > 0
                    ? Math.round(
                        (peleas.filter((p) => p.resultado === 'GANO').length / peleas.length) * 100
                      )
                    : 0}
                  %
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
                  {pelea.lugar ? <Text style={styles.peleaPlace}>{pelea.lugar}</Text> : null}
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
  }, [peleas, router]);

  const renderSaludTab = useCallback(() => {
    return (
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
              {record.proxima_fecha ? (
                <View style={styles.saludNext}>
                  <Text style={styles.saludNextLabel}>Próxima</Text>
                  <Text style={styles.saludNextDate}>{record.proxima_fecha}</Text>
                </View>
              ) : null}
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
  }, [salud, router, id]);

  const renderHijosTab = useCallback(() => {
    return (
      <View style={styles.tabContent}>
        <TouchableOpacity
          style={styles.registerChildButton}
          onPress={() =>
            router.push(
              `/ave/new?padre_id=${ave?.tipo === 'gallo' ? id : ''}&madre_id=${
                ave?.tipo === 'gallina' ? id : ''
              }`
            )
          }
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
                {hijo.nombre ? <Text style={styles.hijoNombre}>{hijo.nombre}</Text> : null}
                <View style={styles.hijoDetails}>
                  {hijo.color ? <Text style={styles.hijoDetail}>{hijo.color}</Text> : null}
                  {hijo.linea ? <Text style={styles.hijoDetail}>{hijo.linea}</Text> : null}
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
  }, [hijos, router, ave?.tipo, id]);

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
          {ave?.nombre ? <Text style={styles.profileNombre}>{ave.nombre}</Text> : null}

          <View
            style={[
              styles.profileEstado,
              { backgroundColor: getEstadoColor(ave?.estado || '') },
            ]}
          >
            <Text style={styles.profileEstadoText}>
              {ave?.estado?.charAt(0).toUpperCase() + (ave?.estado?.slice(1) || '')}
            </Text>
          </View>
        </View>

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
  geneticaCard: {
    backgroundColor: '#242424',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  geneticaHeader: {
    marginBottom: 10,
  },
  geneticaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  geneticaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  geneticaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  geneticaRowLast: {
    borderBottomWidth: 0,
  },
  geneticaLine: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  geneticaPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f59e0b',
  },
  geneticaNote: {
    marginTop: 10,
    fontSize: 12,
    color: '#9ca3af',
  },
  geneticaEmpty: {
    fontSize: 14,
    color: '#9ca3af',
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
  treeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    minWidth: 420,
  },
  treeLevel: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  treeBranch: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  treeNodeContainer: {
    alignItems: 'center',
  },
  treeNodeContainerParent: {
    minWidth: 120,
  },
  treeLabel: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  treeLabelParent: {
    fontSize: 12,
    marginBottom: 6,
  },
  treeNode: {
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 75,
    maxWidth: 90,
  },
  treeNodeParent: {
    minWidth: 110,
    maxWidth: 130,
    padding: 14,
    borderWidth: 2,
  },
  treeNodeUnknown: {
    opacity: 0.5,
    borderStyle: 'dashed',
  },
  treeNodeUnknownText: {
    fontSize: 24,
    color: '#4b5563',
    fontWeight: 'bold',
  },
  treeNodeUnknownSubtext: {
    fontSize: 10,
    color: '#4b5563',
    marginTop: 4,
  },
  treePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
  },
  treePhotoParent: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  treePhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  treePhotoPlaceholderParent: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  treeCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  treeCodeParent: {
    fontSize: 14,
    fontWeight: '700',
  },
  treeConnectorVerticalLong: {
    width: 2,
    height: 30,
    backgroundColor: '#f59e0b',
  },
  treeConnectorHorizontal: {
    width: 180,
    height: 2,
    backgroundColor: '#444444',
    marginBottom: 10,
  },
  treeGrandparentConnectors: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 60,
    marginTop: 8,
  },
  treeConnectorVerticalSmall: {
    width: 2,
    height: 12,
    backgroundColor: '#444444',
  },
  treeGrandparentHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  treeConnectorHorizontalSmall: {
    width: 80,
    height: 2,
    backgroundColor: '#444444',
    marginBottom: 8,
  },
  treeLevelGrandparents: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  treeGrandparentPair: {
    flexDirection: 'row',
    gap: 8,
  },
  consanguinidadAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  consanguinidadText: {
    fontSize: 11,
    color: '#f59e0b',
    flex: 1,
  },
  treeNodeDuplicate: {
    borderColor: '#f59e0b',
    borderWidth: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  treePhotoPlaceholderDuplicate: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  treeCodeDuplicate: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  duplicateBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  treeNodeExpanded: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  expandedPanel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  expandedLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  expandedValue: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  expandedExternalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandedExternalText: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
  },
  expandedViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  expandedViewBtnText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  toggleAbuelosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
  },
  toggleAbuelosText: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '600',
  },
  abuelosContainer: {
    width: '100%',
    marginTop: 8,
  },
  abueloNodeContainer: {
    alignItems: 'center',
    minWidth: 70,
  },
  abueloLabel: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  abueloNode: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 70,
  },
  abueloNodeDuplicate: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  abueloAddBtn: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444444',
    borderStyle: 'dashed',
    minWidth: 70,
  },
  abueloIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  abueloCode: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  abueloExpandedPanel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    width: 120,
    borderWidth: 1,
    borderColor: '#333333',
  },
  abueloExpandedText: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 4,
  },
  abueloExpandedExternal: {
    fontSize: 10,
    color: '#f59e0b',
    marginBottom: 4,
  },
  abueloViewBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
    alignItems: 'center',
  },
  abueloViewBtnText: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
  },
  abueloAddText: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 2,
  },
  abueloEditForm: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 10,
    width: 130,
    borderWidth: 1,
    borderColor: '#333333',
  },
  abueloInput: {
    backgroundColor: '#242424',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
    color: '#fff',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#444444',
  },
  abueloFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 6,
  },
  abueloCancelBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#333333',
    alignItems: 'center',
  },
  abueloCancelBtnText: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
  abueloSaveBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  abueloSaveBtnDisabled: {
    backgroundColor: '#444444',
  },
  abueloSaveBtnText: {
    fontSize: 10,
    color: '#000',
    fontWeight: '600',
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