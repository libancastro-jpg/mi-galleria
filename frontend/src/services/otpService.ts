/**
 * otpService.ts
 *
 * Firebase Phone Auth — único proveedor de OTP en esta app.
 *
 * La `ConfirmationResult` de Firebase no se puede serializar en los params de
 * Expo Router, por lo que se guarda en una variable de módulo de corta vida.
 * El flujo completo (enviar → verificar) siempre sucede dentro de la misma sesión,
 * así que esto es seguro.
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// ─── Session storage (módulo-level, corta vida) ────────────────────────────────

let _session: FirebaseAuthTypes.ConfirmationResult | null = null;

export function setOtpSession(s: FirebaseAuthTypes.ConfirmationResult): void {
  _session = s;
}

export function getOtpSession(): FirebaseAuthTypes.ConfirmationResult | null {
  return _session;
}

export function clearOtpSession(): void {
  _session = null;
}

// ─── Normalización de número ──────────────────────────────────────────────────

/**
 * Convierte un número a formato E.164.
 * PhoneInput devuelve `codigoPais + digitos` (e.g. "18095551234").
 * Firebase requiere el "+" delante: "+18095551234".
 */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `+${digits}`;
}

// ─── Mensajes de error Firebase → español ─────────────────────────────────────

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-phone-number':
    'El número de teléfono no es válido. Usa el formato internacional.',
  'auth/too-many-requests':
    'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/quota-exceeded':
    'Límite de SMS alcanzado. Intenta más tarde.',
  'auth/captcha-check-failed':
    'Verificación de seguridad fallida. Inténtalo de nuevo.',
  'auth/invalid-verification-code':
    'El código ingresado es incorrecto.',
  'auth/code-expired':
    'El código ha expirado. Solicita un código nuevo.',
  'auth/session-expired':
    'La sesión ha expirado. Solicita un código nuevo.',
  'auth/missing-verification-code':
    'Debes ingresar el código de verificación.',
  'auth/network-request-failed':
    'Error de red. Verifica tu conexión e inténtalo de nuevo.',
  'auth/user-disabled':
    'Esta cuenta ha sido deshabilitada. Contacta soporte.',
  'auth/missing-phone-number':
    'Debes ingresar un número de teléfono.',
  'auth/invalid-app-credential':
    'Error de configuración de la app. Contacta soporte.',
};

function resolveFirebaseError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (FIREBASE_ERRORS[code]) return FIREBASE_ERRORS[code];
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido. Inténtalo de nuevo.';
}

// ─── API pública ───────────────────────────────────────────────────────────────

/**
 * Envía un SMS de verificación al número dado via Firebase Phone Auth.
 *
 * @param phoneE164  Número en formato E.164, e.g. "+18095551234".
 *                   Usa `toE164()` para convertir desde el formato del PhoneInput.
 * @returns          La ConfirmationResult. También la almacena en el módulo
 *                   para que `verify-otp.tsx` la recupere con `getOtpSession()`.
 * @throws           Error con mensaje en español si falla.
 */
export async function sendVerificationCode(
  phoneE164: string
): Promise<FirebaseAuthTypes.ConfirmationResult> {
  try {
    const session = await auth().signInWithPhoneNumber(phoneE164);
    setOtpSession(session);
    return session;
  } catch (error) {
    throw new Error(resolveFirebaseError(error));
  }
}

/**
 * Confirma el código OTP ingresado por el usuario.
 *
 * @param session  La ConfirmationResult (de `sendVerificationCode` o `getOtpSession()`).
 * @param code     El código de 6 dígitos.
 * @returns        El UserCredential de Firebase (contiene `user.uid`, `user.getIdToken()`, etc.)
 * @throws         Error con mensaje en español si el código es incorrecto o expiró.
 */
export async function confirmVerificationCode(
  session: FirebaseAuthTypes.ConfirmationResult,
  code: string
): Promise<FirebaseAuthTypes.UserCredential> {
  try {
    const credential = await session.confirm(code);
    if (!credential) {
      throw new Error('No se pudo confirmar el código. Inténtalo de nuevo.');
    }
    return credential;
  } catch (error) {
    throw new Error(resolveFirebaseError(error));
  }
}
