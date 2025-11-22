export interface PushNotifyConfig {
  apiKey: string;
  apiUrl: string;
  autoPrompt?: boolean;
  promptDelay?: number;
  serviceWorkerPath?: string;
  onSubscribe?: (subscriptionId: string) => void;
  onUnsubscribe?: () => void;
  debug?: boolean;
}

export interface SubscriptionResponse {
  id: string;
  endpoint: string;
  createdAt: string;
}

export interface VAPIDConfig {
  vapidPublicKey: string;
}
