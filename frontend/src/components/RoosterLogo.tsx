import React from 'react';
import { View, Image } from 'react-native';

/**
 * Logo Oficial del Gallo - Castador Pro
 * =====================================
 * Archivo: rooster-logo.png (NO MODIFICAR)
 * 
 * Fondo dorado circular para mejorar contraste
 */

// Importar imagen PNG como asset
const roosterLogo = require('../../assets/rooster-logo.png');

interface RoosterLogoProps {
  size?: number;
}

/**
 * Componente del Logo Oficial
 * Con fondo dorado circular
 */
export function RoosterLogo({ size = 72 }: RoosterLogoProps) {
  const padding = 4;
  const imageSize = size - (padding * 2);
  
  return (
    <View style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5A623',
      borderRadius: size / 2,
      padding: padding,
    }}>
      <Image
        source={roosterLogo}
        style={{
          width: imageSize,
          height: imageSize,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

export default RoosterLogo;
