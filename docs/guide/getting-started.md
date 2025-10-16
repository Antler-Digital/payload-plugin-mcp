# Getting Started

## Prerequisites

- Node.js 18.20.2+ or 20.9.0+ or 22.0.0+
- Payload CMS 3.0.0+
- pnpm 9+ (recommended) or npm

## Installation

Install the plugin using your preferred package manager:

::: code-group

```bash [pnpm]
pnpm add payload-plugin-mcp
```

```bash [npm]
npm install payload-plugin-mcp
```

```bash [yarn]
yarn add payload-plugin-mcp
```

:::

## Environment Setup

Create or update your `.env` file with the required configuration:

```env
# Required: API key for MCP server authentication
MCP_API_KEY=your-secret-api-key-here
```

::: tip
Generate a secure API key using a tool like `openssl rand -hex 32` or use a UUID generator.
:::

## Basic Configuration

Add the plugin to your Payload configuration:

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { PayloadPluginMcp } from 'payload-plugin-mcp'

export default buildConfig({
  collections: [
    // your existing collections
  ],
  plugins: [
    PayloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: 'all', // Expose all collections
      defaultOperations: {
        list: true, // Enable listing documents
        get: true, // Enable getting single documents
        create: false, // Disable creation (read-only by default)
        update: false, // Disable updates (read-only by default)
        delete: false, // Disable deletion (read-only by default)
      },
    }),
  ],
})
```

## Start Your Application

Start your Payload CMS application:

```bash
pnpm dev
```

You should see output similar to:

```
✅ PayloadCMS MCP Plugin initialized
🔧 Collections exposed: posts, users, media
🛠️  Tools generated: 6
🌐 MCP HTTP server: http://0.0.0.0:3001/plugin/mcp
🔐 Authentication: Enabled
   📋 posts: list, get
   📋 users: list, get
   📋 media: list, get
```

## Verify Installation

Test that the plugin is working by making a request to the MCP endpoint:

```bash
curl -H "Authorization: Bearer your-api-key" \
     http://localhost:3001/plugin/mcp
```

You should receive a response with information about available tools and the server status.

## Next Steps

- Configure collections for more advanced setups (see README.md)
- Set up Claude Desktop integration (see README.md)
- Deploy to production (see examples/vercel/)

::: warning Important
Never commit your API key to version control. Always use environment variables for sensitive configuration.
:::
