import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
});

export const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url('Invalid endpoint URL'),
    keys: z.object({
      p256dh: z.string().min(1, 'p256dh key is required'),
      auth: z.string().min(1, 'auth key is required'),
    }),
  }),
  userAgent: z.string().optional(),
});

export const updateTagsSchema = z.object({
  tags: z.record(z.string(), z.string()),
});

export const sendNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  icon: z.string().url('Invalid icon URL').optional(),
  badge: z.string().url('Invalid badge URL').optional(),
  image: z.string().url('Invalid image URL').optional(),
  url: z.string().url('Invalid URL').optional(),
  targetType: z.enum(['ALL', 'SEGMENT', 'INDIVIDUAL']),
  targetSegment: z
    .object({
      browserName: z.string().optional(),
      browserVersion: z.string().optional(),
      osName: z.string().optional(),
      osVersion: z.string().optional(),
      deviceType: z.string().optional(),
      tags: z.record(z.string(), z.string()).optional(),
      subscriptionIds: z.array(z.string()).optional(),
    })
    .optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const deliveryWebhookSchema = z.object({
  notificationId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  event: z.enum(['delivered', 'clicked']),
});
