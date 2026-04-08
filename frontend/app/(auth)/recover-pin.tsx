import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PhoneInput from '../../components/PhoneInput';
import { api } from '../../src/services/api';

type Step = 1 | 2 | 3;

export default function RecoverPinScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [telefono, setTelefono] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [nuevaPin, setNuevaPin] = useState('');
  const [confirmarPin, setConfirmarPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP digits
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Start timer when entering step 2
  useEffect(() => {
    if (step !== 2) return;
    setResendTimer(60);
    setCanResend(false);
    setDigits(['', '', '', '', '', '']);
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
    const focusTimeout = setTimeout(() => inputRefs.current[0]?.focus(), 300);
    return () => {
      clearInterval(interval);
      clearTimeout(focusTimeout);
    };
  }, [step]);

  // ── Step 1: enviar OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!telefono.trim()) {
      Alert.alert('Error', 'Ingresa tu número de teléfono');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { telefono: telefono.trim(), tipo: 'recuperar_pin' });
      setStep(2);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verificar OTP ──────────────────────────────────────────────────
  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride ?? digits.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }
    setCodigoOtp(code);
    setStep(3);
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
      handleVerifyOtp(newDigits.join(''));
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
      await api.post('/auth/send-otp', { telefono: telefono.trim(), tipo: 'recuperar_pin' });
      setResendTimer(60);
      setCanResend(false);
      Alert.alert('Código enviado', 'Revisa tu SMS o WhatsApp');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // ── Step 3: cambiar PIN ────────────────────────────────────────────────────
  const handleChangePin = async () => {
    if (!nuevaPin || nuevaPin.length < 4) {
      Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos');
      return;
    }
    if (nuevaPin !== confirmarPin) {
      Alert.alert('Error', 'Los PINs no coinciden');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/recover-pin', {
        telefono: telefono.trim(),
        codigo: codigoOtp,
        nuevo_pin: nuevaPin,
      });
      Alert.alert('PIN actualizado', 'Tu PIN fue cambiado exitosamente', [
        { text: 'Iniciar sesión', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = telefono
    ? `+${telefono.slice(0, 3)} ***-***-${telefono.slice(-4)}`
    : '';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (step > 1 ? setStep((step - 1) as Step) : router.back())}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>

          <Text style={styles.title}>Recuperar PIN</Text>

          {/* Progress indicator */}
          <View style={styles.progressRow}>
            {([1, 2, 3] as Step[]).map(s => (
              <React.Fragment key={s}>
                <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                  <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>
                    {s}
                  </Text>
                </View>
                {s < 3 && (
                  <View style={[styles.stepLine, step > s && styles.stepLineActive]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="phone-portrait-outline" size={48} color="#f59e0b" />
              </View>
              <Text style={styles.stepTitle}>Ingresa tu teléfono</Text>
              <Text style={styles.stepSubtitle}>
                Te enviaremos un código de verificación por SMS o WhatsApp
              </Text>

              <PhoneInput
                placeholder="Número de teléfono"
                onChangeText={setTelefono}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.buttonText}>Enviar código</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#f59e0b" />
              </View>
              <Text style={styles.stepTitle}>Verificar código</Text>
              <Text style={styles.stepSubtitle}>
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
                onPress={() => handleVerifyOtp()}
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
            </View>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed-outline" size={48} color="#f59e0b" />
              </View>
              <Text style={styles.stepTitle}>Nuevo PIN</Text>
              <Text style={styles.stepSubtitle}>
                Elige un PIN de 4 a 6 dígitos para tu cuenta
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nuevo PIN (4-6 dígitos)"
                  placeholderTextColor="#555555"
                  value={nuevaPin}
                  onChangeText={t => setNuevaPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  secureTextEntry={!showPin}
                  maxLength={6}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeIcon}>
                  <Ionicons
                    name={showPin ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar PIN"
                  placeholderTextColor="#555555"
                  value={confirmarPin}
                  onChangeText={t => setConfirmarPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  secureTextEntry={!showPin}
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleChangePin}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.buttonText}>Cambiar PIN</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flexGrow: 1, padding: 24, paddingTop: 16 },
  backBtn: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 24 },

  // Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#e0e0e0',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { borderColor: '#f59e0b', backgroundColor: '#f59e0b' },
  stepDotText: { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  stepDotTextActive: { color: '#000' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e0e0e0', maxWidth: 48, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#f59e0b' },

  // Step content
  stepContent: { flex: 1 },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 10 },
  stepSubtitle: { fontSize: 15, color: '#9ca3af', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  phoneText: { color: '#1a1a1a', fontWeight: '600' },

  // OTP digits
  digitsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 32 },
  digitInput: {
    width: 46, height: 58, borderRadius: 12, borderWidth: 2, borderColor: '#e0e0e0',
    backgroundColor: '#fff', textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#1a1a1a',
  },
  digitFilled: { borderColor: '#f59e0b' },

  // PIN inputs
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0',
  },
  inputIcon: { paddingLeft: 16 },
  input: { flex: 1, padding: 16, fontSize: 16, color: '#1a1a1a' },
  eyeIcon: { padding: 16 },

  // Button
  button: { backgroundColor: '#f59e0b', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#000' },

  // Resend
  resendBtn: { marginTop: 24, alignItems: 'center', paddingVertical: 8 },
  resendText: { color: '#f59e0b', fontSize: 15, fontWeight: '600' },
  resendDisabled: { color: '#9ca3af' },
});
