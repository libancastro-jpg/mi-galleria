import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { View } from 'react-native';

/**
 * Sistema de Iconos Profesionales - Castador Pro
 * ============================================
 * REGLAS DE DISEÑO:
 * - Todos los iconos usan viewBox="0 0 24 24" (estándar)
 * - Contenedor cuadrado con width=height=size
 * - preserveAspectRatio="xMidYMid meet"
 * - Stroke width consistente: 1.5-2px
 * - Estilo: Siluetas limpias, minimalistas
 * - Colores: Dorado activo (#F5A623), Gris inactivo (#6b7280)
 */

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// ============================================
// ICONO DE AVE/PÁJARO - Para navegación "Aves"
// Silueta limpia de pájaro volando
// ============================================
export function BirdIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M12 8c-2-3-5-4-8-3 2 2 3 4 3 6s-1 4-3 5c3 1 6 0 8-2 2 2 5 3 8 2-2-1-3-3-3-5s1-4 3-6c-3-1-6 0-8 3z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle cx="9" cy="10" r="1" fill={color} />
      </Svg>
    </View>
  );
}

// ============================================
// ICONO DE GALLO - Silueta minimalista
// Para filtros y detalles
// ============================================
export function RoosterIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        {/* Cresta */}
        <Path
          d="M13 3c0 1.5 1 2 2 2.5-.5 0-1 .5-1.5 1 .5.5 1 1 1 2"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Cabeza y cuerpo */}
        <Path
          d="M14.5 8.5c1.5 0 3 1 3 3s-1.5 3-3 3.5c0 1.5-.5 3-1.5 4h-2c-1-1-1.5-2.5-1.5-4-1.5-.5-3-1.5-3-3.5s1.5-3 3-3c.5-1.5 2-2.5 3.5-2.5 1 0 1.5.5 2 1.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Pico */}
        <Path
          d="M17.5 11.5l2-.5-2-.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Ojo */}
        <Circle cx="14.5" cy="10" r="0.8" fill={color} />
        {/* Barbilla */}
        <Path
          d="M14 13c.5.5.5 1.5 0 2"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        {/* Patas */}
        <Path
          d="M10 19v2M10 21l-1 1M10 21l1 1M13 19v2M13 21l-1 1M13 21l1 1"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Cola */}
        <Path
          d="M6 12c-1.5-1-2-3-1-4.5M5 12c-2-.5-3-2-2.5-3.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ============================================
// ICONO DE GALLINA - Silueta minimalista
// Para filtros y detalles
// ============================================
export function HenIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        {/* Cresta pequeña */}
        <Path
          d="M12 5c0 .8.5 1.2 1 1.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        {/* Cabeza y cuerpo redondeado */}
        <Path
          d="M13 6.5c1 0 2 .8 2 2s-.8 2-1.5 2.5c.5 1 .5 2-.5 3-1.5 1-4 1-5.5 0-1-1-1-2-.5-3-.7-.5-1.5-1.3-1.5-2.5s1-2 2-2c.3-1 1.5-1.5 2.5-1.5 1 0 2 .5 2.5 1.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Pico pequeño */}
        <Path
          d="M15 8.5l1.5-.3-1.5-.2"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Ojo */}
        <Circle cx="12.5" cy="8" r="0.6" fill={color} />
        {/* Barbilla pequeña */}
        <Path
          d="M12 10c.3.3.3.8 0 1"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        {/* Cola corta */}
        <Path
          d="M6 10c-1-.5-1.5-1.5-1-2.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        {/* Patas */}
        <Path
          d="M8 14v2.5M8 16.5l-.8.8M8 16.5l.8.8M11 14v2.5M11 16.5l-.8.8M11 16.5l.8.8"
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

