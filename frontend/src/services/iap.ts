export function getPremiumSkus() {
  return {
    ios: [
      'com.migalleria.app.premium.mensual',
      'com.migalleria.app.premium.anual',
    ],
    android: [
      'com.migalleria.app.premium.mensual',
      'com.migalleria.app.premium.anual',
    ],
  };
}

export async function initializeIAP(): Promise<boolean> {
  return false;
}

export async function loadSubscriptions(): Promise<any[]> {
  return [];
}

export async function buyPremiumSubscription(_productId: string) {
  throw new Error('IAP ahora se maneja directamente desde premium.tsx');
}

export function startPurchaseListeners(
  _onSuccess?: (purchase: any) => void,
  _onError?: (error: any) => void
) {}

export function stopPurchaseListeners() {}

export async function disconnectIAP() {}