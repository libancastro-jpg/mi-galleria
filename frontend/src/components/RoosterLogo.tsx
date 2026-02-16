import React from 'react';
import { View, Image } from 'react-native';

/**
 * Logo Oficial del Gallo - Castador Pro
 * =====================================
 * Archivo: rooster-logo.png
 * 
 * Con círculo amarillo de fondo
 * Logo ocupa 85-90% del círculo
 */

const roosterLogo = require('../../assets/rooster-logo.png');

interface RoosterLogoProps {
  size?: number;
}

export function RoosterLogo({ size = 72 }: RoosterLogoProps) {
  // Logo ocupa 90% del círculo
  const imageSize = size * 0.9;
  
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