// ============================================
// ICONO DE CABEZA DE GALLO - Para filtros compactos
// ============================================
export function RoosterHeadIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        {/* Cresta */}
        <Path
          d="M10 4c0 1.5 1 2.5 2 3M12 4c0 1.2.8 2.2 1.5 2.8M14 4.5c0 1 .5 1.8 1 2.3"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        {/* Cabeza */}
        <Path
          d="M8 12c0-3 2-5 5-5s5 2 5 5-2 5-5 6c-2 0-4-1-5-3"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Pico */}
        <Path
          d="M18 11l3-1-3-1"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Ojo */}
        <Circle cx="12" cy="10" r="1" fill={color} />
        {/* Barbilla */}
        <Path
          d="M11 14c0 1.5-1 3-2 3.5M13 14c0 1.5 1 3 2 3.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ============================================
// ICONO DE CABEZA DE GALLINA - Para filtros compactos
// ============================================
export function HenHeadIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        {/* Cresta pequeña */}
        <Path
          d="M11 6c.3-.8.8-1.5 1.5-2M13 6c.2-.6.5-1.2 1-1.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        {/* Cabeza redondeada */}
        <Path
          d="M8 12c0-2.5 1.8-4.5 4.5-4.5s4.5 2 4.5 4.5-2 4.5-4.5 5c-2 0-3.5-1-4.5-2.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Pico pequeño */}
        <Path
          d="M17 11l2-.5-2-.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Ojo */}
        <Circle cx="12" cy="10.5" r="0.8" fill={color} />
        {/* Barbilla pequeña */}
        <Path
          d="M11.5 14c0 1-.5 2-1 2.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ============================================
// ICONOS DE MÓDULOS - Consistentes con viewBox 24x24
// ============================================

export function TrophyIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M8 21h8M12 17v4M17 4h2c1 0 2 1 2 2v1c0 2-1.5 4-4 4M7 4H5c-1 0-2 1-2 2v1c0 2 1.5 4 4 4M7 4h10v7c0 3-2 6-5 6s-5-3-5-6V4z"
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

export function GeneticsIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M12 2v20M4 7c4-2 12-2 16 0M4 12c4 2 12 2 16 0M4 17c4-2 12-2 16 0"
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

export function EggIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M12 3c-4 0-7 5-7 10 0 4 3 8 7 8s7-4 7-8c0-5-3-10-7-10z"
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

export function HealthIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M12 6v12M6 12h12"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M4 4h16v16H4z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          rx="2"
        />
      </Svg>
    </View>
  );
}

export function UserIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Path
          d="M20 21c0-4-4-6-8-6s-8 2-8 6"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export function PedigreeIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Circle cx="12" cy="5" r="2.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="6" cy="13" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="18" cy="13" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="4" cy="20" r="1.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="9" cy="20" r="1.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="15" cy="20" r="1.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="20" cy="20" r="1.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Path
          d="M12 7.5V9M9 9.5l3-.5 3 .5M6 15v2.5M5 17l1-.5 1.5.5M18 15v2.5M17 17l1-.5 1.5.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export function CalendarIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zM16 2v4M8 2v4M2 10h20"
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

export function StatsIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M18 20V10M12 20V4M6 20v-6"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export function AlertIcon({ size = 24, color = '#F5A623', strokeWidth = 1.8 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
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

export function PlusIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M12 5v14M5 12h14"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export function CheckIcon({ size = 24, color = '#22c55e', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
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

// ============================================
// ICONOS DE ESTADO
// ============================================

export function WinIcon({ size = 24, color = '#22c55e' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
        <Path
          d="M8 12l3 3 5-6"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export function LossIcon({ size = 24, color = '#ef4444' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
        <Path
          d="M15 9l-6 6M9 9l6 6"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ============================================
// ALIASES / LEGACY EXPORTS
// ============================================
export const BirdNavIcon = BirdIcon;
export const RoosterTabIcon = RoosterIcon;
export const TrainingIcon = TrophyIcon;
export const CrownIcon = TrophyIcon;
export const PerformanceIcon = StatsIcon;
export const TestCircleIcon = BirdIcon;
