import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: User;
}

export interface BrowserInfo {
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceType: string | null;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
}

export interface TargetSegment {
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType?: string;
  tags?: Record<string, string>;
  subscriptionIds?: string[];
}

export interface NotificationJobData {
  notificationId: string;
  projectId: string;
  payload: NotificationPayload;
  subscriptionId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface VAPIDKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}
