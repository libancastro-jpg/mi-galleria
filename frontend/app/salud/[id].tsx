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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
}

export default function SaludFormScreen() {
  const router = useRouter();
  const { id, ave_id: paramAveId } = useLocalSearchParams<{ id: string; ave_id?: string }>();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aves, setAves] = useState<Ave[]>([]);
  const [showAveList, setShowAveList] = useState(false);

  const TIPOS_SALUD = [
    { value: 'vitamina', label: 'Vitamina', icon: 'flask' },
    { value: 'vacuna', label: 'Vacuna', icon: 'shield-checkmark' },
    { value: 'desparasitante', label: 'Desparasitante', icon: 'bug' },
    { value: 'tratamiento', label: 'Tratamiento', icon: 'medkit' },
  ];

  const [formData, setFormData] = useState({
    ave_id: paramAveId || '',
    tipo: 'vitamina',
    producto: '',
    dosis: '',
    fecha: new Date().toISOString().split('T')[0],
    proxima_fecha: '',
    notas: '',
  });

  useEffect(() => {
    fetchAves();
    if (isEdit) {
      fetchSalud();
    }
  }, [id]);

  const fetchAves = async () => {
    try {
      const data = await api.get('/aves', { estado: 'activo' });
      setAves(data);
    } catch (error) {
      console.error('Error fetching aves:', error);
    }
  };

  const fetchSalud = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/salud/${id}`);
      setFormData({
        ave_id: data.ave_id || '',
        tipo: data.tipo || 'vitamina',
        producto: data.producto || '',
        dosis: data.dosis || '',
        fecha: data.fecha || '',
        proxima_fecha: data.proxima_fecha || '',
        notas: data.notas || '',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.ave_id) {
      Alert.alert('Error', 'Debes seleccionar un ave');
      return;
    }
    if (!formData.producto.trim()) {
      Alert.alert('Error', 'El producto es obligatorio');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/salud/${id}`, formData);
        Alert.alert('Éxito', 'Registro actualizado correctamente');
      } else {
        await api.post('/salud', formData);
        Alert.alert('Éxito', 'Registro creado correctamente');
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
          <Text style={styles.title}>
            {isEdit ? 'Editar Registro' : 'Nuevo Registro de Salud'}
          </Text>
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
          {/* Ave Selection */}
          <Text style={styles.label}>Ave *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowAveList(!showAveList)}
          >
            <View style={styles.selectButtonContent}>
              <Ionicons name="fitness" size={20} color="#f59e0b" />
              <Text style={styles.selectButtonText}>
                {formData.ave_id
                  ? aves.find((a) => a.id === formData.ave_id)?.codigo || 'Seleccionado'
                  : 'Seleccionar ave'}
              </Text>
            </View>
            <Ionicons
              name={showAveList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>

          {showAveList && (
            <View style={styles.selectList}>
              {aves.map((ave) => (
                <TouchableOpacity
                  key={ave.id}
                  style={[
                    styles.selectItem,
                    formData.ave_id === ave.id && styles.selectItemActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, ave_id: ave.id });
                    setShowAveList(false);
                  }}
                >
                  <Text style={styles.selectItemText}>
                    {ave.codigo} {ave.nombre ? `- ${ave.nombre}` : ''}
                  </Text>
                  {formData.ave_id === ave.id && (
                    <Ionicons name="checkmark" size={20} color="#f59e0b" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tipo */}
          <Text style={styles.label}>Tipo *</Text>
          <View style={styles.tipoGrid}>
            {TIPOS_SALUD.map((tipo) => (
              <TouchableOpacity
                key={tipo.value}
                style={[
                  styles.tipoButton,
                  formData.tipo === tipo.value && styles.tipoButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, tipo: tipo.value })}
              >
                <Ionicons
                  name={tipo.icon as any}
                  size={24}
                  color={formData.tipo === tipo.value ? '#000' : '#9ca3af'}
                />
                <Text
                  style={[
                    styles.tipoText,
                    formData.tipo === tipo.value && styles.tipoTextActive,
                  ]}
                >
                  {tipo.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Producto */}
          <Text style={styles.label}>Producto *</Text>
          <TextInput
            style={styles.input}
            value={formData.producto}
            onChangeText={(text) => setFormData({ ...formData, producto: text })}
            placeholder="Nombre del producto"
            placeholderTextColor="#555555"
          />

          {/* Dosis */}
          <Text style={styles.label}>Dosis</Text>
          <TextInput
            style={styles.input}
            value={formData.dosis}
            onChangeText={(text) => setFormData({ ...formData, dosis: text })}
            placeholder="Ej: 1ml, 2 gotas, 1 tableta"
            placeholderTextColor="#555555"
          />

          {/* Fecha */}
          <Text style={styles.label}>Fecha de aplicación *</Text>
          <TextInput
            style={styles.input}
            value={formData.fecha}
            onChangeText={(text) => setFormData({ ...formData, fecha: text })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#555555"
          />

          {/* Próxima fecha */}
          <Text style={styles.label}>Próxima aplicación (recordatorio)</Text>
          <TextInput
            style={styles.input}
            value={formData.proxima_fecha}
            onChangeText={(text) => setFormData({ ...formData, proxima_fecha: text })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#555555"
          />

          {/* Notas */}
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notas}
            onChangeText={(text) => setFormData({ ...formData, notas: text })}
            placeholder="Observaciones..."
            placeholderTextColor="#555555"
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
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
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  selectItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  tipoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoButton: {
    width: '48%',
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
    fontSize: 14,
    color: '#9ca3af',
  },
  tipoTextActive: {
    color: '#000',
    fontWeight: '600',
  },
});
