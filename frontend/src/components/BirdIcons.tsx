import React from 'react';
import Svg, { Path, Circle, G, Rect, Line, Ellipse } from 'react-native-svg';
import { View } from 'react-native';

/**
 * Sistema de Iconos Profesionales - Castador Pro
 * ============================================
 * Estilo: Minimalista, flat, siluetas limpias
 * Paleta: Dorado #F5A623, Verde #22c55e, Rojo #ef4444, Gris #6b7280
 * 
 * REGLAS TÉCNICAS:
 * - Todos los SVG usan viewBox cuadrado
 * - preserveAspectRatio="xMidYMid meet" (NUNCA "none")
 * - Contenedor View cuadrado con width=height=size
 * - Centrado con alignItems/justifyContent center
 * - NUNCA usar flex:1 ni stretch en iconos
 */

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// ============================================
// CÍRCULO DE PRUEBA - Para diagnóstico
// Si este círculo se ve ovalado, el problema es el contenedor
// ============================================
export function TestCircleIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return (
    <View style={{ 
      width: size, 
      height: size, 
      alignItems: 'center', 
      justifyContent: 'center',
      // backgroundColor: 'rgba(255,0,0,0.2)', // Debug: descomentar para ver contenedor
    }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet"
      >
        <Circle cx="50" cy="50" r="45" fill={color} />
      </Svg>
    </View>
  );
}

// ============================================
// ICONO PRINCIPAL DEL GALLO
// ============================================
// Silueta vectorial profesional - perfil izquierdo
// Postura VERTICAL erguida - gallo de pelea
// viewBox="0 0 512 512" - estándar para iconos
// ============================================
export function RoosterIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return (
    <View style={{ 
      width: size, 
      height: size, 
      alignItems: 'center', 
      justifyContent: 'center',
    }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 512 512" 
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Gallo de pelea - postura erguida y orgullosa */}
        <G>
          {/* Cabeza */}
          <Path
            d="M320 85
               c25 5 40 25 35 50
               l-8 25
               c10 15 8 35-5 48
               l-15 12"
            fill={color}
          />
          {/* Cresta grande y prominente */}
          <Path
            d="M295 45
               c8-25 35-30 50-12
               c10 12 5 30-8 38
               c12-18 35-15 45 5
               c8 15 0 35-18 40
               l-30 5
               c5-20-5-40-25-45
               l-14-31
               z"
            fill={color}
          />
          {/* Pico */}
          <Path
            d="M355 115
               l45 20
               l-45 18
               z"
            fill={color}
          />
          {/* Barbilla */}
          <Path
            d="M330 155
               c12 15 8 35-10 42
               c-15-5-15-28 0-45
               z"
            fill={color}
          />
          {/* Ojo */}
          <Circle cx="325" cy="105" r="10" fill="#1a1a1a" />
          {/* Cuello largo */}
          <Path
            d="M290 170
               c-15 10-30 35-35 60
               l-8 50
               c-5 25-2 50 8 72"
            fill={color}
          />
          {/* Cuerpo principal - pecho prominente */}
          <Path
            d="M255 352
               c-50-5-90-35-105-80
               c-18-55-5-115 35-155
               l40-30
               c10-8 22-12 35-10
               c35 5 60 35 70 70
               l8 45
               c5 35-5 72-30 100
               c-20 25-45 45-75 55
               l22 5
               z"
            fill={color}
          />
          {/* Cola arqueada - 3 plumas grandes */}
          <Path
            d="M148 280
               c-35-50-50-120-20-175
               c18-32 55-38 75-12
               c15 20 8 50-8 78
               c-18 35-15 75 8 110
               l-20 8
               c-15-2-28-5-35-9
               z"
            fill={color}
          />
          <Path
            d="M168 265
               c-30-55-38-125-5-172
               c20-28 55-30 72-5
               c12 20 2 48-15 75
               c-20 32-18 70 5 105
               l-25 5
               c-12-2-25-5-32-8
               z"
            fill={color}
          />
          <Path
            d="M190 248
               c-25-55-28-118 5-160
               c22-28 55-25 68 2
               c10 20-2 48-22 72
               c-22 30-22 68-2 100
               l-22 2
               c-12 0-22-5-27-16
               z"
            fill={color}
          />
          {/* Ala */}
          <Path
            d="M280 280
               c20-15 35-10 42 12
               c5 18-8 38-28 48
               c-25 12-48 8-62-12
               c15 5 32-2 40-18
               c5-12 2-25-8-32
               l16 2
               z"
            fill={color}
            opacity={0.9}
          />
          {/* Patas - fuertes y firmes */}
          <Path
            d="M235 440
               L235 480
               L210 500
               M235 480
               L235 500
               M235 480
               L260 500"
            stroke={color}
            strokeWidth={18}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M290 430
               L295 475
               L270 495
               M295 475
               L295 495
               M295 475
               L320 495"
            stroke={color}
            strokeWidth={18}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}

