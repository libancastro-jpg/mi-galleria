import type { Purchase, PurchaseError, ProductSubscription } from 'react-native-iap';

export function getPremiumSkus() {
  return {
    ios: [],
    android: [],
  };
}

export async function initializeIAP(): Promise<boolean> {
  console.log('IAP desactivado temporalmente');
  return false;
}

export async function loadSubscriptions(): Promise<ProductSubscription[]> {
  console.log('Carga de suscripciones desactivada temporalmente');
  return [];
}

export async function buyPremiumSubscription(_productId: string) {
  console.log('Compra premium desactivada temporalmente');
  throw new Error('Las suscripciones premium están desactivadas temporalmente.');
}

export function startPurchaseListeners(
  _onSuccess?: (purchase: Purchase) => void,
  _onError?: (error: PurchaseError) => void
) {
  console.log('Listeners de compra desactivados temporalmente');
}

export function stopPurchaseListeners() {
  console.log('Listeners de compra detenidos');
}

export async function disconnectIAP() {
  console.log('IAP desactivado temporalmente');
}