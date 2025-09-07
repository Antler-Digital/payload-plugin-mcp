# Payload MCP Plugin

A comprehensive PayloadCMS plugin that creates an MCP (Model Context Protocol) server compatible with Claude Desktop and other AI assistants.

## Features

- 🚀 **Automatic Tool Generation**: Generates MCP tools for all PayloadCMS collections
- 🔐 **API Key Authentication**: Secure authentication using environment variables
- 🌐 **Multiple Transport Options**: Supports both HTTP/SSE and stdio transports
- ☁️ **Vercel Ready**: Optimized for serverless deployment
- 🛠️ **Comprehensive Operations**: List, get, create, update, and delete operations
- 📊 **Rich JSON Schemas**: Automatically generated schemas from collection fields
- 🔄 **Real-time Updates**: SSE support for real-time communication
- 📝 **Full Claude Desktop Integration**: Ready to use with Claude Desktop
- 🎛️ **Per-Collection Control**: Configure operations individually for each collection
- 🏷️ **Custom Tool Naming**: Custom prefixes and descriptions per collection

## Quick Start

```bash
pnpm install payload-plugin-mcp
```

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { PayloadPluginMcp } from 'payload-plugin-mcp'

export default buildConfig({
  collections: [
    // your collections here
  ],
  plugins: [
    PayloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: 'all',
      defaultOperations: {
        list: true,
        get: true,
        create: false,
        update: false,
        delete: false,
      },
    }),
  ],
})
```

## What's Next?

<div class="vp-doc">
  <div class="custom-block tip">
    <p class="custom-block-title">Get Started</p>
    <p>Follow our <a href="/guide/getting-started">installation guide</a> to set up the plugin in your Payload CMS project.</p>
  </div>

  <div class="custom-block info">
    <p class="custom-block-title">Examples</p>
    <p>Check out our <a href="/examples/">example configurations</a> for different use cases like e-commerce, content management, and more.</p>
  </div>

  <div class="custom-block warning">
    <p class="custom-block-title">API Reference</p>
    <p>Explore the complete <a href="/api/">API documentation</a> for advanced configuration options.</p>
  </div>
</div>