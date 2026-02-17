import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, TouchableOpacity, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { GalloLineaIcon } from '../../src/components/GalloLineaIcon';

// Color palette - Tema Claro
const COLORS = {
  gold: '#d4a017',
  goldLight: 'rgba(212, 160, 23, 0.15)',
  grayDark: '#ffffff',
  grayMedium: '#e0e0e0',
  grayLight: '#555555',
  background: '#f5f5f5',
  textDark: '#1a1a1a',
  black: '#1a1a1a',
};

// Componente del menú desplegable
function ActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleNavigate = (route: string) => {
    setIsOpen(false);
    router.push(route as any);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.menuButtonInner}>
          <Ionicons name="apps" size={24} color={COLORS.gold} />
        </View>
        <Text style={styles.menuButtonLabel}>Más</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/(tabs)/cuido')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="timer" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.menuItemText}>Cuido</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/(tabs)/peleas')}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.menuItemText}>Peleas</Text>
            </TouchableOpacity>

            <View style={styles.menuArrow} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.grayDark,
          borderTopColor: COLORS.grayMedium,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.grayLight,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          width: 32,
          height: 32,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: () => (
            <Ionicons name="home" size={28} color={COLORS.black} />
          ),
        }}
      />
      <Tabs.Screen
        name="aves"
        options={{
          title: 'Aves',
          tabBarIcon: () => (
            <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
              <GalloLineaIcon size={30} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Salud',
          tabBarIcon: ({ color }) => (
            <Ionicons name="medical" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cuido"
        options={{
          title: 'Más',
          tabBarButton: () => <ActionMenu />,
        }}
      />
      <Tabs.Screen
        name="peleas"
        options={{
          href: null, // Oculto, accesible desde el menú
        }}
      />
      <Tabs.Screen
        name="cruces"
        options={{
          href: null, // Accesible desde Dashboard -> Acciones Rápidas
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    minWidth: 60,
  },
  menuButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  menuButtonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gold,
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  menuContainer: {
    backgroundColor: COLORS.grayDark,
    borderRadius: 16,
    padding: 8,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  menuItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  menuItemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  menuArrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.grayDark,
  },
});
