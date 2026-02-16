import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

interface RoosterIconProps {
  size?: number;
  color?: string;
}

// Icono de gallo de pelea elegante - silueta profesional
export function RoosterIcon({ size = 24, color = '#d4a017' }: RoosterIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Silueta completa de gallo de pelea elegante */}
      <Path
        d="M75 25 
           C78 22 82 20 85 22
           C88 24 86 28 83 30
           L78 32
           C80 34 81 37 80 40
           C79 43 76 45 73 45
           L70 44
           C72 48 73 52 72 56
           C71 62 68 67 63 70
           L60 72
           C62 74 63 77 62 80
           L58 82
           C56 86 52 88 48 88
           L44 87
           C40 86 36 84 33 81
           L30 78
           C26 76 22 73 20 69
           C18 65 17 60 18 55
           L20 50
           C18 48 16 45 15 42
           C14 38 15 34 18 31
           C20 28 24 26 28 27
           L32 29
           C30 26 29 22 30 18
           C31 14 34 11 38 10
           C42 9 46 10 49 13
           L52 16
           C54 14 57 13 60 14
           C64 15 67 18 68 22
           L69 26
           C71 24 73 23 75 25
           Z
           M35 55 
           C32 55 30 58 30 61
           C30 64 32 67 35 68
           L38 68
           C44 68 49 66 53 62
           L56 59
           C58 57 59 54 58 51
           C57 48 54 46 51 46
           L47 47
           C43 48 39 51 35 55
           Z"
        fill={color}
        fillRule="evenodd"
      />
      {/* Cola dramática con plumas */}
      <Path
        d="M15 42
           C10 38 6 32 5 25
           C4 20 6 15 10 12
           C12 10 15 10 17 12
           L18 16
           C16 20 16 25 18 30
           L20 35
           C18 37 16 40 15 42
           Z"
        fill={color}
      />
      <Path
        d="M18 35
           C14 30 11 24 12 18
           C13 14 16 11 20 10
           C22 9 25 10 26 13
           L25 18
           C24 22 25 27 27 31
           L28 34
           C25 35 21 35 18 35
           Z"
        fill={color}
      />
      <Path
        d="M22 32
           C20 27 19 21 22 16
           C24 12 28 10 32 11
           C34 12 35 14 34 17
           L32 21
           C31 25 32 29 34 33
           L33 35
           C29 35 25 34 22 32
           Z"
        fill={color}
      />
      {/* Patas elegantes */}
      <Path
        d="M42 88
           L42 94
           L38 98
           M42 94
           L42 98
           M42 94
           L46 98"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M55 85
           L56 92
           L52 96
           M56 92
           L56 96
           M56 92
           L60 96"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Cresta prominente */}
      <Path
        d="M72 22
           C74 18 77 16 80 18
           C82 20 81 24 78 26
           L75 25
           C77 22 76 19 74 20
           C72 21 72 23 72 22
           Z"
        fill="#c41e3a"
      />
      {/* Ojo */}
      <Circle cx="76" cy="32" r="2" fill="#1a1a1a" />
      {/* Pico afilado */}
      <Path
        d="M83 35
           L92 38
           L83 41
           Z"
        fill="#e67e22"
      />
      {/* Barbilla */}
      <Path
        d="M78 42
           C80 45 79 48 76 49
           C74 48 74 45 76 43
           Z"
        fill="#c41e3a"
      />
    </Svg>
  );
}

// Icono de gallina elegante
export function HenIcon({ size = 24, color = '#8b4513' }: RoosterIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Cuerpo de gallina más redondeado */}
      <Path
        d="M70 35
           C75 33 78 35 78 40
           L76 45
           C78 48 78 52 76 56
           C74 62 70 67 64 70
           L58 73
           C58 76 56 79 53 81
           L48 82
           C44 82 40 81 36 79
           L32 76
           C28 74 25 71 23 67
           C20 62 19 56 21 50
           L24 45
           C22 42 22 38 24 35
           C26 32 30 31 34 32
           L38 34
           C38 30 40 27 44 26
           C48 25 52 27 55 30
           L58 33
           C61 32 65 32 68 34
           L70 35
           Z"
        fill={color}
      />
      {/* Cola corta */}
      <Path
        d="M21 48
           C17 44 15 39 16 34
           C17 31 20 29 23 30
           L24 33
           C23 37 24 41 26 45
           L24 47
           C23 47 22 48 21 48
           Z"
        fill={color}
      />
      {/* Cabeza */}
      <Circle cx="72" cy="38" r="8" fill={color} />
      {/* Cresta pequeña */}
      <Path
        d="M70 30
           C71 28 73 28 74 30
           C75 28 77 28 78 30
           L76 32
           L72 32
           Z"
        fill="#c41e3a"
      />
      {/* Ojo */}
      <Circle cx="74" cy="36" r="1.5" fill="#1a1a1a" />
      {/* Pico */}
      <Path
        d="M80 38
           L86 40
           L80 42
           Z"
        fill="#e67e22"
      />
      {/* Barbilla pequeña */}
      <Path
        d="M74 44
           C75 46 74 48 72 48
           C71 47 72 45 74 44
           Z"
        fill="#c41e3a"
      />
      {/* Patas */}
      <Path
        d="M40 82
           L40 90
           L36 94
           M40 90
           L40 94
           M40 90
           L44 94"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M52 80
           L53 88
           L49 92
           M53 88
           L53 92
           M53 88
           L57 92"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
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
