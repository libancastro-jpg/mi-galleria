import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface GalloIconProps {
  size?: number;
  color?: string;
}

export const GalloLineaIcon: React.FC<GalloIconProps> = ({ size = 24 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require('../../assets/icono_gallo_linea.png')}
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
  image: {},
});

export default GalloLineaIcon;
