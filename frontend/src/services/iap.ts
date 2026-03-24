import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  type Purchase,
  type PurchaseError,
  type ProductSubscription,
} from 'react-native-iap';

const IOS_SKUS = [
  'com.migalleria.criadorolite.mensual',
  'com.migalleria.criadorolite.anual',
];

const ANDROID_SKUS = [
  'com.migalleria.criadorolite.mensual',
  'com.migalleria.criadorolite.anual',
];

let purchaseUpdateSubscription: { remove: () => void } | null = null;
let purchaseErrorSubscription: { remove: () => void } | null = null;

function getCurrentPlatformSkus(): string[] {
  return Platform.OS === 'ios' ? IOS_SKUS : ANDROID_SKUS;
}

export function getPremiumSkus() {
  return {
    ios: IOS_SKUS,
    android: ANDROID_SKUS,
  };
}

export async function initializeIAP(): Promise<boolean> {
  try {
    await initConnection();
    console.log('IAP iniciado correctamente');
    return true;
  } catch (error) {
    console.log('Error iniciando IAP:', error);
    return false;
  }
}

export async function loadSubscriptions(): Promise<ProductSubscription[]> {
  try {
    const currentSkus = getCurrentPlatformSkus();

    console.log('Cargando suscripciones para', Platform.OS, currentSkus);

    const subscriptions = await fetchProducts({
      skus: currentSkus,
      type: 'subs',
    });

    console.log('Suscripciones cargadas:', subscriptions);

    return subscriptions as ProductSubscription[];
  } catch (error) {
    console.log('Error cargando suscripciones:', error);
    return [];
  }
}

export async function buyPremiumSubscription(productId: string) {
  try {
    console.log('Solicitando compra para:', productId, 'en', Platform.OS);

    await requestPurchase({
      request: {
        apple: {
          sku: productId,
        },
        google: {
          skus: [productId],
        },
      },
      type: 'subs',
    });
  } catch (error) {
    console.log('Error solicitando suscripción:', error);
    throw error;
  }
}

export function startPurchaseListeners(
  onSuccess?: (purchase: Purchase) => void,
  onError?: (error: PurchaseError) => void
) {
  purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
    try {
      console.log('Compra actualizada:', purchase);

      await finishTransaction({
        purchase,
        isConsumable: false,
      });

      if (onSuccess) {
        onSuccess(purchase);
      }
    } catch (error) {
      console.log('Error finalizando compra:', error);
    }
  });

  purchaseErrorSubscription = purchaseErrorListener((error) => {
    console.log('Error de compra:', error);

    if (onError) {
      onError(error);
    }
  });
}

export function stopPurchaseListeners() {
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
    purchaseUpdateSubscription = null;
  }

  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
    purchaseErrorSubscription = null;
  }
}

export async function disconnectIAP() {
  try {
    stopPurchaseListeners();
    await endConnection();
    console.log('IAP cerrado correctamente');
  } catch (error) {
    console.log('Error cerrando IAP:', error);
  }
}