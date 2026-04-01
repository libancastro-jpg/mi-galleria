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
  Image,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { api, ApiError } from '../../src/services/api';
import { RoosterIcon } from '../../src/components/BirdIcons';
import { DatePickerField } from '../../src/components/DatePickerField';

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  foto_principal?: string;
  color?: string;
  linea?: string;
}

interface Actividad {
  id: string;
  tipo: 'tope' | 'trabajo';
  numero: number;
  tiempo_minutos?: number;
  fecha: string;
  notas?: string;
  peso?: string;
  marcaje_mes?: string;
  marcaje_anio?: string;
}

interface Cuido {
  id: string;
  ave_id: string;
  ave_codigo?: string;
  ave_nombre?: string;
  ave_foto?: string;
  ave_color?: string;
  ave_linea?: string;
  fecha_inicio: string;
  estado: string;
  actividades: Actividad[];
  en_descanso: boolean;
  dias_descanso?: number;
  fecha_inicio_descanso?: string;
  fecha_fin_descanso?: string;
  notas?: string;
}

const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.14)',
  goldBorder: 'rgba(212, 160, 23, 0.35)',
  green: '#22c55e',
  greenDark: '#166534',
  greenLight: 'rgba(34, 197, 94, 0.12)',
  red: '#8b1a1a',
  redLight: 'rgba(139, 26, 26, 0.12)',
  blue: '#3b82f6',
  blueLight: 'rgba(59, 130, 246, 0.12)',
  black: '#171717',
  white: '#ffffff',
  background: '#f5f5f5',
  border: '#e6e6e6',
  textMuted: '#6b7280',
  soft: '#f3f4f6',
  soft2: '#fafafa',
  overlay: 'rgba(0,0,0,0.55)',
};

