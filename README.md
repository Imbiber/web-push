# PushNotify - Self-Hosted Push Notification Microservice

A complete, production-ready push notification microservice that you can self-host. Replace services like OneSignal with your own infrastructure.

## Features

- **Complete Push Notification System**: Send browser push notifications to your users
- **Multi-Project Support**: Manage multiple websites/apps from one installation
- **Smart Targeting**: Send to all users, specific browsers/devices, or custom segments
- **Real-time Analytics**: Track delivery rates, clicks, and user engagement
- **Beautiful Admin Dashboard**: Manage projects and send notifications with ease
- **Easy Integration**: Simple JavaScript SDK - just 3 lines of code
- **Queue System**: Reliable delivery with automatic retries
- **Browser Detection**: Automatically track user browsers, OS, and devices
- **Tag-Based Segmentation**: Organize users with custom tags
- **Scheduled Notifications**: Send notifications at specific times
- **Production Ready**: Docker deployment, TypeScript, comprehensive error handling

## Architecture

```
┌─────────────────┐
│  Admin Dashboard │  (Next.js 14, Tailwind CSS)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API    │  (Express, TypeScript)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌─────────┐
│PostgreSQL│ │  Redis  │
└─────────┘ └─────────┘
         │
         ▼
   ┌──────────┐
   │  Worker  │  (BullMQ)
   └──────────┘
         │
         ▼
   ┌──────────┐
   │ Browsers │
   └──────────┘
```

## Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd push-notification-service
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Access the services**
- Admin Dashboard: http://localhost:3002
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

4. **Create your first admin account**
- Open http://localhost:3002
- Click "Sign up"
- Create your account

5. **Create a project**
- Login to the dashboard
- Click "New Project"
- Copy your API key

6. **Integrate with your website**
```html
<script src="http://localhost:3001/sdk/pushnotify.js"></script>
<script>
  const pushNotify = new PushNotify({
    apiKey: 'your-api-key-here',
    apiUrl: 'http://localhost:3001'
  });

  pushNotify.init();
</script>
```

That's it! Your users can now subscribe to notifications.

## Manual Setup

See [QUICKSTART.md](QUICKSTART.md) for detailed manual installation instructions.

## Documentation

- [QUICKSTART.md](QUICKSTART.md) - Quick 5-minute setup guide
- [API.md](docs/API.md) - Complete API reference
- [TESTING.md](TESTING.md) - Testing guide
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview and architecture

## Project Structure

```
push-notification-service/
├── backend/              # Express API server
│   ├── src/
│   │   ├── config/      # Database, Redis, environment config
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth, error handling, rate limiting
│   │   ├── routes/      # API routes
│   │   ├── queue/       # BullMQ queue and worker
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utilities (validation, parsing, VAPID)
│   └── prisma/          # Database schema
├── client-sdk/          # JavaScript SDK for browsers
│   ├── src/            # SDK source code
│   └── push-sw.js      # Service worker
├── admin-dashboard/     # Next.js admin interface
│   ├── app/            # Next.js app directory
│   ├── lib/            # API client
│   └── store/          # State management
├── examples/           # Integration examples
└── docs/              # Additional documentation
```

## Technology Stack

### Backend
- **Node.js 18+** with Express
- **TypeScript** for type safety
- **PostgreSQL** with Prisma ORM
- **Redis** with BullMQ for queue management
- **web-push** library for VAPID protocol
- **JWT** authentication
- **Zod** for validation

### Client SDK
- **TypeScript**
- **Rollup** for bundling (UMD + ESM)
- **Service Worker** for push handling

### Admin Dashboard
- **Next.js 14** with App Router
- **TypeScript**
- **Tailwind CSS**
- **Zustand** for state management

### DevOps
- **Docker** & **Docker Compose**
- Multi-container setup with health checks

## API Overview

### Authentication
```bash
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/profile
```

### Projects
```bash
POST   /api/v1/projects
GET    /api/v1/projects
GET    /api/v1/projects/:id
PUT    /api/v1/projects/:id
DELETE /api/v1/projects/:id
```