// ============================================
// ICONO DE GALLINA
// ============================================
export function HenIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return (
    <View style={{ 
      width: size, 
      height: size, 
      alignItems: 'center', 
      justifyContent: 'center',
    }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 512 512" 
        preserveAspectRatio="xMidYMid meet"
      >
        <G>
          {/* Cuerpo redondeado */}
          <Path
            d="M320 150
               c25-8 45 10 40 40
               l-12 35
               c15 28 10 60-10 88
               c-25 35-60 58-105 68
               l-30 8
               c0 22-15 42-38 50
               l-30 5
               c-28 2-55-5-80-22
               l-22-18
               c-28-22-48-55-55-95
               c-8-45 0-90 28-128
               l22-28
               c-15-18-18-42-5-62
               c15-25 48-28 75-12
               l28 18
               c0-30 18-55 48-65
               c32-12 65 2 85 32
               l22 28
               c25-15 55-12 78 8
               z"
            fill={color}
          />
          {/* Cola corta */}
          <Path
            d="M90 180
               c-30-32-42-82-22-125
               c15-28 50-32 65-8
               c12 20 2 48-12 75
               c-15 30-8 62 18 90
               l-22 5
               c-12-12-20-25-27-37
               z"
            fill={color}
          />
          {/* Cresta pequeña */}
          <Path
            d="M310 120
               c8-22 32-25 42-8
               c8-18 25-15 30 5
               l-25 15
               l-32 2
               z"
            fill={color}
          />
          {/* Pico */}
          <Path
            d="M358 175
               l50 22
               l-50 22
               z"
            fill={color}
          />
          {/* Barbilla */}
          <Path
            d="M335 225
               c12 22 2 42-22 40
               c-12-10-5-32 12-45
               z"
            fill={color}
          />
          {/* Ojo */}
          <Circle cx="330" cy="160" r="10" fill="#1a1a1a" />
          {/* Patas */}
          <Path
            d="M175 410 L175 465 L150 495 M175 465 L175 495 M175 465 L200 495"
            stroke={color}
            strokeWidth={15}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M235 400 L238 460 L213 490 M238 460 L238 490 M238 460 L263 490"
            stroke={color}
            strokeWidth={15}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}

// ============================================
// ICONOS DE MÓDULOS
// Todos con viewBox="0 0 24 24" estándar
// Grosor de línea consistente: 2px
// ============================================

export function TrophyIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
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

export function GeneticsIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
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

export function EggIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
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

export function HealthIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path d="M12 4v16M4 12h16" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth={strokeWidth} fill="none" />
      </Svg>
    </View>
  );
}

export function TrainingIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Circle cx="12" cy="5" r="3" stroke={color} strokeWidth={strokeWidth} fill="none" />
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

export function CalendarIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

export function StatsIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

export function PedigreeIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Circle cx="12" cy="5" r="2.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="6" cy="13" r="2.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="18" cy="13" r="2.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="4" cy="20" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="9" cy="20" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="15" cy="20" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle cx="20" cy="20" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Path d="M12 7.5v2M9 9.5l3-2 3 2M6 15.5v2M5 17.5l1-2 1 2M18 15.5v2M17 17.5l1-2 1 2" 
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

export function AlertIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
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

export function UserIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Path d="M20 21c0-4-4-6-8-6s-8 2-8 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

export function PlusIcon({ size = 24, color = '#F5A623', strokeWidth = 2.5 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

export function CheckIcon({ size = 24, color = '#22c55e', strokeWidth = 2.5 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}

export function CrownIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path d="M2 17l3-12 5 6 2-8 2 8 5-6 3 12H2zM2 17h20v4H2z" stroke={color} strokeWidth={strokeWidth} 
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}

export function PerformanceIcon({ size = 24, color = '#F5A623', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" stroke={color} strokeWidth={strokeWidth} 
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}

// Tab icon simplificado
export function RoosterTabIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M17 7c.5-.5 1-.5 1.2 0s0 1-.5 1.2l-.5.3c.2.5.2 1 0 1.5l-.2.5c.5.5.7 1 .5 1.7-.2.7-1 1.5-2 2l-.5.3c0 .5-.2 1-.7 1.2l-.8.2c-.7.2-1.7.2-2.5 0l-.7-.5c-.7-.5-1.5-1.2-2-2.2-.5-1-.7-2-.5-3l.2-.7c-.5-.5-.7-1-.5-1.5.2-.5.7-.7 1.2-.5l.7.2c-.2-.7 0-1.5.5-2s1.2-.7 2-.5l.7.5c.5-.5 1-.7 1.7-.5.7.2 1.2 1 1.5 1.7z"
          fill={color}
        />
        <Path d="M6 11c-.7-.7-1.2-2-1-3s1-1.5 1.7-1.2c.5.2.5.7.2 1.5-.2.7 0 1.5.5 2.2" fill={color} />
      </Svg>
    </View>
  );
}

// Estado - Victoria
export function WinIcon({ size = 24, color = '#22c55e' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
        <Path d="M8 12l3 3 5-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}

// Estado - Derrota
export function LossIcon({ size = 24, color = '#ef4444' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <Circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
        <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

// Legacy export
export function BirdIcon({ size = 24, color = '#F5A623' }: IconProps) {
  return <RoosterTabIcon size={size} color={color} />;
}
