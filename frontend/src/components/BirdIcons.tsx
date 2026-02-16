import React from 'react';
import Svg, { Path, Circle, G, Rect, Line } from 'react-native-svg';

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
// ============================================
export function RoosterIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Silueta completa del gallo - perfil izquierdo, postura firme */}
      <Path
        d="M52 18
           C54 16 56 16 57 18
           C58 20 57 22 55 23
           L53 24
           C54 26 54 28 53 30
           L52 32
           C54 34 55 37 54 40
           C53 44 50 48 46 51
           L44 52
           C44 54 43 56 41 57
           L38 58
           C35 59 31 59 28 58
           L25 56
           C22 54 19 51 17 47
           C15 43 14 38 15 33
           L16 30
           C14 28 13 25 14 22
           C15 19 18 17 21 18
           L24 19
           C23 16 24 13 26 11
           C28 9 32 8 35 9
           L38 11
           C40 9 43 9 46 10
           C49 12 51 15 52 18
           Z"
        fill={color}
      />
      {/* Cola arqueada - plumas definidas */}
      <Path
        d="M15 30
           C11 26 8 20 9 14
           C10 11 13 9 16 10
           C18 11 18 14 17 17
           C16 21 17 25 19 28
           L18 30
           C17 30 16 30 15 30
           Z"
        fill={color}
      />
      <Path
        d="M18 28
           C15 23 13 17 15 12
           C16 9 20 8 22 10
           C23 12 22 15 21 18
           C20 22 21 26 23 29
           L22 30
           C20 30 19 29 18 28
           Z"
        fill={color}
      />
      <Path
        d="M21 27
           C19 23 18 18 20 14
           C22 11 25 10 27 12
           C28 14 27 17 26 20
           C25 23 26 27 28 30
           L26 30
           C24 29 22 28 21 27
           Z"
        fill={color}
      />
      {/* Cresta - proporcionada */}
      <Path
        d="M50 15
           C52 12 55 12 56 15
           C57 17 55 19 53 19
           L51 18
           C52 16 51 14 50 15
           Z"
        fill={color}
      />
      {/* Pico - afilado */}
      <Path
        d="M57 26
           L62 28
           L57 30
           Z"
        fill={color}
      />
      {/* Barbilla */}
      <Path
        d="M54 32
           C55 34 54 36 52 36
           C51 35 52 33 54 32
           Z"
        fill={color}
      />
      {/* Patas fuertes */}
      <Path
        d="M32 58 L32 62 L29 64 M32 62 L32 64 M32 62 L35 64"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M40 56 L41 61 L38 63 M41 61 L41 63 M41 61 L44 63"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// ============================================
// ICONO DE GALLINA
// Silueta más redondeada, perfil izquierdo
// ============================================
export function HenIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Cuerpo redondeado */}
      <Path
        d="M48 24
           C51 23 53 25 52 29
           L51 32
           C52 35 51 39 49 42
           C46 46 42 49 37 51
           L34 52
           C34 54 32 56 30 57
           L27 57
           C24 57 21 56 18 54
           L16 52
           C13 50 11 47 10 43
           C9 39 9 34 11 30
           L13 27
           C12 25 12 22 14 20
           C16 18 19 18 22 19
           L25 21
           C25 18 27 16 30 15
           C33 15 36 17 38 19
           L40 22
           C43 21 46 22 48 24
           Z"
        fill={color}
      />
      {/* Cola corta */}
      <Path
        d="M11 28
           C8 25 7 21 9 17
           C10 15 13 14 15 16
           C16 18 15 20 14 23
           C13 26 14 29 16 31
           L14 32
           C12 31 11 30 11 28
           Z"
        fill={color}
      />
      {/* Cresta pequeña */}
      <Path
        d="M47 20
           C48 18 50 18 51 20
           C52 18 53 19 53 21
           L51 22
           L48 22
           Z"
        fill={color}
      />
      {/* Pico */}
      <Path
        d="M53 27
           L58 29
           L53 31
           Z"
        fill={color}
      />
      {/* Barbilla */}
      <Path
        d="M50 33
           C51 35 50 36 48 36
           C47 35 48 34 50 33
           Z"
        fill={color}
      />
      {/* Patas */}
      <Path
        d="M24 57 L24 61 L21 63 M24 61 L24 63 M24 61 L27 63"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M32 56 L33 60 L30 62 M33 60 L33 62 M33 60 L36 62"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// ============================================
// ICONOS DE MÓDULOS - Estilo consistente
// Mismo grosor de línea (2px), estilo flat minimalista
// ============================================

// Icono de Trofeo/Rendimiento
export function TrophyIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 21h8M12 17v4M6 3h12M6 3c0 0-2 0-2 2v2c0 2 2 4 4 4M18 3c0 0 2 0 2 2v2c0 2-2 4-4 4M8 11c0 3 2 6 4 6s4-3 4-6V3H8v8z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Icono de Cruces/Genética
export function GeneticsIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
  );
}

// Icono de Huevo/Camadas
export function EggIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C8 3 5 8 5 13c0 4 3 8 7 8s7-4 7-8c0-5-3-10-7-10z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Icono de Salud/Médico
export function HealthIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
  );
}

// Icono de Cuido/Entrenamiento
export function TrainingIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
  );
}

// Icono de Calendario/Fecha
export function CalendarIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
  );
}

// Icono de Estadísticas/Gráfico
export function StatsIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 20V10M12 20V4M6 20v-6"
        stroke={color}
        strokeWidth={strokeWidth + 1}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Icono de Árbol/Pedigrí
export function PedigreeIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
  );
}

// Icono de Alerta/Campana
export function AlertIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Icono de Usuario/Perfil
export function UserIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
  );
}

// Icono de Añadir/Plus
export function PlusIcon({ size = 24, color = '#F5A623', strokeWidth = 2.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Icono de Check/Éxito
export function CheckIcon({ size = 24, color = '#22c55e', strokeWidth = 2.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Icono de Victoria/Corona
export function CrownIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
  );
}

// Icono de Flecha/Rendimiento
export function PerformanceIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
  );
}

// Icono compacto para tabs - Gallo simplificado
export function RoosterTabIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 7c1-1 2-1 2.5 0s0 2-1 2.5l-1 .5c.5 1 .5 2 0 3l-.5 1c1 1 1.5 2 1 3.5-.5 1.5-2 3-4 4l-1 .5c0 1-.5 2-1.5 2.5l-1.5.5c-1.5.5-3.5.5-5 0l-1.5-1c-1.5-1-3-2.5-4-4.5-1-2-1.5-4-1-6l.5-1.5c-1-1-1.5-2-1-3s1.5-1.5 2.5-1l1.5.5c-.5-1.5 0-3 1-4s2.5-1.5 4-1l1.5 1c1-1 2-1.5 3.5-1 1.5.5 2.5 2 3 3.5z"
        fill={color}
      />
      {/* Cola */}
      <Path
        d="M5 12c-1.5-1.5-2.5-4-2-6s2-3 3.5-2.5c1 .5 1 1.5.5 3-.5 1.5 0 3 1 4.5"
        fill={color}
      />
    </Svg>
  );
}

// ============================================
// ICONOS DE ESTADO
// ============================================

// Victoria
export function WinIcon({ size = 24, color = '#22c55e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
  );
}

// Derrota
export function LossIcon({ size = 24, color = '#ef4444' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
  );
}

// ============================================
// EXPORTS LEGACY (compatibilidad)
// ============================================
export function BirdIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return <RoosterTabIcon size={size} color={color} />;
}
