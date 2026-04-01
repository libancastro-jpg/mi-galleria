import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';

interface Pelea {
  id: string;
  ave_id: string;
  fecha: string;
  lugar?: string;
  ganadas?: number;
  perdidas?: number;
  entabladas?: number;
  calificacion: string;
  notas?: string;
}

interface Ave {
  id: string;
  codigo: string;
  nombre?: string;
  tipo?: string;
  foto_principal?: string;
  foto?: string;
  imagen?: string;
  image_url?: string;
  padre_id?: string;
  madre_id?: string;
}

interface Estadisticas {
  total: number;
  ganadas: number;
  perdidas: number;
  entabladas: number;
  porcentaje_victorias: number;
  calificaciones: Record<string, number>;
  racha_actual: number;
  racha_tipo: string | null;
}

interface ParentStat {
  id: string;
  codigo: string;
  nombre?: string;
  ganadas: number;
  total: number;
  porcentaje: number;
  hijos_peleados: number;
}

const galloDefaultImg = require('../../assets/images/gallo.png');
const gallinaDefaultImg = require('../../assets/images/gallina.png');

const MONTH_OPTIONS = [
  { value: null as number | null, label: 'Todos' },
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

type PickerType = 'month' | 'year' | null;

const getOptimizedImage = (url?: string, width: number = 300) => {
  if (!url) return undefined;

  if (!url.includes('/image/upload/')) return url;

  return url.replace(
    '/image/upload/',
    `/image/upload/f_auto,q_auto,w_${width}/`
  );
};

const getAveImageSource = (ave?: Ave) => {
  if (!ave) return galloDefaultImg;

  const url =
    ave.foto_principal ||
    ave.foto ||
    ave.imagen ||
    ave.image_url;

  if (url) {
    return { uri: getOptimizedImage(url, 300) };
  }

  return ave.tipo === 'gallina' ? gallinaDefaultImg : galloDefaultImg;
};

const parseFecha = (fecha?: string) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  return d;
};

const getGanadas = (pelea: Pelea) => Number(pelea.ganadas || 0);
const getPerdidas = (pelea: Pelea) => Number(pelea.perdidas || 0);
const getEntabladas = (pelea: Pelea) => Number(pelea.entabladas || 0);
const getTotalPelea = (pelea: Pelea) =>
  getGanadas(pelea) + getPerdidas(pelea) + getEntabladas(pelea);

const getDominantResultado = (pelea: Pelea): 'GANO' | 'PERDIO' | 'ENTABLO' | 'MIXTO' | 'NEUTRAL' => {
  const ganadas = getGanadas(pelea);
  const perdidas = getPerdidas(pelea);
  const entabladas = getEntabladas(pelea);

  const activos = [ganadas > 0, perdidas > 0, entabladas > 0].filter(Boolean).length;

  if (activos > 1) return 'MIXTO';
  if (ganadas > 0) return 'GANO';
  if (perdidas > 0) return 'PERDIO';
  if (entabladas > 0) return 'ENTABLO';
  return 'NEUTRAL';
};

