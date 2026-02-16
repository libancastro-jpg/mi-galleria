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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../src/services/api';

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
  const [showPadreExterno, setShowPadreExterno] = useState(false);
  const [showMadreExterno, setShowMadreExterno] = useState(false);
  const [padreExterno, setPadreExterno] = useState('');
  const [madreExterno, setMadreExterno] = useState('');

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
    'Gallo Fino',
    'Otro',
  ];

  const [formData, setFormData] = useState({
    tipo: 'gallo',
    codigo: '',
    nombre: '',
    foto_principal: '',
    fecha_nacimiento: '',
    color: '',
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

  useEffect(() => {
    fetchAves();
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

  const fetchAve = async () => {
    setLoading(true);
    try {
      const ave = await api.get(`/aves/${id}`);
      setFormData({
        tipo: ave.tipo || 'gallo',
        codigo: ave.codigo || '',
        nombre: ave.nombre || '',
        foto_principal: ave.foto_principal || '',
        fecha_nacimiento: ave.fecha_nacimiento || '',
        color: ave.color || '',
        linea: ave.linea || '',
        estado: ave.estado || 'activo',
        notas: ave.notas || '',
        padre_id: ave.padre_id || '',
        madre_id: ave.madre_id || '',
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
      quality: 0.5,
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
      quality: 0.5,
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
      };

      if (isEdit) {
        await api.put(`/aves/${id}`, dataToSend);
        Alert.alert('Éxito', 'Ave actualizada correctamente');
      } else {
        await api.post('/aves', dataToSend);
        Alert.alert('Éxito', 'Ave creada correctamente');
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
            <Ionicons name="arrow-back" size={24} color="#fff" />
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
          {/* Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={() => {
                Alert.alert('Foto', 'Selecciona una opción', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Cámara', onPress: takePhoto },
                  { text: 'Galería', onPress: pickImage },
                ]);
              }}
            >
              {formData.foto_principal ? (
                <Image
                  source={{ uri: formData.foto_principal }}
                  style={styles.photo}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={40} color="#a0a0a0" />
                  <Text style={styles.photoText}>Agregar foto</Text>
                </View>
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

          {/* Número de Placa */}
          <Text style={styles.label}>Número de Placa *</Text>
          <TextInput
            style={styles.input}
            value={formData.codigo}
            onChangeText={(text) => setFormData({ ...formData, codigo: text })}
            placeholder="Ej: 12, 001, A-15"
            placeholderTextColor="#a0a0a0"
          />

          {/* Nombre */}
          <Text style={styles.label}>Nombre (opcional)</Text>
          <TextInput
            style={styles.input}
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            placeholder="Nombre del ave"
            placeholderTextColor="#a0a0a0"
          />

          {/* Color */}
          <Text style={styles.label}>Color</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowColorList(!showColorList)}
          >
            <Text style={[styles.selectButtonText, formData.color && { color: '#fff' }]}>
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

          {/* Línea */}
          <Text style={styles.label}>Línea</Text>
          <TextInput
            style={styles.input}
            value={formData.linea}
            onChangeText={(text) => setFormData({ ...formData, linea: text })}
            placeholder="Línea genética"
            placeholderTextColor="#a0a0a0"
          />

          {/* Castado Por */}
          <Text style={styles.label}>Castado Por</Text>
          <TextInput
            style={styles.input}
            value={formData.castado_por}
            onChangeText={(text) => setFormData({ ...formData, castado_por: text })}
            placeholder="Nombre del castador"
            placeholderTextColor="#a0a0a0"
          />

          {/* Fecha nacimiento */}
          <Text style={styles.label}>Fecha de nacimiento</Text>
          <TextInput
            style={styles.input}
            value={formData.fecha_nacimiento}
            onChangeText={(text) => setFormData({ ...formData, fecha_nacimiento: text })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#a0a0a0"
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

          {/* Padre */}
          <Text style={[styles.label, { marginTop: 16 }]}>Padre (Gallo)</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowPadreList(!showPadreList)}
          >
            <Text style={styles.selectButtonText}>
              {formData.padre_externo
                ? `Externo: ${formData.padre_externo}`
                : formData.padre_id
                  ? gallos.find((g) => g.id === formData.padre_id)?.codigo || 'Seleccionado'
                  : 'Seleccionar padre'}
            </Text>
            <Ionicons
              name={showPadreList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#a0a0a0"
            />
          </TouchableOpacity>
          {showPadreList && (
            <View style={styles.selectList}>
              {/* Opción Agregar Padre Externo */}
              <TouchableOpacity
                style={[styles.selectItem, styles.addParentOption]}
                onPress={() => setShowPadreExterno(!showPadreExterno)}
              >
                <View style={styles.addParentRow}>
                  <Ionicons name="add-circle" size={20} color="#f59e0b" />
                  <Text style={styles.addParentText}>Agregar Padre</Text>
                </View>
                <Text style={styles.addParentSubtext}>De otra gallería</Text>
              </TouchableOpacity>
              
              {showPadreExterno && (
                <View style={styles.externalForm}>
                  <TextInput
                    style={styles.externalInput}
                    value={formData.padre_externo}
                    onChangeText={(text) => setFormData({ ...formData, padre_externo: text, padre_id: '' })}
                    placeholder="Placa del padre"
                    placeholderTextColor="#707070"
                  />
                  <TextInput
                    style={styles.externalInput}
                    value={padreExterno}
                    onChangeText={setPadreExterno}
                    placeholder="Gallería / Castador (opcional)"
                    placeholderTextColor="#707070"
                  />
                  <TouchableOpacity
                    style={styles.confirmExternalButton}
                    onPress={() => {
                      if (formData.padre_externo) {
                        const placaConGalleria = padreExterno 
                          ? `${formData.padre_externo} (${padreExterno})`
                          : formData.padre_externo;
                        setFormData({ ...formData, padre_externo: placaConGalleria, padre_id: '' });
                      }
                      setShowPadreList(false);
                      setShowPadreExterno(false);
                    }}
                  >
                    <Text style={styles.confirmExternalText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Limpiar selección */}
              <TouchableOpacity
                style={styles.selectItem}
                onPress={() => {
                  setFormData({ ...formData, padre_id: '', padre_externo: '' });
                  setPadreExterno('');
                  setShowPadreList(false);
                  setShowPadreExterno(false);
                }}
              >
                <Text style={[styles.selectItemText, { color: '#a0a0a0' }]}>Ninguno / Desconocido</Text>
              </TouchableOpacity>
              
              {/* Lista de gallos registrados */}
              {gallos.filter((g) => g.id !== id).map((gallo) => (
                <TouchableOpacity
                  key={gallo.id}
                  style={styles.selectItem}
                  onPress={() => {
                    setFormData({ ...formData, padre_id: gallo.id, padre_externo: '' });
                    setPadreExterno('');
                    setShowPadreList(false);
                    setShowPadreExterno(false);
                  }}
                >
                  <Text style={styles.selectItemText}>
                    {gallo.codigo} {gallo.nombre ? `- ${gallo.nombre}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Madre */}
          <Text style={[styles.label, { marginTop: 16 }]}>Madre (Gallina)</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowMadreList(!showMadreList)}
          >
            <Text style={styles.selectButtonText}>
              {formData.madre_externo
                ? `Externa: ${formData.madre_externo}`
                : formData.madre_id
                  ? gallinas.find((g) => g.id === formData.madre_id)?.codigo || 'Seleccionada'
                  : 'Seleccionar madre'}
            </Text>
            <Ionicons
              name={showMadreList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#a0a0a0"
            />
          </TouchableOpacity>
          {showMadreList && (
            <View style={styles.selectList}>
              {/* Opción Agregar Madre Externa */}
              <TouchableOpacity
                style={[styles.selectItem, styles.addParentOption]}
                onPress={() => setShowMadreExterno(!showMadreExterno)}
              >
                <View style={styles.addParentRow}>
                  <Ionicons name="add-circle" size={20} color="#ec4899" />
                  <Text style={[styles.addParentText, { color: '#ec4899' }]}>Agregar Madre</Text>
                </View>
                <Text style={styles.addParentSubtext}>De otra gallería</Text>
              </TouchableOpacity>
              
              {showMadreExterno && (
                <View style={styles.externalForm}>
                  <TextInput
                    style={styles.externalInput}
                    value={formData.madre_externo}
                    onChangeText={(text) => setFormData({ ...formData, madre_externo: text, madre_id: '' })}
                    placeholder="Placa de la madre"
                    placeholderTextColor="#707070"
                  />
                  <TextInput
                    style={styles.externalInput}
                    value={madreExterno}
                    onChangeText={setMadreExterno}
                    placeholder="Gallería / Castador (opcional)"
                    placeholderTextColor="#707070"
                  />
                  <TouchableOpacity
                    style={[styles.confirmExternalButton, { backgroundColor: '#ec4899' }]}
                    onPress={() => {
                      if (formData.madre_externo) {
                        const placaConGalleria = madreExterno 
                          ? `${formData.madre_externo} (${madreExterno})`
                          : formData.madre_externo;
                        setFormData({ ...formData, madre_externo: placaConGalleria, madre_id: '' });
                      }
                      setShowMadreList(false);
                      setShowMadreExterno(false);
                    }}
                  >
                    <Text style={styles.confirmExternalText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Limpiar selección */}
              <TouchableOpacity
                style={styles.selectItem}
                onPress={() => {
                  setFormData({ ...formData, madre_id: '', madre_externo: '' });
                  setMadreExterno('');
                  setShowMadreList(false);
                  setShowMadreExterno(false);
                }}
              >
                <Text style={[styles.selectItemText, { color: '#a0a0a0' }]}>Ninguna / Desconocida</Text>
              </TouchableOpacity>
              
              {/* Lista de gallinas registradas */}
              {gallinas.filter((g) => g.id !== id).map((gallina) => (
                <TouchableOpacity
                  key={gallina.id}
                  style={styles.selectItem}
                  onPress={() => {
                    setFormData({ ...formData, madre_id: gallina.id, madre_externo: '' });
                    setMadreExterno('');
                    setShowMadreList(false);
                    setShowMadreExterno(false);
                  }}
                >
                  <Text style={styles.selectItemText}>
                    {gallina.codigo} {gallina.nombre ? `- ${gallina.nombre}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Notas */}
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notas}
            onChangeText={(text) => setFormData({ ...formData, notas: text })}
            placeholder="Notas adicionales..."
            placeholderTextColor="#a0a0a0"
            multiline
            numberOfLines={4}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
    borderRadius: 60,
  },
  photoText: {
    fontSize: 12,
    color: '#a0a0a0',
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
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333333',
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
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#333333',
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
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#333333',
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
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  selectList: {
    backgroundColor: '#242424',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333333',
    maxHeight: 200,
  },
  selectItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  selectItemText: {
    fontSize: 16,
    color: '#fff',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  colorOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#333333',
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
    borderBottomColor: '#333333',
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
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  externalInput: {
    backgroundColor: '#242424',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
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
});
