import { PushNotifyConfig, SubscriptionResponse, VAPIDConfig } from './types';
import { urlBase64ToUint8Array, log, getBrowserInfo } from './utils';

class PushNotify {
  private config: PushNotifyConfig;
  private vapidPublicKey: string | null = null;
  private subscriptionId: string | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(config: PushNotifyConfig) {
    this.config = {
      autoPrompt: false,
      promptDelay: 0,
      serviceWorkerPath: '/push-sw.js',
      debug: false,
      ...config,
    };

    this.loadSubscriptionId();
  }

  async init(): Promise<void> {
    try {
      log(this.config.debug!, 'Initializing PushNotify SDK');

      if (!this.isPushSupported()) {
        throw new Error('Push notifications are not supported in this browser');
      }

      // Fetch VAPID config
      await this.fetchVAPIDConfig();

      // Register service worker
      await this.registerServiceWorker();

      // Check existing subscription
      await this.checkExistingSubscription();

      // Auto-prompt if enabled
      if (this.config.autoPrompt) {
        setTimeout(() => {
          this.subscribe();
        }, this.config.promptDelay);
      }

      log(this.config.debug!, 'PushNotify SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PushNotify SDK:', error);
      throw error;
    }
  }

  async subscribe(): Promise<SubscriptionResponse> {
    try {
      log(this.config.debug!, 'Requesting notification permission');

      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      if (!this.serviceWorkerRegistration) {
        throw new Error('Service worker not registered');
      }

      if (!this.vapidPublicKey) {
        await this.fetchVAPIDConfig();
      }

      log(this.config.debug!, 'Subscribing to push notifications');

      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(this.vapidPublicKey!),
      });

      // Send subscription to backend
      const response = await fetch(
        `${this.config.apiUrl}/api/v1/public/${this.config.apiKey}/subscriptions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            userAgent: getBrowserInfo(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      const data: SubscriptionResponse = await response.json();

      this.subscriptionId = data.id;
      this.saveSubscriptionId(data.id);

      log(this.config.debug!, 'Subscribed successfully:', data);

      if (this.config.onSubscribe) {
        this.config.onSubscribe(data.id);
      }

      return data;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      throw error;
    }
  }

  async unsubscribe(): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration) {
        throw new Error('Service worker not registered');
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Notify backend
      const endpoint = encodeURIComponent(subscription.endpoint);
      await fetch(
        `${this.config.apiUrl}/api/v1/public/${this.config.apiKey}/subscriptions/${endpoint}`,
        {
          method: 'DELETE',
        }
      );

      this.subscriptionId = null;
      this.removeSubscriptionId();

      log(this.config.debug!, 'Unsubscribed successfully');

      if (this.config.onUnsubscribe) {
        this.config.onUnsubscribe();
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        return false;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  async setTags(tags: Record<string, string>): Promise<void> {
    try {
      if (!this.subscriptionId) {
        throw new Error('Not subscribed');
      }

      const response = await fetch(
        `${this.config.apiUrl}/api/v1/public/${this.config.apiKey}/subscriptions/${this.subscriptionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tags }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update tags');
      }

      log(this.config.debug!, 'Tags updated successfully');
    } catch (error) {
      console.error('Failed to set tags:', error);
      throw error;
    }
  }

  getPermission(): NotificationPermission {
    return Notification.permission;
  }

  isPushSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      log(this.config.debug!, 'Registering service worker');

      this.serviceWorkerRegistration = await navigator.serviceWorker.register(
        this.config.serviceWorkerPath!
      );

      // Pass API URL and API key to service worker
      if (this.serviceWorkerRegistration.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'INIT',
          apiUrl: this.config.apiUrl,
          apiKey: this.config.apiKey,
        });
      }

      log(this.config.debug!, 'Service worker registered');
    } catch (error) {
      console.error('Failed to register service worker:', error);
      throw error;
    }
  }

  private async fetchVAPIDConfig(): Promise<void> {
    try {
      log(this.config.debug!, 'Fetching VAPID config');

      const response = await fetch(
        `${this.config.apiUrl}/api/v1/projects/public/${this.config.apiKey}/config`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch VAPID config');
      }

      const data: VAPIDConfig = await response.json();
      this.vapidPublicKey = data.vapidPublicKey;

      log(this.config.debug!, 'VAPID config fetched');
    } catch (error) {
      console.error('Failed to fetch VAPID config:', error);
      throw error;
    }
  }

  private async checkExistingSubscription(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        log(this.config.debug!, 'Existing subscription found');
      }
    }
  }

  private saveSubscriptionId(id: string): void {
    try {
      localStorage.setItem('pushnotify_subscription_id', id);
    } catch (error) {
      console.error('Failed to save subscription ID:', error);
    }
  }

  private loadSubscriptionId(): void {
    try {
      const id = localStorage.getItem('pushnotify_subscription_id');
      if (id) {
        this.subscriptionId = id;
      }
    } catch (error) {
      console.error('Failed to load subscription ID:', error);
    }
  }

  private removeSubscriptionId(): void {
    try {
      localStorage.removeItem('pushnotify_subscription_id');
    } catch (error) {
      console.error('Failed to remove subscription ID:', error);
    }
  }
}

export default PushNotify;
export { PushNotify };
export * from './types';
