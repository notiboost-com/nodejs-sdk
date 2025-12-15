# NotiBoost Node.js SDK

Official Node.js SDK for NotiBoost - Notification Orchestration Platform.

## Installation

```bash
npm install @notiboost/sdk
```

## Quick Start

```javascript
const { NotiBoost } = require('@notiboost/sdk');

const client = new NotiBoost({
  apiKey: 'YOUR_API_KEY'
});

// Send an event
const result = await client.events.ingest({
  event_name: 'order_created',
  event_id: 'evt_001',
  occurred_at: new Date().toISOString(),
  user_id: 'u_123',
  properties: {
    order_id: 'A001',
    amount: 350000
  }
});

console.log('Trace ID:', result.trace_id);
```

## API Reference

### Constructor

```javascript
new NotiBoost(options)
```

**Options:**
- `apiKey` (string, required) - Your NotiBoost API key
- `baseURL` (string, optional) - Custom API base URL (default: `https://api.notiboost.com`)
- `timeout` (number, optional) - Request timeout in milliseconds (default: `30000`)
- `retries` (number, optional) - Number of retry attempts (default: `3`)

### Events

#### `events.ingest(event)`

Ingest a single event.

```javascript
const result = await client.events.ingest({
  event_name: 'order_created',
  event_id: 'evt_001',
  occurred_at: new Date().toISOString(),
  user_id: 'u_123',
  properties: {
    order_id: 'A001',
    amount: 350000
  }
});
```

**Returns:**
```javascript
{
  success: true,
  trace_id: 'trc_abc123',
  event_id: 'evt_001',
  message: 'Event ingested successfully'
}
```

#### `events.ingestBatch(events)`

Ingest multiple events in a single request.

```javascript
const result = await client.events.ingestBatch([
  {
    event_name: 'order_created',
    event_id: 'evt_001',
    user_id: 'u_123',
    properties: { order_id: 'A001' }
  },
  {
    event_name: 'payment_success',
    event_id: 'evt_002',
    user_id: 'u_123',
    properties: { order_id: 'A001' }
  }
]);
```

### Users

#### `users.create(user)`

Create a new user.

```javascript
await client.users.create({
  user_id: 'u_123',
  name: 'Nguyễn Văn A',
  email: 'user@example.com',
  phone: '+84901234567',
  properties: {
    segment: 'vip',
    preferred_channel: 'zns'
  }
});
```

#### `users.get(userId)`

Get user by ID.

```javascript
const user = await client.users.get('u_123');
```

**Returns:**
```javascript
{
  user_id: 'u_123',
  name: 'Nguyễn Văn A',
  email: 'user@example.com',
  phone: '+84901234567',
  channel_data: {
    email: 'user@example.com',
    phone: '+84901234567',
    push_token: 'fcm_token_abc123',
    push_platform: 'android',
    zns_oa_id: '123456789'
  },
  properties: {
    segment: 'vip',
    preferred_channel: 'zns'
  },
  created_at: '2025-12-01T10:00:00Z',
  updated_at: '2025-12-01T10:00:00Z'
}
```

#### `users.update(userId, data)`

Update user.

```javascript
await client.users.update('u_123', {
  name: 'Nguyễn Văn B'
});
```

#### `users.delete(userId)`

Delete user.

```javascript
await client.users.delete('u_123');
```

#### `users.setChannelData(userId, channelData)`

Set channel data for user.

```javascript
await client.users.setChannelData('u_123', {
  email: 'user@example.com',
  phone: '+84901234567',
  push_token: 'fcm_token_abc123',
  push_platform: 'android',
  zns_oa_id: '123456789'
});
```

#### `users.setPreferences(userId, preferences)`

Set user notification preferences.

```javascript
await client.users.setPreferences('u_123', {
  channels: {
    zns: { enabled: true },
    email: { enabled: true },
    sms: { enabled: true },
    push: { enabled: true }
  },
  categories: {
    order: { enabled: true },
    marketing: { enabled: false }
  }
});
```

#### `users.createBatch(users)`

Create multiple users in a single request.

```javascript
await client.users.createBatch([
  {
    user_id: 'u_123',
    name: 'Nguyễn Văn A',
    email: 'user1@example.com',
    phone: '+84901234567'
  },
  {
    user_id: 'u_124',
    name: 'Trần Thị B',
    email: 'user2@example.com',
    phone: '+84901234568',
    push_token: 'fcm_token_xyz789',
    push_platform: 'ios'
  }
]);
```

### Flows

#### `flows.create(flow)`

Create a notification flow.

```javascript
await client.flows.create({
  name: 'order_confirmation',
  description: 'Send order confirmation via ZNS',
  rules: [
    {
      condition: "event_name == 'order_created'",
      action: 'send_zns'
    }
  ],
  channels: ['zns'],
  template_id: 'tpl_order_confirm'
});
```

### Templates

#### `templates.create(template)`

Create a template.

```javascript
await client.templates.create({
  name: 'order_confirmation_zns',
  channel: 'zns',
  content: {
    header: 'Xác nhận đơn hàng',
    body: 'Đơn hàng {{order_id}} đã được xác nhận. Tổng tiền: {{amount}} VNĐ',
    footer: 'Cảm ơn bạn đã mua sắm'
  },
  variables: ['order_id', 'amount']
});
```

#### `templates.list(options)`

List templates.

```javascript
const templates = await client.templates.list({
  channel: 'zns'
});
```

#### `templates.get(templateId)`

Get template by ID.

```javascript
const template = await client.templates.get('tpl_order_confirm');
```

#### `templates.update(templateId, data)`

Update template.

```javascript
await client.templates.update('tpl_order_confirm', {
  content: {
    body: 'Updated body content'
  }
});
```

### Webhooks

#### `webhooks.create(webhook)`

Create a webhook.

```javascript
await client.webhooks.create({
  url: 'https://your-app.com/webhooks/notiboost',
  events: ['message.sent', 'message.delivered', 'message.failed'],
  secret: 'your_webhook_secret'
});
```

## Error Handling

```javascript
try {
  await client.events.ingest(event);
} catch (error) {
  if (error.statusCode === 429) {
    // Rate limit exceeded
    console.log('Rate limit exceeded, retrying...');
  } else if (error.statusCode === 401) {
    // Invalid API key
    console.error('Invalid API key');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Idempotency

Use `Idempotency-Key` header for idempotent requests:

```javascript
await client.events.ingest(event, {
  headers: {
    'Idempotency-Key': 'unique-key-12345'
  }
});
```

## Rate Limits

The SDK automatically handles rate limit headers:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time for the window

## Best Practices

1. Use singleton pattern for client instance
2. Cache API key and don't hardcode in code
3. Use async/await for non-blocking calls
4. Monitor errors and retry logic
5. Use idempotency keys for critical operations

