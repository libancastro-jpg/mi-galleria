import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

type Step = 'login' | 'recover_send' | 'recover_verify';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  // ── Login ──────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('login');
  const [telefono, setTelefono] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Recuperar PIN ──────────────────────────────────────────
  const [recoverTelefono, setRecoverTelefono] = useState('');
  const [recoverOtp, setRecoverOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [canalEnvio, setCanalEnvio] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingRecover, setLoadingRecover] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  // ── Cooldown ───────────────────────────────────────────────
  const startCooldown = (seconds: number = 60) => {
    setResendCooldown(seconds);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Login normal ───────────────────────────────────────────
  const handleLogin = async () => {
    if (!telefono.trim()) {
      Alert.alert('Error', 'Ingresa tu número de teléfono');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos');
      return;
    }
    setLoading(true);
    try {
      await login(telefono.trim(), pin);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Enviar OTP para recuperar PIN ──────────────────────────
  const handleSendRecoverOTP = async () => {
    if (!recoverTelefono.trim()) {
      Alert.alert('Error', 'Ingresa tu número de teléfono');
      return;
    }
    setLoadingSend(true);
    try {
      const result = await api.post('/auth/send-otp', {
        telefono: recoverTelefono.trim(),
        tipo: 'recuperar_pin',
      });
      setCanalEnvio(result.canal || 'whatsapp');
      setStep('recover_verify');
      startCooldown(60);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'No se pudo enviar el código';
      Alert.alert('Error', msg);
    } finally {
      setLoadingSend(false);
    }
  };

  // ── Verificar OTP y cambiar PIN ────────────────────────────
  const handleRecoverPin = async () => {
    if (!recoverOtp.trim() || recoverOtp.length < 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }
    if (!newPin.trim() || newPin.length < 4) {
      Alert.alert('Error', 'El nuevo PIN debe tener al menos 4 dígitos');
      return;
    }
    if (newPin !== confirmNewPin) {
      Alert.alert('Error', 'Los PINs no coinciden');
      return;
    }
    setLoadingRecover(true);
    try {
      await api.post('/auth/recover-pin', {
        telefono: recoverTelefono.trim(),
        codigo: recoverOtp.trim(),
        nuevo_pin: newPin,
      });
      Alert.alert(
        '✅ PIN actualizado',
        'Tu PIN fue cambiado correctamente. Ya puedes iniciar sesión.',
        [{ text: 'Iniciar sesión', onPress: () => { setStep('login'); setRecoverOtp(''); setNewPin(''); setConfirmNewPin(''); } }]
      );
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'No se pudo recuperar el PIN';
      Alert.alert('Error', msg);
    } finally {
      setLoadingRecover(false);
    }
  };

  // ── Reenviar OTP ───────────────────────────────────────────
  const handleResend = async (canal: 'whatsapp' | 'sms') => {
    setLoadingResend(true);
    try {
      const result = await api.post('/auth/send-otp', {
        telefono: recoverTelefono.trim(),
        tipo: 'recuperar_pin',
      });
      setCanalEnvio(result.canal || canal);
      startCooldown(60);
      Alert.alert('✅ Código reenviado', `Te enviamos un nuevo código por ${canal === 'whatsapp' ? 'WhatsApp' : 'SMS'}`);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'No se pudo reenviar el código';
      Alert.alert('Error', msg);
    } finally {
      setLoadingResend(false);
    }
  };

  // ── RENDER: Login ──────────────────────────────────────────
  if (step === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Mi Galleria</Text>
              <Text style={styles.subtitle}>Gestión de Gallos de Pelea</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Número de teléfono"
                  placeholderTextColor="#555555"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="PIN (4-6 dígitos)"
                  placeholderTextColor="#555555"
                  value={pin}
                  onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  secureTextEntry={!showPin}
                  maxLength={6}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeIcon}>
                  <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Olvidé mi PIN */}
              <TouchableOpacity
                style={styles.forgotPin}
                onPress={() => { setStep('recover_send'); setRecoverTelefono(telefono); }}
              >
                <Text style={styles.forgotPinText}>¿Olvidaste tu PIN?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>

              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>¿No tienes cuenta? </Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.link}>Regístrate</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── RENDER: Recuperar — Paso 1 (ingresar teléfono) ────────
  if (step === 'recover_send') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <View style={styles.otpIconContainer}>
                <Ionicons name="lock-open-outline" size={48} color="#F5A623" />
              </View>
              <Text style={styles.title}>Recuperar PIN</Text>
              <Text style={styles.subtitle}>
                Ingresa tu número y te enviaremos un código por WhatsApp para crear un nuevo PIN
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Número de teléfono"
                  placeholderTextColor="#555555"
                  value={recoverTelefono}
                  onChangeText={setRecoverTelefono}
                  keyboardType="phone-pad"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loadingSend && styles.buttonDisabled]}
                onPress={handleSendRecoverOTP}
                disabled={loadingSend}
              >
                {loadingSend ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>Enviar código</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={() => setStep('login')}>
                <Ionicons name="arrow-back" size={18} color="#6b7280" />
                <Text style={styles.backButtonText}>Volver al inicio de sesión</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── RENDER: Recuperar — Paso 2 (código + nuevo PIN) ───────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.otpIconContainer}>
              <Ionicons
                name={canalEnvio === 'whatsapp' ? 'logo-whatsapp' : 'chatbox-outline'}
                size={48}
                color={canalEnvio === 'whatsapp' ? '#25D366' : '#F5A623'}
              />
            </View>
            <Text style={styles.title}>Nuevo PIN</Text>
            <Text style={styles.subtitle}>
              Ingresa el código que enviamos por{' '}
              <Text style={{ fontWeight: '700', color: canalEnvio === 'whatsapp' ? '#25D366' : '#F5A623' }}>
                {canalEnvio === 'whatsapp' ? 'WhatsApp' : 'SMS'}
              </Text>
              {'\n'}al número {recoverTelefono}
            </Text>
          </View>

          <View style={styles.form}>
            {/* Código OTP */}
            <View style={[styles.inputContainer, styles.otpInput]}>
              <Ionicons name="keypad-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.otpText]}
                placeholder="_ _ _ _ _ _"
                placeholderTextColor="#aaa"
                value={recoverOtp}
                onChangeText={(text) => setRecoverOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
            </View>

            {/* Nuevo PIN */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nuevo PIN (4-6 dígitos)"
                placeholderTextColor="#555555"
                value={newPin}
                onChangeText={(text) => setNewPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="numeric"
                secureTextEntry={!showNewPin}
                maxLength={6}
              />
              <TouchableOpacity onPress={() => setShowNewPin(!showNewPin)} style={styles.eyeIcon}>
                <Ionicons name={showNewPin ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Confirmar PIN */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar nuevo PIN"
                placeholderTextColor="#555555"
                value={confirmNewPin}
                onChangeText={(text) => setConfirmNewPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="numeric"
                secureTextEntry={!showNewPin}
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, (loadingRecover || recoverOtp.length < 6 || newPin.length < 4) && styles.buttonDisabled]}
              onPress={handleRecoverPin}
              disabled={loadingRecover || recoverOtp.length < 6 || newPin.length < 4}
            >
              {loadingRecover ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Cambiar PIN</Text>
              )}
            </TouchableOpacity>

            {/* Reenviar */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendLabel}>¿No recibiste el código?</Text>
              {resendCooldown > 0 ? (
                <Text style={styles.cooldownText}>Reenviar en {resendCooldown}s</Text>
              ) : (
                <View style={styles.resendButtons}>
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={() => handleResend('whatsapp')}
                    disabled={loadingResend}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    <Text style={[styles.resendButtonText, { color: '#25D366' }]}>Reenviar por WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={() => handleResend('sms')}
                    disabled={loadingResend}
                  >
                    <Ionicons name="chatbox-outline" size={16} color="#F5A623" />
                    <Text style={[styles.resendButtonText, { color: '#F5A623' }]}>Enviar por SMS</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => { setStep('recover_send'); setRecoverOtp(''); }}
            >
              <Ionicons name="arrow-back" size={18} color="#6b7280" />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  logoImage: { width: 120, height: 120 },
  otpIconContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff', borderRadius: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0',
  },
  inputIcon: { paddingLeft: 16 },
  input: { flex: 1, padding: 16, fontSize: 16, color: '#1a1a1a' },
  eyeIcon: { padding: 16 },
  otpInput: { borderColor: '#F5A623', borderWidth: 2, marginBottom: 20 },
  otpText: { fontSize: 24, fontWeight: '800', letterSpacing: 8, textAlign: 'center' },
  forgotPin: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotPinText: { color: '#F5A623', fontSize: 14, fontWeight: '600' },
  button: {
    backgroundColor: '#f59e0b', padding: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#000' },
  linkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  linkText: { color: '#9ca3af', fontSize: 14 },
  link: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },
  resendContainer: { marginTop: 24, alignItems: 'center' },
  resendLabel: { color: '#6b7280', fontSize: 14, marginBottom: 12 },
  cooldownText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  resendButtons: { gap: 10, width: '100%' },
  resendButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  resendButtonText: { fontSize: 14, fontWeight: '600' },
  backButton: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, marginTop: 20, paddingVertical: 10,
  },
  backButtonText: { color: '#6b7280', fontSize: 14 },
});
