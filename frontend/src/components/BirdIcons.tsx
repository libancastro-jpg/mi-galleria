import React from 'react';
import Svg, { Path, Circle, G, Rect, Line } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

/**
 * Sistema de Iconos Profesionales - Castador Pro
 * Estilo: Minimalista, flat, líneas limpias
 * Paleta: Dorado (#F5A623), Verde éxito, Rojo alertas, Gris neutro
 */

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// ============================================
// ICONO PRINCIPAL DEL GALLO
// Silueta vectorial limpia, perfil izquierdo
// Estilo logo corporativo premium
// viewBox cuadrado, preserveAspectRatio activo
// ============================================
export function RoosterIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Cuerpo principal del gallo */}
        <Path
          d="M70 35
             C73 33 76 34 76 38
             L75 42
             C77 45 77 49 75 53
             C73 58 69 62 64 65
             L61 67
             C61 70 59 73 56 74
             L52 75
             C48 75 44 74 40 72
             L37 70
             C33 68 30 64 28 60
             C26 55 25 49 27 43
             L29 39
             C27 37 26 34 28 31
             C30 28 34 28 37 29
             L40 31
             C39 27 41 24 44 22
             C47 20 51 21 54 23
             L57 26
             C60 24 64 25 67 27
             C70 30 71 33 70 35
             Z"
          fill={color}
        />
        {/* Cola - pluma 1 */}
        <Path
          d="M27 40
             C22 35 18 28 20 21
             C21 17 25 15 28 17
             C30 19 29 23 27 27
             C26 32 28 37 31 41
             L29 42
             C28 41 27 41 27 40
             Z"
          fill={color}
        />
        {/* Cola - pluma 2 */}
        <Path
          d="M30 38
             C26 32 24 25 27 19
             C29 16 33 15 35 18
             C36 21 34 25 32 29
             C31 34 33 38 36 42
             L33 42
             C32 41 30 39 30 38
             Z"
          fill={color}
        />
        {/* Cola - pluma 3 */}
        <Path
          d="M34 36
             C31 31 30 24 33 19
             C35 16 39 16 40 19
             C41 22 39 26 37 30
             C36 34 38 39 41 43
             L38 43
             C36 41 35 38 34 36
             Z"
          fill={color}
        />
        {/* Cresta */}
        <Path
          d="M68 28
             C70 24 74 24 75 28
             C76 31 73 34 70 33
             L69 32
             C70 29 69 27 68 28
             Z"
          fill={color}
        />
        {/* Pico */}
        <Path
          d="M76 40
             L84 43
             L76 46
             Z"
          fill={color}
        />
        {/* Barbilla */}
        <Path
          d="M72 48
             C74 51 72 54 69 54
             C67 53 68 50 71 48
             Z"
          fill={color}
        />
        {/* Pata izquierda */}
        <Path
          d="M45 75 L45 85 L41 90 M45 85 L45 90 M45 85 L49 90"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Pata derecha */}
        <Path
          d="M56 73 L57 83 L53 88 M57 83 L57 88 M57 83 L61 88"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ============================================
// ICONO DE GALLINA
// Silueta más redondeada, perfil izquierdo
// ============================================
export function HenIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Cuerpo redondeado */}
        <Path
          d="M65 38
             C69 37 72 40 70 45
             L68 50
             C70 54 68 59 65 63
             C61 68 56 71 50 73
             L46 74
             C46 77 44 80 41 81
             L37 81
             C33 81 29 79 26 77
             L23 74
             C19 71 17 67 16 62
             C15 57 16 51 19 46
             L22 42
             C20 39 21 35 24 33
             C27 31 31 32 34 34
             L38 36
             C38 32 41 29 45 29
             C49 29 52 32 55 35
             L58 38
             C61 37 64 38 65 38
             Z"
          fill={color}
        />
        {/* Cola corta */}
        <Path
          d="M19 44
             C15 40 14 34 17 29
             C19 26 23 26 24 29
             C25 32 23 36 22 40
             C21 44 23 48 26 51
             L23 51
             C21 49 19 47 19 44
             Z"
          fill={color}
        />
        {/* Cresta pequeña */}
        <Path
          d="M63 32
             C64 29 67 29 68 32
             C69 29 71 30 71 33
             L68 35
             L64 35
             Z"
          fill={color}
        />
        {/* Pico */}
        <Path
          d="M71 42
             L78 45
             L71 48
             Z"
          fill={color}
        />
        {/* Barbilla */}
        <Path
          d="M67 51
             C68 54 66 56 64 55
             C63 54 64 52 67 51
             Z"
          fill={color}
        />
        {/* Patas */}
        <Path
          d="M35 81 L35 89 L31 93 M35 89 L35 93 M35 89 L39 93"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M45 80 L46 88 L42 92 M46 88 L46 92 M46 88 L50 92"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ============================================
