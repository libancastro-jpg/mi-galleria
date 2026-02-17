import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface CamadaLogoProps {
  size?: number;
}

export const CamadaLogo: React.FC<CamadaLogoProps> = ({ size = 48 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require('../../assets/camadas_logo.png')}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    tintColor: undefined, // Mantener colores originales
  },
});

export default CamadaLogo;
