import React from 'react';
import { View, Image } from 'react-native';

/**
 * Logo Oficial del Gallo - Castador Pro
 * =====================================
 * Archivo: rooster-logo.png
 * 
 * NO MODIFICAR:
 * - No redibujar
 * - No reemplazar por icono del sistema
 * - No convertir a outline
 * - No aplicar stroke
 * - No aplicar transform
 */

// Importar imagen PNG como asset
const roosterLogo = require('../../assets/rooster-logo.png');

interface RoosterLogoProps {
  size?: number;
}

/**
 * Componente del Logo Oficial
 * Contenedor cuadrado, modo contain, centrado
 */
export function RoosterLogo({ size = 72 }: RoosterLogoProps) {
  return (
    <View style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Image
        source={roosterLogo}
        style={{
          width: size,
          height: size,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

export default RoosterLogo;