export default function PeleasScreen() {
  const router = useRouter();
  const [peleas, setPeleas] = useState<Pelea[]>([]);
  const [aves, setAves] = useState<Record<string, Ave>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [draftMonth, setDraftMonth] = useState<number | null>(null);
  const [draftYear, setDraftYear] = useState<number | null>(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerType>(null);

  const fetchData = async () => {
    try {
      const [peleasData, avesData] = await Promise.all([
        api.get('/peleas'),
        api.get('/aves'),
      ]);

      const getData = (res: any) => res?.data || res || [];

      const peleasArray = getData(peleasData);
      const avesArray = getData(avesData);

      setPeleas(peleasArray);

      const avesMap: Record<string, Ave> = {};
      avesArray.forEach((ave: Ave) => {
        avesMap[ave.id] = ave;
      });
      setAves(avesMap);
    } catch (error) {
      console.error('Error fetching peleas:', error);
      Alert.alert('Error', 'No se pudieron cargar las peleas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();

    peleas.forEach((pelea) => {
      const d = parseFecha(pelea.fecha);
      if (d) years.add(d.getFullYear());
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [peleas]);

  useEffect(() => {
    if (showFilterModal) {
      setDraftMonth(selectedMonth);
      setDraftYear(selectedYear);
    }
  }, [showFilterModal, selectedMonth, selectedYear]);

  const selectedMonthLabel =
    MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || 'Todos';

  const filterSummaryLabel =
    selectedMonth === null && selectedYear === null
      ? 'Todos los registros'
      : `${selectedYear ? `${selectedYear}` : 'Todos'}${selectedMonth !== null ? ` • ${selectedMonthLabel}` : ''}`;

  const draftMonthLabel =
    MONTH_OPTIONS.find((m) => m.value === draftMonth)?.label || 'Todos';

  const draftYearLabel = draftYear ? String(draftYear) : 'Todos';

  const filteredPeleas = useMemo(() => {
    return peleas.filter((pelea) => {
      const d = parseFecha(pelea.fecha);
      if (!d) return true;

      const monthOk = selectedMonth === null || d.getMonth() + 1 === selectedMonth;
      const yearOk = selectedYear === null || d.getFullYear() === selectedYear;

      return monthOk && yearOk;
    });
  }, [peleas, selectedMonth, selectedYear]);

  const stats = useMemo<Estadisticas>(() => {
    const total = filteredPeleas.reduce((acc, pelea) => acc + getTotalPelea(pelea), 0);
    const ganadas = filteredPeleas.reduce((acc, pelea) => acc + getGanadas(pelea), 0);
    const perdidas = filteredPeleas.reduce((acc, pelea) => acc + getPerdidas(pelea), 0);
    const entabladas = filteredPeleas.reduce((acc, pelea) => acc + getEntabladas(pelea), 0);

    const calificaciones: Record<string, number> = {
      EXTRAORDINARIA: 0,
      BUENA: 0,
      REGULAR: 0,
      MALA: 0,
    };

    filteredPeleas.forEach((p) => {
      if (calificaciones[p.calificacion] !== undefined) {
        calificaciones[p.calificacion] += 1;
      }
    });

    const sortedByDate = [...filteredPeleas].sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });

    let racha_actual = 0;
    let racha_tipo: string | null = null;

    for (const pelea of sortedByDate) {
      const dominant = getDominantResultado(pelea);

      if (dominant !== 'GANO' && dominant !== 'PERDIO') {
        break;
      }

      if (!racha_tipo) {
        racha_tipo = dominant;
        racha_actual = 1;
      } else if (dominant === racha_tipo) {
        racha_actual += 1;
      } else {
        break;
      }
    }

    return {
      total,
      ganadas,
      perdidas,
      entabladas,
      porcentaje_victorias: total > 0 ? Math.round((ganadas / total) * 100) : 0,
      calificaciones,
      racha_actual,
      racha_tipo,
    };
  }, [filteredPeleas]);

  const parentStats = useMemo(() => {
    const padreMap: Record<string, ParentStat> = {};
    const madreMap: Record<string, ParentStat> = {};

    filteredPeleas.forEach((pelea) => {
      const ave = aves[pelea.ave_id];
      if (!ave) return;

      const totalPelea = getTotalPelea(pelea);
      const ganadasPelea = getGanadas(pelea);

      if (ave.padre_id) {
        const padre = aves[ave.padre_id];
        if (padre) {
          if (!padreMap[padre.id]) {
            padreMap[padre.id] = {
              id: padre.id,
              codigo: padre.codigo,
              nombre: padre.nombre,
              ganadas: 0,
              total: 0,
              porcentaje: 0,
              hijos_peleados: 0,
            };
          }
          padreMap[padre.id].total += totalPelea;
          padreMap[padre.id].ganadas += ganadasPelea;
        }
      }

      if (ave.madre_id) {
        const madre = aves[ave.madre_id];
        if (madre) {
          if (!madreMap[madre.id]) {
            madreMap[madre.id] = {
              id: madre.id,
              codigo: madre.codigo,
              nombre: madre.nombre,
              ganadas: 0,
              total: 0,
              porcentaje: 0,
              hijos_peleados: 0,
            };
          }
          madreMap[madre.id].total += totalPelea;
          madreMap[madre.id].ganadas += ganadasPelea;
        }
      }
    });

    const padres = Object.values(padreMap)
      .map((p) => ({
        ...p,
        hijos_peleados: p.total,
        porcentaje: p.total > 0 ? Math.round((p.ganadas / p.total) * 100) : 0,
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje || b.total - a.total);

    const madres = Object.values(madreMap)
      .map((p) => ({
        ...p,
        hijos_peleados: p.total,
        porcentaje: p.total > 0 ? Math.round((p.ganadas / p.total) * 100) : 0,
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje || b.total - a.total);

    return { padres, madres };
  }, [filteredPeleas, aves]);

  const getCalificacionColor = (cal: string) => {
    switch (cal) {
      case 'EXTRAORDINARIA':
        return '#f59e0b';
      case 'BUENA':
        return '#22c55e';
      case 'REGULAR':
        return '#555555';
      case 'MALA':
        return '#ef4444';
      default:
        return '#555555';
    }
  };

  const getResultadoLabel = (pelea: Pelea) => {
    const ganadas = getGanadas(pelea);
    const perdidas = getPerdidas(pelea);
    const entabladas = getEntabladas(pelea);

    const partes: string[] = [];

    if (ganadas > 0) partes.push(`Ganó x${ganadas}`);
    if (perdidas > 0) partes.push(`Perdió x${perdidas}`);
    if (entabladas > 0) partes.push(`Entabló x${entabladas}`);

    return partes.length > 0 ? partes.join(' • ') : 'Sin resultado';
  };

  const getResultadoBadgeStyle = (pelea: Pelea) => {
    const dominant = getDominantResultado(pelea);

    switch (dominant) {
      case 'GANO':
        return styles.resultadoBadgeGano;
      case 'PERDIO':
        return styles.resultadoBadgePerdio;
      case 'ENTABLO':
        return styles.resultadoBadgeEntablo;
      case 'MIXTO':
        return styles.resultadoBadgeMixto;
      default:
        return styles.resultadoBadgeNeutral;
    }
  };

  const getResultadoIndicatorStyle = (pelea: Pelea) => {
    const dominant = getDominantResultado(pelea);

    switch (dominant) {
      case 'GANO':
        return styles.resultadoGano;
      case 'PERDIO':
        return styles.resultadoPerdio;
      case 'ENTABLO':
        return styles.resultadoEntablo;
      case 'MIXTO':
        return styles.resultadoMixto;
      default:
        return styles.resultadoNeutral;
    }
  };

  const getResultadoIndicatorText = (pelea: Pelea) => {
    const dominant = getDominantResultado(pelea);

    switch (dominant) {
      case 'GANO':
        return 'G';
      case 'PERDIO':
        return 'P';
      case 'ENTABLO':
        return 'E';
      case 'MIXTO':
        return 'M';
      default:
        return '-';
    }
  };

  const openFilterModal = () => {
    setDraftMonth(selectedMonth);
    setDraftYear(selectedYear);
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setActivePicker(null);
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setSelectedMonth(draftMonth);
    setSelectedYear(draftYear);
    setActivePicker(null);
    setShowFilterModal(false);
  };

  const clearDraftFilters = () => {
    setDraftMonth(null);
    setDraftYear(null);
  };

  const renderResultMiniBadges = (pelea: Pelea) => {
    const ganadas = getGanadas(pelea);
    const perdidas = getPerdidas(pelea);
    const entabladas = getEntabladas(pelea);

    return (
      <View style={styles.resultMiniRow}>
        {ganadas > 0 ? (
          <View style={[styles.resultMiniBadge, styles.resultMiniBadgeGano]}>
            <Text style={styles.resultMiniBadgeText}>G x{ganadas}</Text>
          </View>
        ) : null}

        {perdidas > 0 ? (
          <View style={[styles.resultMiniBadge, styles.resultMiniBadgePerdio]}>
            <Text style={styles.resultMiniBadgeText}>P x{perdidas}</Text>
          </View>
        ) : null}

        {entabladas > 0 ? (
          <View style={[styles.resultMiniBadge, styles.resultMiniBadgeEntablo]}>
            <Text style={styles.resultMiniBadgeText}>E x{entabladas}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderPelea = ({ item }: { item: Pelea }) => {
    const ave = aves[item.ave_id];
    const imageSource = getAveImageSource(ave);

    const handleDelete = () => {
      Alert.alert(
        'Eliminar pelea',
        '¿Seguro que quieres eliminar esta pelea?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.delete(`/peleas/${item.id}`);
                fetchData();
              } catch (error) {
                Alert.alert('Error', 'No se pudo eliminar');
              }
            },
          },
        ]
      );
    };

    return (
      <View style={styles.peleaCard}>
        <TouchableOpacity
          style={styles.cardPressArea}
          activeOpacity={0.85}
          onPress={() => router.push(`/pelea/${item.id}`)}
        >
          <View style={styles.aveImageContainer}>
            <Image
              source={imageSource}
              style={styles.aveImage}
              resizeMode="cover"
              fadeDuration={0}
            />
          </View>

          <View
            style={[
              styles.resultadoIndicator,
              getResultadoIndicatorStyle(item),
            ]}
          >
            <Text style={styles.resultadoText}>
              {getResultadoIndicatorText(item)}
            </Text>
          </View>

          <View style={styles.peleaInfo}>
            <Text style={styles.aveCodigo}>
              {ave?.codigo || 'Ave desconocida'}
            </Text>

            <Text style={styles.peleaFecha}>{item.fecha}</Text>

            <View
              style={[
                styles.resultadoBadge,
                getResultadoBadgeStyle(item),
              ]}
            >
              <Text style={styles.resultadoBadgeText}>
                {getResultadoLabel(item)}
              </Text>
            </View>

            {renderResultMiniBadges(item)}

            {item.lugar ? (
              <Text style={styles.peleaLugar}>{item.lugar}</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.rightActions}>
          <View
            style={[
              styles.calificacionBadge,
              { backgroundColor: getCalificacionColor(item.calificacion) + '20' },
            ]}
          >
            <Text
              style={[
                styles.calificacionText,
                { color: getCalificacionColor(item.calificacion) },
              ]}
            >
              {item.calificacion?.charAt(0) || '-'}
            </Text>
          </View>

          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Peleas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/pelea/new')}
        >
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeaderRow}>
          <View>
            <Text style={styles.calendarTitle}>Filtrar peleas</Text>
            <Text style={styles.calendarSubtitle}>{filterSummaryLabel}</Text>
          </View>

          <TouchableOpacity
            style={styles.calendarOpenButton}
            onPress={openFilterModal}
          >
            <Ionicons name="calendar-outline" size={18} color="#000" />
            <Text style={styles.calendarOpenButtonText}>Elegir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={closeFilterModal}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalCard}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtrar por fecha</Text>
              <TouchableOpacity onPress={closeFilterModal}>
                <Ionicons name="close" size={22} color="#555555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Año</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              activeOpacity={0.85}
              onPress={() => setActivePicker('year')}
            >
              <View style={styles.selectorButtonLeft}>
                <Ionicons name="calendar-clear-outline" size={18} color="#555555" />
                <Text style={styles.selectorButtonText}>{draftYearLabel}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#555555" />
            </TouchableOpacity>

            <Text style={styles.filterSectionTitle}>Mes</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              activeOpacity={0.85}
              onPress={() => setActivePicker('month')}
            >
              <View style={styles.selectorButtonLeft}>
                <Ionicons name="today-outline" size={18} color="#555555" />
                <Text style={styles.selectorButtonText}>{draftMonthLabel}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#555555" />
            </TouchableOpacity>

            <View style={styles.filterPreviewBox}>
              <Text style={styles.filterPreviewLabel}>Selección actual</Text>
              <Text style={styles.filterPreviewValue}>
                {draftYear ? draftYear : 'Todos los años'}
                {draftMonth !== null ? ` • ${draftMonthLabel}` : ' • Todos los meses'}
              </Text>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.filterClearButton}
                onPress={clearDraftFilters}
              >
                <Text style={styles.filterClearButtonText}>Limpiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterDoneButton}
                onPress={applyFilters}
              >
                <Text style={styles.filterDoneButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Modal
          visible={activePicker !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActivePicker(null)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>
                  {activePicker === 'year' ? 'Seleccionar año' : 'Seleccionar mes'}
                </Text>
                <TouchableOpacity onPress={() => setActivePicker(null)}>
                  <Ionicons name="close" size={22} color="#555555" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerOptionsContainer}
              >
                {activePicker === 'year' ? (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.pickerOption,
                        draftYear === null && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setDraftYear(null);
                        setActivePicker(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          draftYear === null && styles.pickerOptionTextActive,
                        ]}
                      >
                        Todos
                      </Text>
                      {draftYear === null && (
                        <Ionicons name="checkmark" size={18} color="#000" />
                      )}
                    </TouchableOpacity>

                    {availableYears.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.pickerOption,
                          draftYear === year && styles.pickerOptionActive,
                        ]}
                        onPress={() => {
                          setDraftYear(year);
                          setActivePicker(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            draftYear === year && styles.pickerOptionTextActive,
                          ]}
                        >
                          {year}
                        </Text>
                        {draftYear === year && (
                          <Ionicons name="checkmark" size={18} color="#000" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  MONTH_OPTIONS.map((month) => (
                    <TouchableOpacity
                      key={String(month.value)}
                      style={[
                        styles.pickerOption,
                        draftMonth === month.value && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setDraftMonth(month.value);
                        setActivePicker(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          draftMonth === month.value && styles.pickerOptionTextActive,
                        ]}
                      >
                        {month.label}
                      </Text>
                      {draftMonth === month.value && (
                        <Ionicons name="checkmark" size={18} color="#000" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Modal>

      {stats.total > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.ganadas}</Text>
              <Text style={styles.statLabel}>Ganadas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.perdidas}</Text>
              <Text style={styles.statLabel}>Perdidas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.entabladas}</Text>
              <Text style={styles.statLabel}>Entabló</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#22c55e' }]}>
                {stats.porcentaje_victorias}%
              </Text>
              <Text style={styles.statLabel}>Victorias</Text>
            </View>
          </View>

          {stats.racha_actual > 0 && (
            <View style={styles.rachaContainer}>
              <Ionicons
                name={stats.racha_tipo === 'GANO' ? 'flame' : 'trending-down'}
                size={16}
                color={stats.racha_tipo === 'GANO' ? '#f59e0b' : '#ef4444'}
              />
              <Text style={styles.rachaText}>
                Racha de {stats.racha_actual}{' '}
                {stats.racha_tipo === 'GANO' ? 'victorias' : 'derrotas'}
              </Text>
            </View>
          )}

          <View style={styles.calificacionesRow}>
            {Object.entries(stats.calificaciones).map(([cal, count]) => (
              <View key={cal} style={styles.calItem}>
                <View
                  style={[
                    styles.calDot,
                    { backgroundColor: getCalificacionColor(cal) },
                  ]}
                />
                <Text style={styles.calCount}>{count}</Text>
                <Text style={styles.calLabel}>{cal.charAt(0)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.parentStatsContainer}>
        <Text style={styles.parentStatsTitle}>Promedio Reproductores</Text>

        {parentStats.padres.length > 0 || parentStats.madres.length > 0 ? (
          <View style={styles.parentStatsRow}>
            <View style={styles.parentColumn}>
              <View style={styles.parentColumnHeader}>
                <Ionicons name="male" size={14} color="#3b82f6" />
                <Text style={styles.parentColumnTitle}>Padres</Text>
              </View>
              {parentStats.padres.length > 0 ? (
                parentStats.padres.slice(0, 4).map((padre, idx) => (
                  <TouchableOpacity
                    key={padre.id}
                    style={styles.parentItem}
                    onPress={() => router.push(`/ave/detail/${padre.id}`)}
                  >
                    <Text style={styles.parentRank}>{idx + 1}.</Text>
                    <View style={styles.parentInfo}>
                      <Text style={styles.parentCode} numberOfLines={1}>
                        PL: {padre.codigo}
                      </Text>
                      <Text style={styles.parentHijos}>{padre.hijos_peleados} hijos</Text>
                    </View>
                    <Text
                      style={[
                        styles.parentPercent,
                        { color: padre.porcentaje >= 50 ? '#22c55e' : '#ef4444' },
                      ]}
                    >
                      {padre.porcentaje}%
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.parentEmptyText}>Sin datos</Text>
              )}
            </View>

            <View style={styles.parentDivider} />

            <View style={styles.parentColumn}>
              <View style={styles.parentColumnHeader}>
                <Ionicons name="female" size={14} color="#ec4899" />
                <Text style={styles.parentColumnTitle}>Madres</Text>
              </View>
              {parentStats.madres.length > 0 ? (
                parentStats.madres.slice(0, 4).map((madre, idx) => (
                  <TouchableOpacity
                    key={madre.id}
                    style={styles.parentItem}
                    onPress={() => router.push(`/ave/detail/${madre.id}`)}
                  >
                    <Text style={styles.parentRank}>{idx + 1}.</Text>
                    <View style={styles.parentInfo}>
                      <Text style={styles.parentCode} numberOfLines={1}>
                        PL: {madre.codigo}
                      </Text>
                      <Text style={styles.parentHijos}>{madre.hijos_peleados} hijos</Text>
                    </View>
                    <Text
                      style={[
                        styles.parentPercent,
                        { color: madre.porcentaje >= 50 ? '#22c55e' : '#ef4444' },
                      ]}
                    >
                      {madre.porcentaje}%
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.parentEmptyText}>Sin datos</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.parentEmptyContainer}>
            <Text style={styles.parentEmptyMessage}>
              Registra peleas con aves que tengan padres asignados para ver el promedio de reproductores
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <FlatList
          data={filteredPeleas}
          renderItem={renderPelea}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f59e0b"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color="#4b5563" />
              <Text style={styles.emptyTitle}>Sin peleas</Text>
              <Text style={styles.emptyText}>
                No hay peleas registradas para este filtro
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/pelea/new')}
              >
                <Ionicons name="add" size={20} color="#000" />
                <Text style={styles.emptyButtonText}>Registrar Pelea</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
  },
  calendarSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  calendarOpenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  calendarOpenButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  filterModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555555',
    marginTop: 12,
    marginBottom: 10,
  },
  selectorButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorButtonText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
    marginLeft: 10,
  },
  filterPreviewBox: {
    marginTop: 16,
    backgroundColor: '#fff7e6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#fde7b0',
  },
  filterPreviewLabel: {
    fontSize: 12,
    color: '#8a6a00',
    fontWeight: '600',
    marginBottom: 4,
  },
  filterPreviewValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  filterClearButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  filterClearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555555',
  },
  filterDoneButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  filterDoneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  pickerOptionsContainer: {
    paddingBottom: 10,
  },
  pickerOption: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#f7f7f7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerOptionActive: {
    backgroundColor: '#f59e0b',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 11,
    color: '#555555',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  rachaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 6,
  },
  rachaText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  calificacionesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  calItem: {
    alignItems: 'center',
  },
  calDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  calCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  calLabel: {
    fontSize: 11,
    color: '#555555',
    marginTop: 2,
  },
  parentStatsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  parentStatsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  parentStatsRow: {
    flexDirection: 'row',
  },
  parentColumn: {
    flex: 1,
  },
  parentColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 6,
  },
  parentColumnTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
  },
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  parentRank: {
    fontSize: 11,
    color: '#9ca3af',
    width: 16,
  },
  parentInfo: {
    flex: 1,
  },
  parentCode: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  parentHijos: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 1,
  },
  parentPercent: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  parentDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  parentEmptyText: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  parentEmptyContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  parentEmptyMessage: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  peleaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 88,
  },
  cardPressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aveImageContainer: {
    position: 'relative',
  },
  aveImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  resultadoIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  resultadoGano: {
    backgroundColor: 'rgba(34, 197, 94, 0.20)',
  },
  resultadoPerdio: {
    backgroundColor: 'rgba(239, 68, 68, 0.20)',
  },
  resultadoEntablo: {
    backgroundColor: 'rgba(245, 158, 11, 0.20)',
  },
  resultadoMixto: {
    backgroundColor: 'rgba(59, 130, 246, 0.20)',
  },
  resultadoNeutral: {
    backgroundColor: 'rgba(107, 114, 128, 0.20)',
  },
  resultadoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  peleaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  aveCodigo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  peleaFecha: {
    fontSize: 13,
    color: '#555555',
    marginTop: 2,
  },
  resultadoBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  resultadoBadgeGano: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
  },
  resultadoBadgePerdio: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  resultadoBadgeEntablo: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  resultadoBadgeMixto: {
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
  },
  resultadoBadgeNeutral: {
    backgroundColor: 'rgba(107, 114, 128, 0.14)',
  },
  resultadoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  resultMiniRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  resultMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resultMiniBadgeGano: {
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  resultMiniBadgePerdio: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  resultMiniBadgeEntablo: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  resultMiniBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  peleaLugar: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  rightActions: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  calificacionBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calificacionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: 10,
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#555555',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});