export default function CuidoDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const MEMBERSHIP_PLANS_ROUTE = '/premium';

  const now = new Date();
  const defaultMonth = String(now.getMonth() + 1).padStart(2, '0');
  const defaultYear = String(now.getFullYear());

  const availableMonths = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        return num < 10 ? `0${num}` : String(num);
      }),
    []
  );

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => String(currentYear - 2 + i));
  }, []);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [cuido, setCuido] = useState<Cuido | null>(null);
  const [gallos, setGallos] = useState<Ave[]>([]);
  const [showGalloList, setShowGalloList] = useState(false);
  const [selectedGallo, setSelectedGallo] = useState('');

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalTitle, setPremiumModalTitle] = useState('Límite alcanzado');
  const [premiumModalMessage, setPremiumModalMessage] = useState(
    'Has alcanzado el límite de tu plan. Ve a Planes de membresía para continuar.'
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [actividadTipo, setActividadTipo] = useState<'tope' | 'trabajo' | null>(null);
  const [actividadTiempo, setActividadTiempo] = useState('');
  const [actividadFecha, setActividadFecha] = useState(new Date().toISOString().split('T')[0]);
  const [actividadNotas, setActividadNotas] = useState('');
  const [actividadPeso, setActividadPeso] = useState('');
  const [marcajeMes, setMarcajeMes] = useState(defaultMonth);
  const [marcajeAnio, setMarcajeAnio] = useState(defaultYear);

  const [openPicker, setOpenPicker] = useState<'mes' | 'anio' | null>(null);

  const [showDescansoModal, setShowDescansoModal] = useState(false);
  const [diasDescanso, setDiasDescanso] = useState('');

  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetchCuido();
    }
    fetchGallos();
  }, [id]);

  const extractErrorMessage = (error: any) => {
    if (error instanceof ApiError) {
      if (typeof error.detail === 'object' && error.detail?.message) {
        return error.detail.message;
      }
      return error.message;
    }
    return (
      error?.response?.data?.detail?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Ocurrió un error'
    );
  };

  const isPremiumLimitError = (error: any) => {
    if (error instanceof ApiError) {
      const code =
        error.detail?.code ||
        (typeof error.detail === 'object' && error.detail?.code);
      return (
        code === 'PREMIUM_REQUIRED' ||
        code === 'FREE_PLAN_LIMIT_REACHED' ||
        code === 'TRIAL_EXPIRED' ||
        code === 'PLAN_REQUIRED' ||
        error.status === 403
      );
    }
    return false;
  };

  const openPremiumModalFromError = (error: any) => {
    if (error instanceof ApiError && typeof error.detail === 'object') {
      setPremiumModalTitle(error.detail?.title || 'Límite alcanzado');
      setPremiumModalMessage(
        error.detail?.message ||
          'Has alcanzado el límite de tu plan. Ve a Planes de membresía para continuar.'
      );
    }
    setShowPremiumModal(true);
  };

  const goToMembershipPlans = () => {
    setShowPremiumModal(false);
    router.push(MEMBERSHIP_PLANS_ROUTE as any);
  };

  const formatPesoInput = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '').slice(0, 5);

    if (!onlyNumbers) return '';
    if (onlyNumbers.length === 1) return onlyNumbers;
    if (onlyNumbers.length <= 3) {
      return `${onlyNumbers.slice(0, 1)}.${onlyNumbers.slice(1)}`;
    }

    return `${onlyNumbers.slice(0, 1)}.${onlyNumbers.slice(1, 3)}.${onlyNumbers.slice(3)}`;
  };

  const ensureNotificationPermissions = async () => {
    try {
      const current = await Notifications.getPermissionsAsync();
      let status = current.status;

      if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }

      return status === 'granted';
    } catch {
      return false;
    }
  };

  const scheduleRestNotifications = async (dias: number) => {
    const permissionGranted = await ensureNotificationPermissions();
    if (!permissionGranted) return;

    const currentDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + dias);

    const oneDayBefore = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    const twelveHoursBefore = new Date(endDate.getTime() - 12 * 60 * 60 * 1000);

    const aveLabel = cuido?.ave_codigo || cuido?.ave_nombre || 'Tu gallo';

    try {
      if (oneDayBefore > currentDate) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏳ Descanso casi terminado',
            body: `${aveLabel} termina su descanso en 24 horas.`,
            sound: true,
          },
          trigger: oneDayBefore as any,
        });
      }

      if (twelveHoursBefore > currentDate) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔥 Descanso por finalizar',
            body: `${aveLabel} termina su descanso en 12 horas.`,
            sound: true,
          },
          trigger: twelveHoursBefore as any,
        });
      }
    } catch {
      // no rompemos el flujo si falla la programación local
    }
  };

  const isTrabajoRegistrado = (t: any) => {
    return Boolean(
      t?.completado === true ||
      t?.fecha_completado ||
      t?.fecha ||
      t?.peso ||
      t?.marcaje_mes ||
      t?.marcaje_anio ||
      t?.notas
    );
  };

  const normalizeTrabajo = (t: any, index: number): Actividad | null => {
    const numero = Number(t?.numero ?? t?.trabajo_numero ?? index + 1);
    if (!numero || numero < 1) return null;
    if (!isTrabajoRegistrado(t)) return null;

    return {
      id: String(t?.id || t?._id || `trabajo${numero}`),
      tipo: 'trabajo',
      numero,
      tiempo_minutos:
        t?.tiempo_minutos !== undefined && t?.tiempo_minutos !== null
          ? Number(t.tiempo_minutos)
          : undefined,
      fecha:
        t?.fecha_completado ||
        t?.fecha ||
        t?.created_at ||
        t?.updated_at ||
        new Date().toISOString().split('T')[0],
      notas: t?.notas ? String(t.notas) : undefined,
      peso:
        t?.peso !== undefined && t?.peso !== null && t?.peso !== ''
          ? String(t.peso)
          : undefined,
      marcaje_mes:
        t?.marcaje_mes !== undefined && t?.marcaje_mes !== null && t?.marcaje_mes !== ''
          ? String(t.marcaje_mes).padStart(2, '0')
          : undefined,
      marcaje_anio:
        t?.marcaje_anio !== undefined && t?.marcaje_anio !== null && t?.marcaje_anio !== ''
          ? String(t.marcaje_anio)
          : undefined,
    };
  };

  const fetchCuido = async () => {
    try {
      const data = await api.get(`/cuido/${id}`);
      const actividadesMap = new Map<string, Actividad>();

      if (Array.isArray(data?.actividades)) {
        data.actividades.forEach((a: any) => {
          if (!a?.tipo || !a?.numero) return;

          const actividad: Actividad = {
            id: String(a?.id || a?._id || `${a.tipo}${a.numero}`),
            tipo: a.tipo,
            numero: Number(a.numero),
            tiempo_minutos:
              a?.tiempo_minutos !== undefined && a?.tiempo_minutos !== null
                ? Number(a.tiempo_minutos)
                : undefined,
            fecha:
              a?.fecha ||
              a?.fecha_completado ||
              a?.created_at ||
              data?.fecha_inicio ||
              new Date().toISOString().split('T')[0],
            notas: a?.notas ? String(a.notas) : undefined,
            peso:
              a?.peso !== undefined && a?.peso !== null && a?.peso !== ''
                ? String(a.peso)
                : undefined,
            marcaje_mes:
              a?.marcaje_mes !== undefined && a?.marcaje_mes !== null && a?.marcaje_mes !== ''
                ? String(a.marcaje_mes).padStart(2, '0')
                : undefined,
            marcaje_anio:
              a?.marcaje_anio !== undefined && a?.marcaje_anio !== null && a?.marcaje_anio !== ''
                ? String(a.marcaje_anio)
                : undefined,
          };

          actividadesMap.set(`${actividad.tipo}-${actividad.numero}`, actividad);
        });
      }

      if (data?.tope1_completado) {
        actividadesMap.set('tope-1', {
          id: 'tope1',
          tipo: 'tope',
          numero: 1,
          fecha: data?.tope1_fecha || data?.fecha_inicio || new Date().toISOString().split('T')[0],
          notas: data?.tope1_notas || undefined,
        });
      }

      if (data?.tope2_completado) {
        actividadesMap.set('tope-2', {
          id: 'tope2',
          tipo: 'tope',
          numero: 2,
          fecha: data?.tope2_fecha || data?.fecha_inicio || new Date().toISOString().split('T')[0],
          notas: data?.tope2_notas || undefined,
        });
      }

      if (Array.isArray(data?.trabajos)) {
        data.trabajos.forEach((t: any, index: number) => {
          const trabajo = normalizeTrabajo(t, index);
          if (!trabajo) return;
          actividadesMap.set(`trabajo-${trabajo.numero}`, trabajo);
        });
      }

      const actividades = Array.from(actividadesMap.values()).sort((a, b) => {
        if (a.tipo !== b.tipo) return a.tipo === 'tope' ? -1 : 1;
        return a.numero - b.numero;
      });

      setCuido({
        ...data,
        actividades,
      });
    } catch (error: any) {
      Alert.alert('Error', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchGallos = async () => {
    try {
      const data = await api.get('/aves', { tipo: 'gallo', estado: 'activo' });
      const gallosData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setGallos(gallosData);
    } catch (error) {
      console.error('Error fetching gallos:', error);
      setGallos([]);
    }
  };

  const handleCreateCuido = async () => {
    if (!selectedGallo) {
      Alert.alert('Error', 'Debes seleccionar un gallo');
      return;
    }

    setSaving(true);
    try {
      await api.post('/cuido', { ave_id: selectedGallo });
      Alert.alert('Éxito', 'Cuido creado correctamente');
      router.back();
    } catch (error: any) {
      if (isPremiumLimitError(error)) {
        openPremiumModalFromError(error);
      } else {
        Alert.alert('Error', extractErrorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCuido = () => {
    if (!cuido) return;

    Alert.alert(
      'Eliminar cuido',
      `¿Seguro que quieres eliminar el cuido de ${cuido.ave_codigo || 'esta ave'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await api.delete(`/cuido/${cuido.id}`);
              Alert.alert('Éxito', 'Cuido eliminado correctamente');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', extractErrorMessage(error));
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteTrabajo = (trabajo: Actividad) => {
    if (!cuido) return;

    Alert.alert(
      'Eliminar trabajo',
      `¿Seguro que quieres eliminar el Trabajo ${trabajo.numero}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const endpoints = [
                `/cuido/${cuido.id}/trabajo/${trabajo.numero}`,
                `/cuido/${cuido.id}/trabajo?trabajo_numero=${trabajo.numero}`,
              ];

              let deleted = false;
              let lastError: any = null;

              for (const endpoint of endpoints) {
                try {
                  await api.delete(endpoint);
                  deleted = true;
                  break;
                } catch (err) {
                  lastError = err;
                }
              }

              if (!deleted) {
                throw lastError || new Error('No se pudo eliminar el trabajo');
              }

              setCuido((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  actividades: prev.actividades.filter(
                    (a) => !(a.tipo === 'trabajo' && a.numero === trabajo.numero)
                  ),
                };
              });

              Alert.alert('Éxito', 'Trabajo eliminado correctamente');
            } catch (error: any) {
              Alert.alert('Error', extractErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  const resetAddModal = () => {
    Keyboard.dismiss();
    setShowAddModal(false);
    setActividadTipo(null);
    setActividadTiempo('');
    setActividadFecha(new Date().toISOString().split('T')[0]);
    setActividadNotas('');
    setActividadPeso('');
    setMarcajeMes(defaultMonth);
    setMarcajeAnio(defaultYear);
    setOpenPicker(null);
  };

  const handleAddActividad = async () => {
    if (!cuido || !actividadTipo) return;

    const topeCount = cuido.actividades.filter((a) => a.tipo === 'tope').length;
    const trabajoCount = cuido.actividades.filter((a) => a.tipo === 'trabajo').length;
    const numero = actividadTipo === 'tope' ? topeCount + 1 : trabajoCount + 1;

    if (actividadTipo === 'trabajo' && !actividadTiempo.trim()) {
      Alert.alert('Error', 'Ingresa el tiempo del trabajo');
      return;
    }

    if (actividadTipo === 'trabajo' && !actividadPeso.trim()) {
      Alert.alert('Error', 'Ingresa el peso del gallo');
      return;
    }

    try {
      if (actividadTipo === 'tope') {
        let url = `/cuido/${cuido.id}/tope?tope_numero=${numero}`;

        if (actividadNotas.trim()) {
          url += `&notas=${encodeURIComponent(actividadNotas.trim())}`;
        }

        if (actividadFecha) {
          url += `&fecha=${encodeURIComponent(actividadFecha)}`;
        }

        await api.post(url);

        const nuevoTope: Actividad = {
          id: `tope${numero}-${Date.now()}`,
          tipo: 'tope',
          numero,
          fecha: actividadFecha || new Date().toISOString().split('T')[0],
          notas: actividadNotas.trim() || undefined,
        };

        setCuido((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            actividades: [...prev.actividades, nuevoTope].sort((a, b) => {
              if (a.tipo !== b.tipo) return a.tipo === 'tope' ? -1 : 1;
              return a.numero - b.numero;
            }),
          };
        });
      } else {
        const tiempo = parseInt(actividadTiempo, 10);

        if (isNaN(tiempo) || tiempo <= 0) {
          Alert.alert('Error', 'Ingresa un tiempo válido');
          return;
        }

        let url = `/cuido/${cuido.id}/trabajo?trabajo_numero=${numero}&tiempo_minutos=${tiempo}`;

        if (actividadNotas.trim()) {
          url += `&notas=${encodeURIComponent(actividadNotas.trim())}`;
        }

        if (actividadPeso.trim()) {
          url += `&peso=${encodeURIComponent(actividadPeso.trim())}`;
        }

        if (marcajeMes) {
          url += `&marcaje_mes=${encodeURIComponent(String(marcajeMes).padStart(2, '0'))}`;
        }

        if (marcajeAnio) {
          url += `&marcaje_anio=${encodeURIComponent(marcajeAnio)}`;
        }

        if (actividadFecha) {
          url += `&fecha=${encodeURIComponent(actividadFecha)}`;
        }

        await api.post(url);

        const nuevoTrabajo: Actividad = {
          id: `trabajo${numero}-${Date.now()}`,
          tipo: 'trabajo',
          numero,
          tiempo_minutos: tiempo,
          fecha: actividadFecha || new Date().toISOString().split('T')[0],
          notas: actividadNotas.trim() || undefined,
          peso: actividadPeso.trim() || undefined,
          marcaje_mes: String(marcajeMes).padStart(2, '0'),
          marcaje_anio: marcajeAnio || undefined,
        };

        setCuido((prev) => {
          if (!prev) return prev;

          const filtradas = prev.actividades.filter(
            (a) => !(a.tipo === 'trabajo' && a.numero === numero)
          );

          return {
            ...prev,
            actividades: [...filtradas, nuevoTrabajo].sort((a, b) => {
              if (a.tipo !== b.tipo) return a.tipo === 'tope' ? -1 : 1;
              return a.numero - b.numero;
            }),
          };
        });
      }

      resetAddModal();

      Alert.alert(
        'Éxito',
        `${actividadTipo === 'tope' ? 'Tope' : 'Trabajo'} ${numero} registrado`
      );
    } catch (error: any) {
      if (isPremiumLimitError(error)) {
        openPremiumModalFromError(error);
      } else {
        Alert.alert('Error', extractErrorMessage(error));
      }
    }
  };

  const handleDescanso = async () => {
    if (!cuido || !diasDescanso) return;

    const dias = parseInt(diasDescanso, 10);
    if (isNaN(dias) || dias < 1 || dias > 30) {
      Alert.alert('Error', 'Los días deben ser entre 1 y 30');
      return;
    }

    try {
      await api.post(`/cuido/${cuido.id}/descanso?dias=${dias}`);
      await scheduleRestNotifications(dias);

      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + dias);

      setCuido((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          en_descanso: true,
          dias_descanso: dias,
          fecha_inicio_descanso: fechaInicio.toISOString(),
          fecha_fin_descanso: fechaFin.toISOString(),
        };
      });

      Keyboard.dismiss();
      setShowDescansoModal(false);
      setDiasDescanso('');
      Alert.alert('Éxito', `Descanso de ${dias} días iniciado`);
    } catch (error: any) {
      Alert.alert('Error', extractErrorMessage(error));
    }
  };

  const handleFinalizarDescanso = async () => {
    if (!cuido) return;

    try {
      await api.post(`/cuido/${cuido.id}/finalizar-descanso`);
      setCuido((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          en_descanso: false,
          dias_descanso: undefined,
          fecha_inicio_descanso: undefined,
          fecha_fin_descanso: undefined,
        };
      });
      Alert.alert('Éxito', 'Descanso finalizado');
    } catch (error: any) {
      Alert.alert('Error', extractErrorMessage(error));
    }
  };

  const handleFinalizar = () => {
    Alert.alert(
      'Finalizar Cuido',
      '¿Estás seguro de finalizar este cuido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            try {
              await api.post(`/cuido/${cuido?.id}/finalizar`);
              Alert.alert('Éxito', 'Cuido finalizado');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', extractErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatDateLong = (dateStr?: string) => {
    if (!dateStr) return 'N/D';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const topes = useMemo(
    () =>
      (cuido?.actividades || [])
        .filter((a) => a.tipo === 'tope')
        .sort((a, b) => a.numero - b.numero),
    [cuido]
  );

  const trabajos = useMemo(
    () =>
      (cuido?.actividades || [])
        .filter((a) => a.tipo === 'trabajo')
        .sort((a, b) => a.numero - b.numero),
    [cuido]
  );

  const latestTrabajo = useMemo(() => {
    if (!trabajos.length) return null;

    return [...trabajos].sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.numero - a.numero;
    })[0];
  }, [trabajos]);

  const latestPeso = latestTrabajo?.peso ? `${latestTrabajo.peso} Lb` : 'N/D';
  const latestMarcaje =
  latestTrabajo?.marcaje_mes && latestTrabajo?.marcaje_anio
    ? `M-${String(latestTrabajo.marcaje_mes).padStart(2, '0')}/${latestTrabajo.marcaje_anio}`
    : 'N/D';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (isNew) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Nuevo Cuido</Text>

          <TouchableOpacity
            onPress={handleCreateCuido}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveButtonText}>Crear</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Seleccionar Gallo</Text>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowGalloList(!showGalloList)}
          >
            <View style={styles.selectButtonContent}>
              <RoosterIcon size={24} color={COLORS.gold} />
              <Text style={styles.selectButtonText}>
                {selectedGallo
                  ? gallos.find((g) => g.id === selectedGallo)?.codigo || 'Seleccionado'
                  : 'Seleccionar gallo'}
              </Text>
            </View>

            <Ionicons
              name={showGalloList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>

          {showGalloList && (
            <View style={styles.selectList}>
              {gallos.length === 0 ? (
                <Text style={styles.noDataText}>No hay gallos activos</Text>
              ) : (
                gallos.map((gallo) => (
                  <TouchableOpacity
                    key={gallo.id}
                    style={[
                      styles.selectItem,
                      selectedGallo === gallo.id && styles.selectItemActive,
                    ]}
                    onPress={() => {
                      setSelectedGallo(gallo.id);
                      setShowGalloList(false);
                    }}
                  >
                    <View style={styles.galloItemContent}>
                      {gallo.foto_principal ? (
                        <Image source={{ uri: gallo.foto_principal }} style={styles.galloPhoto} />
                      ) : (
                        <View style={styles.galloPhotoPlaceholder}>
                          <RoosterIcon size={20} color={COLORS.textMuted} />
                        </View>
                      )}

                      <View style={styles.galloInfo}>
                        <Text style={styles.galloCodigo}>{gallo.codigo}</Text>
                        {gallo.nombre ? <Text style={styles.galloNombre}>{gallo.nombre}</Text> : null}
                      </View>
                    </View>

                    {selectedGallo === gallo.id && (
                      <Ionicons name="checkmark" size={20} color={COLORS.gold} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={COLORS.blue} />
            <Text style={styles.infoText}>
              Al crear un cuido podrás agregar topes, trabajos y períodos de descanso según las
              necesidades del gallo.
            </Text>
          </View>
        </ScrollView>

        <Modal
          visible={showPremiumModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPremiumModal(false)}
        >
          <View style={styles.premiumModalOverlay}>
            <View style={styles.premiumModal}>
              <View style={styles.premiumIconWrap}>
                <Ionicons name="lock-closed" size={30} color="#d4a017" />
              </View>

              <Text style={styles.premiumTitle}>{premiumModalTitle}</Text>
              <Text style={styles.premiumMessage}>{premiumModalMessage}</Text>

              <TouchableOpacity
                style={styles.premiumPrimaryButton}
                onPress={goToMembershipPlans}
              >
                <Text style={styles.premiumPrimaryButtonText}>Ver planes de membresía</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.premiumSecondaryButton}
                onPress={() => setShowPremiumModal(false)}
              >
                <Text style={styles.premiumSecondaryButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Cuido</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleDeleteCuido}
            disabled={deleting}
            style={styles.deleteButton}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={COLORS.red} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleFinalizar} style={styles.finalizarButton}>
            <Text style={styles.finalizarText}>Finalizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.galloCard}>
          {cuido?.ave_foto ? (
            <Image source={{ uri: cuido.ave_foto }} style={styles.galloDetailPhoto} />
          ) : (
            <View style={styles.galloDetailPhotoPlaceholder}>
              <RoosterIcon size={40} color={COLORS.gold} />
            </View>
          )}

          <View style={styles.galloDetailInfo}>
            <Text style={styles.galloDetailCodigo}>{cuido?.ave_codigo}</Text>
            {cuido?.ave_nombre ? <Text style={styles.galloDetailNombre}>{cuido.ave_nombre}</Text> : null}

            <View style={styles.galloDetailTags}>
              {cuido?.ave_color ? <Text style={styles.galloDetailTag}>{cuido.ave_color}</Text> : null}
              {cuido?.ave_linea ? <Text style={styles.galloDetailTag}>{cuido.ave_linea}</Text> : null}
            </View>

            <View style={styles.resumenMetricRow}>
              <View style={styles.resumenMetricBox}>
                <Text style={styles.resumenMetricLabel}>Peso actual</Text>
                <Text style={styles.resumenMetricValue}>{latestPeso}</Text>
              </View>

              <View style={styles.resumenMetricBox}>
                <Text style={styles.resumenMetricLabel}>M</Text>
                <Text style={styles.resumenMetricValue}>{latestMarcaje}</Text>
              </View>
            </View>
          </View>

          {cuido?.en_descanso ? (
            <View style={styles.descansoIndicator}>
              <Ionicons name="bed" size={20} color={COLORS.blue} />
              <Text style={styles.descansoIndicatorText}>Descansando</Text>
            </View>
          ) : null}
        </View>

        {cuido?.en_descanso ? (
          <View style={styles.descansoCard}>
            <View style={styles.descansoHeader}>
              <Ionicons name="bed" size={24} color={COLORS.blue} />
              <Text style={styles.descansoTitle}>Período de Descanso</Text>
            </View>

            <Text style={styles.descansoInfo}>{cuido.dias_descanso || 0} días de descanso</Text>
            <Text style={styles.descansoFecha}>Finaliza: {formatDateLong(cuido.fecha_fin_descanso)}</Text>

            <TouchableOpacity
              style={styles.finalizarDescansoButton}
              onPress={handleFinalizarDescanso}
            >
              <Text style={styles.finalizarDescansoText}>Terminar Descanso</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Topes ({topes.length})</Text>

          {!cuido?.en_descanso ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setActividadTipo('tope');
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={22} color={COLORS.gold} />
            </TouchableOpacity>
          ) : null}
        </View>

        {topes.length === 0 ? (
          <View style={styles.emptyActividad}>
            <Ionicons name="flash-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyActividadText}>Sin topes registrados</Text>
            <Text style={styles.emptyActividadHint}>Presiona + para agregar</Text>
          </View>
        ) : (
          <View style={styles.actividadesGrid}>
            {topes.map((tope) => (
              <TouchableOpacity
                key={tope.id}
                style={styles.actividadCard}
                onPress={() => {
                  setSelectedActividad(tope);
                  setShowDetalleModal(true);
                }}
              >
                <View style={styles.actividadIconCompleted}>
                  <Ionicons name="flash" size={18} color="#000" />
                </View>

                <Text style={styles.actividadLabel}>Tope {tope.numero}</Text>
                <Text style={styles.actividadFecha}>{formatDate(tope.fecha)}</Text>

                {tope.notas ? (
                  <View style={styles.actividadNotasIndicator}>
                    <Ionicons name="document-text" size={12} color={COLORS.greenDark} />
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trabajos ({trabajos.length})</Text>

          {!cuido?.en_descanso ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setActividadTipo('trabajo');
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={22} color={COLORS.gold} />
            </TouchableOpacity>
          ) : null}
        </View>

        {trabajos.length === 0 ? (
          <View style={styles.emptyActividad}>
            <Ionicons name="barbell-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyActividadText}>Sin trabajos registrados</Text>
            <Text style={styles.emptyActividadHint}>Presiona + para agregar</Text>
          </View>
        ) : (
          <View style={styles.actividadesGrid}>
            {trabajos.map((trabajo) => (
              <View key={trabajo.id} style={styles.actividadCardWide}>
                <TouchableOpacity
                  style={styles.trabajoDeleteButton}
                  onPress={() => handleDeleteTrabajo(trabajo)}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.red} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.trabajoPressArea}
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedActividad(trabajo);
                    setShowDetalleModal(true);
                  }}
                >
                  <View style={styles.actividadIconCompleted}>
                    <Ionicons name="barbell" size={18} color="#000" />
                  </View>

                  <Text style={styles.actividadLabel}>Trabajo {trabajo.numero}</Text>

                  {trabajo.tiempo_minutos ? (
                    <Text style={styles.actividadTiempo}>{trabajo.tiempo_minutos} min</Text>
                  ) : null}

                  <View style={styles.trabajoCompactInfoRow}>
                    <View style={styles.trabajoCompactPill}>
                      <Text style={styles.trabajoCompactLabel}>Peso</Text>
                      <Text style={styles.trabajoCompactValue}>
                        {trabajo.peso ? `${trabajo.peso} Lb` : 'N/D'}
                      </Text>
                    </View>

                    <View style={styles.trabajoCompactPill}>
  <Text style={styles.trabajoCompactLabel}>M</Text>
  <Text style={styles.trabajoCompactValue}>
    {trabajo.marcaje_mes && trabajo.marcaje_anio
      ? `M-${String(trabajo.marcaje_mes).padStart(2, '0')}/${trabajo.marcaje_anio}`
      : 'N/D'}
  </Text>
</View>
                  </View>

                  <Text style={styles.actividadFecha}>{formatDate(trabajo.fecha)}</Text>

                  {trabajo.notas ? (
                    <View style={styles.actividadNotasIndicator}>
                      <Ionicons name="document-text" size={12} color={COLORS.greenDark} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {!cuido?.en_descanso ? (
          <>
            <Text style={[styles.sectionTitle, styles.descansoSectionTitle]}>Descanso</Text>

            <TouchableOpacity
              style={styles.descansoButton}
              onPress={() => setShowDescansoModal(true)}
            >
              <Ionicons name="bed" size={24} color={COLORS.blue} />
              <Text style={styles.descansoButtonText}>Iniciar Período de Descanso</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={resetAddModal}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            setOpenPicker(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCompact}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  <View style={styles.modalTopRow}>
                    <Text style={styles.modalTitle}>
                      Agregar {actividadTipo === 'tope' ? 'Tope' : 'Trabajo'}
                    </Text>

                    <TouchableOpacity onPress={resetAddModal} style={styles.modalCloseIcon}>
                      <Ionicons name="close" size={20} color={COLORS.black} />
                    </TouchableOpacity>
                  </View>

                  {actividadTipo === 'trabajo' ? (
                    <>
                      <Text style={styles.modalLabel}>Tiempo (minutos)</Text>

                      <TextInput
                        style={styles.modalInput}
                        value={actividadTiempo}
                        onChangeText={setActividadTiempo}
                        keyboardType="numeric"
                        placeholder="Ej: 05, 10, 15"
                        placeholderTextColor={COLORS.textMuted}
                        returnKeyType="done"
                        blurOnSubmit
                      />

                      <View style={styles.quickButtonsRow}>
                        {[10, 15, 20, 30, 45].map((min) => {
                          const active = actividadTiempo === String(min);

                          return (
                            <TouchableOpacity
                              key={min}
                              style={[styles.quickButton, active && styles.quickButtonActive]}
                              onPress={() => {
                                Keyboard.dismiss();
                                setActividadTiempo(String(min));
                              }}
                            >
                              <Text
                                style={[
                                  styles.quickButtonText,
                                  active && styles.quickButtonTextActive,
                                ]}
                              >
                                {min}m
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={styles.compactStatsRow}>
                        <View style={styles.compactPesoBox}>
                          <Text style={styles.inlineFieldLabel}>Peso</Text>

                          <View style={styles.compactInputValueRow}>
                            <TextInput
                              style={styles.compactInput}
                              value={actividadPeso}
                              onChangeText={(text) => setActividadPeso(formatPesoInput(text))}
                              placeholder="3.1.7"
                              placeholderTextColor={COLORS.textMuted}
                              keyboardType="numeric"
                              returnKeyType="done"
                              blurOnSubmit
                            />
                            <Text style={styles.compactSuffix}>Lb</Text>
                          </View>
                        </View>

                        <View style={styles.compactMarcajeBox}>
                          <Text style={styles.inlineFieldLabel}>M</Text>

                          <View style={styles.marcajeCompactRow}>
                            <View style={styles.marcajeFieldWrap}>
                              <TouchableOpacity
                                style={styles.selectorFieldMonth}
                                onPress={() => {
                                  Keyboard.dismiss();
                                  setOpenPicker(openPicker === 'mes' ? null : 'mes');
                                }}
                                activeOpacity={0.85}
                              >
                                <Text style={styles.selectorFieldText}>M-{marcajeMes}</Text>
                                <Ionicons name="chevron-down" size={15} color={COLORS.textMuted} />
                              </TouchableOpacity>

                              {openPicker === 'mes' ? (
                                <View style={styles.dropdownListMonth}>
                                  <ScrollView
                                    nestedScrollEnabled
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                  >
                                    {availableMonths.map((value) => (
                                      <TouchableOpacity
                                        key={value}
                                        style={[
                                          styles.dropdownItem,
                                          marcajeMes === value && styles.dropdownItemActive,
                                        ]}
                                        onPress={() => {
                                          setMarcajeMes(value);
                                          setOpenPicker(null);
                                        }}
                                      >
                                        <Text
                                          style={[
                                            styles.dropdownItemText,
                                            marcajeMes === value && styles.dropdownItemTextActive,
                                          ]}
                                        >
                                          M-{value}
                                        </Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                </View>
                              ) : null}
                            </View>

                            <Text style={styles.marcajeSlash}>/</Text>

                            <View style={styles.marcajeFieldWrapYear}>
                              <TouchableOpacity
                                style={styles.selectorFieldYear}
                                onPress={() => {
                                  Keyboard.dismiss();
                                  setOpenPicker(openPicker === 'anio' ? null : 'anio');
                                }}
                                activeOpacity={0.85}
                              >
                                <Text style={styles.selectorFieldText}>{marcajeAnio}</Text>
                                <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                              </TouchableOpacity>

                              {openPicker === 'anio' ? (
                                <View style={styles.dropdownListYear}>
                                  <ScrollView
                                    nestedScrollEnabled
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                  >
                                    {availableYears.map((value) => (
                                      <TouchableOpacity
                                        key={value}
                                        style={[
                                          styles.dropdownItem,
                                          marcajeAnio === value && styles.dropdownItemActive,
                                        ]}
                                        onPress={() => {
                                          setMarcajeAnio(value);
                                          setOpenPicker(null);
                                        }}
                                      >
                                        <Text
                                          style={[
                                            styles.dropdownItemText,
                                            marcajeAnio === value && styles.dropdownItemTextActive,
                                          ]}
                                        >
                                          {value}
                                        </Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      </View>
                    </>
                  ) : null}

                  <DatePickerField
                    label="Fecha"
                    value={actividadFecha}
                    onChange={setActividadFecha}
                    placeholder="Seleccionar fecha"
                  />

                  <Text style={styles.modalLabel}>Notas (opcional)</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputMultilineCompact]}
                    value={actividadNotas}
                    onChangeText={setActividadNotas}
                    placeholder="Observaciones..."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalCancelButton} onPress={resetAddModal}>
                      <Text style={styles.modalCancelText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modalConfirmButton} onPress={handleAddActividad}>
                      <Text style={styles.modalConfirmText}>Agregar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showDescansoModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowDescansoModal(false);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCompact}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  <View style={styles.modalTopRow}>
                    <Text style={styles.modalTitle}>Iniciar Descanso</Text>

                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowDescansoModal(false);
                        setDiasDescanso('');
                      }}
                      style={styles.modalCloseIcon}
                    >
                      <Ionicons name="close" size={20} color={COLORS.black} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalLabel}>Días de descanso (1-30)</Text>

                  <TextInput
                    style={styles.modalInput}
                    value={diasDescanso}
                    onChangeText={setDiasDescanso}
                    keyboardType="numeric"
                    placeholder="Ej: 5, 10, 15"
                    placeholderTextColor={COLORS.textMuted}
                    returnKeyType="done"
                    blurOnSubmit
                  />

                  <View style={styles.quickButtonsRow}>
                    {[5, 7, 10, 14, 21].map((dias) => {
                      const active = diasDescanso === String(dias);

                      return (
                        <TouchableOpacity
                          key={dias}
                          style={[styles.quickButton, active && styles.quickButtonActive]}
                          onPress={() => {
                            Keyboard.dismiss();
                            setDiasDescanso(String(dias));
                          }}
                        >
                          <Text
                            style={[
                              styles.quickButtonText,
                              active && styles.quickButtonTextActive,
                            ]}
                          >
                            {dias}d
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={styles.notificacionHint}>
                    Se enviará una notificación 24 horas antes y otra 12 horas antes de finalizar
                    el descanso.
                  </Text>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowDescansoModal(false);
                        setDiasDescanso('');
                      }}
                    >
                      <Text style={styles.modalCancelText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modalConfirmButton} onPress={handleDescanso}>
                      <Text style={styles.modalConfirmText}>Iniciar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showDetalleModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDetalleModal(false);
          setSelectedActividad(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detalleModal}>
            {selectedActividad ? (
              <>
                <View style={styles.detalleHeader}>
                  <View
                    style={[
                      styles.detalleIconContainer,
                      selectedActividad.tipo === 'tope'
                        ? { backgroundColor: COLORS.goldLight }
                        : { backgroundColor: COLORS.greenLight },
                    ]}
                  >
                    <Ionicons
                      name={selectedActividad.tipo === 'tope' ? 'flash' : 'barbell'}
                      size={30}
                      color={selectedActividad.tipo === 'tope' ? COLORS.gold : COLORS.greenDark}
                    />
                  </View>

                  <Text style={styles.detalleTitle}>
                    {selectedActividad.tipo === 'tope' ? 'Tope' : 'Trabajo'} {selectedActividad.numero}
                  </Text>
                </View>

                <View style={styles.detalleInfoRow}>
                  <View style={styles.detalleInfoItem}>
                    <Ionicons name="calendar" size={18} color={COLORS.textMuted} />
                    <Text style={styles.detalleInfoLabel}>Fecha</Text>
                    <Text style={styles.detalleInfoValue}>{formatDateLong(selectedActividad.fecha)}</Text>
                  </View>

                  {selectedActividad.tiempo_minutos ? (
                    <View style={styles.detalleInfoItem}>
                      <Ionicons name="time" size={18} color={COLORS.textMuted} />
                      <Text style={styles.detalleInfoLabel}>Duración</Text>
                      <Text style={styles.detalleInfoValue}>
                        {selectedActividad.tiempo_minutos} minutos
                      </Text>
                    </View>
                  ) : null}
                </View>

                {selectedActividad.tipo === 'trabajo' ? (
                  <View style={styles.detalleMetricRow}>
                    <View style={styles.detalleMetricCard}>
                      <Text style={styles.detalleMetricTitle}>Peso</Text>
                      <Text style={styles.detalleMetricValue}>
                        {selectedActividad.peso ? `${selectedActividad.peso} Lb` : 'N/D'}
                      </Text>
                    </View>

                    <View style={styles.detalleMetricCard}>
                      <Text style={styles.detalleMetricTitle}>M</Text>
                      <Text style={styles.detalleMetricValue}>
                      {selectedActividad.marcaje_mes && selectedActividad.marcaje_anio
                    ? `M-${String(selectedActividad.marcaje_mes).padStart(2, '0')}/${selectedActividad.marcaje_anio}`
                     : 'N/D'}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {selectedActividad.notas ? (
                  <View style={styles.detalleNotasContainer}>
                    <View style={styles.detalleNotasHeader}>
                      <Ionicons name="document-text" size={18} color={COLORS.gold} />
                      <Text style={styles.detalleNotasLabel}>Descripción / Notas</Text>
                    </View>
                    <Text style={styles.detalleNotasText}>{selectedActividad.notas}</Text>
                  </View>
                ) : (
                  <View style={styles.detalleNotasEmpty}>
                    <Ionicons name="document-text-outline" size={24} color={COLORS.textMuted} />
                    <Text style={styles.detalleNotasEmptyText}>Sin notas registradas</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.detalleCerrarButton}
                  onPress={() => {
                    setShowDetalleModal(false);
                    setSelectedActividad(null);
                  }}
                >
                  <Text style={styles.detalleCerrarText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPremiumModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={styles.premiumModalOverlay}>
          <View style={styles.premiumModal}>
            <View style={styles.premiumIconWrap}>
              <Ionicons name="lock-closed" size={30} color="#d4a017" />
            </View>

            <Text style={styles.premiumTitle}>{premiumModalTitle}</Text>
            <Text style={styles.premiumMessage}>{premiumModalMessage}</Text>

            <TouchableOpacity
              style={styles.premiumPrimaryButton}
              onPress={goToMembershipPlans}
            >
              <Text style={styles.premiumPrimaryButtonText}>Ver planes de membresía</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.premiumSecondaryButton}
              onPress={() => setShowPremiumModal(false)}
            >
              <Text style={styles.premiumSecondaryButtonText}>Cerrar</Text>
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
    backgroundColor: COLORS.white,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },

  saveButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },

  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 26, 26, 0.18)',
    marginRight: 6,
  },

  finalizarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  finalizarText: {
    fontSize: 14,
    color: COLORS.red,
    fontWeight: '700',
  },

  content: {
    flex: 1,
    padding: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },

  descansoSectionTitle: {
    marginTop: 24,
    marginBottom: 12,
  },

  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },

  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectButtonText: {
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
  },

  selectList: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 300,
    overflow: 'hidden',
  },

  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  selectItemActive: {
    backgroundColor: COLORS.goldLight,
  },

  galloItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  galloPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  galloPhotoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  galloInfo: {
    marginLeft: 12,
  },

  galloCodigo: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },

  galloNombre: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  noDataText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: 16,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.blueLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginLeft: 12,
  },

  galloCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  galloDetailPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },

  galloDetailPhotoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  galloDetailInfo: {
    flex: 1,
    marginLeft: 14,
  },

  galloDetailCodigo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.black,
  },

  galloDetailNombre: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  galloDetailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },

  galloDetailTag: {
    fontSize: 12,
    color: COLORS.textMuted,
    backgroundColor: COLORS.soft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
  },

  resumenMetricRow: {
    flexDirection: 'row',
    marginTop: 10,
  },

  resumenMetricBox: {
    flex: 1,
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginRight: 8,
  },

  resumenMetricLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },

  resumenMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.black,
  },

  descansoIndicator: {
    alignItems: 'center',
    backgroundColor: COLORS.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
  },

  descansoIndicatorText: {
    fontSize: 11,
    color: COLORS.blue,
    marginTop: 4,
    fontWeight: '600',
  },

  descansoCard: {
    backgroundColor: COLORS.blueLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  descansoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  descansoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.blue,
    marginLeft: 8,
  },

  descansoInfo: {
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 4,
  },

  descansoFecha: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  finalizarDescansoButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },

  finalizarDescansoText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  actividadesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  actividadCard: {
    width: '31%',
    backgroundColor: COLORS.greenLight,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
    marginBottom: 10,
    position: 'relative',
  },

  actividadCardWide: {
    width: '48%',
    backgroundColor: COLORS.greenLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
    marginBottom: 8,
    position: 'relative',
    overflow: 'visible',
  },

  trabajoPressArea: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },

  trabajoDeleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(139, 26, 26, 0.12)',
    zIndex: 10,
  },

  actividadIconCompleted: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  actividadLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
  },

  actividadTiempo: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 6,
  },

  actividadFecha: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },

  actividadNotasIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },

  emptyActividad: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  emptyActividadText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 10,
  },

  emptyActividadHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  trabajoCompactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
  },

  trabajoCompactPill: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 3,
    alignItems: 'center',
  },

  trabajoCompactLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 2,
    fontWeight: '600',
  },

  trabajoCompactValue: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: '800',
  },

  descansoButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  descansoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
    marginLeft: 10,
  },

  bottomSpace: {
    height: 30,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  modalCompact: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    maxHeight: '88%',
    overflow: 'hidden',
  },

  modalScrollContent: {
    padding: 16,
  },

  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
  },

  modalCloseIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.soft,
  },

  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    marginTop: 6,
  },

  modalInput: {
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.black,
  },

  modalInputMultilineCompact: {
    minHeight: 84,
    paddingTop: 12,
  },

  quickButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 6,
  },

  quickButton: {
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },

  quickButtonActive: {
    backgroundColor: COLORS.goldLight,
    borderColor: COLORS.gold,
  },

  quickButtonText: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: '600',
  },

  quickButtonTextActive: {
    color: COLORS.black,
    fontWeight: '800',
  },

  compactStatsRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 8,
  },

  compactPesoBox: {
    flex: 1,
    marginRight: 8,
  },

  compactMarcajeBox: {
    flex: 1.15,
  },

  inlineFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
  },

  compactInputValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },

  compactInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    paddingVertical: 10,
  },

  compactSuffix: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginLeft: 6,
  },

  marcajeCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  marcajeFieldWrap: {
    flex: 1,
    position: 'relative',
    zIndex: 20,
  },

  marcajeFieldWrapYear: {
    flex: 1,
    position: 'relative',
    zIndex: 20,
  },

  selectorFieldMonth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    minHeight: 48,
  },

  selectorFieldYear: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    minHeight: 48,
  },

  selectorFieldText: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: '700',
  },

  marcajeSlash: {
    marginHorizontal: 8,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMuted,
  },

  dropdownListMonth: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 180,
    overflow: 'hidden',
    zIndex: 30,
    elevation: 6,
  },

  dropdownListYear: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 180,
    overflow: 'hidden',
    zIndex: 30,
    elevation: 6,
  },

  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  dropdownItemActive: {
    backgroundColor: COLORS.goldLight,
  },

  dropdownItemText: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: '600',
  },

  dropdownItemTextActive: {
    fontWeight: '800',
  },

  modalButtons: {
    flexDirection: 'row',
    marginTop: 18,
  },

  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.soft,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginRight: 8,
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },

  modalConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginLeft: 8,
  },

  modalConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },

  notificacionHint: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    marginTop: 6,
  },

  detalleModal: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 18,
  },

  detalleHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },

  detalleIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  detalleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
  },

  detalleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  detalleInfoItem: {
    flex: 1,
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 4,
  },

  detalleInfoLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 4,
    fontWeight: '700',
  },

  detalleInfoValue: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: '700',
  },

  detalleMetricRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  detalleMetricCard: {
    flex: 1,
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
  },

  detalleMetricTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: '700',
  },

  detalleMetricValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '800',
  },

  detalleNotasContainer: {
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },

  detalleNotasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  detalleNotasLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
    marginLeft: 8,
  },

  detalleNotasText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 21,
  },

  detalleNotasEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  detalleNotasEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '600',
  },

  detalleCerrarButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },

  detalleCerrarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },

  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  premiumModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  premiumIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 160, 23, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
  },
  premiumMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 22,
  },
  premiumPrimaryButton: {
    width: '100%',
    backgroundColor: '#d4a017',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumPrimaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  premiumSecondaryButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  premiumSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555555',
  },
});
