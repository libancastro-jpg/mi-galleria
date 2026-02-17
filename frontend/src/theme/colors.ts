/**
 * Tema de Colores - Castador Pro
 * ================================
 * Paleta de colores centralizada para toda la aplicación
 * MODO CLARO
 */

export const THEME = {
  // Fondos - Modo Claro
  background: '#f5f5f5',          // Fondo principal (gris muy claro)
  backgroundDark: '#e8e8e8',      // Fondo más oscuro para contraste
  backgroundCard: '#ffffff',      // Fondo de tarjetas (blanco)
  backgroundInput: '#ffffff',     // Fondo de inputs
  
  // Bordes
  border: '#e0e0e0',              // Borde estándar
  borderLight: '#ebebeb',         // Borde más claro
  
  // Texto - Colores oscuros para contraste
  textPrimary: '#1a1a1a',         // Texto principal (casi negro)
  textSecondary: '#555555',       // Texto secundario
  textMuted: '#888888',           // Texto atenuado
  textPlaceholder: '#aaaaaa',     // Placeholder
  
  // Colores de acento
  gold: '#d4a017',                // Dorado principal
  goldLight: 'rgba(212, 160, 23, 0.15)',  // Dorado transparente
  goldDark: '#b8860b',            // Dorado oscuro
  
  // Estados
  success: '#22c55e',             // Verde éxito
  successLight: 'rgba(34, 197, 94, 0.12)',
  error: '#ef4444',               // Rojo error
  errorLight: 'rgba(239, 68, 68, 0.12)',
  warning: '#f59e0b',             // Naranja advertencia
  warningLight: 'rgba(245, 158, 11, 0.12)',
  info: '#3b82f6',                // Azul información
  infoLight: 'rgba(59, 130, 246, 0.12)',
  
  // Géneros
  male: '#3b82f6',                // Azul para gallos
  maleLight: 'rgba(59, 130, 246, 0.12)',
  female: '#ec4899',              // Rosa para gallinas
  femaleLight: 'rgba(236, 72, 153, 0.12)',
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
