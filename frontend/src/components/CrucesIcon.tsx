import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface CrucesIconProps {
  size?: number;
}

export const CrucesIcon: React.FC<CrucesIconProps> = ({ size = 24 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require('../../assets/icono_cruces.png')}
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

export default CrucesIcon;
