import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../src/services/api';
import { DatePickerField } from '../../src/components/DatePickerField';

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  tipo: string;
}

export default function AveFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gallos, setGallos] = useState<Ave[]>([]);
  const [gallinas, setGallinas] = useState<Ave[]>([]);
  const [showPadreList, setShowPadreList] = useState(false);
  const [showMadreList, setShowMadreList] = useState(false);
  const [showColorList, setShowColorList] = useState(false);
  const [showCrestaList, setShowCrestaList] = useState(false);
  const [showColorPlacaList, setShowColorPlacaList] = useState(false);
  const [showCastadorList, setShowCastadorList] = useState(false);
  const [showPadreExterno, setShowPadreExterno] = useState(false);
  const [showMadreExterno, setShowMadreExterno] = useState(false);
  const [showPadresSection, setShowPadresSection] = useState(false);
  const [padreExterno, setPadreExterno] = useState('');
  const [madreExterno, setMadreExterno] = useState('');
  const [padreGalleria, setPadreGalleria] = useState('');
  const [madreGalleria, setMadreGalleria] = useState('');
  const [showAbuelosPaternos, setShowAbuelosPaternos] = useState(false);
  const [showAbuelosMaternos, setShowAbuelosMaternos] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [castadores, setCastadores] = useState<{nombre: string, cantidad: number}[]>([]);
  const [nuevoCastador, setNuevoCastador] = useState('');
  const [showNuevoCastador, setShowNuevoCastador] = useState(false);

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

  const COLORES = [
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

  const [formData, setFormData] = useState({
    tipo: 'gallo',
    codigo: '',
    color_placa: '',
    nombre: '',
    foto_principal: '',
    fecha_nacimiento: '',
    color: '',
    cresta: '',
    linea: '',
    estado: 'activo',
    notas: '',
    padre_id: '',
    madre_id: '',
    padre_externo: '',  // Placa de padre externo (otra gallería)
    madre_externo: '',  // Placa de madre externo (otra gallería)
    marcaje_qr: '',
    castado_por: '',
  });

  const [padreNombre, setPadreNombre] = useState('');
  const [madreNombre, setMadreNombre] = useState('');

  // Función para obtener color hex de la placa
  const getColorPlaca = (color: string) => {
    const colores: { [key: string]: string } = {
      'Amarillo': '#fbbf24',
      'Azul': '#3b82f6',
      'Rojo': '#ef4444',
      'Verde': '#22c55e',
      'Blanco': '#f5f5f5',
      'Negro': '#1a1a1a',
      'Naranja': '#f97316',
      'Morado': '#a855f7',
      'Rosado': '#ec4899',
      'Gris': '#6b7280',
    };
    return colores[color] || '#d4a017';
  };

  useEffect(() => {
    fetchAves();
    fetchCastadores();
    if (isEdit) {
      fetchAve();
    }
  }, [id]);

  const fetchAves = async () => {
    try {
      const aves = await api.get('/aves');
      setGallos(aves.filter((a: Ave) => a.tipo === 'gallo'));
      setGallinas(aves.filter((a: Ave) => a.tipo === 'gallina'));
    } catch (error) {
      console.error('Error fetching aves:', error);
    }
  };

  const fetchCastadores = async () => {
    try {
      const aves = await api.get('/aves');
      // Obtener castadores únicos y contar aves por cada uno
      const castadoresMap: { [key: string]: number } = {};
      aves.forEach((ave: any) => {
        if (ave.castado_por && ave.castado_por.trim() !== '') {
          const nombre = ave.castado_por.trim();
          castadoresMap[nombre] = (castadoresMap[nombre] || 0) + 1;
        }
      });
      // Convertir a array y ordenar por cantidad
      const castadoresList = Object.entries(castadoresMap)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
      setCastadores(castadoresList);
    } catch (error) {
      console.error('Error fetching castadores:', error);
    }
  };

  const fetchAve = async () => {
    setLoading(true);
    try {
      const ave = await api.get(`/aves/${id}`);
      setFormData({
        tipo: ave.tipo || 'gallo',
        codigo: ave.codigo || '',
        color_placa: ave.color_placa || '',
        nombre: ave.nombre || '',
        foto_principal: ave.foto_principal || '',
        fecha_nacimiento: ave.fecha_nacimiento || '',
        color: ave.color || '',
        cresta: ave.cresta || '',
        linea: ave.linea || '',
        estado: ave.estado || 'activo',
        notas: ave.notas || '',
        padre_id: ave.padre_id || '',
        madre_id: ave.madre_id || '',
        padre_externo: ave.padre_externo || '',
        madre_externo: ave.madre_externo || '',
        marcaje_qr: ave.marcaje_qr || '',
        castado_por: ave.castado_por || '',
      });

      if (ave.padre_id) {
        const padre = gallos.find((g) => g.id === ave.padre_id);
        setPadreNombre(padre?.codigo || 'Seleccionado');
      }
      if (ave.madre_id) {
        const madre = gallinas.find((g) => g.id === ave.madre_id);
        setMadreNombre(madre?.codigo || 'Seleccionada');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,  // Reducido para carga más rápida
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setFormData({
        ...formData,
        foto_principal: `data:image/jpeg;base64,${result.assets[0].base64}`,
      });
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,  // Reducido para carga más rápida
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setFormData({
        ...formData,
        foto_principal: `data:image/jpeg;base64,${result.assets[0].base64}`,
      });
    }
  };

  const handleSave = async () => {
    if (!formData.codigo.trim()) {
      Alert.alert('Error', 'El número de placa es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        ...formData,
        padre_id: formData.padre_id || null,
        madre_id: formData.madre_id || null,
        padre_externo: formData.padre_externo || null,
        madre_externo: formData.madre_externo || null,
      };

      if (isEdit) {
        await api.put(`/aves/${id}`, dataToSend);
        if (Platform.OS !== 'web') {
          Alert.alert('Éxito', 'Ave actualizada correctamente');
        }
      } else {
        await api.post('/aves', dataToSend);
        if (Platform.OS !== 'web') {
          Alert.alert('Éxito', 'Ave creada correctamente');
        }
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#d4a017" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Editar Ave' : 'Nueva Ave'}</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          {/* Photo - Circular centrado con + */}
          <View style={styles.photoSectionCentered}>
            <TouchableOpacity
              style={styles.photoContainerCircle}
              onPress={() => {
                if (Platform.OS === 'web') {
                  setShowPhotoModal(true);
                } else {
                  Alert.alert('Foto', 'Selecciona una opción', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Cámara', onPress: takePhoto },
                    { text: 'Galería', onPress: pickImage },
                  ]);
                }
              }}
            >
              {formData.foto_principal ? (
                <Image
                  source={{ uri: formData.foto_principal }}
                  style={styles.photoCircle}
                />
              ) : (
                <View style={styles.photoPlaceholderCircle}>
                  <Ionicons name="camera" size={36} color="#d4a017" />
                  <View style={styles.photoPlusIcon}>
                    <Ionicons name="add" size={16} color="#fff" />
                  </View>
                </View>
              )}
              {formData.foto_principal && (
                <TouchableOpacity
                  style={styles.removePhotoButtonCircle}
                  onPress={() => setFormData({ ...formData, foto_principal: '' })}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Tipo */}
          <Text style={styles.label}>Tipo *</Text>
          <View style={styles.tipoContainer}>
            <TouchableOpacity
              style={[
                styles.tipoButton,
                formData.tipo === 'gallo' && styles.tipoButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, tipo: 'gallo' })}
            >
              <Ionicons
                name="fitness"
                size={24}
                color={formData.tipo === 'gallo' ? '#000' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.tipoText,
                  formData.tipo === 'gallo' && styles.tipoTextActive,
                ]}
              >
                Gallo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tipoButton,
                formData.tipo === 'gallina' && styles.tipoButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, tipo: 'gallina' })}
            >
              <Ionicons
                name="egg"
                size={24}
                color={formData.tipo === 'gallina' ? '#000' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.tipoText,
                  formData.tipo === 'gallina' && styles.tipoTextActive,
                ]}
              >
                Gallina
              </Text>
            </TouchableOpacity>
          </View>

          {/* Número de Placa con Color */}
          <Text style={styles.label}>Número de Placa *</Text>
          <View style={styles.placaContainer}>
            <TextInput
              style={[styles.input, styles.placaInput]}
              value={formData.codigo}
              onChangeText={(text) => setFormData({ ...formData, codigo: text })}
              placeholder="Ej: 12, 001, A-15"
              placeholderTextColor="#555555"
            />
            <TouchableOpacity
              style={[styles.colorPlacaButton, formData.color_placa && { borderColor: '#d4a017' }]}
              onPress={() => setShowColorPlacaList(!showColorPlacaList)}
            >
              <View style={[styles.colorPlacaDot, { backgroundColor: getColorPlaca(formData.color_placa) }]} />
              <Text style={styles.colorPlacaText}>
                {formData.color_placa || 'Color'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#555555" />
            </TouchableOpacity>
          </View>
          {showColorPlacaList && (
            <View style={styles.colorPlacaGrid}>
              {COLORES_PLACA.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorPlacaOption,
                    formData.color_placa === color && styles.colorPlacaOptionActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, color_placa: color });
                    setShowColorPlacaList(false);
                  }}
                >
                  <View style={[styles.colorPlacaDotSmall, { backgroundColor: getColorPlaca(color) }]} />
                  <Text style={styles.colorPlacaOptionText}>{color}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Color del Ave */}
          <Text style={styles.label}>Color del Ave</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowColorList(!showColorList)}
          >
            <Text style={[styles.selectButtonText, formData.color && { color: '#1a1a1a' }]}>
              {formData.color || 'Seleccionar color'}
            </Text>
            <Ionicons
              name={showColorList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
          {showColorList && (
            <View style={styles.colorGrid}>
              {COLORES.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    formData.color === color && styles.colorOptionActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, color });
                    setShowColorList(false);
                  }}
                >
                  <Text
                    style={[
                      styles.colorOptionText,
                      formData.color === color && styles.colorOptionTextActive,
                    ]}
                  >
                    {color}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tipo de Cresta */}
          <Text style={styles.label}>Tipo de Cresta</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCrestaList(!showCrestaList)}
          >
            <Text style={[styles.selectButtonText, formData.cresta && { color: '#1a1a1a' }]}>
              {formData.cresta || 'Seleccionar cresta'}
            </Text>
            <Ionicons
              name={showCrestaList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
          {showCrestaList && (
            <View style={styles.colorGrid}>
              {TIPOS_CRESTA.map((cresta) => (
                <TouchableOpacity
                  key={cresta}
                  style={[
                    styles.colorOption,
                    formData.cresta === cresta && styles.colorOptionActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, cresta });
                    setShowCrestaList(false);
                  }}
                >
                  <Text
                    style={[
                      styles.colorOptionText,
                      formData.cresta === cresta && styles.colorOptionTextActive,
                    ]}
                  >
                    {cresta}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Línea */}
          <Text style={styles.label}>Línea</Text>
          <TextInput
            style={styles.input}
            value={formData.linea}
            onChangeText={(text) => setFormData({ ...formData, linea: text })}
            placeholder="Línea genética"
            placeholderTextColor="#555555"
          />

          {/* Castador o Criador */}
          <Text style={styles.label}>Castador o Criador</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCastadorList(!showCastadorList)}
          >
            <Text style={[styles.selectButtonText, formData.castado_por && { color: '#1a1a1a' }]}>
              {formData.castado_por || 'Seleccionar o crear nuevo'}
            </Text>
            <Ionicons
              name={showCastadorList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
          {showCastadorList && (
            <View style={styles.castadorList}>
              {/* Opción crear nuevo */}
              <TouchableOpacity
                style={styles.castadorNuevoButton}
                onPress={() => setShowNuevoCastador(!showNuevoCastador)}
              >
                <Ionicons name="add-circle" size={20} color="#d4a017" />
                <Text style={styles.castadorNuevoText}>Crear nuevo castador/criador</Text>
              </TouchableOpacity>
              
              {showNuevoCastador && (
                <View style={styles.nuevoCastadorForm}>
                  <TextInput
                    style={styles.nuevoCastadorInput}
                    value={nuevoCastador}
                    onChangeText={setNuevoCastador}
                    placeholder="Nombre del castador/criador"
                    placeholderTextColor="#555555"
                  />
                  <TouchableOpacity
                    style={styles.nuevoCastadorConfirm}
                    onPress={() => {
                      if (nuevoCastador.trim()) {
                        setFormData({ ...formData, castado_por: nuevoCastador.trim() });
                        setNuevoCastador('');
                        setShowNuevoCastador(false);
                        setShowCastadorList(false);
                      }
                    }}
                  >
                    <Text style={styles.nuevoCastadorConfirmText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Lista de castadores existentes */}
              {castadores.length > 0 && (
                <View style={styles.castadoresExistentes}>
                  <Text style={styles.castadoresTitle}>Castadores/Criadores registrados:</Text>
                  {castadores.map((castador) => (
                    <TouchableOpacity
                      key={castador.nombre}
                      style={[
                        styles.castadorItem,
                        formData.castado_por === castador.nombre && styles.castadorItemActive,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, castado_por: castador.nombre });
                        setShowCastadorList(false);
                      }}
                    >
                      <Text style={styles.castadorNombre}>{castador.nombre}</Text>
                      <View style={styles.castadorCantidad}>
                        <Text style={styles.castadorCantidadText}>{castador.cantidad} aves</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {castadores.length === 0 && !showNuevoCastador && (
                <Text style={styles.noCastadores}>No hay castadores registrados aún</Text>
              )}
            </View>
          )}

          {/* Fecha nacimiento */}
          <DatePickerField
            label="Fecha de Nacimiento"
            value={formData.fecha_nacimiento}
            onChange={(date) => setFormData({ ...formData, fecha_nacimiento: date })}
            placeholder="Seleccionar fecha"
          />

          {/* Nombre del Ave */}
          <Text style={styles.label}>Nombre del Ave (opcional)</Text>
          <TextInput
            style={styles.input}
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            placeholder="Ej: Campeón, Rey, etc."
            placeholderTextColor="#555555"
          />

          {/* Estado */}
          <Text style={styles.label}>Estado</Text>
          <View style={styles.estadoContainer}>
            {['activo', 'vendido', 'retirado'].map((estado) => (
              <TouchableOpacity
                key={estado}
                style={[
                  styles.estadoButton,
                  formData.estado === estado && styles.estadoButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, estado })}
              >
                <Text
                  style={[
                    styles.estadoText,
                    formData.estado === estado && styles.estadoTextActive,
                  ]}
                >
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sección de Padres - Árbol Genealógico */}
          <TouchableOpacity
            style={styles.padresSectionHeader}
            onPress={() => setShowPadresSection(!showPadresSection)}
          >
            <View style={styles.padresSectionHeaderLeft}>
              <Ionicons name="git-network-outline" size={20} color="#d4a017" />
              <Text style={styles.padresSectionTitle}>Padres (Opcional)</Text>
            </View>
            <Ionicons
              name={showPadresSection ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#555555"
            />
          </TouchableOpacity>

          {showPadresSection && (
            <View style={styles.padresSectionContent}>
              {/* Vista de Árbol Genealógico */}
              <View style={styles.treeFormContainer}>
                {/* Etiqueta del Ave Actual - Descendencia */}
                <View style={styles.treeFormCurrentBird}>
                  <Text style={styles.treeFormLabelMain}>DESCENDENCIA</Text>
                  <View style={styles.treeFormNodeMain}>
                    {formData.foto_principal ? (
                      <Image source={{ uri: formData.foto_principal }} style={styles.treeFormPhoto} />
                    ) : (
                      <View style={styles.treeFormPhotoPlaceholder}>
                        <Ionicons 
                          name={formData.tipo === 'gallo' ? 'male' : 'female'} 
                          size={20} 
                          color="#d4a017" 
                        />
                      </View>
                    )}
                    <Text style={styles.treeFormNodeCode}>
                      {formData.codigo || 'PL: ---'}
                    </Text>
                  </View>
                </View>

                {/* Conector vertical */}
                <View style={styles.treeFormConnectorVertical} />
                
                {/* Conector horizontal */}
                <View style={styles.treeFormConnectorHorizontal} />

                {/* Padres */}
                <View style={styles.treeFormParentsRow}>
                  {/* Padre */}
                  <View style={styles.treeFormParentColumn}>
                    <Text style={styles.treeFormLabel}>Padre</Text>
                    <TouchableOpacity
                      style={[
                        styles.treeFormNode,
                        (formData.padre_id || formData.padre_externo) && styles.treeFormNodeSelected
                      ]}
                      onPress={() => setShowPadreList(!showPadreList)}
                    >
                      {formData.padre_id ? (
                        <>
                          <View style={[styles.treeFormPhotoPlaceholder, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                            <Ionicons name="male" size={18} color="#3b82f6" />
                          </View>
                          <Text style={styles.treeFormNodeCode} numberOfLines={1}>
                            {gallos.find((g) => g.id === formData.padre_id)?.codigo || 'Seleccionado'}
                          </Text>
                        </>
                      ) : formData.padre_externo ? (
                        <>
                          <View style={[styles.treeFormPhotoPlaceholder, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                            <Ionicons name="male" size={18} color="#f59e0b" />
                          </View>
                          <Text style={styles.treeFormNodeCode} numberOfLines={1}>
                            {formData.padre_externo}
                          </Text>
                          {padreGalleria && <Text style={styles.treeFormNodeGalleria}>{padreGalleria}</Text>}
                          <Text style={styles.treeFormNodeExternal}>Externo</Text>
                        </>
                      ) : (
                        <>
                          <View style={styles.treeFormPhotoPlaceholderEmpty}>
                            <Ionicons name="add" size={20} color="#9ca3af" />
                          </View>
                          <Text style={styles.treeFormNodePlaceholder}>Seleccionar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    {/* Botón + para abuelos paternos */}
                    {(formData.padre_id || formData.padre_externo) && (
                      <TouchableOpacity
                        style={styles.treeFormAddAbueloBtn}
                        onPress={() => setShowAbuelosPaternos(!showAbuelosPaternos)}
                      >
                        <Ionicons name={showAbuelosPaternos ? "chevron-up" : "add"} size={16} color="#d4a017" />
                        <Text style={styles.treeFormAddAbueloText}>Abuelos</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Lista desplegable padre */}
                    {showPadreList && (
                      <View style={styles.treeFormSelectList}>
                        <TouchableOpacity
                          style={styles.treeFormSelectOption}
                          onPress={() => setShowPadreExterno(!showPadreExterno)}
                        >
                          <Ionicons name="add-circle" size={18} color="#f59e0b" />
                          <Text style={styles.treeFormSelectOptionTextAdd}>Padre Externo</Text>
                        </TouchableOpacity>
                        
                        {showPadreExterno && (
                          <View style={styles.treeFormExternalInputContainer}>
                            <TextInput
                              style={styles.treeFormInput}
                              value={padreExterno}
                              onChangeText={setPadreExterno}
                              placeholder="Placa"
                              placeholderTextColor="#9ca3af"
                            />
                            <TextInput
                              style={styles.treeFormInput}
                              value={padreGalleria}
                              onChangeText={setPadreGalleria}
                              placeholder="Gallería"
                              placeholderTextColor="#9ca3af"
                            />
                            <TouchableOpacity
                              style={styles.treeFormConfirmBtn}
                              onPress={() => {
                                if (padreExterno) {
                                  setFormData({ ...formData, padre_externo: padreExterno, padre_id: '' });
                                }
                                setShowPadreList(false);
                                setShowPadreExterno(false);
                              }}
                            >
                              <Text style={styles.treeFormConfirmText}>OK</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        
                        <TouchableOpacity
                          style={styles.treeFormSelectOption}
                          onPress={() => {
                            setFormData({ ...formData, padre_id: '', padre_externo: '' });
                            setPadreExterno('');
                            setPadreGalleria('');
                            setShowPadreList(false);
                          }}
                        >
                          <Ionicons name="close-circle" size={18} color="#9ca3af" />
                          <Text style={styles.treeFormSelectOptionText}>Ninguno</Text>
                        </TouchableOpacity>
                        
                        {gallos.filter((g) => g.id !== id).map((gallo) => (
                          <TouchableOpacity
                            key={gallo.id}
                            style={[
                              styles.treeFormSelectOption,
                              formData.padre_id === gallo.id && styles.treeFormSelectOptionActive
                            ]}
                            onPress={() => {
                              setFormData({ ...formData, padre_id: gallo.id, padre_externo: '' });
                              setPadreExterno('');
                              setPadreGalleria('');
                              setShowPadreList(false);
                            }}
                          >
                            <Ionicons name="male" size={16} color="#3b82f6" />
                            <Text style={styles.treeFormSelectOptionText}>{gallo.codigo}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Separador */}
                  <View style={styles.treeFormDivider} />

                  {/* Madre */}
                  <View style={styles.treeFormParentColumn}>
                    <Text style={styles.treeFormLabel}>Madre</Text>
                    <TouchableOpacity
                      style={[
                        styles.treeFormNode,
                        (formData.madre_id || formData.madre_externo) && styles.treeFormNodeSelected
                      ]}
                      onPress={() => setShowMadreList(!showMadreList)}
                    >
                      {formData.madre_id ? (
                        <>
                          <View style={[styles.treeFormPhotoPlaceholder, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                            <Ionicons name="female" size={18} color="#ec4899" />
                          </View>
                          <Text style={styles.treeFormNodeCode} numberOfLines={1}>
                            {gallinas.find((g) => g.id === formData.madre_id)?.codigo || 'Seleccionada'}
                          </Text>
                        </>
                      ) : formData.madre_externo ? (
                        <>
                          <View style={[styles.treeFormPhotoPlaceholder, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                            <Ionicons name="female" size={18} color="#ec4899" />
                          </View>
                          <Text style={styles.treeFormNodeCode} numberOfLines={1}>
                            {formData.madre_externo}
                          </Text>
                          {madreGalleria && <Text style={styles.treeFormNodeGalleria}>{madreGalleria}</Text>}
                          <Text style={styles.treeFormNodeExternal}>Externa</Text>
                        </>
                      ) : (
                        <>
                          <View style={styles.treeFormPhotoPlaceholderEmpty}>
                            <Ionicons name="add" size={20} color="#9ca3af" />
                          </View>
                          <Text style={styles.treeFormNodePlaceholder}>Seleccionar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    {/* Botón + para abuelos maternos */}
                    {(formData.madre_id || formData.madre_externo) && (
                      <TouchableOpacity
                        style={styles.treeFormAddAbueloBtn}
                        onPress={() => setShowAbuelosMaternos(!showAbuelosMaternos)}
                      >
                        <Ionicons name={showAbuelosMaternos ? "chevron-up" : "add"} size={16} color="#d4a017" />
                        <Text style={styles.treeFormAddAbueloText}>Abuelos</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Lista desplegable madre */}
                    {showMadreList && (
                      <View style={styles.treeFormSelectList}>
                        <TouchableOpacity
                          style={styles.treeFormSelectOption}
                          onPress={() => setShowMadreExterno(!showMadreExterno)}
                        >
                          <Ionicons name="add-circle" size={18} color="#ec4899" />
                          <Text style={[styles.treeFormSelectOptionTextAdd, { color: '#ec4899' }]}>Madre Externa</Text>
                        </TouchableOpacity>
                        
                        {showMadreExterno && (
                          <View style={styles.treeFormExternalInputContainer}>
                            <TextInput
                              style={styles.treeFormInput}
                              value={madreExterno}
                              onChangeText={setMadreExterno}
                              placeholder="Placa"
                              placeholderTextColor="#9ca3af"
                            />
                            <TextInput
                              style={styles.treeFormInput}
                              value={madreGalleria}
                              onChangeText={setMadreGalleria}
                              placeholder="Gallería"
                              placeholderTextColor="#9ca3af"
                            />
                            <TouchableOpacity
                              style={[styles.treeFormConfirmBtn, { backgroundColor: '#ec4899' }]}
                              onPress={() => {
                                if (madreExterno) {
                                  setFormData({ ...formData, madre_externo: madreExterno, madre_id: '' });
                                }
                                setShowMadreList(false);
                                setShowMadreExterno(false);
                              }}
                            >
                              <Text style={styles.treeFormConfirmText}>OK</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        
                        <TouchableOpacity
                          style={styles.treeFormSelectOption}
                          onPress={() => {
                            setFormData({ ...formData, madre_id: '', madre_externo: '' });
                            setMadreExterno('');
                            setMadreGalleria('');
                            setShowMadreList(false);
                          }}
                        >
                          <Ionicons name="close-circle" size={18} color="#9ca3af" />
                          <Text style={styles.treeFormSelectOptionText}>Ninguna</Text>
                        </TouchableOpacity>
                        
                        {gallinas.filter((g) => g.id !== id).map((gallina) => (
                          <TouchableOpacity
                            key={gallina.id}
                            style={[
                              styles.treeFormSelectOption,
                              formData.madre_id === gallina.id && styles.treeFormSelectOptionActive
                            ]}
                            onPress={() => {
                              setFormData({ ...formData, madre_id: gallina.id, madre_externo: '' });
                              setMadreExterno('');
                              setMadreGalleria('');
                              setShowMadreList(false);
                            }}
                          >
                            <Ionicons name="female" size={16} color="#ec4899" />
                            <Text style={styles.treeFormSelectOptionText}>{gallina.codigo}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Sección de Abuelos Paternos - Árbol */}
                {showAbuelosPaternos && (formData.padre_id || formData.padre_externo) && (
                  <View style={styles.abuelosTreeSection}>
                    <View style={styles.abuelosTreeConnectorFromParent} />
                    <View style={styles.abuelosTreeHorizontal} />
                    <View style={styles.abuelosTreeRow}>
                      <View style={styles.abueloTreeItem}>
                        <Text style={styles.abueloTreeLabel}>Abuelo ♂</Text>
                        <View style={styles.abueloTreeNode}>
                          <View style={[styles.abueloTreeIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                            <Ionicons name="male" size={16} color="#3b82f6" />
                          </View>
                          <TextInput
                            style={styles.abueloTreeInput}
                            placeholder="Placa"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      </View>
                      <View style={styles.abueloTreeItem}>
                        <Text style={styles.abueloTreeLabel}>Abuela ♀</Text>
                        <View style={styles.abueloTreeNode}>
                          <View style={[styles.abueloTreeIcon, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                            <Ionicons name="female" size={16} color="#ec4899" />
                          </View>
                          <TextInput
                            style={styles.abueloTreeInput}
                            placeholder="Placa"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Sección de Abuelos Maternos - Árbol */}
                {showAbuelosMaternos && (formData.madre_id || formData.madre_externo) && (
                  <View style={styles.abuelosTreeSection}>
                    <View style={styles.abuelosTreeConnectorFromParent} />
                    <View style={styles.abuelosTreeHorizontal} />
                    <View style={styles.abuelosTreeRow}>
                      <View style={styles.abueloTreeItem}>
                        <Text style={styles.abueloTreeLabel}>Abuelo ♂</Text>
                        <View style={styles.abueloTreeNode}>
                          <View style={[styles.abueloTreeIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                            <Ionicons name="male" size={16} color="#3b82f6" />
                          </View>
                          <TextInput
                            style={styles.abueloTreeInput}
                            placeholder="Placa"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      </View>
                      <View style={styles.abueloTreeItem}>
                        <Text style={styles.abueloTreeLabel}>Abuela ♀</Text>
                        <View style={styles.abueloTreeNode}>
                          <View style={[styles.abueloTreeIcon, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                            <Ionicons name="female" size={16} color="#ec4899" />
                          </View>
                          <TextInput
                            style={styles.abueloTreeInput}
                            placeholder="Placa"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Notas */}
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notas}
            onChangeText={(text) => setFormData({ ...formData, notas: text })}
            placeholder="Notas adicionales..."
            placeholderTextColor="#555555"
            multiline
            numberOfLines={4}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para seleccionar foto (web) */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.photoModalOverlay}>
          <View style={styles.photoModal}>
            <Text style={styles.photoModalTitle}>Agregar Foto</Text>
            <Text style={styles.photoModalSubtitle}>Selecciona una opción</Text>
            
            <TouchableOpacity
              style={styles.photoModalOption}
              onPress={() => {
                setShowPhotoModal(false);
                pickImage();
              }}
            >
              <View style={[styles.photoModalIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="images" size={28} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.photoModalOptionText}>Galería</Text>
                <Text style={styles.photoModalOptionSubtext}>Seleccionar de tus fotos</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoModalOption}
              onPress={() => {
                setShowPhotoModal(false);
                takePhoto();
              }}
            >
              <View style={[styles.photoModalIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <Ionicons name="camera" size={28} color="#22c55e" />
              </View>
              <View>
                <Text style={styles.photoModalOptionText}>Cámara</Text>
                <Text style={styles.photoModalOptionSubtext}>Tomar una foto nueva</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoModalCancel}
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={styles.photoModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 12,
    textAlign: 'center',
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 60,
  },
  photoText: {
    fontSize: 12,
    color: '#555555',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tipoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tipoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tipoButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  tipoText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  tipoTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  estadoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estadoButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  estadoButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  estadoText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  estadoTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  selectList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
  },
  selectItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  colorOptionActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  colorOptionText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  colorOptionTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  addParentOption: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  addParentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addParentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f59e0b',
  },
  addParentSubtext: {
    fontSize: 11,
    color: '#707070',
    marginTop: 4,
  },
  externalForm: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  externalInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmExternalButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmExternalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  photoModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  photoModalSubtitle: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 24,
  },
  photoModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  photoModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  photoModalOptionSubtext: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
  },
  photoModalCancel: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  photoModalCancelText: {
    fontSize: 16,
    color: '#555555',
    fontWeight: '500',
  },
  // Estilos para placa con color
  placaContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  placaInput: {
    flex: 1,
  },
  colorPlacaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  colorPlacaDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorPlacaText: {
    fontSize: 14,
    color: '#555555',
  },
  colorPlacaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorPlacaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  colorPlacaOptionActive: {
    backgroundColor: '#d4a017',
  },
  colorPlacaDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorPlacaOptionText: {
    fontSize: 13,
    color: '#1a1a1a',
  },
  // Estilos para castador/criador
  castadorList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  castadorNuevoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 10,
  },
  castadorNuevoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#d4a017',
  },
  nuevoCastadorForm: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  nuevoCastadorInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  nuevoCastadorConfirm: {
    backgroundColor: '#d4a017',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  nuevoCastadorConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  castadoresExistentes: {
    padding: 12,
  },
  castadoresTitle: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 8,
    fontWeight: '500',
  },
  castadorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 6,
  },
  castadorItemActive: {
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    borderWidth: 1,
    borderColor: '#d4a017',
  },
  castadorNombre: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  castadorCantidad: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  castadorCantidadText: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '600',
  },
  noCastadores: {
    padding: 16,
    textAlign: 'center',
    color: '#555555',
    fontSize: 14,
  },
  // Estilos para indicador de fotos
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  photoIndicatorText: {
    fontSize: 12,
    color: '#555555',
  },
  // Estilos para sección de padres desplegable
  padresSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  padresSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  padresSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  padresSectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  labelInSection: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555555',
    marginBottom: 8,
  },
  // Estilos para foto circular centrada
  photoSectionCentered: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  photoContainerCircle: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#d4a017',
  },
  photoPlaceholderCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#d4a017',
    borderStyle: 'dashed',
  },
  photoPlusIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#d4a017',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoButtonCircle: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  // Estilos para árbol genealógico en formulario
  treeFormContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  treeFormCurrentBird: {
    alignItems: 'center',
  },
  treeFormNodeMain: {
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d4a017',
    minWidth: 90,
  },
  treeFormPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
  },
  treeFormPhotoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  treeFormPhotoPlaceholderEmpty: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  treeFormNodeCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  treeFormConnectorVertical: {
    width: 2,
    height: 16,
    backgroundColor: '#d4a017',
  },
  treeFormConnectorHorizontal: {
    width: 120,
    height: 2,
    backgroundColor: '#d4a017',
    marginBottom: 8,
  },
  treeFormParentsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
  },
  treeFormParentColumn: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 150,
  },
  treeFormDivider: {
    width: 20,
  },
  treeFormLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d4a017',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  treeFormNode: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 100,
    width: '100%',
  },
  treeFormNodeSelected: {
    borderColor: '#d4a017',
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
  },
  treeFormNodePlaceholder: {
    fontSize: 12,
    color: '#9ca3af',
  },
  treeFormNodeExternal: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
    marginTop: 2,
  },
  treeFormSelectList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  treeFormSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  treeFormSelectOptionActive: {
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
  },
  treeFormSelectOptionText: {
    fontSize: 13,
    color: '#1a1a1a',
  },
  treeFormSelectOptionTextAdd: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f59e0b',
  },
  treeFormExternalInput: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  treeFormInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  treeFormConfirmBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  treeFormConfirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  treeFormLabelMain: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d4a017',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  treeFormNodeGalleria: {
    fontSize: 10,
    color: '#555555',
    marginTop: 2,
  },
  treeFormExternalInputContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  treeFormAddAbueloBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
    borderRadius: 16,
    gap: 4,
  },
  treeFormAddAbueloText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d4a017',
  },
  // Estilos para sección de abuelos
  abuelosSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  abuelosSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
    textAlign: 'center',
    marginBottom: 12,
  },
  abuelosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  // Estilos para árbol de abuelos en formulario
  abuelosTreeSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  abuelosTreeConnectorFromParent: {
    width: 2,
    height: 12,
    backgroundColor: '#d4a017',
  },
  abuelosTreeHorizontal: {
    width: 100,
    height: 2,
    backgroundColor: '#d4a017',
    marginBottom: 8,
  },
  abuelosTreeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  abueloTreeItem: {
    alignItems: 'center',
  },
  abueloTreeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 6,
  },
  abueloTreeNode: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
  },
  abueloTreeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  abueloTreeInput: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
    color: '#1a1a1a',
    textAlign: 'center',
    width: 70,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  abueloItem: {
    gap: 12,
  },
  abueloItem: {
    flex: 1,
    alignItems: 'center',
  },
  abueloLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 6,
  },
  abueloInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
    textAlign: 'center',
  },
});
