/**
 * Tema de Colores - Castador Pro
 * ================================
 * Paleta de colores centralizada para toda la aplicación
 */

export const THEME = {
  // Fondos
  background: '#1a1a1a',        // Fondo principal (gris oscuro suave)
  backgroundDark: '#141414',    // Fondo más oscuro para contraste
  backgroundCard: '#242424',    // Fondo de tarjetas
  backgroundInput: '#2a2a2a',   // Fondo de inputs
  
  // Bordes
  border: '#333333',            // Borde estándar
  borderLight: '#3a3a3a',       // Borde más claro
  
  // Texto
  textPrimary: '#ffffff',       // Texto principal (blanco puro)
  textSecondary: '#b0b0b0',     // Texto secundario (más visible)
  textMuted: '#808080',         // Texto atenuado
  textPlaceholder: '#707070',   // Placeholder
  
  // Colores de acento
  gold: '#d4a017',              // Dorado principal
  goldLight: 'rgba(212, 160, 23, 0.2)',  // Dorado transparente
  goldDark: '#b8860b',          // Dorado oscuro
  
  // Estados
  success: '#22c55e',           // Verde éxito
  successLight: 'rgba(34, 197, 94, 0.15)',
  error: '#ef4444',             // Rojo error
  errorLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#f59e0b',           // Naranja advertencia
  warningLight: 'rgba(245, 158, 11, 0.15)',
  info: '#3b82f6',              // Azul información
  infoLight: 'rgba(59, 130, 246, 0.15)',
  
  // Géneros
  male: '#3b82f6',              // Azul para gallos
  maleLight: 'rgba(59, 130, 246, 0.15)',
  female: '#ec4899',            // Rosa para gallinas
  femaleLight: 'rgba(236, 72, 153, 0.15)',
};

// Alias para compatibilidad
export const COLORS = {
  background: THEME.background,
  grayDark: THEME.backgroundCard,
  grayMedium: THEME.border,
  grayLight: THEME.textSecondary,
  white: THEME.textPrimary,
  gold: THEME.gold,
  goldLight: THEME.goldLight,
  greenDark: THEME.success,
  greenLight: THEME.successLight,
  redDeep: THEME.error,
  redLight: THEME.errorLight,
  blue: THEME.info,
  pink: THEME.female,
};

export default THEME;