// ICONOS DE MÓDULOS - Estilo consistente
// viewBox cuadrado, preserveAspectRatio activo
// ============================================

// Icono de Trofeo/Rendimiento
export function TrophyIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M8 21h8M12 17v4M6 3h12M6 3c0 0-2 0-2 2v2c0 2 2 4 4 4M18 3c0 0 2 0 2 2v2c0 2-2 4-4 4M8 11c0 3 2 6 4 6s4-3 4-6V3H8v8z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Cruces/Genética
export function GeneticsIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M12 2v20M12 2c-3 0-6 2-6 5s3 5 6 5M12 2c3 0 6 2 6 5s-3 5-6 5M12 22c-3 0-6-2-6-5s3-5 6-5M12 22c3 0 6-2 6-5s-3-5-6-5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle cx="12" cy="7" r="1.5" fill={color} />
        <Circle cx="12" cy="17" r="1.5" fill={color} />
      </Svg>
    </View>
  );
}

// Icono de Huevo/Camadas
export function EggIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M12 3C8 3 5 8 5 13c0 4 3 8 7 8s7-4 7-8c0-5-3-10-7-10z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Salud/Médico
export function HealthIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M12 4v16M4 12h16"
          stroke={color}
          strokeWidth={strokeWidth + 1}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="3"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Cuido/Entrenamiento
export function TrainingIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Circle
          cx="12"
          cy="5"
          r="3"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Path
          d="M12 8v4M8 14l4-2 4 2M6 17l6-3 6 3M4 21h16"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Calendario/Fecha
export function CalendarIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Rect
          x="3"
          y="4"
          width="18"
          height="18"
          rx="2"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Path
          d="M16 2v4M8 2v4M3 10h18"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Estadísticas/Gráfico
export function StatsIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M18 20V10M12 20V4M6 20v-6"
          stroke={color}
          strokeWidth={strokeWidth + 1}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Árbol/Pedigrí
export function PedigreeIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Circle cx="12" cy="5" r="2.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="6" cy="13" r="2.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="18" cy="13" r="2.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="4" cy="20" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="9" cy="20" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="15" cy="20" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="20" cy="20" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Path
          d="M12 7.5v2M9 9.5l3-2 3 2M6 15.5v2M5 17.5l1-2 1 2M18 15.5v2M17 17.5l1-2 1 2"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Alerta/Campana
export function AlertIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Usuario/Perfil
export function UserIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Circle
          cx="12"
          cy="8"
          r="4"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Path
          d="M20 21c0-4-4-6-8-6s-8 2-8 6"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Añadir/Plus
export function PlusIcon({ size = 24, color = '#F5A623', strokeWidth = 2.5 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M12 5v14M5 12h14"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Check/Éxito
export function CheckIcon({ size = 24, color = '#22c55e', strokeWidth = 2.5 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M20 6L9 17l-5-5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Victoria/Corona
export function CrownIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M2 17l3-12 5 6 2-8 2 8 5-6 3 12H2z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M2 17h20v4H2z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono de Flecha/Rendimiento
export function PerformanceIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M23 6l-9.5 9.5-5-5L1 18"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M17 6h6v6"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Icono compacto para tabs - Gallo simplificado
export function RoosterTabIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M17 7c.5-.5 1-.5 1.2 0s0 1-.5 1.2l-.5.3c.2.5.2 1 0 1.5l-.2.5c.5.5.7 1 .5 1.7-.2.7-1 1.5-2 2l-.5.3c0 .5-.2 1-.7 1.2l-.8.2c-.7.2-1.7.2-2.5 0l-.7-.5c-.7-.5-1.5-1.2-2-2.2-.5-1-.7-2-.5-3l.2-.7c-.5-.5-.7-1-.5-1.5.2-.5.7-.7 1.2-.5l.7.2c-.2-.7 0-1.5.5-2s1.2-.7 2-.5l.7.5c.5-.5 1-.7 1.7-.5.7.2 1.2 1 1.5 1.7z"
          fill={color}
        />
        {/* Cola */}
        <Path
          d="M6 11c-.7-.7-1.2-2-1-3s1-1.5 1.7-1.2c.5.2.5.7.2 1.5-.2.7 0 1.5.5 2.2"
          fill={color}
        />
      </Svg>
    </View>
  );
}

// ============================================
// ICONOS DE ESTADO
// ============================================

// Victoria
export function WinIcon({ size = 24, color = '#22c55e' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
        <Path
          d="M8 12l3 3 5-6"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Derrota
export function LossIcon({ size = 24, color = '#ef4444' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
        <Path
          d="M15 9l-6 6M9 9l6 6"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ============================================
// EXPORTS LEGACY (compatibilidad)
// ============================================
export function BirdIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return <RoosterTabIcon size={size} color={color} />;
}
