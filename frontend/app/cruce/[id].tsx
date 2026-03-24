import React, { useEffect, useMemo, useState } from 'react';
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
  Image,
  Switch,
  GestureResponderEvent,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { DatePickerField } from '../../src/components/DatePickerField';

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  tipo: string;
  foto?: string;
  imagen?: string;
  image_url?: string;
  castado_por?: string;
}

interface Criador {
  id: string;
  nombre?: string;
  nombre_completo?: string;
  alias?: string;
  name?: string;
  full_name?: string;
}

interface Consanguinidad {
  porcentaje_estimado: number;
  nivel: string;
  ancestros_comunes: Array<{
    id: string;
    codigo: string;
    nombre?: string;
    closest_generation: number;
  }>;
  total_comunes: number;
}

type MarcaTipo = 'pie_izquierdo' | 'pie_derecho' | 'nariz' | 'marca_casera' | '';
type MarcaLado = 'izquierda' | 'derecha' | '';

const pieIzquierdoImg = require('../../assets/images/pie_izquierdo.png');
const pieDerechoImg = require('../../assets/images/pie_derecho.png');
const narizImg = require('../../assets/images/nariz.png');

const CASERA_COLORS = [
  '#ffffff',
  '#111111',
  '#6b7280',
  '#7c2d12',
  '#ea580c',
  '#f59e0b',
  '#dc2626',
  '#ec4899',
  '#7c3aed',
  '#2563eb',
  '#16a34a',
  '#92400e',
];

const MARCA_DOT_COLOR = '#b9b9b9';

