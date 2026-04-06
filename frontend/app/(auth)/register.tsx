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

type Step = 'datos' | 'verificar';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  // ── Paso 1: datos ──────────────────────────────────────────
  const [step, setStep] = useState<Step>('datos');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // ── Paso 2: OTP ────────────────────────────────────────────
  const [otp, setOtp] = useState('');
  const [canalEnvio, setCanalEnvio] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Loading ────────────────────────────────────────────────
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  // ── Cooldown timer ─────────────────────────────────────────
  const startCooldown = (seconds: number = 60) => {
    setResendCooldown(seconds);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Paso 1: validar y enviar OTP ──────────────────────────
  const handleSendOTP = async () => {
    if (!telefono.trim()) {
      Alert.alert('Error', 'El número de teléfono es obligatorio');
      return;
    }
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la galleria es obligatorio');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Error', 'Los PINs no coinciden');
      return;
    }

    setLoadingSend(true);
    try {
      const result = await api.post('/auth/send-otp', {
        telefono: telefono.trim(),
        tipo: 'registro',
      });
      setCanalEnvio(result.canal || 'whatsapp');
      setStep('verificar');
      startCooldown(60);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'No se pudo enviar el código';
      Alert.alert('Error', msg);
    } finally {
      setLoadingSend(false);
    }
  };

  // ── Paso 2: verificar OTP y registrar ─────────────────────
  const handleVerifyAndRegister = async () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }

    setLoadingVerify(true);
    try {
      // 1. Verificar OTP
      await api.post('/auth/verify-otp', {
        telefono: telefono.trim(),
        codigo: otp.trim(),
        tipo: 'registro',
      });

      // 2. Registrar usuario
      await register(
        telefono.trim(),
        pin,
        email.trim() || undefined,
        nombre.trim() || undefined
      );

      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Error al verificar el código';
      Alert.alert('Error', msg);
    } finally {
      setLoadingVerify(false);
    }
  };

  // ── Reenviar código ────────────────────────────────────────
  const handleResend = async (canal: 'whatsapp' | 'sms') => {
    setLoadingResend(true);
    try {
      const result = await api.post('/auth/send-otp', {
        telefono: telefono.trim(),
        tipo: 'registro',
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

  // ── RENDER: Paso 1 — Datos ─────────────────────────────────
  if (step === 'datos') {
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
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Regístrate para comenzar</Text>
            </View>

            <View style={styles.form}>
              {/* Teléfono */}
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Número de teléfono *"
                  placeholderTextColor="#555555"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Nombre galleria */}
              <View style={styles.inputContainer}>
                <Ionicons name="home-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de tu Galleria *"
                  placeholderTextColor="#555555"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico (opcional)"
                  placeholderTextColor="#555555"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* PIN */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="PIN (4-6 dígitos) *"
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

              {/* Confirmar PIN */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar PIN *"
                  placeholderTextColor="#555555"
                  value={confirmPin}
                  onChangeText={(text) => setConfirmPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  secureTextEntry={!showPin}
                  maxLength={6}
                />
              </View>

              <Text style={styles.infoText}>
                <Ionicons name="information-circle-outline" size={14} color="#555555" />
                {' '}Recibirás un código de verificación por WhatsApp
              </Text>

              <TouchableOpacity
                style={[styles.button, loadingSend && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loadingSend}
              >
                {loadingSend ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>Continuar</Text>
                )}
              </TouchableOpacity>

              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>¿Ya tienes cuenta? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.link}>Inicia Sesión</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── RENDER: Paso 2 — Verificar OTP ────────────────────────
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
            <View style={styles.otpIconContainer}>
              <Ionicons
                name={canalEnvio === 'whatsapp' ? 'logo-whatsapp' : 'chatbox-outline'}
                size={48}
                color={canalEnvio === 'whatsapp' ? '#25D366' : '#F5A623'}
              />
            </View>
            <Text style={styles.title}>Verifica tu número</Text>
            <Text style={styles.subtitle}>
              Enviamos un código de 6 dígitos por{' '}
              <Text style={{ fontWeight: '700', color: canalEnvio === 'whatsapp' ? '#25D366' : '#F5A623' }}>
                {canalEnvio === 'whatsapp' ? 'WhatsApp' : 'SMS'}
              </Text>
              {'\n'}al número {telefono}
            </Text>
          </View>

          <View style={styles.form}>
            {/* Campo OTP */}
            <View style={[styles.inputContainer, styles.otpInput]}>
              <Ionicons name="keypad-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.otpText]}
                placeholder="_ _ _ _ _ _"
                placeholderTextColor="#aaa"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
            </View>

            {/* Botón verificar */}
            <TouchableOpacity
              style={[styles.button, (loadingVerify || otp.length < 6) && styles.buttonDisabled]}
              onPress={handleVerifyAndRegister}
              disabled={loadingVerify || otp.length < 6}
            >
              {loadingVerify ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Verificar y Registrarse</Text>
              )}
            </TouchableOpacity>

            {/* Reenviar */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendLabel}>¿No recibiste el código?</Text>

              {resendCooldown > 0 ? (
                <Text style={styles.cooldownText}>
                  Reenviar en {resendCooldown}s
                </Text>
              ) : (
                <View style={styles.resendButtons}>
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={() => handleResend('whatsapp')}
                    disabled={loadingResend}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    <Text style={[styles.resendButtonText, { color: '#25D366' }]}>
                      Reenviar por WhatsApp
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={() => handleResend('sms')}
                    disabled={loadingResend}
                  >
                    <Ionicons name="chatbox-outline" size={16} color="#F5A623" />
                    <Text style={[styles.resendButtonText, { color: '#F5A623' }]}>
                      Enviar por SMS
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Volver */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => { setStep('datos'); setOtp(''); }}
            >
              <Ionicons name="arrow-back" size={18} color="#6b7280" />
              <Text style={styles.backButtonText}>Volver y editar datos</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  otpIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  eyeIcon: {
    padding: 16,
  },
  otpInput: {
    borderColor: '#F5A623',
    borderWidth: 2,
    marginBottom: 20,
  },
  otpText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  infoText: {
    color: '#555555',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  link: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 12,
  },
  cooldownText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtons: {
    gap: 10,
    width: '100%',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
