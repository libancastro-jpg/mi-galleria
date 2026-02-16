import React from 'react';
import { View, Image } from 'react-native';

/**
 * Logo Oficial del Gallo - Castador Pro
 * =====================================
 * Archivo: rooster-logo.png
 * 
 * NO MODIFICAR - Usar exactamente como está
 */

const roosterLogo = require('../../assets/rooster-logo.png');

interface RoosterLogoProps {
  size?: number;
}

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
