import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

interface RoosterIconProps {
  size?: number;
  color?: string;
}

// Icono de gallo más visible y reconocible
export function RoosterIcon({ size = 24, color = '#d4a017' }: RoosterIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Cuerpo */}
      <Path
        d="M20 52 C12 52 8 44 10 36 C12 28 18 24 26 24 L40 24 C48 24 54 30 54 38 C54 46 48 52 40 52 Z"
        fill={color}
      />
      {/* Cabeza */}
      <Circle cx="48" cy="20" r="10" fill={color} />
      {/* Cresta */}
      <Path
        d="M44 10 Q46 4 50 8 Q52 4 56 10 Q54 12 52 10 Q50 14 48 10 Q46 14 44 10"
        fill="#c41e3a"
      />
      {/* Ojo */}
      <Circle cx="50" cy="18" r="2" fill="#000" />
      {/* Pico */}
      <Path
        d="M58 20 L64 22 L58 24 Z"
        fill="#e67e22"
      />
      {/* Barbilla */}
      <Path
        d="M52 28 Q54 32 50 34 Q48 32 50 28"
        fill="#c41e3a"
      />
      {/* Cola */}
      <Path
        d="M8 36 Q0 28 4 16 Q8 20 10 28 Q6 20 8 12 Q14 18 14 28 Q10 18 14 10 Q18 16 16 28"
        fill={color}
      />
      {/* Patas */}
      <Path
        d="M28 52 L28 58 L24 62 M28 58 L28 62 M28 58 L32 62"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M40 52 L40 58 L36 62 M40 58 L40 62 M40 58 L44 62"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Ala */}
      <Path
        d="M24 32 Q32 28 38 34 Q32 38 24 36 Z"
        fill={color}
        opacity="0.7"
      />
    </Svg>
  );
}

// Icono de gallina
export function HenIcon({ size = 24, color = '#8b4513' }: RoosterIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Cuerpo */}
      <Path
        d="M16 50 C8 50 6 42 8 34 C10 26 18 22 28 22 L42 22 C50 22 54 28 54 36 C54 44 48 50 40 50 Z"
        fill={color}
      />
      {/* Cabeza */}
      <Circle cx="50" cy="22" r="8" fill={color} />
      {/* Cresta pequeña */}
      <Path
        d="M48 14 Q50 10 52 14 Q54 10 56 14"
        fill="#c41e3a"
      />
      {/* Ojo */}
      <Circle cx="52" cy="20" r="1.5" fill="#000" />
      {/* Pico */}
      <Path
        d="M58 22 L62 24 L58 26 Z"
        fill="#e67e22"
      />
      {/* Barbilla pequeña */}
      <Path
        d="M52 28 Q54 30 52 32"
        fill="#c41e3a"
      />
      {/* Cola corta */}
      <Path
        d="M6 34 Q2 28 6 22 Q10 26 8 32"
        fill={color}
      />
      {/* Patas */}
      <Path
        d="M26 50 L26 56 L22 60 M26 56 L26 60 M26 56 L30 60"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M38 50 L38 56 L34 60 M38 56 L38 60 M38 56 L42 60"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Ala */}
      <Path
        d="M22 30 Q30 26 36 32 Q30 36 22 34 Z"
        fill={color}
        opacity="0.7"
      />
    </Svg>
  );
}

// Icono simple de ave para espacios pequeños
export function BirdIcon({ size = 24, color = '#d4a017' }: RoosterIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M21.5 9.5c-.3-.4-.7-.6-1.2-.5l-1.3.3c-.1-.4-.2-.8-.4-1.2l1.2-.6c.4-.2.7-.6.7-1.1s-.2-.9-.6-1.1l-1.8-1c-.2-.1-.4-.2-.6-.2-.6 0-1.1.4-1.3.9l-.4 1.2-1.1-.5c-.1-.5-.3-1-.6-1.4-.4-.5-.9-.9-1.5-1.1C13.1 3 12.5 3 12 3.1c-.5.1-1 .3-1.4.6-.4.3-.7.6-.9 1-.3.5-.4 1.1-.4 1.7 0 .1 0 .3.1.4l-1.5.4c-.1 0-.2.1-.3.1l-1.4.6c-.5.2-.8.6-.9 1.1s0 1 .3 1.4l1 1.3-.9 1c-.3.4-.4.9-.3 1.4.1.5.4.9.8 1.1l1.5.8-.1 1.7c0 .5.2 1 .5 1.3.3.3.8.5 1.2.5h.1l1.7-.1.8 1.5c.2.4.6.7 1.1.8.1 0 .2 0 .3 0 .4 0 .8-.2 1.1-.5l1-1 1.3 1c.3.2.6.3 1 .3.2 0 .4 0 .6-.1.5-.2.8-.5 1-1l.5-1.5 1.3-.4c.5-.1.9-.5 1.1-.9.2-.5.1-1-.2-1.4l-.8-1 .6-1.4c.2-.4.2-.9 0-1.3-.2-.4-.5-.8-1-1l-1.2-.4v-1.4c0-.5-.2-.9-.6-1.2zM12 15c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
    </Svg>
  );
}
