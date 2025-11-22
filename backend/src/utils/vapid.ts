import webpush from 'web-push';

export function generateVAPIDKeys() {
  return webpush.generateVAPIDKeys();
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = Buffer.from(base64, 'base64');
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData[i];
  }
  return outputArray;
}

export default {
  generateVAPIDKeys,
  urlBase64ToUint8Array,
};
