# Simple Website Example

This is a simple demonstration of how to integrate PushNotify SDK into your website.

## Setup

1. Make sure the PushNotify backend is running
2. Create a project in the admin dashboard and get your API key
3. Update the SDK path in `index.html` if needed (line 195)
4. Open `index.html` in a browser
5. Enter your API key and click "Initialize"
6. Click "Subscribe" to enable notifications

## Testing

1. Subscribe to notifications using this demo page
2. Go to the admin dashboard
3. Send a test notification to your project
4. You should receive the notification in your browser

## Notes

- Make sure your browser supports push notifications
- The service worker must be hosted on the same origin or use HTTPS
- For production, always use HTTPS
