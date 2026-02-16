import React from 'react';
import { View, Image } from 'react-native';

/**
 * Logo Oficial del Gallo - Castador Pro
 * =====================================
 * Archivo: rooster-logo.png
 * 
 * Con círculo amarillo de fondo
 * Logo aumentado para compensar transparencia
 */

const roosterLogo = require('../../assets/rooster-logo.png');

interface RoosterLogoProps {
  size?: number;
}

export function RoosterLogo({ size = 72 }: RoosterLogoProps) {
  // Logo 115% del círculo para compensar transparencia del PNG
  const imageSize = size * 1.15;
  
  return (
    <View style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5A623',
      borderRadius: size / 2,
      overflow: 'hidden',
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