### Subscriptions
```bash
POST   /api/v1/public/:apiKey/subscriptions
DELETE /api/v1/public/:apiKey/subscriptions/:endpoint
PATCH  /api/v1/public/:apiKey/subscriptions/:id
GET    /api/v1/admin/:projectId/subscriptions
```

### Notifications
```bash
POST /api/v1/:projectId/notifications/send
GET  /api/v1/:projectId/notifications
GET  /api/v1/:projectId/notifications/:id/stats
GET  /api/v1/:projectId/analytics
```

See [API.md](docs/API.md) for complete API documentation.

## SDK Usage

### Initialize
```javascript
const pushNotify = new PushNotify({
  apiKey: 'your-api-key',
  apiUrl: 'http://localhost:3001',
  autoPrompt: false,
  promptDelay: 3000,
  serviceWorkerPath: '/push-sw.js',
  debug: true,
  onSubscribe: (subscriptionId) => {
    console.log('Subscribed:', subscriptionId);
  },
  onUnsubscribe: () => {
    console.log('Unsubscribed');
  }
});

await pushNotify.init();
```

### Subscribe
```javascript
await pushNotify.subscribe();
```

### Unsubscribe
```javascript
await pushNotify.unsubscribe();
```

### Check Status
```javascript
const isSubscribed = await pushNotify.isSubscribed();
const permission = pushNotify.getPermission();
```

### Set User Tags
```javascript
await pushNotify.setTags({
  plan: 'premium',
  userId: '12345',
  language: 'en'
});
```

## Sending Notifications

### Via API
```javascript
const response = await fetch('http://localhost:3001/api/v1/YOUR_PROJECT_ID/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Hello!',
    body: 'This is a test notification',
    icon: 'https://example.com/icon.png',
    url: 'https://example.com',
    targetType: 'ALL'
  })
});
```

### Via Admin Dashboard
1. Login to admin dashboard
2. Select your project
3. Fill in notification details
4. Choose target audience
5. Send!

## Environment Variables

### Backend
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/pushnotify
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=30d
CORS_ORIGIN=*
```

### Admin Dashboard
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Security Best Practices

1. **Change JWT Secret**: Always use a strong, unique JWT secret in production
2. **Use HTTPS**: Never use HTTP in production
3. **Secure Database**: Use strong passwords and limit network access
4. **Rate Limiting**: Already configured for 100 req/15min
5. **CORS**: Configure CORS_ORIGIN to your specific domains
6. **Environment Variables**: Never commit .env files

## Production Deployment

### Docker Deployment
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

1. Set up PostgreSQL and Redis servers
2. Clone repository and install dependencies
3. Configure environment variables
4. Run database migrations
5. Build TypeScript code
6. Start backend, worker, and admin services
7. Configure reverse proxy (nginx/Apache)
8. Set up SSL certificates

See [TESTING.md](TESTING.md) for deployment testing guide.

## Browser Support

- Chrome 50+
- Firefox 44+
- Safari 16+ (macOS 13+)
- Edge 17+
- Opera 37+

Note: Safari on iOS does not support web push notifications.

## Troubleshooting

### Service Worker Registration Failed
- Ensure service worker is served from same origin
- Check browser console for errors
- Verify HTTPS in production (required for service workers)

### Notifications Not Received
- Check browser notification permissions
- Verify VAPID keys are correctly configured
- Check worker logs for errors
- Ensure Redis and PostgreSQL are running

### Database Connection Failed
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Run `npx prisma migrate deploy`

See [TESTING.md](TESTING.md) for more troubleshooting tips.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Support

For issues and questions:
- Open a GitHub issue
- Check existing documentation
- Review example integration

## Roadmap

- [ ] Email notifications support
- [ ] SMS notifications support
- [ ] Advanced analytics dashboard
- [ ] A/B testing for notifications
- [ ] Rich notification templates
- [ ] Mobile app support (iOS/Android)
- [ ] Webhook integrations
- [ ] Multi-language support

---

Built with ❤️ for developers who want control over their push notification infrastructure.
