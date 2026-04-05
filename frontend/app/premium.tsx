import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ErrorCode, useIAP, getAvailablePurchases } from 'react-native-iap';
import { api } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';

const COLORS = {
  gold: '#F5A623',
  greenDark: '#16a34a',
  greenLight: '#ecfdf5',
  greenBorder: '#22c55e',
  grayDark: '#111827',
  grayMedium: '#6b7280',
  grayBorder: '#e5e7eb',
  white: '#ffffff',
  background: '#f5f5f5',
  card: '#ffffff',
};

const MONTHLY_SKU = 'com.migalleria.app.premium.mensual';
const YEARLY_SKU = 'com.migalleria.app.premium.anual';
const SUBSCRIPTION_SKUS = [MONTHLY_SKU, YEARLY_SKU];

const PRIVACY_URL = 'https://sites.google.com/view/migalleria-privacidad';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
type PlanType = 'mensual' | 'anual';

function extractTransactionId(purchase: any): string | null {
  const directId = purchase?.transactionId;
  if (directId && !String(directId).includes('.')) {
    console.log('[IAP] Usando transactionId directo:', directId);
    return String(directId);
  }

  const jws = directId || purchase?.transactionReceipt;
  if (jws && typeof jws === 'string' && jws.includes('.')) {
    try {
      const parts = jws.split('.');
      if (parts.length === 3) {
        const payloadBase64 = parts[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        const decoded = atob(payloadBase64);
        const payload = JSON.parse(decoded);

        if (payload.transactionId) {
          console.log('[IAP] TransactionId extraído del JWS:', payload.transactionId);
          return String(payload.transactionId);
        }
      }
    } catch (e) {
      console.error('[IAP] Error decodificando JWS:', e);
    }
  }

  console.warn('[IAP] No se pudo obtener transactionId válido del purchase');
  return null;
}

function BenefitItem({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <Ionicons name="checkmark-circle" size={20} color={COLORS.greenDark} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

type PlanCardProps = {
  title: string;
  price: string;
  subtitle: string;
  recommended?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function PlanCard({
  title,
  price,
  subtitle,
  recommended = false,
  loading = false,
  disabled = false,
  onPress,
}: PlanCardProps) {
  return (
    <View style={[styles.planCard, recommended && styles.planCardRecommended]}>
      {recommended ? (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedBadgeText}>RECOMENDADO</Text>
        </View>
      ) : null}

      <Text style={styles.planTitle}>{title}</Text>
      <Text style={styles.planPrice}>{price}</Text>
      <Text style={styles.planSubtitle}>{subtitle}</Text>

      <TouchableOpacity
        style={[styles.subscribeButton, (loading || disabled) && styles.disabledButton]}
        activeOpacity={0.85}
        onPress={onPress}
        disabled={loading || disabled}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.subscribeButtonText}>Suscribirme</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function PremiumScreen() {
  const router = useRouter();
  const { user, syncUserFromBackend } = useAuth();

  const [buyingSku, setBuyingSku] = useState<string | null>(null);
  const [loadingRestore, setLoadingRestore] = useState(false);

  const lastProcessedTransactionRef = useRef<string | null>(null);
  // ── Guard para evitar procesamiento duplicado ──────────────
  const isProcessingRef = useRef<boolean>(false);

  const isPremium = user?.plan === 'premium';
  const premiumExpiresAt = user?.premium_expires_at || null;

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        // ── GUARD 1: Si ya está procesando, ignorar ──────────
        if (isProcessingRef.current) {
          console.log('[IAP] Ya hay un procesamiento en curso, ignorando evento duplicado');
          return;
        }

        // ── GUARD 2: Si el usuario ya es premium por código promo, ignorar ──
        if (user?.plan === 'premium') {
          console.log('[IAP] Usuario ya es premium (posiblemente por código promo), ignorando evento IAP');
          try {
            await finishTransaction({ purchase, isConsumable: false });
          } catch {}
          return;
        }

        const transactionId = extractTransactionId(purchase);

        if (!transactionId) {
          throw new Error('No se pudo obtener el ID de transacción de Apple.');
        }

        // ── GUARD 3: Si ya procesamos esta transacción, ignorar ──
        if (lastProcessedTransactionRef.current === transactionId) {
          console.log('[IAP] TransactionId ya procesado, ignorando:', transactionId);
          return;
        }

        isProcessingRef.current = true;
        lastProcessedTransactionRef.current = transactionId;

        const productId =
          (purchase as any)?.productId ||
          (purchase as any)?.productIds?.[0] ||
          null;

        if (!productId) {
          throw new Error('No se pudo identificar el plan comprado.');
        }

        const planType: PlanType =
          productId === YEARLY_SKU ? 'anual' : 'mensual';

        console.log('[IAP] Activando premium:', {
          plan_type: planType,
          product_id: productId,
          transaction_id: transactionId,
        });

        await api.post('/auth/activate-premium', {
          plan_type: planType,
          product_id: productId,
          platform: 'ios',
          transaction_id: transactionId,
          purchase_token: (purchase as any)?.purchaseToken || null,
        });

        await finishTransaction({
          purchase,
          isConsumable: false,
        });

        // ── Un solo syncUserFromBackend es suficiente ────────
        await syncUserFromBackend();

        setBuyingSku(null);

        Alert.alert(
          '👑 Nivel Elite Activado',
          'Tu membresía premium está activa. Ya tienes acceso completo a Mi Galleria.',
          [
            {
              text: 'Continuar',
              onPress: () => router.replace('/perfil' as any),
            },
          ]
        );
      } catch (error: any) {
        setBuyingSku(null);
        console.error('[IAP] Error activando premium:', error);
        Alert.alert(
          'Error',
          error?.message || 'La compra se realizó, pero hubo un problema activando premium.'
        );
      } finally {
        isProcessingRef.current = false;
      }
    },
    onPurchaseError: (error) => {
      setBuyingSku(null);
      isProcessingRef.current = false;

      const message = String(error?.message || '');

      if (error.code === ErrorCode.UserCancelled) {
        return;
      }

      if (message.toLowerCase().includes('duplicate purchase')) {
        return;
      }

      Alert.alert(
        'Error de compra',
        error.message || 'No se pudo completar la compra.'
      );
    },
  });

  useEffect(() => {
    if (!connected) return;

    fetchProducts({
      skus: SUBSCRIPTION_SKUS,
      type: 'subs',
    }).catch(() => {
      Alert.alert(
        'Error',
        'No se pudieron cargar las suscripciones disponibles.'
      );
    });
  }, [connected, fetchProducts]);

  const monthlyProduct = useMemo(() => {
    return products.find(
      (p: any) => p.id === MONTHLY_SKU || p.productId === MONTHLY_SKU
    );
  }, [products]);

  const yearlyProduct = useMemo(() => {
    return products.find(
      (p: any) => p.id === YEARLY_SKU || p.productId === YEARLY_SKU
    );
  }, [products]);

  useEffect(() => {
    console.log('IAP connected =>', connected);
    console.log('IAP products =>', JSON.stringify(products, null, 2));
    console.log('IAP monthlyProduct =>', monthlyProduct);
    console.log('IAP yearlyProduct =>', yearlyProduct);
  }, [connected, products, monthlyProduct, yearlyProduct]);

  const getProductPrice = (product: any, fallback: string) => {
    return (
      product?.displayPrice ||
      product?.localizedPrice ||
      product?.priceString ||
      fallback
    );
  };

  const formatExpirationDate = (value: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleBuySubscription = async (sku: string) => {
    try {
      if (!connected) {
        Alert.alert(
          'Tienda no disponible',
          'Aún no se ha conectado la tienda. Espera un momento e inténtalo de nuevo.'
        );
        return;
      }

      setBuyingSku(sku);

      await requestPurchase({
        request: {
          apple: { sku },
          google: { skus: [sku] },
        },
        type: 'subs',
      });
    } catch (error: any) {
      setBuyingSku(null);

      const message = String(error?.message || '');

      if (message.toLowerCase().includes('duplicate purchase')) {
        return;
      }

      Alert.alert(
        'Error',
        error?.message || 'No se pudo iniciar la compra.'
      );
    }
  };

  const handleRestore = async () => {
    try {
      setLoadingRestore(true);

      const purchases: any[] = await getAvailablePurchases();

      if (!purchases || purchases.length === 0) {
        Alert.alert('Restaurar compras', 'No hay compras para restaurar.');
        return;
      }

      const sortedPurchases = [...purchases].sort((a, b) => {
        const aTime = Number(a?.transactionDate || 0);
        const bTime = Number(b?.transactionDate || 0);
        return bTime - aTime;
      });

      const restoredPurchase = sortedPurchases.find((purchase) => {
        const productId =
          purchase?.productId || purchase?.productIds?.[0] || '';
        return productId === MONTHLY_SKU || productId === YEARLY_SKU;
      });

      if (!restoredPurchase) {
        Alert.alert(
          'Restaurar compras',
          'No se encontró una suscripción válida para restaurar.'
        );
        return;
      }

      const restoredProductId =
        restoredPurchase?.productId ||
        restoredPurchase?.productIds?.[0] ||
        null;

      if (!restoredProductId) {
        throw new Error('No se pudo identificar la compra a restaurar.');
      }

      const transactionId = extractTransactionId(restoredPurchase);

      if (!transactionId) {
        throw new Error('No se pudo obtener el ID de transacción para restaurar.');
      }

      lastProcessedTransactionRef.current = transactionId;

      const planType: PlanType =
        restoredProductId === YEARLY_SKU ? 'anual' : 'mensual';

      console.log('[IAP] Restaurando premium:', {
        plan_type: planType,
        product_id: restoredProductId,
        transaction_id: transactionId,
      });

      await api.post('/auth/restore-premium', {
        plan_type: planType,
        product_id: restoredProductId,
        platform: 'ios',
        transaction_id: transactionId,
        purchase_token: restoredPurchase?.purchaseToken || null,
      });

      // ── Un solo syncUserFromBackend es suficiente ────────
      await syncUserFromBackend();

      Alert.alert(
        'Restaurar compras',
        'Tu membresía premium fue restaurada correctamente.',
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/perfil' as any),
          },
        ]
      );
    } catch (error: any) {
      console.error('[IAP] Error restaurando:', error);
      Alert.alert(
        'Error',
        error?.message || 'No se pudieron restaurar las compras.'
      );
    } finally {
      setLoadingRestore(false);
    }
  };

  const expiresFormatted = formatExpirationDate(premiumExpiresAt);
  const buttonsDisabled = !!buyingSku || loadingRestore;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Mi Membresía',
          headerShadowVisible: false,
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 5 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {isPremium ? (
            <View style={styles.heroCardActive}>
              <Text style={styles.heroTitleActive}>👑 Nivel Elite Activo</Text>
              <Text style={styles.heroSubtitleActive}>
                Tu membresía premium está activa y tienes acceso completo a las
                funciones de Mi Galleria.
              </Text>
              <View style={styles.heroButtonActive}>
                <Text style={styles.heroButtonText}>ACCESO COMPLETO DESBLOQUEADO</Text>
              </View>
              {expiresFormatted ? (
                <Text style={styles.expirationText}>
                  Activo hasta: {expiresFormatted}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>Eleva tu membresía</Text>
              <Text style={styles.heroSubtitle}>
                Desbloquea el control libre, más registros y una experiencia premium
                dentro de Mi Galleria.
              </Text>
              <View style={styles.heroButton}>
                <Text style={styles.heroButtonText}>👑 SUBE A NIVEL ELITE 👑</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beneficios Premium</Text>
            <View style={styles.benefitsCard}>
              <BenefitItem text="Más registros y mayor capacidad en la app" />
              <BenefitItem text="Acceso libre a todas las funciones" />
              <BenefitItem text="Mejor control y gestión avanzada" />
              <BenefitItem text="Experiencia pensada para criadores exigentes" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Planes disponibles</Text>

            {!connected ? (
              <View style={styles.infoMiniCard}>
                <Text style={styles.infoMiniText}>
                  Conectando con la tienda...
                </Text>
              </View>
            ) : null}

            {isPremium ? (
              <View style={styles.activePlanCard}>
                <Ionicons
                  name="checkmark-circle"
                  size={26}
                  color={COLORS.greenDark}
                />
                <Text style={styles.activePlanTitle}>Premium activo</Text>
                <Text style={styles.activePlanText}>
                  Ya tienes acceso completo. Tu cambio a Nivel Elite fue aplicado
                  correctamente.
                </Text>
              </View>
            ) : (
              <>
                <PlanCard
                  title="Premium Mensual"
                  price={getProductPrice(monthlyProduct, '$7.99 / mes')}
                  subtitle="Pago mensual con acceso completo a funciones premium."
                  loading={buyingSku === MONTHLY_SKU}
                  disabled={buttonsDisabled && buyingSku !== MONTHLY_SKU}
                  onPress={() => handleBuySubscription(MONTHLY_SKU)}
                />
                <PlanCard
                  title="Premium Anual"
                  price={getProductPrice(yearlyProduct, '$66.99 / año')}
                  subtitle="Ahorra más con el plan anual y mantén acceso completo."
                  recommended
                  loading={buyingSku === YEARLY_SKU}
                  disabled={buttonsDisabled && buyingSku !== YEARLY_SKU}
                  onPress={() => handleBuySubscription(YEARLY_SKU)}
                />
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.restoreButton, loadingRestore && styles.disabledButton]}
            activeOpacity={0.85}
            onPress={handleRestore}
            disabled={loadingRestore}
          >
            {loadingRestore ? (
              <ActivityIndicator size="small" color={COLORS.grayDark} />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color={COLORS.grayDark} />
                <Text style={styles.restoreButtonText}>Restaurar compras</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Información de la suscripción</Text>
            <Text style={styles.infoText}>
              • Premium Mensual: $7.99 USD / mes{'\n'}
              • Premium Anual: $66.99 USD / año{'\n\n'}
              La suscripción se renueva automáticamente a menos que se cancele al menos 24 horas antes del fin del periodo actual. Tu cuenta de Apple será cargada por la renovación dentro de las 24 horas previas al fin del periodo actual.{'\n\n'}
              Puedes gestionar y cancelar tu suscripción desde los ajustes de tu cuenta en la App Store. Cualquier porción no utilizada del periodo de prueba gratuito, si se ofrece, se perderá al adquirir una suscripción.
            </Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
                <Text style={styles.legalLinkText}>Política de Privacidad</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}>|</Text>
              <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
                <Text style={styles.legalLinkText}>Términos de Uso</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 50 : 40,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: COLORS.greenLight,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: COLORS.greenBorder,
    marginBottom: 22,
  },
  heroCardActive: {
    backgroundColor: '#022c22',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    marginBottom: 22,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.grayDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  heroTitleActive: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4ade80',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.grayMedium,
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitleActive: {
    fontSize: 15,
    lineHeight: 22,
    color: '#bbf7d0',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroButton: {
    backgroundColor: COLORS.greenDark,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonActive: {
    backgroundColor: '#16a34a',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  expirationText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#86efac',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.grayDark,
    marginBottom: 12,
  },
  benefitsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.grayDark,
    lineHeight: 21,
  },
  planCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    marginBottom: 14,
  },
  planCardRecommended: {
    borderColor: COLORS.greenBorder,
    borderWidth: 1.5,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  recommendedBadgeText: {
    color: COLORS.greenDark,
    fontSize: 11,
    fontWeight: '800',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.grayDark,
    marginBottom: 6,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.greenDark,
    marginBottom: 6,
  },
  planSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.grayMedium,
    marginBottom: 16,
  },
  subscribeButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
  activePlanCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#22c55e',
    alignItems: 'center',
  },
  activePlanTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.greenDark,
    textAlign: 'center',
  },
  activePlanText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.grayDark,
    textAlign: 'center',
  },
  infoMiniCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    marginBottom: 12,
  },
  infoMiniText: {
    color: COLORS.grayMedium,
    fontSize: 14,
  },
  restoreButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  restoreButtonText: {
    color: COLORS.grayDark,
    fontSize: 15,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.grayDark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.grayMedium,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  legalLinkText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    color: '#9ca3af',
    fontSize: 13,
  },
});
