import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useAuth } from '../../src/context/AuthContext';
import { firebaseConfig } from '../../src/config/firebase';
import {
  getOtpSession,
  clearOtpSession,
  sendVerificationCode,
  confirmVerificationCode,
  toE164,
} from '../../src/services/otpService';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const recaptchaVerifierRef = useRef<FirebaseRecaptchaVerifierModal>(null);
  const { telefono, pin, nombre, email } = useLocalSearchParams<{
    telefono: string;
    pin: string;
    nombre: string;
    email?: string;
  }>();
  const { register } = useAuth();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => inputRefs.current[0]?.focus(), 300);
    return () => clearTimeout(timeout);
  }, []);

  const handleVerify = async (codeOverride?: string) => {
    const code = codeOverride ?? digits.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }

    const session = getOtpSession();
    if (!session) {
      Alert.alert(
        'Sesión expirada',
        'La sesión de verificación expiró. Regresa e inicia el registro de nuevo.',
        [{ text: 'Regresar', onPress: () => router.back() }]
      );
      return;
    }

    setLoading(true);
    try {
      const credential = await confirmVerificationCode(session, code);
      const idToken = await credential.user.getIdToken();
      await register(idToken, pin!, email || undefined, nombre!);
      clearOtpSession();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Código incorrecto', error.message);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && newDigits.every(d => d !== '')) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await sendVerificationCode(toE164(telefono!), recaptchaVerifierRef.current!);
      setResendTimer(60);
      setCanResend(false);
      Alert.alert('Código enviado', 'Revisa tu SMS');
    } catch (error: any) {
      Alert.alert('Error al reenviar', error.message);
    }
  };

  const maskedPhone = telefono
    ? `+${telefono.slice(0, 3)} ***-***-${telefono.slice(-4)}`
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifierRef}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={52} color="#f59e0b" />
          </View>

          <Text style={styles.title}>Verificar número</Text>
          <Text style={styles.subtitle}>
            Código enviado a{'\n'}
            <Text style={styles.phoneText}>{maskedPhone}</Text>
          </Text>

          <View style={styles.digitsRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={r => { inputRefs.current[i] = r; }}
                style={[styles.digitInput, d ? styles.digitFilled : null]}
                value={d}
                onChangeText={t => handleDigitChange(t, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => handleVerify()}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.buttonText}>Verificar</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            disabled={!canResend}
            style={styles.resendBtn}
          >
            <Text style={[styles.resendText, !canResend && styles.resendDisabled]}>
              {canResend ? 'Reenviar código' : `Reenviar en ${resendTimer}s`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flexGrow: 1, padding: 24, paddingTop: 16 },
  backBtn: { marginBottom: 32 },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#9ca3af', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  phoneText: { color: '#1a1a1a', fontWeight: '600' },
  digitsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 32 },
  digitInput: {
    width: 46, height: 58, borderRadius: 12, borderWidth: 2, borderColor: '#e0e0e0',
    backgroundColor: '#fff', textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#1a1a1a',
  },
  digitFilled: { borderColor: '#f59e0b' },
  button: { backgroundColor: '#f59e0b', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#000' },
  resendBtn: { marginTop: 24, alignItems: 'center', paddingVertical: 8 },
  resendText: { color: '#f59e0b', fontSize: 15, fontWeight: '600' },
  resendDisabled: { color: '#9ca3af' },
});
