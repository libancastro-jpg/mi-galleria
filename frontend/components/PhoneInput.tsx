import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Country {
  name: string;
  flag: string;
  code: string;   // dial code without +, e.g. "1"
  iso: string;    // ISO 3166-1 alpha-2
  digitCount: number; // expected local digits (after country code)
}

const COUNTRIES: Country[] = [
  { name: 'Rep. Dominicana', flag: '🇩🇴', code: '1',   iso: 'DO', digitCount: 10 },
  { name: 'Estados Unidos',  flag: '🇺🇸', code: '1',   iso: 'US', digitCount: 10 },
  { name: 'Puerto Rico',     flag: '🇵🇷', code: '1',   iso: 'PR', digitCount: 10 },
  { name: 'Colombia',        flag: '🇨🇴', code: '57',  iso: 'CO', digitCount: 10 },
  { name: 'México',          flag: '🇲🇽', code: '52',  iso: 'MX', digitCount: 10 },
  { name: 'Venezuela',       flag: '🇻🇪', code: '58',  iso: 'VE', digitCount: 10 },
  { name: 'Panamá',          flag: '🇵🇦', code: '507', iso: 'PA', digitCount: 8  },
  { name: 'Ecuador',         flag: '🇪🇨', code: '593', iso: 'EC', digitCount: 9  },
  { name: 'Perú',            flag: '🇵🇪', code: '51',  iso: 'PE', digitCount: 9  },
  { name: 'Chile',           flag: '🇨🇱', code: '56',  iso: 'CL', digitCount: 9  },
  { name: 'Cuba',            flag: '🇨🇺', code: '53',  iso: 'CU', digitCount: 8  },
  { name: 'Honduras',        flag: '🇭🇳', code: '504', iso: 'HN', digitCount: 8  },
  { name: 'Guatemala',       flag: '🇬🇹', code: '502', iso: 'GT', digitCount: 8  },
  { name: 'El Salvador',     flag: '🇸🇻', code: '503', iso: 'SV', digitCount: 8  },
  { name: 'Nicaragua',       flag: '🇳🇮', code: '505', iso: 'NI', digitCount: 8  },
  { name: 'Costa Rica',      flag: '🇨🇷', code: '506', iso: 'CR', digitCount: 8  },
];

const DEFAULT_COUNTRY = COUNTRIES[0]; // Rep. Dominicana

interface PhoneInputProps {
  onChangeText: (fullNumber: string) => void;
  placeholder?: string;
}

export default function PhoneInput({ onChangeText, placeholder = 'Número de teléfono' }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [localNumber, setLocalNumber] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handleChangeText = (text: string) => {
    let digits = text.replace(/[^0-9]/g, '');
    const code = selectedCountry.code;

    // Strip "00" + country code (international dialing prefix)
    if (digits.startsWith('00' + code)) {
      digits = digits.slice(('00' + code).length);
    }
    // Strip country code when the remainder fits within the local digit count.
    // This is the key fix: checking remainder length (not total length) avoids
    // missing the case where code+local === digitCount characters total.
    else if (digits.startsWith(code)) {
      const afterCode = digits.slice(code.length);
      if (afterCode.length <= selectedCountry.digitCount) {
        digits = afterCode;
      }
    }

    digits = digits.slice(0, selectedCountry.digitCount);
    setLocalNumber(digits);
    onChangeText(digits ? code + digits : '');
  };

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setModalVisible(false);

    // Re-apply code-stripping logic against the new country's code
    let digits = localNumber;
    if (digits.startsWith(country.code)) {
      const afterCode = digits.slice(country.code.length);
      if (afterCode.length <= country.digitCount) {
        digits = afterCode;
      }
    }
    const trimmed = digits.slice(0, country.digitCount);
    setLocalNumber(trimmed);
    onChangeText(trimmed ? country.code + trimmed : '');
  };

  return (
    <>
      <View style={styles.container}>
        {/* Country selector */}
        <TouchableOpacity style={styles.countrySelector} onPress={() => setModalVisible(true)}>
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.dialCode}>+{selectedCountry.code}</Text>
          <Ionicons name="chevron-down" size={14} color="#9ca3af" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Number input */}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#555555"
          value={localNumber}
          onChangeText={handleChangeText}
          keyboardType="phone-pad"
          maxLength={selectedCountry.digitCount}
        />
      </View>

      {/* Country picker modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar país</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.iso}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryRow,
                  item.iso === selectedCountry.iso && styles.countryRowSelected,
                ]}
                onPress={() => handleSelectCountry(item)}
              >
                <Text style={styles.rowFlag}>{item.flag}</Text>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowCode}>+{item.code}</Text>
                {item.iso === selectedCountry.iso && (
                  <Ionicons name="checkmark" size={18} color="#f59e0b" />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 16,
    gap: 4,
  },
  flag: {
    fontSize: 20,
  },
  dialCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 32,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginRight: 4,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },

  // Modal
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryRowSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  rowFlag: {
    fontSize: 22,
  },
  rowName: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  rowCode: {
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 8,
  },
});