export default function CruceFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';

  const MEMBERSHIP_PLANS_ROUTE = '/planes';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [gallos, setGallos] = useState<Ave[]>([]);
  const [gallinas, setGallinas] = useState<Ave[]>([]);
  const [criadores, setCriadores] = useState<Criador[]>([]);

  const [showCriadorList, setShowCriadorList] = useState(false);
  const [showNuevoCriadorInput, setShowNuevoCriadorInput] = useState(false);
  const [nuevoCriadorNombre, setNuevoCriadorNombre] = useState('');

  const [showPadreList, setShowPadreList] = useState(false);
  const [showMadreList, setShowMadreList] = useState(false);
  const [showPadreExterno, setShowPadreExterno] = useState(false);
  const [showMadreExterno, setShowMadreExterno] = useState(false);

  const [padreGalleria, setPadreGalleria] = useState('');
  const [madreGalleria, setMadreGalleria] = useState('');

  const [consanguinidad, setConsanguinidad] = useState<Consanguinidad | null>(null);
  const [calculatingConsang, setCalculatingConsang] = useState(false);

  const [sinMarca, setSinMarca] = useState(false);
  const [marcaNacimiento, setMarcaNacimiento] = useState<MarcaTipo>('');
  const [marcaPosicion, setMarcaPosicion] = useState<MarcaLado>('');
  const [marcaColor, setMarcaColor] = useState<string>('#dc2626');
  const [showCaseraColors, setShowCaseraColors] = useState(false);

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalTitle, setPremiumModalTitle] = useState('Límite alcanzado');
  const [premiumModalMessage, setPremiumModalMessage] = useState(
    'Has alcanzado el límite de tu plan. Ve a Planes de membresía para continuar.'
  );

  const [formData, setFormData] = useState({
    padre_id: '',
    madre_id: '',
    padre_externo: '',
    madre_externo: '',
    criador_id: '',
    cantidad_huevos_pollitos: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    estado: 'planeado',
  });

  useEffect(() => {
    loadInitialData();
  }, [id]);

  useEffect(() => {
    if (formData.padre_id && formData.madre_id) {
      calculateConsanguinidad();
    } else {
      setConsanguinidad(null);
    }
  }, [formData.padre_id, formData.madre_id]);

  const padreSeleccionado = useMemo(
    () => gallos.find((g) => g.id === formData.padre_id),
    [gallos, formData.padre_id]
  );

  const madreSeleccionada = useMemo(
    () => gallinas.find((g) => g.id === formData.madre_id),
    [gallinas, formData.madre_id]
  );

  const criadorSeleccionado = useMemo(
    () => criadores.find((c) => c.id === formData.criador_id),
    [criadores, formData.criador_id]
  );

  const extractErrorMessage = (error: any) => {
    return (
      error?.response?.data?.detail?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Ocurrió un error'
    );
  };

  const isPremiumLimitError = (error: any) => {
    const code =
      error?.response?.data?.detail?.code ||
      error?.response?.data?.code ||
      error?.code;

    const message = String(
      error?.response?.data?.detail?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        ''
    ).toLowerCase();

    return (
      code === 'PREMIUM_REQUIRED' ||
      code === 'FREE_PLAN_LIMIT_REACHED' ||
      code === 'TRIAL_EXPIRED' ||
      code === 'PLAN_REQUIRED' ||
      message.includes('premium') ||
      message.includes('membres') ||
      message.includes('trial') ||
      message.includes('prueba gratis') ||
      message.includes('límite') ||
      message.includes('limite') ||
      message.includes('plan requerido')
    );
  };

  const openPremiumModalFromError = (error: any) => {
    const title =
      error?.response?.data?.detail?.title ||
      error?.response?.data?.title ||
      'Límite alcanzado';

    const message =
      error?.response?.data?.detail?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      'Has alcanzado el límite de tu plan. Ve a Planes de membresía para continuar.';

    setPremiumModalTitle(title);
    setPremiumModalMessage(message);
    setShowPremiumModal(true);
  };

  const goToMembershipPlans = () => {
    setShowPremiumModal(false);
    router.push(MEMBERSHIP_PLANS_ROUTE as any);
  };

  const getCriadorDisplayName = (item?: Criador) => {
    if (!item) return 'Seleccionar criador / castador';
    return (
      item.nombre ||
      item.nombre_completo ||
      item.alias ||
      item.name ||
      item.full_name ||
      'Seleccionar criador / castador'
    );
  };

  const normalizeCriadores = (data: any[]): Criador[] => {
    return data
      .map((item: any) => ({
        id: String(item?.id || item?._id || item?.uuid || ''),
        nombre:
          item?.nombre ||
          item?.nombre_completo ||
          item?.alias ||
          item?.name ||
          item?.full_name ||
          'Sin nombre',
        nombre_completo: item?.nombre_completo || item?.full_name || item?.nombre || '',
        alias: item?.alias || '',
        name: item?.name || '',
        full_name: item?.full_name || '',
      }))
      .filter((c: Criador) => c.id);
  };

  const buildCriadoresFromAves = (avesArray: Ave[]): Criador[] => {
    const seen = new Set<string>();
    const result: Criador[] = [];

    for (const ave of avesArray) {
      const nombre = (ave.castado_por || '').trim();
      if (!nombre) continue;

      const key = nombre.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      result.push({
        id: `castado_por_${key.replace(/\s+/g, '_')}`,
        nombre,
      });
    }

    return result.sort((a, b) =>
      getCriadorDisplayName(a).localeCompare(getCriadorDisplayName(b), 'es', {
        sensitivity: 'base',
      })
    );
  };

  const fetchAves = async (): Promise<Ave[]> => {
    try {
      const aves = await api.get('/aves');
      const avesArray: Ave[] = Array.isArray(aves)
        ? aves
        : Array.isArray(aves?.data)
          ? aves.data
          : [];

      setGallos(avesArray.filter((a: Ave) => a.tipo === 'gallo'));
      setGallinas(avesArray.filter((a: Ave) => a.tipo === 'gallina'));
      return avesArray;
    } catch (error) {
      console.error('Error fetching aves:', error);
      setGallos([]);
      setGallinas([]);
      return [];
    }
  };

  const fetchCriadores = async (avesArray: Ave[]) => {
    try {
      let raw: any = null;

      try {
        raw = await api.get('/criadores');
      } catch {
        try {
          raw = await api.get('/castadores');
        } catch {
          try {
            raw = await api.get('/criador');
          } catch {
            try {
              raw = await api.get('/castador');
            } catch {
              raw = [];
            }
          }
        }
      }

      const endpointData = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.items)
            ? raw.items
            : Array.isArray(raw?.results)
              ? raw.results
              : [];

      const normalizedFromEndpoint = normalizeCriadores(endpointData);
      const normalizedFromAves = buildCriadoresFromAves(avesArray);

      const mergedMap = new Map<string, Criador>();

      for (const item of normalizedFromEndpoint) {
        mergedMap.set(item.id, item);
      }

      for (const item of normalizedFromAves) {
        const existingByName = Array.from(mergedMap.values()).find(
          (x) =>
            getCriadorDisplayName(x).trim().toLowerCase() ===
            getCriadorDisplayName(item).trim().toLowerCase()
        );

        if (!existingByName) {
          mergedMap.set(item.id, item);
        }
      }

      const finalList = Array.from(mergedMap.values()).sort((a, b) =>
        getCriadorDisplayName(a).localeCompare(getCriadorDisplayName(b), 'es', {
          sensitivity: 'base',
        })
      );

      setCriadores(finalList);
    } catch (error) {
      console.error('Error fetching criadores/castadores:', error);
      setCriadores(buildCriadoresFromAves(avesArray));
    }
  };

  const loadInitialData = async () => {
    const avesArray = await fetchAves();
    await fetchCriadores(avesArray);

    if (isEdit) {
      await fetchCruce();
    }
  };

  const fetchCruce = async () => {
    setLoading(true);
    try {
      const cruce: any = await api.get(`/cruces/${id}`);

      setFormData({
        padre_id: cruce?.padre_id || '',
        madre_id: cruce?.madre_id || '',
        padre_externo: cruce?.padre_externo || '',
        madre_externo: cruce?.madre_externo || '',
        criador_id: cruce?.criador_id || cruce?.castador_id || '',
        cantidad_huevos_pollitos: String(
          cruce?.cantidad_huevos_pollitos ??
            cruce?.cantidad_registrada ??
            cruce?.cantidad_huevos ??
            cruce?.cantidad_pollitos ??
            ''
        ),
        fecha: cruce?.fecha || '',
        notas: cruce?.notas || cruce?.objetivo || '',
        estado: cruce?.estado || 'planeado',
      });

      if (cruce?.padre_externo) {
        const match = cruce.padre_externo.match(/^(.*?)\s*\((.*?)\)\s*$/);
        if (match) setPadreGalleria(match[2]);
      }

      if (cruce?.madre_externo) {
        const match = cruce.madre_externo.match(/^(.*?)\s*\((.*?)\)\s*$/);
        if (match) setMadreGalleria(match[2]);
      }

      if (
        cruce?.marca_nacimiento === 'pie_izquierdo' ||
        cruce?.marca_nacimiento === 'pie_derecho' ||
        cruce?.marca_nacimiento === 'nariz' ||
        cruce?.marca_nacimiento === 'marca_casera'
      ) {
        setMarcaNacimiento(cruce.marca_nacimiento);
      }

      if (cruce?.sin_marca) {
        setSinMarca(true);
      }

      if (cruce?.marca_lado === 'izquierda' || cruce?.marca_lado === 'derecha') {
        setMarcaPosicion(cruce.marca_lado);
      }

      if (typeof cruce?.marca_color === 'string' && cruce.marca_color.trim()) {
        setMarcaColor(cruce.marca_color);
      }
    } catch (error: any) {
      Alert.alert('Error', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const calculateConsanguinidad = async () => {
    setCalculatingConsang(true);
    try {
      const result = await api.get('/consanguinidad', {
        padre_id: formData.padre_id,
        madre_id: formData.madre_id,
      });
      setConsanguinidad(result);
    } catch (error) {
      console.error('Error calculating consanguinidad:', error);
    } finally {
      setCalculatingConsang(false);
    }
  };

  const getConsangColor = (nivel: string) => {
    switch (nivel) {
      case 'bajo':
        return '#16a34a';
      case 'medio':
        return '#f59e0b';
      case 'alto':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatAveLabel = (ave?: Ave) => {
    if (!ave) return 'Seleccionado';
    return ave.nombre ? `${ave.codigo} - ${ave.nombre}` : ave.codigo;
  };

  const clearPadre = () => {
    setFormData((prev) => ({
      ...prev,
      padre_id: '',
      padre_externo: '',
    }));
    setPadreGalleria('');
    setShowPadreList(false);
    setShowPadreExterno(false);
  };

  const clearMadre = () => {
    setFormData((prev) => ({
      ...prev,
      madre_id: '',
      madre_externo: '',
    }));
    setMadreGalleria('');
    setShowMadreList(false);
    setShowMadreExterno(false);
  };

  const toggleParentMenu = (type: 'padre' | 'madre') => {
    if (type === 'padre') {
      const willOpen = !showPadreList;
      setShowPadreList(willOpen);
      setShowPadreExterno(false);
      setShowMadreList(false);
      setShowMadreExterno(false);
      setShowCriadorList(false);
      setShowNuevoCriadorInput(false);
      setNuevoCriadorNombre('');
    } else {
      const willOpen = !showMadreList;
      setShowMadreList(willOpen);
      setShowMadreExterno(false);
      setShowPadreList(false);
      setShowPadreExterno(false);
      setShowCriadorList(false);
      setShowNuevoCriadorInput(false);
      setNuevoCriadorNombre('');
    }
  };

  const getTappedSide = (event: GestureResponderEvent): MarcaLado => {
    const { locationX } = event.nativeEvent;
    return locationX < 70 ? 'izquierda' : 'derecha';
  };

  const handleTapMarca = (
    tipo: 'pie_izquierdo' | 'pie_derecho' | 'nariz',
    event: GestureResponderEvent
  ) => {
    setMarcaNacimiento(tipo);
    setMarcaPosicion(getTappedSide(event));
    setShowCaseraColors(false);
  };

  const handleSelectMarcaCasera = () => {
    setMarcaNacimiento('marca_casera');
    setMarcaPosicion('');
    setShowCaseraColors((prev) => !prev);
  };

  const handleAgregarNuevoCriador = () => {
    const nombre = nuevoCriadorNombre.trim();

    if (!nombre) {
      Alert.alert('Error', 'Debes escribir el nombre del criador o castador');
      return;
    }

    const existing = criadores.find(
      (c) => getCriadorDisplayName(c).trim().toLowerCase() === nombre.toLowerCase()
    );

    if (existing) {
      setFormData((prev) => ({
        ...prev,
        criador_id: existing.id,
      }));
      setNuevoCriadorNombre('');
      setShowNuevoCriadorInput(false);
      setShowCriadorList(false);
      return;
    }

    const nuevoCriador: Criador = {
      id: `manual_${Date.now()}`,
      nombre,
    };

    setCriadores((prev) =>
      [...prev, nuevoCriador].sort((a, b) =>
        getCriadorDisplayName(a).localeCompare(getCriadorDisplayName(b), 'es', {
          sensitivity: 'base',
        })
      )
    );

    setFormData((prev) => ({
      ...prev,
      criador_id: nuevoCriador.id,
    }));

    setNuevoCriadorNombre('');
    setShowNuevoCriadorInput(false);
    setShowCriadorList(false);
  };

  const renderMarcaDot = (tipo: MarcaTipo) => {
    if (sinMarca || marcaNacimiento !== tipo) return null;

    if (tipo === 'marca_casera') {
      return (
        <View
          style={[
            styles.marcaDot,
            styles.dotCasera,
            { backgroundColor: marcaColor, borderColor: '#d7dde5' },
          ]}
        />
      );
    }

    let dotStyle = styles.dotLeftPieIzquierdo;

    if (tipo === 'pie_izquierdo') {
      dotStyle =
        marcaPosicion === 'izquierda'
          ? styles.dotLeftPieIzquierdo
          : styles.dotRightPieIzquierdo;
    } else if (tipo === 'pie_derecho') {
      dotStyle =
        marcaPosicion === 'izquierda'
          ? styles.dotLeftPieDerecho
          : styles.dotRightPieDerecho;
    } else if (tipo === 'nariz') {
      dotStyle =
        marcaPosicion === 'izquierda' ? styles.dotLeftNariz : styles.dotRightNariz;
    }

    return (
      <View
        style={[
          styles.marcaDot,
          dotStyle,
          { backgroundColor: MARCA_DOT_COLOR, borderColor: '#a3a3a3' },
        ]}
      />
    );
  };

  const renderParentSelection = (
    type: 'padre' | 'madre',
    selectedText: string,
    selectedInternal: boolean
  ) => {
    const isPadre = type === 'padre';
    const showList = isPadre ? showPadreList : showMadreList;
    const showExterno = isPadre ? showPadreExterno : showMadreExterno;
    const items = isPadre ? gallos : gallinas;

    return (
      <View style={styles.parentOptionsWrap}>
        {showList && (
          <View style={styles.dropdownList}>
            {items.length === 0 ? (
              <Text style={styles.emptyListText}>
                {isPadre ? 'No hay gallos registrados' : 'No hay gallinas registradas'}
              </Text>
            ) : (
              items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.dropdownItem,
                    index === items.length - 1 && styles.dropdownItemLast,
                  ]}
                  onPress={() => {
                    if (isPadre) {
                      setFormData((prev) => ({
                        ...prev,
                        padre_id: item.id,
                        padre_externo: '',
                      }));
                      setPadreGalleria('');
                      setShowPadreList(false);
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        madre_id: item.id,
                        madre_externo: '',
                      }));
                      setMadreGalleria('');
                      setShowMadreList(false);
                    }
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {item.codigo} {item.nombre ? `- ${item.nombre}` : ''}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.externalOptionButton}
          onPress={() => {
            if (isPadre) {
              setShowPadreExterno(!showPadreExterno);
              setShowPadreList(false);
              setShowMadreList(false);
              setShowMadreExterno(false);
              setShowCriadorList(false);
              setShowNuevoCriadorInput(false);
              setNuevoCriadorNombre('');
            } else {
              setShowMadreExterno(!showMadreExterno);
              setShowMadreList(false);
              setShowPadreList(false);
              setShowPadreExterno(false);
              setShowCriadorList(false);
              setShowNuevoCriadorInput(false);
              setNuevoCriadorNombre('');
            }
          }}
        >
          <Text style={styles.externalOptionText}>
            {isPadre ? 'Agregar Padre Externo' : 'Agregar Madre Externa'}
          </Text>
          <Ionicons
            name={showExterno ? 'chevron-up' : 'chevron-forward'}
            size={24}
            color="#b45309"
          />
        </TouchableOpacity>

        {showExterno && (
          <View style={styles.externalForm}>
            <Text style={styles.fieldSmallLabel}>
              {isPadre ? 'Placa del padre externo' : 'Placa de la madre externa'}
            </Text>

            <TextInput
              style={styles.externalInput}
              value={
                isPadre
                  ? formData.padre_externo.split(' (')[0]
                  : formData.madre_externo.split(' (')[0]
              }
              onChangeText={(text) => {
                if (isPadre) {
                  setFormData((prev) => ({
                    ...prev,
                    padre_externo: text,
                    padre_id: '',
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    madre_externo: text,
                    madre_id: '',
                  }));
                }
              }}
              placeholder={isPadre ? 'Ej: P-102' : 'Ej: M-210'}
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.fieldSmallLabel}>Gallería / Criador (opcional)</Text>
            <TextInput
              style={styles.externalInput}
              value={isPadre ? padreGalleria : madreGalleria}
              onChangeText={isPadre ? setPadreGalleria : setMadreGalleria}
              placeholder="Nombre de la gallería o criador"
              placeholderTextColor="#9ca3af"
            />

            <TouchableOpacity
              style={styles.confirmExternalButton}
              onPress={() => {
                if (isPadre) {
                  if (!formData.padre_externo.trim()) {
                    Alert.alert('Error', 'Debes escribir la placa del padre externo');
                    return;
                  }

                  const placa = formData.padre_externo.split(' (')[0].trim();
                  const finalValue = padreGalleria.trim()
                    ? `${placa} (${padreGalleria.trim()})`
                    : placa;

                  setFormData((prev) => ({
                    ...prev,
                    padre_externo: finalValue,
                    padre_id: '',
                  }));
                  setShowPadreExterno(false);
                } else {
                  if (!formData.madre_externo.trim()) {
                    Alert.alert('Error', 'Debes escribir la placa de la madre externa');
                    return;
                  }

                  const placa = formData.madre_externo.split(' (')[0].trim();
                  const finalValue = madreGalleria.trim()
                    ? `${placa} (${madreGalleria.trim()})`
                    : placa;

                  setFormData((prev) => ({
                    ...prev,
                    madre_externo: finalValue,
                    madre_id: '',
                  }));
                  setShowMadreExterno(false);
                }
              }}
            >
              <Text style={styles.confirmExternalButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        )}

        {(selectedInternal ||
          (!selectedInternal &&
            selectedText !== (isPadre ? 'Agregar padre' : 'Agregar madre'))) && (
          <TouchableOpacity
            style={styles.clearSelectionButton}
            onPress={isPadre ? clearPadre : clearMadre}
          >
            <Ionicons name="close-circle" size={18} color="#ef4444" />
            <Text style={styles.clearSelectionText}>Quitar selección</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const padreText = formData.padre_externo
    ? `Padre externo: ${formData.padre_externo}`
    : formData.padre_id
      ? formatAveLabel(padreSeleccionado)
      : 'Agregar padre';

  const madreText = formData.madre_externo
    ? `Madre externa: ${formData.madre_externo}`
    : formData.madre_id
      ? formatAveLabel(madreSeleccionada)
      : 'Agregar madre';

  const handleSave = async () => {
    if (!formData.padre_id && !formData.padre_externo) {
      Alert.alert('Error', 'Debes seleccionar o agregar un padre');
      return;
    }

    if (!formData.madre_id && !formData.madre_externo) {
      Alert.alert('Error', 'Debes seleccionar o agregar una madre');
      return;
    }

    if (!sinMarca && !marcaNacimiento) {
      Alert.alert('Error', 'Debes seleccionar una marca o activar "Sin Marca"');
      return;
    }

    setSaving(true);
    try {
      const cantidad = formData.cantidad_huevos_pollitos
        ? Number(formData.cantidad_huevos_pollitos)
        : null;

      const selectedCriador = criadores.find((c) => c.id === formData.criador_id);
      const selectedCriadorName = getCriadorDisplayName(selectedCriador);

      const dataToSend = {
        padre_id: formData.padre_id || null,
        madre_id: formData.madre_id || null,
        padre_externo: formData.padre_externo || null,
        madre_externo: formData.madre_externo || null,
        criador_id: formData.criador_id || null,
        castador_id: formData.criador_id || null,
        criador_nombre:
          formData.criador_id && selectedCriadorName !== 'Seleccionar criador / castador'
            ? selectedCriadorName
            : null,
        fecha: formData.fecha,
        objetivo: formData.notas || '',
        notas: formData.notas || '',
        estado: formData.estado,
        cantidad_huevos_pollitos: cantidad,
        cantidad_registrada: cantidad,
        sin_marca: sinMarca,
        marca_nacimiento: sinMarca ? null : marcaNacimiento || null,
        marca_color:
          sinMarca || marcaNacimiento !== 'marca_casera' ? null : marcaColor || null,
        marca_lado:
          sinMarca || marcaNacimiento === 'marca_casera' ? null : marcaPosicion || null,
      };

      if (isEdit) {
        await api.put(`/cruces/${id}`, dataToSend);
        if (Platform.OS !== 'web') {
          Alert.alert('Éxito', 'Cruce actualizado correctamente');
        }
      } else {
        await api.post('/cruces', dataToSend);
        if (Platform.OS !== 'web') {
          Alert.alert('Éxito', 'Cruce creado correctamente');
        }
      }

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

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cruce',
      '¿Estás seguro de que deseas eliminar este cruce?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/cruces/${id}`);
              Alert.alert('Éxito', 'Cruce eliminado correctamente');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', extractErrorMessage(error));
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
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </SafeAreaView>
    );
  }

  const madreMenuAbierto = showMadreList || showMadreExterno;
  const padreMenuAbierto = showPadreList || showPadreExterno;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isEdit ? 'Editar Cruce' : 'Registrar Nuevo Cruce'}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DatePickerField
            label="Fecha del cruce *"
            value={formData.fecha}
            onChange={(date) => setFormData((prev) => ({ ...prev, fecha: date }))}
            placeholder="Seleccionar fecha"
          />

          <Text style={styles.sectionLabel}>Criador / Castador</Text>

          <TouchableOpacity
            style={styles.selectOptionCard}
            onPress={() => {
              setShowCriadorList((prev) => !prev);
              setShowPadreList(false);
              setShowPadreExterno(false);
              setShowMadreList(false);
              setShowMadreExterno(false);
              setShowNuevoCriadorInput(false);
              setNuevoCriadorNombre('');
            }}
          >
            <Text style={styles.selectOptionText}>
              {getCriadorDisplayName(criadorSeleccionado)}
            </Text>
            <Ionicons
              name={showCriadorList ? 'chevron-up' : 'chevron-forward'}
              size={24}
              color="#111827"
            />
          </TouchableOpacity>

          {showCriadorList && (
            <View style={styles.dropdownList}>
              {criadores.length === 0 ? (
                <Text style={styles.emptyListText}>
                  No hay criadores o castadores registrados
                </Text>
              ) : (
                criadores.map((criador, index) => (
                  <TouchableOpacity
                    key={criador.id}
                    style={[
                      styles.dropdownItem,
                      index === criadores.length - 1 &&
                        !showNuevoCriadorInput &&
                        styles.dropdownItemLast,
                    ]}
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        criador_id: criador.id,
                      }));
                      setShowCriadorList(false);
                      setShowNuevoCriadorInput(false);
                      setNuevoCriadorNombre('');
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      {getCriadorDisplayName(criador)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}

              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  !showNuevoCriadorInput && styles.dropdownItemLast,
                ]}
                onPress={() => setShowNuevoCriadorInput((prev) => !prev)}
              >
                <Text style={styles.addNewCriadorText}>
                  + Agregar nuevo criador / castador
                </Text>
              </TouchableOpacity>

              {showNuevoCriadorInput && (
                <View style={styles.nuevoCriadorBox}>
                  <TextInput
                    style={styles.nuevoCriadorInput}
                    value={nuevoCriadorNombre}
                    onChangeText={setNuevoCriadorNombre}
                    placeholder="Nombre del criador o castador"
                    placeholderTextColor="#9ca3af"
                  />

                  <View style={styles.nuevoCriadorActions}>
                    <TouchableOpacity
                      style={styles.nuevoCriadorCancelBtn}
                      onPress={() => {
                        setShowNuevoCriadorInput(false);
                        setNuevoCriadorNombre('');
                      }}
                    >
                      <Text style={styles.nuevoCriadorCancelText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.nuevoCriadorSaveBtn}
                      onPress={handleAgregarNuevoCriador}
                    >
                      <Text style={styles.nuevoCriadorSaveText}>Agregar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          <Text style={styles.sectionLabel}>Cantidad de Huevos/Pollitos</Text>
          <TextInput
            style={styles.quantityInput}
            value={formData.cantidad_huevos_pollitos}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                cantidad_huevos_pollitos: text.replace(/[^0-9]/g, ''),
              }))
            }
            placeholder="Ej: 12"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />

          <Text style={styles.sectionLabel}>Información de los padres *</Text>

          <TouchableOpacity
            style={styles.parentCard}
            activeOpacity={0.9}
            onPress={() => toggleParentMenu('madre')}
          >
            <View style={styles.parentCardLeft}>
              <View style={styles.madreIconBox}>
                <Ionicons name="female" size={28} color="#2563eb" />
              </View>
              <Text style={styles.parentCardText}>{madreText}</Text>
            </View>
            <Ionicons
              name={madreMenuAbierto ? 'chevron-up' : 'chevron-forward'}
              size={28}
              color="#111827"
            />
          </TouchableOpacity>

          {madreMenuAbierto &&
            renderParentSelection('madre', madreText, !!formData.madre_id)}

          <TouchableOpacity
            style={styles.parentCard}
            activeOpacity={0.9}
            onPress={() => toggleParentMenu('padre')}
          >
            <View style={styles.parentCardLeft}>
              <View style={styles.padreIconBox}>
                <Ionicons name="male" size={28} color="#16a34a" />
              </View>
              <Text style={styles.parentCardText}>{padreText}</Text>
            </View>
            <Ionicons
              name={padreMenuAbierto ? 'chevron-up' : 'chevron-forward'}
              size={28}
              color="#111827"
            />
          </TouchableOpacity>

          {padreMenuAbierto &&
            renderParentSelection('padre', padreText, !!formData.padre_id)}

          {(consanguinidad || calculatingConsang) && (
            <View style={styles.consanguinidadCard}>
              <Text style={styles.consanguinidadTitle}>Porcentaje de consanguinidad</Text>

              {calculatingConsang ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : consanguinidad ? (
                <>
                  <View style={styles.consanguinidadRow}>
                    <Text
                      style={[
                        styles.consanguinidadValue,
                        { color: getConsangColor(consanguinidad.nivel) },
                      ]}
                    >
                      {consanguinidad.porcentaje_estimado.toFixed(1)}%
                    </Text>

                    <View
                      style={[
                        styles.consanguinidadBadge,
                        {
                          backgroundColor: `${getConsangColor(consanguinidad.nivel)}20`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.consanguinidadBadgeText,
                          { color: getConsangColor(consanguinidad.nivel) },
                        ]}
                      >
                        {consanguinidad.nivel.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {consanguinidad.total_comunes > 0 && (
                    <View style={styles.ancestrosBox}>
                      <Text style={styles.ancestrosTitle}>
                        Ancestros en común ({consanguinidad.total_comunes})
                      </Text>

                      {consanguinidad.ancestros_comunes.slice(0, 3).map((anc) => (
                        <Text key={anc.id} style={styles.ancestroItem}>
                          • {anc.codigo}
                          {anc.nombre ? ` - ${anc.nombre}` : ''} (Gen {anc.closest_generation})
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              ) : null}
            </View>
          )}

          <View style={styles.estadoBlock}>
            <Text style={styles.sectionLabel}>Estado</Text>
            <View style={styles.estadoContainer}>
              {['Prueba', 'hecho', 'Repetidos'].map((estado, index) => {
                const isActive = formData.estado === estado;
                return (
                  <TouchableOpacity
                    key={estado}
                    style={[
                      styles.estadoButton,
                      isActive && styles.estadoButtonActive,
                      index === 2 && styles.estadoButtonLast,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, estado }))}
                  >
                    <Text style={[styles.estadoText, isActive && styles.estadoTextActive]}>
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.marcaHeaderRow}>
            <Text style={styles.sectionLabel}>Marca de Nacimiento *</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Sin Marca</Text>
              <Switch
                value={sinMarca}
                onValueChange={(value) => {
                  setSinMarca(value);
                  if (value) {
                    setMarcaNacimiento('');
                    setMarcaPosicion('');
                    setShowCaseraColors(false);
                  }
                }}
                trackColor={{ false: '#d4d4d8', true: '#111827' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {!sinMarca && (
            <>
              <View style={styles.marcaGrid}>
                <TouchableOpacity
                  style={[
                    styles.marcaCard,
                    marcaNacimiento === 'pie_izquierdo' && styles.marcaCardActive,
                  ]}
                  activeOpacity={0.95}
                  onPress={(e) => handleTapMarca('pie_izquierdo', e)}
                >
                  <View style={styles.marcaImageWrap}>
                    <Image
                      source={pieIzquierdoImg}
                      style={styles.marcaImageLeft}
                      resizeMode="contain"
                    />
                    {renderMarcaDot('pie_izquierdo')}
                  </View>
                  <Text
                    style={[
                      styles.marcaText,
                      marcaNacimiento === 'pie_izquierdo' && styles.marcaTextActive,
                    ]}
                  >
                    PIE IZQUIERDO
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.marcaCard,
                    marcaNacimiento === 'pie_derecho' && styles.marcaCardActive,
                  ]}
                  activeOpacity={0.95}
                  onPress={(e) => handleTapMarca('pie_derecho', e)}
                >
                  <View style={styles.marcaImageWrap}>
                    <Image
                      source={pieDerechoImg}
                      style={styles.marcaImageRight}
                      resizeMode="contain"
                    />
                    {renderMarcaDot('pie_derecho')}
                  </View>
                  <Text
                    style={[
                      styles.marcaText,
                      marcaNacimiento === 'pie_derecho' && styles.marcaTextActive,
                    ]}
                  >
                    PIE DERECHO
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.marcaCard,
                    marcaNacimiento === 'nariz' && styles.marcaCardActive,
                  ]}
                  activeOpacity={0.95}
                  onPress={(e) => handleTapMarca('nariz', e)}
                >
                  <View style={styles.marcaImageWrap}>
                    <Image source={narizImg} style={styles.marcaImageNose} resizeMode="contain" />
                    {renderMarcaDot('nariz')}
                  </View>
                  <Text
                    style={[
                      styles.marcaText,
                      marcaNacimiento === 'nariz' && styles.marcaTextActive,
                    ]}
                  >
                    Nariz
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.caseraRow}>
                <TouchableOpacity
                  style={[
                    styles.marcaCaseraMiniCard,
                    marcaNacimiento === 'marca_casera' && styles.marcaCardActive,
                  ]}
                  activeOpacity={0.9}
                  onPress={handleSelectMarcaCasera}
                >
                  <View style={styles.marcaCaseraMiniTop}>
                    <View
                      style={[
                        styles.marcaCaseraSelectedCircle,
                        { backgroundColor: marcaColor },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.marcaCaseraMiniText,
                      marcaNacimiento === 'marca_casera' && styles.marcaTextActive,
                    ]}
                  >
                    Marca casera
                  </Text>
                </TouchableOpacity>
              </View>

              {showCaseraColors && (
                <View style={styles.caseraColorsWrap}>
                  <View style={styles.caseraPalette}>
                    {CASERA_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.caseraColorItem,
                          marcaColor === color && styles.caseraColorItemActive,
                        ]}
                        onPress={() => {
                          setMarcaNacimiento('marca_casera');
                          setMarcaColor(color);
                        }}
                      >
                        <View
                          style={[
                            styles.caseraColorDot,
                            {
                              backgroundColor: color,
                              borderWidth: color === '#ffffff' ? 1 : 0,
                              borderColor: color === '#ffffff' ? '#d1d5db' : 'transparent',
                            },
                          ]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          <Text style={styles.sectionLabel}>Notas de objetivo</Text>
          <TextInput
            style={styles.notesInput}
            value={formData.notas}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, notas: text }))}
            placeholder="Escribe observaciones adicionales..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
          />

          {isEdit && (
            <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={styles.deleteActionText}>Eliminar cruce</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>

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
  flex: {
    flex: 1,
  },
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
    height: 84,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#1f1f2e',
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 92,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginTop: 22,
    marginBottom: 12,
  },
  selectOptionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 18,
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  selectOptionText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  quantityInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 18,
    minHeight: 58,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    marginBottom: 8,
  },
  parentCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 20,
    minHeight: 92,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  parentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  madreIconBox: {
    width: 82,
    height: 82,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  padreIconBox: {
    width: 82,
    height: 82,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  parentCardText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  parentOptionsWrap: {
    marginBottom: 6,
  },
  externalOptionButton: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#f6c26b',
    borderRadius: 18,
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  externalOptionText: {
    fontSize: 15,
    color: '#b45309',
    fontWeight: '500',
    flex: 1,
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7dde5',
    marginBottom: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#111827',
  },
  emptyListText: {
    padding: 16,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  externalForm: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  fieldSmallLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 2,
  },
  externalInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  confirmExternalButton: {
    backgroundColor: '#1f1f2e',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmExternalButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 8,
  },
  clearSelectionText: {
    color: '#ef4444',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  consanguinidadCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
    marginBottom: 8,
  },
  consanguinidadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  consanguinidadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consanguinidadValue: {
    fontSize: 34,
    fontWeight: '800',
  },
  consanguinidadBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  consanguinidadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ancestrosBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  ancestrosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  ancestroItem: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  estadoBlock: {
    marginTop: 4,
  },
  estadoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  estadoButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  estadoButtonLast: {
    marginRight: 0,
  },
  estadoButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  estadoText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  estadoTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  marcaHeaderRow: {
    marginTop: 10,
  },
  switchRow: {
    position: 'absolute',
    right: 0,
    top: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 10,
    color: '#334155',
    fontSize: 15,
    fontWeight: '500',
  },
  marcaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  marcaCard: {
    width: '30.5%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: 'center',
    minHeight: 170,
    marginBottom: 10,
  },
  marcaCardActive: {
    borderColor: '#1f1f2e',
    borderWidth: 2,
  },
  marcaImageWrap: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  marcaImageLeft: {
    width: 190,
    height: 190,
    marginTop: -18,
  },
  marcaImageRight: {
    width: 136,
    height: 136,
  },
  marcaImageNose: {
    width: 112,
    height: 112,
  },
  marcaDot: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    position: 'absolute',
    borderWidth: 1.5,
  },
  dotLeftPieIzquierdo: {
    left: 46,
    top: 36,
  },
  dotRightPieIzquierdo: {
    left: 70,
    top: 42,
  },
  dotLeftPieDerecho: {
    left: 52,
    top: 39,
  },
  dotRightPieDerecho: {
    left: 74,
    top: 38,
  },
  dotLeftNariz: {
    left: 42,
    top: 30,
  },
  dotRightNariz: {
    left: 60,
    top: 30,
  },
  dotCasera: {
    left: 46,
    top: 9,
  },
  marcaText: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: -2,
  },
  marcaTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  caseraRow: {
    flexDirection: 'row',
    marginTop: -2,
    marginBottom: 4,
  },
  marcaCaseraMiniCard: {
    width: 112,
    height: 72,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaCaseraMiniTop: {
    marginBottom: 6,
  },
  marcaCaseraSelectedCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7dde5',
  },
  marcaCaseraMiniText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
  },
  caseraColorsWrap: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  caseraPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  caseraColorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d7dde5',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  caseraColorItemActive: {
    borderColor: '#111827',
    borderWidth: 2,
  },
  caseraColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  notesInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 20,
    minHeight: 170,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
  },
  deleteAction: {
    marginTop: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteActionText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  addNewCriadorText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
  nuevoCriadorBox: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
    backgroundColor: '#ffffff',
  },
  nuevoCriadorInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  nuevoCriadorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  nuevoCriadorCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
  },
  nuevoCriadorCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  nuevoCriadorSaveBtn: {
    backgroundColor: '#1f1f2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  nuevoCriadorSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
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