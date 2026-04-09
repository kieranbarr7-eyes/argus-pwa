import { fetchVapidPublicKey, sendSubscription } from './api';

/**
 * Convert a base64 URL-safe string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission, subscribe to push, and register with Railway.
 * @param {number|null} watchId - optional watch ID to link the subscription to
 * @returns {Promise<PushSubscription|null>}
 */
export async function subscribeToPush(watchId = null) {
  // 1. Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('[Argus] Notification permission denied');
    return null;
  }

  // 2. Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // 3. Fetch VAPID public key from Railway
  let vapidKey;
  try {
    vapidKey = await fetchVapidPublicKey();
  } catch (err) {
    console.error('[Argus] Failed to fetch VAPID key:', err);
    return null;
  }

  // 4. Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  // 5. Send subscription to Railway
  try {
    await sendSubscription(subscription.toJSON(), watchId);
    console.log('[Argus] Push subscription registered with Railway');
  } catch (err) {
    console.error('[Argus] Failed to send subscription to Railway:', err);
  }

  return subscription;
}
