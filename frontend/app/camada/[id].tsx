import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../src/services/api';
import { DatePickerField } from '../../src/components/DatePickerField';

interface Cruce {
  id: string;
  padre_id?: string;
  madre_id?: string;
  padre_externo?: string;
  madre_externo?: string;
  fecha: string;
  estado: string;
}

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  tipo: string;
  castado_por?: string;
  padre_id?: string;
  madre_id?: string;
  padre_externo?: string;
  madre_externo?: string;
  foto_principal?: string;
  foto?: string;
  imagen?: string;
  image_url?: string;
}

interface DraftAnimal {
  localId: string;
  codigo: string;
  color_placa: string;
  tipo: 'gallo' | 'gallina';
  estado: string;
  color: string;
  cresta: string;
  foto_principal: string;
}

const defaultGalloImg = require('../../assets/images/gallo.png');
const defaultGallinaImg = require('../../assets/images/gallina.png');

const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  background: '#f5f5f5',
  cardBg: '#ffffff',
  border: '#e0e0e0',
  text: '#1a1a1a',
  textSoft: '#555555',
  textMuted: '#9ca3af',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
};

const COLORES_PLACA = [
  'Amarillo',
  'Azul',
  'Rojo',
  'Verde',
  'Blanco',
  'Negro',
  'Naranja',
  'Morado',
  'Rosado',
  'Gris',
];

const COLORES_AVE = [
  'Jabao',
  'Cenizo',
  'Canelo',
  'Giro',
  'Colorado',
  'Pinto',
  'Negro',
  'Blanco',
  'Indio',
  'Gallino',
  'Prieto',
  'Amarillo',
  'Ajiseñao',
  'Melao',
  'Joco',
  'Gallo Fino',
  'Otro',
];

const TIPOS_CRESTA = [
  'Rosa o Crestallado',
  'Tusa de Peine',
  'Pava',
  'Sencilla',
  'Otra',
];

function getColorPlaca(color: string) {
  const colores: Record<string, string> = {
    Amarillo: '#fbbf24',
    Azul: '#3b82f6',
    Rojo: '#ef4444',
    Verde: '#22c55e',
    Blanco: '#f5f5f5',
    Negro: '#1a1a1a',
    Naranja: '#f97316',
    Morado: '#a855f7',
    Rosado: '#ec4899',
    Gris: '#6b7280',
  };
  return colores[color] || '#d4a017';
}

function getDefaultAnimalImage(tipo: 'gallo' | 'gallina') {
  return tipo === 'gallo' ? defaultGalloImg : defaultGallinaImg;
}

