# Payload Analytics Plugin API Documentation

This document provides detailed information about the API endpoints, configuration options, and event tracking capabilities of the Payload Analytics Plugin.

## Table of Contents

- [Plugin Configuration](#plugin-configuration)
- [JavaScript API](#javascript-api)
- [REST API Endpoints](#rest-api-endpoints)
- [Data Structures](#data-structures)
- [Custom Event Tracking](#custom-event-tracking)

## Plugin Configuration

The plugin can be configured with the following options when initializing in your Payload config:

```typescript
import { buildConfig } from 'payload/config'
import { analyticsPlugin } from '@antler-digital/plugin-analytics'

export default buildConfig({
  plugins: [
    analyticsPlugin({
      // Configuration options
      collectionSlug: 'analytics',
      dashboardSlug: '/analytics',
      dashboardLinkLabel: 'Analytics',
      maxAgeInDays: 30,
      isServerless: true,
    }),
  ],
})
```

### Configuration Options

| Option               | Type    | Default        | Description                                         |
| -------------------- | ------- | -------------- | --------------------------------------------------- |
| `collectionSlug`     | string  | `'analytics'`  | The name of the collection to store analytics data  |
| `dashboardSlug`      | string  | `'/analytics'` | The route path for the admin dashboard              |
| `dashboardLinkLabel` | string  | `'Analytics'`  | The label for the dashboard in the admin navigation |
| `maxAgeInDays`       | number  | `30`           | The number of days to retain analytics data         |
| `isServerless`       | boolean | `true`         | Whether the deployment is serverless                |

## JavaScript API

The client-side JavaScript API allows you to track page views and custom events.

### Initialization

```javascript
// Initialize analytics tracking
window.analytics = new Analytics({
  endpoint: 'https://your-payload-domain.com/api/pixel',
  domain: 'your-domain.com',
})
```

### Methods

#### track(eventName, properties)

Track a custom event with optional properties.

```javascript
window.analytics.track('button_click', {
  buttonId: 'signup',
  section: 'hero',
})
```

#### pageView(path)

Track a page view (automatically called on page load and route changes).

```javascript
window.analytics.pageView('/blog/how-to-use-payload')
```

#### identify(userId, traits)

Associate the current visitor with a user ID and additional traits.

```javascript
window.analytics.identify('user123', {
  email: 'user@example.com',
  plan: 'premium',
})
```

## REST API Endpoints

The plugin adds several REST API endpoints to your Payload application:

### POST /api/pixel

The primary endpoint for tracking page views and events.

**Request Body:**

```json
{
  "type": "pageview",
  "url": "/products/payload-cms",
  "referrer": "https://google.com",
  "deviceInfo": {
    "browser": "Chrome",
    "os": "macOS",
    "device": "desktop"
  },
  "utm": {
    "source": "twitter",
    "medium": "social",
    "campaign": "summer_launch"
  }
}
```

### GET /api/analytics/dashboard

Get dashboard data for the admin panel.

**Query Parameters:**

- `date_range`: The date range to filter data (e.g., `last_7_days`, `last_30_days`, `custom`)
- `date_from`: ISO date string for custom date range start
- `date_to`: ISO date string for custom date range end

**Response:**

Returns dashboard statistics including page views, unique visitors, and other metrics.

## Data Structures

### Event Collection Schema

The analytics collection created by the plugin has the following structure:

```typescript
type AnalyticsEvent = {
  id: string
  type: 'pageview' | 'custom'
  event?: string
  url: string
  path: string
  referrer?: string
  visitorId: string
  country?: string
  region?: string
  city?: string
  browser?: string
  os?: string
  device?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  properties?: Record<string, any>
  createdAt: Date
}
```

## Custom Event Tracking

In addition to automatic page view tracking, you can track custom events for specific user actions:

```javascript
// Track form submission
document.querySelector('form').addEventListener('submit', () => {
  window.analytics.track('form_submitted', {
    formId: 'contact',
    source: 'homepage',
  })
})

// Track button clicks
document.querySelector('.signup-button').addEventListener('click', () => {
  window.analytics.track('signup_clicked')
})
```

### Best Practices for Custom Events

- Use consistent naming conventions (e.g., `noun_verb`)
- Include relevant properties that provide context
- Avoid tracking personally identifiable information
- Group related events with common prefixes

For more examples and advanced usage, see the [examples directory](examples/) in the repository.

test
