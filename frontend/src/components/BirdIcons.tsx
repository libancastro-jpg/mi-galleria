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
// SVG fijo desde assets/rooster.svg
// NO MODIFICAR - Usar exactamente este diseño
// Contenedor cuadrado, modo contain
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
        {/* SVG fijo - NO MODIFICAR */}
        <Path fill={color} d="
          M169 120
          C145 132 132 154 131 176
          C130 200 140 220 156 234
          C126 248 110 270 110 297
          C110 333 136 360 175 367
          C206 372 237 364 260 347
          C271 368 287 389 308 405
          C340 430 381 444 427 446
          C436 446 444 439 444 430
          C444 421 436 414 427 414
          C396 413 368 405 345 391
          C363 388 382 379 401 364
          C408 358 410 348 404 341
          C399 334 388 332 381 338
          C360 352 339 359 319 359
          C315 359 311 359 307 358
          C316 350 322 340 326 330
          C348 338 372 336 395 324
          C403 320 406 310 402 302
          C398 294 388 291 380 295
          C360 305 341 305 325 297
          C327 286 327 274 325 262
          C355 255 377 239 389 215
          C395 203 399 190 401 176
          C415 173 426 166 433 156
          C439 148 441 139 439 131
          C437 123 431 118 424 116
          C416 114 407 117 399 123
          C391 108 379 96 365 88
          C349 80 332 78 316 81
          C306 62 287 49 264 46
          C240 43 214 52 199 72
          C186 69 175 73 169 80
          C163 87 163 96 169 103
          C174 109 182 112 190 114
          C183 117 176 119 169 120
          Z
          M225 102
          C238 92 257 90 273 95
          C288 99 299 110 303 124
          C305 131 312 136 320 135
          C333 133 346 135 357 141
          C370 149 379 163 380 178
          C381 186 379 195 375 203
          C366 220 347 232 320 236
          C311 237 305 245 307 254
          C310 269 309 284 304 297
          C296 316 280 333 257 345
          C235 356 208 360 184 354
          C161 348 144 328 144 305
          C144 283 160 266 189 258
          C200 255 202 240 193 235
          C173 223 164 203 165 182
          C167 163 180 145 204 136
          C211 133 216 126 214 118
          C212 111 215 106 225 102
          Z
          M205 368
          C198 386 196 400 196 414
          C196 423 189 430 180 430
          C171 430 164 423 164 414
          C164 395 169 375 179 356
          C183 348 193 345 201 349
          C209 353 212 361 205 368
          Z
          M240 360
          C234 378 232 395 232 414
          C232 423 225 430 216 430
          C207 430 200 423 200 414
          C200 393 204 372 213 351
          C216 343 226 339 234 343
          C242 347 246 354 240 360
          Z
        "/>
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