export default function CamadaFormScreen() {
  const router = useRouter();
  const { id, selected_cruce_id } = useLocalSearchParams<{
    id: string;
    selected_cruce_id?: string;
  }>();
  const isEdit = !!id && id !== 'new';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [aves, setAves] = useState<Ave[]>([]);
  const [showCruceList, setShowCruceList] = useState(false);
  const [showCriadorList, setShowCriadorList] = useState(false);

  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [showColorPlacaList, setShowColorPlacaList] = useState(false);
  const [showColorAveList, setShowColorAveList] = useState(false);
  const [showCrestaList, setShowCrestaList] = useState(false);

  const [formData, setFormData] = useState({
    cruce_id: '',
    fecha_nacimiento: '',
    criador_nombre: '',
    notas: '',
  });

  const [draftAnimals, setDraftAnimals] = useState<DraftAnimal[]>([]);
  const [animalForm, setAnimalForm] = useState<DraftAnimal>({
    localId: '',
    codigo: '',
    color_placa: '',
    tipo: 'gallina',
    estado: 'activo',
    color: '',
    cresta: '',
    foto_principal: '',
  });

  useEffect(() => {
    fetchInitialData();
    if (isEdit) {
      fetchCamada();
    }
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchInitialData();
    }, [])
  );

  useEffect(() => {
    if (selected_cruce_id) {
      setFormData((prev) => ({
        ...prev,
        cruce_id: String(selected_cruce_id),
      }));
    }
  }, [selected_cruce_id]);

  const fetchInitialData = async () => {
    try {
      const [crucesRaw, avesRaw] = await Promise.all([
        api.get('/cruces'),
        api.get('/aves'),
      ]);

      const crucesData = Array.isArray(crucesRaw)
        ? crucesRaw
        : Array.isArray((crucesRaw as any)?.data)
          ? (crucesRaw as any).data
          : [];

      const avesData = Array.isArray(avesRaw)
        ? avesRaw
        : Array.isArray((avesRaw as any)?.data)
          ? (avesRaw as any).data
          : [];

      setCruces(crucesData);
      setAves(avesData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchCamada = async () => {
    if (!id || id === 'new') {
      setLoading(false);
      return;
    }

    try {
      const data = await api.get(`/camadas/${id}`);
      if (data) {
        setFormData({
          cruce_id: (data as any).cruce_id || '',
          fecha_nacimiento: (data as any).fecha_nacimiento || '',
          criador_nombre: (data as any).criador_nombre || '',
          notas: (data as any).notas || '',
        });
      }
    } catch (error) {
      console.error('Error fetching camada:', error);
      Alert.alert('Error', 'No se pudo cargar la camada');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const criadores = useMemo(() => {
    const uniques = new Map<string, number>();

    aves.forEach((ave) => {
      const nombre = String(ave.castado_por || '').trim();
      if (!nombre) return;
      uniques.set(nombre, (uniques.get(nombre) || 0) + 1);
    });

    return Array.from(uniques.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [aves]);

  const sortedCruces = useMemo(() => {
    return [...cruces].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [cruces]);

  const selectedCruce = useMemo(() => {
    return cruces.find((c) => c.id === formData.cruce_id);
  }, [cruces, formData.cruce_id]);

  const padreAve = useMemo(() => {
    if (!selectedCruce?.padre_id) return null;
    return aves.find((a) => a.id === selectedCruce.padre_id) || null;
  }, [selectedCruce, aves]);

  const madreAve = useMemo(() => {
    if (!selectedCruce?.madre_id) return null;
    return aves.find((a) => a.id === selectedCruce.madre_id) || null;
  }, [selectedCruce, aves]);

  const formatCruceLabel = (cruce: Cruce) => {
    let padreLabel = 'Desconocido';
    if (cruce.padre_id) {
      const padre = aves.find((a) => a.id === cruce.padre_id);
      padreLabel = padre ? `Placa ${padre.codigo}` : 'Desconocido';
    } else if (cruce.padre_externo) {
      padreLabel = `Ext. ${cruce.padre_externo.split(' (')[0]}`;
    }

    let madreLabel = 'Desconocida';
    if (cruce.madre_id) {
      const madre = aves.find((a) => a.id === cruce.madre_id);
      madreLabel = madre ? `Placa ${madre.codigo}` : 'Desconocida';
    } else if (cruce.madre_externo) {
      madreLabel = `Ext. ${cruce.madre_externo.split(' (')[0]}`;
    }

    return `Gallo ${padreLabel} x Gallina ${madreLabel}`;
  };

  const pickAnimalImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setAnimalForm((prev) => ({
        ...prev,
        foto_principal: `data:image/jpeg;base64,${result.assets[0].base64}`,
      }));
    }
  };

  const resetAnimalForm = () => {
    setAnimalForm({
      localId: '',
      codigo: '',
      color_placa: '',
      tipo: 'gallina',
      estado: 'activo',
      color: '',
      cresta: '',
      foto_principal: '',
    });
    setShowColorPlacaList(false);
    setShowColorAveList(false);
    setShowCrestaList(false);
  };

  const openAnimalModal = () => {
    if (!formData.cruce_id) {
      Alert.alert('Selecciona un cruce', 'Primero debes seleccionar el cruce de origen.');
      return;
    }
    resetAnimalForm();
    setShowAnimalModal(true);
  };

  const addDraftAnimal = () => {
    if (!animalForm.codigo.trim()) {
      Alert.alert('Error', 'La placa del animal es obligatoria.');
      return;
    }

    const newAnimal: DraftAnimal = {
      ...animalForm,
      localId: `${Date.now()}-${Math.random()}`,
      codigo: animalForm.codigo.trim(),
    };

    setDraftAnimals((prev) => [...prev, newAnimal]);
    setShowAnimalModal(false);
    resetAnimalForm();
  };

  const removeDraftAnimal = (localId: string) => {
    setDraftAnimals((prev) => prev.filter((item) => item.localId !== localId));
  };

  const getDraftAnimalImageSource = (animal: DraftAnimal) => {
    if (animal.foto_principal) {
      return { uri: animal.foto_principal };
    }
    return getDefaultAnimalImage(animal.tipo);
  };

  const handleSave = async () => {
    if (!formData.cruce_id) {
      Alert.alert('Error', 'Debes seleccionar un cruce');
      return;
    }

    if (!formData.fecha_nacimiento) {
      Alert.alert('Error', 'Debes elegir la fecha de nacimiento');
      return;
    }

    if (!formData.criador_nombre.trim()) {
      Alert.alert('Error', 'Debes elegir o escribir un criador');
      return;
    }

    setSaving(true);

    try {
      const camadaPayload = {
        cruce_id: formData.cruce_id,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        criador_nombre: formData.criador_nombre || null,
        cantidad_nacidos: draftAnimals.length > 0 ? draftAnimals.length : null,
        notas: formData.notas || null,
      };

      let camadaId = isEdit ? String(id) : '';
      let camadaResponse: any = null;

      if (isEdit) {
        await api.put(`/camadas/${id}`, camadaPayload);
      } else {
        camadaResponse = await api.post('/camadas', camadaPayload);
        camadaId =
          camadaResponse?.id ||
          camadaResponse?._id ||
          camadaResponse?.data?.id ||
          camadaResponse?.data?._id ||
          '';
      }

      if (draftAnimals.length > 0) {
        for (const animal of draftAnimals) {
          const avePayload = {
            tipo: animal.tipo,
            codigo: animal.codigo,
            color_placa: animal.color_placa || null,
            nombre: null,
            foto_principal: animal.foto_principal || null,
            fecha_nacimiento: formData.fecha_nacimiento || null,
            color: animal.color || null,
            cresta: animal.cresta || null,
            linea: null,
            estado: animal.estado || 'activo',
            notas: `Registrado desde camada${formData.notas ? ` - ${formData.notas}` : ''}`,
            padre_id: selectedCruce?.padre_id || null,
            madre_id: selectedCruce?.madre_id || null,
            padre_externo: selectedCruce?.padre_externo || null,
            madre_externo: selectedCruce?.madre_externo || null,
            castado_por: formData.criador_nombre || null,
            camada_id: camadaId || null,
            cruce_id: formData.cruce_id || null,
          };

          await api.post('/aves', avePayload);
        }
      }

      Alert.alert(
        'Éxito',
        isEdit
          ? 'Camada actualizada correctamente'
          : draftAnimals.length > 0
            ? 'Camada y animales creados correctamente'
            : 'Camada creada correctamente'
      );

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo guardar la camada');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Camada',
      '¿Estás seguro de que deseas eliminar esta camada? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/camadas/${id}`);
              Alert.alert('Éxito', 'Camada eliminada correctamente');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'No se pudo eliminar la camada');
            }
          },
        },
      ]
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{isEdit ? 'Editar Camada' : 'Nueva Camada'}</Text>

          <View style={styles.headerActions}>
            {isEdit && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={22} color={COLORS.red} />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.topLabel}>Cruce de origen *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCruceList((prev) => !prev)}
          >
            <View style={styles.selectButtonContent}>
              <Ionicons name="git-merge" size={20} color={COLORS.gold} />
              <Text style={styles.selectButtonText}>
                {formData.cruce_id && selectedCruce
                  ? formatCruceLabel(selectedCruce)
                  : 'Seleccionar cruce'}
              </Text>
            </View>
            <Ionicons
              name={showCruceList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textSoft}
            />
          </TouchableOpacity>

          {showCruceList && (
            <View style={styles.selectList}>
              <TouchableOpacity
                style={styles.nuevoCruceOption}
                onPress={() => {
                  setShowCruceList(false);
                  router.push('/cruce/new?from_camada=1');
                }}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.gold} />
                <View style={styles.nuevoCruceContent}>
                  <Text style={styles.nuevoCruceText}>Registrar nuevo cruce</Text>
                  <Text style={styles.nuevoCruceSubtext}>
                    Si los padres no aparecen en la lista
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSoft} />
              </TouchableOpacity>

              {sortedCruces.length === 0 ? (
                <Text style={styles.noDataText}>No hay cruces registrados</Text>
              ) : (
                sortedCruces.map((cruce) => (
                  <TouchableOpacity
                    key={cruce.id}
                    style={[
                      styles.selectItem,
                      formData.cruce_id === cruce.id && styles.selectItemActive,
                    ]}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, cruce_id: cruce.id }));
                      setShowCruceList(false);
                    }}
                  >
                    <Text style={styles.selectItemText}>{formatCruceLabel(cruce)}</Text>
                    {formData.cruce_id === cruce.id && (
                      <Ionicons name="checkmark" size={20} color={COLORS.gold} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <View style={styles.cleanSection}>
            <Text style={styles.cleanSectionTitle}>Camada</Text>

            <DatePickerField
              label="Fecha de nacimiento *"
              value={formData.fecha_nacimiento}
              onChange={(date) => setFormData((prev) => ({ ...prev, fecha_nacimiento: date }))}
              placeholder="Elegir fecha"
            />
          </View>

          <View style={styles.cleanSection}>
            <Text style={styles.cleanSectionTitle}>Criador o Castador</Text>

            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCriadorList((prev) => !prev)}
            >
              <Text style={styles.selectButtonText}>
                {formData.criador_nombre || 'Elegir criador'}
              </Text>
              <Ionicons
                name={showCriadorList ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textSoft}
              />
            </TouchableOpacity>

            {showCriadorList && (
              <View style={styles.selectList}>
                {criadores.length === 0 ? (
                  <View style={styles.selectItem}>
                    <Text style={styles.noDataText}>No hay criadores registrados</Text>
                  </View>
                ) : (
                  criadores.map((criador) => (
                    <TouchableOpacity
                      key={criador.nombre}
                      style={[
                        styles.selectItem,
                        formData.criador_nombre === criador.nombre && styles.selectItemActive,
                      ]}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, criador_nombre: criador.nombre }));
                        setShowCriadorList(false);
                      }}
                    >
                      <Text style={styles.selectItemText}>
                        {criador.nombre} ({criador.cantidad})
                      </Text>
                      {formData.criador_nombre === criador.nombre && (
                        <Ionicons name="checkmark" size={20} color={COLORS.gold} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            <Text style={styles.inlineHelper}>O escribe el nombre manualmente</Text>
            <TextInput
              style={styles.input}
              value={formData.criador_nombre}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, criador_nombre: text }))
              }
              placeholder="Nombre del criador"
              placeholderTextColor={COLORS.textSoft}
            />
          </View>

          <View style={styles.cleanSection}>
            <Text style={styles.cleanSectionTitle}>Información de los padres</Text>

            <View style={styles.parentCard}>
              <View style={[styles.parentIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.14)' }]}>
                <Ionicons name="male" size={26} color={COLORS.blue} />
              </View>
              <View style={styles.parentTextWrap}>
                <Text style={styles.parentTitle}>Padre</Text>
                <Text style={styles.parentValue}>
                  {padreAve?.codigo || selectedCruce?.padre_externo || 'No asignado'}
                </Text>
              </View>
            </View>

            <View style={styles.parentCard}>
              <View style={[styles.parentIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.14)' }]}>
                <Ionicons name="female" size={26} color={COLORS.green} />
              </View>
              <View style={styles.parentTextWrap}>
                <Text style={styles.parentTitle}>Madre</Text>
                <Text style={styles.parentValue}>
                  {madreAve?.codigo || selectedCruce?.madre_externo || 'No asignada'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.animalesSection}>
            <Text style={styles.animalesTitle}>Aves</Text>

            {draftAnimals.length === 0 ? (
              <View style={styles.emptyAnimalsBox}>
              <Image
                source={require('../../assets/images/camadas.png')}
                style={{
                  width: 90,
                  height: 90,
                  opacity: 0.8,
                  marginBottom: 10,
                }}
                resizeMode="contain"
              />
            
              <TouchableOpacity style={styles.addAnimalsButton} onPress={openAnimalModal}>
                <Ionicons name="add" size={24} color="#334155" />
                <Text style={styles.addAnimalsButtonText}>Agrega tu camada aquí</Text>
              </TouchableOpacity>
            </View>
            ) : (
              <>
                <View style={styles.animalsList}>
                  {draftAnimals.map((animal) => (
                    <View key={animal.localId} style={styles.animalPreviewCard}>
                      <View style={styles.animalPreviewLeft}>
                        <Image
                          source={getDraftAnimalImageSource(animal)}
                          style={styles.animalPreviewImage}
                          resizeMode="cover"
                        />

                        <View>
                          <Text style={styles.animalPreviewCode}>{animal.codigo}</Text>
                          <Text style={styles.animalPreviewMeta}>
                            {animal.tipo === 'gallo' ? 'Macho' : 'Hembra'}
                            {animal.color ? ` • ${animal.color}` : ''}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity onPress={() => removeDraftAnimal(animal.localId)}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.addAnotherButton} onPress={openAnimalModal}>
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.gold} />
                  <Text style={styles.addAnotherButtonText}>Agregar otro animal</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.cleanSection}>
            <Text style={styles.cleanSectionTitle}>Notas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notas}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, notas: text }))}
              placeholder="Observaciones adicionales..."
              placeholderTextColor={COLORS.textSoft}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <Modal
          visible={showAnimalModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAnimalModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowAnimalModal(false)}>
                  <Ionicons name="close" size={32} color={COLORS.text} />
                </TouchableOpacity>

                <Text style={styles.modalTitle}>Agregar animal</Text>

                <TouchableOpacity style={styles.modalDoneButton} onPress={addDraftAnimal}>
                  <Text style={styles.modalDoneButtonText}>Listo</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalContent}>
                <TouchableOpacity style={styles.photoUploadBox} onPress={pickAnimalImage}>
                  {animalForm.foto_principal ? (
                    <Image
                      source={{ uri: animalForm.foto_principal }}
                      style={styles.uploadedImage}
                    />
                  ) : (
                    <>
                      <Image
                        source={getDefaultAnimalImage(animalForm.tipo)}
                        style={styles.defaultModalAnimalImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.photoUploadText}>Agregar foto (opcional)</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.modalFieldLabel}>Placa *</Text>
                <View style={styles.placaRow}>
                  <TextInput
                    style={[styles.input, styles.placaInput]}
                    value={animalForm.codigo}
                    onChangeText={(text) =>
                      setAnimalForm((prev) => ({ ...prev, codigo: text }))
                    }
                    placeholder="Ingresa placa"
                    placeholderTextColor={COLORS.textSoft}
                  />

                  <TouchableOpacity
                    style={styles.colorPickerButton}
                    onPress={() => setShowColorPlacaList((prev) => !prev)}
                  >
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: getColorPlaca(animalForm.color_placa) },
                      ]}
                    />
                    <Text style={styles.colorPickerText}>
                      {animalForm.color_placa || 'Elegir Color'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showColorPlacaList && (
                  <View style={styles.optionGrid}>
                    {COLORES_PLACA.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.optionChip,
                          animalForm.color_placa === color && styles.optionChipActive,
                        ]}
                        onPress={() => {
                          setAnimalForm((prev) => ({ ...prev, color_placa: color }));
                          setShowColorPlacaList(false);
                        }}
                      >
                        <View
                          style={[styles.colorDotSmall, { backgroundColor: getColorPlaca(color) }]}
                        />
                        <Text style={styles.optionChipText}>{color}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={styles.modalFieldLabel}>Sexo *</Text>
                <View style={styles.sexRow}>
                  <TouchableOpacity
                    style={[
                      styles.sexButton,
                      animalForm.tipo === 'gallo' && styles.sexButtonActive,
                    ]}
                    onPress={() => setAnimalForm((prev) => ({ ...prev, tipo: 'gallo' }))}
                  >
                    <Text
                      style={[
                        styles.sexButtonText,
                        animalForm.tipo === 'gallo' && styles.sexButtonTextActive,
                      ]}
                    >
                      Macho
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sexButton,
                      animalForm.tipo === 'gallina' && styles.sexButtonActive,
                    ]}
                    onPress={() => setAnimalForm((prev) => ({ ...prev, tipo: 'gallina' }))}
                  >
                    <Text
                      style={[
                        styles.sexButtonText,
                        animalForm.tipo === 'gallina' && styles.sexButtonTextActive,
                      ]}
                    >
                      Hembra
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalFieldLabel}>Estado *</Text>
                <View style={styles.estadoRow}>
                  {['activo', 'vendido', 'retirado'].map((estado) => (
                    <TouchableOpacity
                      key={estado}
                      style={[
                        styles.estadoChip,
                        animalForm.estado === estado && styles.estadoChipActive,
                      ]}
                      onPress={() => setAnimalForm((prev) => ({ ...prev, estado }))}
                    >
                      <Text
                        style={[
                          styles.estadoChipText,
                          animalForm.estado === estado && styles.estadoChipTextActive,
                        ]}
                      >
                        {estado}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.doubleRow}>
                  <View style={styles.doubleCol}>
                    <Text style={styles.modalFieldLabel}>Pluma</Text>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => setShowColorAveList((prev) => !prev)}
                    >
                      <Text style={styles.selectButtonText}>
                        {animalForm.color || 'Elegir pluma'}
                      </Text>
                      <Ionicons
                        name={showColorAveList ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={COLORS.textSoft}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.doubleCol}>
                    <Text style={styles.modalFieldLabel}>Cresta</Text>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => setShowCrestaList((prev) => !prev)}
                    >
                      <Text style={styles.selectButtonText}>
                        {animalForm.cresta || 'Elegir cresta'}
                      </Text>
                      <Ionicons
                        name={showCrestaList ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={COLORS.textSoft}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {showColorAveList && (
                  <View style={styles.optionGrid}>
                    {COLORES_AVE.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.optionChip,
                          animalForm.color === color && styles.optionChipActive,
                        ]}
                        onPress={() => {
                          setAnimalForm((prev) => ({ ...prev, color }));
                          setShowColorAveList(false);
                        }}
                      >
                        <Text style={styles.optionChipText}>{color}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {showCrestaList && (
                  <View style={styles.optionGrid}>
                    {TIPOS_CRESTA.map((cresta) => (
                      <TouchableOpacity
                        key={cresta}
                        style={[
                          styles.optionChip,
                          animalForm.cresta === cresta && styles.optionChipActive,
                        ]}
                        onPress={() => {
                          setAnimalForm((prev) => ({ ...prev, cresta }));
                          setShowCrestaList(false);
                        }}
                      >
                        <Text style={styles.optionChipText}>{cresta}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={styles.modalSaveButton} onPress={addDraftAnimal}>
                  <Text style={styles.modalSaveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
  },
  saveButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  topLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSoft,
    marginBottom: 8,
    marginTop: 4,
  },

  cleanSection: {
    marginTop: 24,
  },
  cleanSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 14,
  },

  inlineHelper: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 12,
    color: COLORS.textSoft,
  },

  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectButtonText: {
    fontSize: 16,
    color: COLORS.text,
    flexShrink: 1,
  },

  selectList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 300,
    overflow: 'hidden',
  },
  nuevoCruceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  nuevoCruceContent: {
    flex: 1,
  },
  nuevoCruceText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gold,
  },
  nuevoCruceSubtext: {
    fontSize: 11,
    color: COLORS.textSoft,
    marginTop: 2,
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectItemActive: {
    backgroundColor: COLORS.goldLight,
  },
  selectItemText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    paddingRight: 10,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.textSoft,
    textAlign: 'center',
    padding: 16,
  },

  parentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  parentIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  parentTextWrap: {
    flex: 1,
  },
  parentTitle: {
    fontSize: 14,
    color: COLORS.textSoft,
    marginBottom: 4,
  },
  parentValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  animalesSection: {
    marginTop: 28,
    paddingTop: 8,
    borderTopWidth: 8,
    borderTopColor: '#ebedf0',
  },
  animalesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 18,
    marginBottom: 18,
  },
  emptyAnimalsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
  },
  addAnimalsButton: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: '#fff',
  },
  addAnimalsButtonText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },

  animalsList: {
    gap: 10,
  },
  animalPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  animalPreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  animalPreviewImage: {
    width: 54,
    height: 54,
    borderRadius: 14,
  },
  animalPreviewCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  animalPreviewMeta: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSoft,
  },
  addAnotherButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
  },
  addAnotherButtonText: {
    fontSize: 15,
    color: COLORS.gold,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '88%',
    maxHeight: '94%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalDoneButton: {
    backgroundColor: '#d1d5db',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  modalDoneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  modalContent: {
    padding: 16,
    paddingBottom: 34,
  },
  modalFieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginTop: 18,
    marginBottom: 8,
  },

  photoUploadBox: {
    height: 140,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    padding: 10,
  },
  photoUploadText: {
    fontSize: 15,
    color: COLORS.textSoft,
    fontWeight: '500',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  defaultModalAnimalImage: {
    width: 88,
    height: 88,
    marginBottom: 4,
  },

  placaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  placaInput: {
    flex: 1,
  },
  colorPickerButton: {
    minWidth: 150,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  colorPickerText: {
    fontSize: 14,
    color: COLORS.textSoft,
    fontWeight: '500',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  colorDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 6,
  },

  sexRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sexButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  sexButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  sexButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  sexButtonTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  estadoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estadoChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  estadoChipActive: {
    backgroundColor: COLORS.goldLight,
    borderColor: COLORS.gold,
  },
  estadoChipText: {
    color: '#64748b',
    fontSize: 14,
  },
  estadoChipTextActive: {
    color: COLORS.gold,
    fontWeight: '700',
  },

  doubleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  doubleCol: {
    flex: 1,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionChipActive: {
    backgroundColor: COLORS.goldLight,
    borderColor: COLORS.gold,
  },
  optionChipText: {
    fontSize: 13,
    color: COLORS.text,
  },

  modalSaveButton: {
    marginTop: 26,
    backgroundColor: '#cfcfd4',
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});