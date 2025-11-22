# Quick Start Guide

Get PushNotify up and running in 5 minutes!

## Option 1: Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- Git

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd push-notification-service
```

2. **Start all services**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- Backend API (port 3001)
- Worker process
- Admin Dashboard (port 3002)

3. **Wait for services to be ready** (about 30 seconds)
```bash
docker-compose logs -f backend
# Wait until you see "Server running on port 3001"
```

4. **Access the admin dashboard**

Open http://localhost:3002 in your browser

5. **Create your admin account**
- Click "Sign up"
- Enter email and password
- Click "Sign up"

6. **Create your first project**
- Click "New Project"
- Enter project name (e.g., "My Website")
- Click "Create"
- Copy the API key (you'll need this for integration)

7. **Test with the demo page**
- Open `examples/simple-website/index.html` in a browser
- Enter your API key
- Click "Initialize"
- Click "Subscribe"
- Allow notifications when prompted

8. **Send a test notification**
- Go back to admin dashboard
- You should see your project with 1 subscription
- Send a notification (feature can be implemented)

Done! Your push notification system is ready.

## Option 2: Manual Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Backend Setup

1. **Install backend dependencies**
```bash
cd backend
npm install
```

2. **Create .env file**
```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/pushnotify
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=30d
CORS_ORIGIN=*
```

3. **Run database migrations**
```bash
npx prisma migrate dev
```

4. **Start the backend**
```bash
npm run dev
```

Backend will run on http://localhost:3001

### Worker Setup

In a new terminal:

```bash
cd backend
npm run worker
```

### Admin Dashboard Setup

1. **Install dependencies**
```bash
cd admin-dashboard
npm install
```

2. **Create .env.local file**
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

3. **Start the dashboard**
```bash
npm run dev
```

Dashboard will run on http://localhost:3002

### Client SDK Setup

1. **Build the SDK**
```bash
cd client-sdk
npm install
npm run build
```

2. **Copy files to your website**
```bash
cp dist/index.js /path/to/your/website/pushnotify.js
cp push-sw.js /path/to/your/website/push-sw.js
```

## Integration Example

### Basic Integration

Add to your website's HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <button id="subscribe-btn">Enable Notifications</button>

    <script src="/pushnotify.js"></script>
    <script>
        const pushNotify = new PushNotify({
            apiKey: 'your-api-key-from-dashboard',
            apiUrl: 'http://localhost:3001'
        });

        // Initialize SDK
        pushNotify.init();

        // Subscribe on button click
        document.getElementById('subscribe-btn').addEventListener('click', async () => {
            try {
                await pushNotify.subscribe();
                alert('Successfully subscribed to notifications!');
            } catch (error) {
                console.error('Failed to subscribe:', error);
            }
        });
    </script>
</body>
</html>
```

### Service Worker

Create `push-sw.js` in your website root:

```javascript
// Copy the push-sw.js from client-sdk/push-sw.js
```

### Advanced Configuration

```javascript
const pushNotify = new PushNotify({
    apiKey: 'your-api-key',
    apiUrl: 'https://your-api-domain.com',
    autoPrompt: true,           // Auto-prompt for permission
    promptDelay: 3000,          // Wait 3 seconds before prompting
    serviceWorkerPath: '/push-sw.js',
    debug: true,                // Enable debug logging
    onSubscribe: (subscriptionId) => {
        console.log('User subscribed:', subscriptionId);
        // Track subscription in your analytics
    },
    onUnsubscribe: () => {
        console.log('User unsubscribed');
    }
});

await pushNotify.init();
```

## First Notification

### Using API

```bash
curl -X POST http://localhost:3001/api/v1/YOUR_PROJECT_ID/notifications/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome!",
    "body": "Thanks for subscribing to notifications",
    "icon": "https://example.com/icon.png",
    "url": "https://example.com",
    "targetType": "ALL"
  }'
```

### Targeting Options

**Send to all users:**
```json
{
  "title": "Hello Everyone!",
  "body": "This goes to all subscribers",
  "targetType": "ALL"
}
```

**Send to specific browser:**
```json
{
  "title": "Chrome Users",
  "body": "Special message for Chrome users",
  "targetType": "SEGMENT",
  "targetSegment": {
    "browserName": "Chrome"
  }
}
```

**Send to specific users by tag:**
```json
{
  "title": "Premium Users",
  "body": "Exclusive offer for premium members",
  "targetType": "SEGMENT",
  "targetSegment": {
    "tags": {
      "plan": "premium"
    }
  }
}
```

**Send to specific subscriptions:**
```json
{
  "title": "Individual Message",
  "body": "Message for specific users",
  "targetType": "INDIVIDUAL",
  "targetSegment": {
    "subscriptionIds": ["sub-id-1", "sub-id-2"]
  }
}
```

## Verification Steps

1. **Check backend is running**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

2. **Check database connection**
```bash
cd backend
npx prisma studio
# Should open Prisma Studio at http://localhost:5555
```

3. **Check Redis connection**
```bash
redis-cli ping
# Should return: PONG
```

4. **Check worker is running**
```bash
docker-compose logs worker
# Or check terminal where worker is running
```

## Common Issues

### Port Already in Use
```bash
# Change ports in docker-compose.yml or .env files
# For backend, change PORT in .env
# For admin, change port in package.json dev script
```

### Database Migration Failed
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

### Service Worker Not Registering
- Ensure you're using HTTPS (or localhost for testing)
- Check browser console for errors
- Verify service worker path is correct

### Redis Connection Failed
```bash
# Check Redis is running
docker ps | grep redis
# Or if manual install:
redis-cli ping
```

## Next Steps

1. **Explore the API**: See [API.md](docs/API.md) for complete API reference
2. **Test thoroughly**: See [TESTING.md](TESTING.md) for testing guide
3. **Deploy to production**: Update environment variables, use HTTPS, secure your database
4. **Read project summary**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture details

## Getting Help

- Check the main [README.md](README.md)
- Review example code in `examples/`
- Check logs: `docker-compose logs -f`
- Open an issue on GitHub

---

Happy notifying! 🔔
