# PayloadCMS MCP Plugin

A comprehensive PayloadCMS plugin that creates an MCP (Model Context Protocol) server compatible with Claude Desktop. This plugin automatically generates MCP tools for all your PayloadCMS collections and provides both embedded and standalone server options.

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

## Installation

```bash
pnpm install payload-plugin-mcp
```

## Quick Start

### 1. Environment Setup

Create a `.env` file in your project root:

```env
# Required: API key for MCP server authentication
MCP_API_KEY=your-secret-api-key-here

# Optional: Server configuration
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=0.0.0.0
```

### 2. Add to PayloadCMS Config

The plugin supports multiple configuration formats for maximum flexibility:

#### Option 1: Simple - Expose All Collections

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
      collections: 'all', // Expose all collections with default operations
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

#### Option 2: Import Collections Directly

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { PayloadPluginMcp } from 'payload-plugin-mcp'
// Import your collections
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Media } from './collections/Media'

export default buildConfig({
  collections: [Posts, Users, Media],
  plugins: [
    PayloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      // Pass collections directly (like Payload's native format)
      collections: [
        Posts, // Uses default operations
        Users, // Uses default operations
        Media, // Uses default operations
      ],
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

#### Option 3: Advanced - Per-Collection Configuration

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { PayloadPluginMcp } from 'payload-plugin-mcp'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Media } from './collections/Media'

export default buildConfig({
  collections: [Posts, Users, Media],
  plugins: [
    PayloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: [
        // Simple collection (uses default operations)
        Posts,

        // Collection with custom options
        {
          collection: Users,
          options: {
            operations: {
              list: true,
              get: true,
              create: true, // Enable creation for users
              update: true, // Enable updates for users
              delete: false, // Keep delete disabled
            },
            toolPrefix: 'user', // Custom tool prefix
            description: 'user management', // Custom description
            excludeFields: ['password'], // Hide sensitive fields
          },
        },

        // Media with different settings
        {
          collection: Media,
          options: {
            operations: {
              list: true,
              get: true,
              create: true,
              update: false,
              delete: true, // Allow media deletion
            },
            toolPrefix: 'file',
            description: 'file storage',
          },
        },
      ],
      // Default operations for collections without specific config
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

### 3. Start Your PayloadCMS Application

```bash
pnpm dev
```

The plugin will automatically:

- Generate MCP tools for your collections
- Start an MCP server on the configured port
- Log available endpoints and tools

Expected output:

```
✅ PayloadCMS MCP Plugin initialized
🔧 Collections exposed: posts, users, media
🛠️  Tools generated: 8
🌐 MCP HTTP server: http://0.0.0.0:3001/mcp
📡 SSE endpoint: http://0.0.0.0:3001/mcp/sse
🔐 Authentication: Enabled
   📋 posts: list, get
   📋 users: list, get, create, update
   📋 media: list, get, create, delete
```

## Generated Tools

The plugin generates tools based on your collection configuration:

### For the advanced configuration example above:

1. **posts_list** / **posts_get** - Basic read operations
2. **user_list** / **user_get** / **user_create** / **user_update** - Full CRUD except delete
3. **file_list** / **file_get** / **file_create** / **file_delete** - File management tools

### Tool Examples

#### List Tool (`posts_list`)

```json
{
  "name": "posts_list",
  "description": "List documents from the posts collection with optional filtering, pagination, and sorting",
  "input": {
    "where": { "status": { "equals": "published" } },
    "limit": 10,
    "page": 1,
    "sort": "-createdAt",
    "depth": 1
  }
}
```

#### Custom Tool (`user_create`)

```json
{
  "name": "user_create",
  "description": "Create a new document in the user management",
  "input": {
    "data": {
      "name": "John Doe",
      "email": "john@example.com"
      // Note: 'password' field excluded due to excludeFields config
    },
    "depth": 1
  }
}
```

## Collection Configuration Options

### CollectionMcpOptions

```typescript
interface CollectionMcpOptions {
  /**
   * Operations to enable for this collection
   */
  operations?: {
    list?: boolean // List documents with filtering/pagination
    get?: boolean // Get single document by ID
    create?: boolean // Create new documents
    update?: boolean // Update existing documents
    delete?: boolean // Delete documents
  }

  /**
   * Custom tool naming prefix (defaults to collection slug)
   * Example: 'user' generates 'user_list', 'user_get', etc.
   */
  toolPrefix?: string

  /**
   * Custom description for this collection's tools
   * Used in tool descriptions: "List documents from the {description}"
   */
  description?: string

  /**
   * Fields to exclude from schemas (useful for sensitive data)
   * Example: ['password', 'secret', 'internal']
   */
  excludeFields?: string[]

  /**
   * Additional metadata for this collection
   */
  metadata?: Record<string, any>
}
```

### Configuration Formats

```typescript
// Format 1: All collections with defaults
collections: 'all'

// Format 2: Direct collection imports
collections: [Posts, Users, Media]

// Format 3: Mixed configuration
collections: [
  Posts,                          // Uses defaults
  { collection: Users, options: {...} }, // Custom config
  Media,                          // Uses defaults
]
```

## Claude Desktop Integration

### Method 1: HTTP over SSE (Recommended for hosted servers)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "payloadcms": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "https://your-domain.com/mcp/sse?api_key=your-api-key"
      ]
    }
  }
}
```

### Method 2: Local Development

For local development, you can connect directly:

```json
{
  "mcpServers": {
    "payloadcms-local": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "http://localhost:3001/mcp/sse?api_key=your-api-key"
      ]
    }
  }
}
```

## API Endpoints

The plugin creates the following endpoints:

- `GET /mcp/list_tools` - List all available tools
- `POST /mcp/invoke` - Invoke a specific tool
- `GET /mcp/schemas/{tool}` - Get tool input/output schemas
- `GET /mcp/sse` - Server-Sent Events endpoint for HTTP transport
- `POST /mcp` - JSON-RPC 2.0 endpoint for MCP protocol
- `GET /health` - Health check endpoint

## Authentication

The plugin supports API key authentication:

1. Set the `MCP_API_KEY` environment variable
2. Include the API key in requests:
   - Header: `Authorization: Bearer your-api-key`
   - Query parameter: `?api_key=your-api-key`

## Advanced Usage Examples

### Content Management System

```typescript
// CMS with different access levels
PayloadPluginMcp({
  collections: [
    // Public content - read-only
    {
      collection: Posts,
      options: {
        operations: { list: true, get: true },
        description: 'blog posts',
      },
    },

    // Admin content - full access
    {
      collection: Pages,
      options: {
        operations: { list: true, get: true, create: true, update: true, delete: true },
        toolPrefix: 'page',
        description: 'website pages',
      },
    },

    // Media - managed uploads
    {
      collection: Media,
      options: {
        operations: { list: true, get: true, create: true, delete: true },
        toolPrefix: 'asset',
        description: 'media assets',
      },
    },
  ],
})
```

### E-commerce Setup

```typescript
// E-commerce with product management
PayloadPluginMcp({
  collections: [
    // Products - full management
    {
      collection: Products,
      options: {
        operations: { list: true, get: true, create: true, update: true },
        excludeFields: ['internalNotes', 'cost'],
      },
    },

    // Orders - read and update only
    {
      collection: Orders,
      options: {
        operations: { list: true, get: true, update: true },
        excludeFields: ['paymentDetails'],
      },
    },

    // Categories - read-only
    {
      collection: Categories,
      options: {
        operations: { list: true, get: true },
      },
    },
  ],
})
```

## Vercel Deployment

### 1. Create `api/mcp/[...path].ts`

```typescript
// api/mcp/[...path].ts
import { buildConfig } from 'payload'
import { payloadPluginMcp, mcpServerHandler } from 'payload-plugin-mcp'
import { NextRequest } from 'next/server'

// Your payload config
const config = buildConfig({
  // ... your payload configuration
  plugins: [
    payloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: 'all',
      enableHttpTransport: false, // Disable standalone server in Vercel
    }),
  ],
})

export async function GET(req: NextRequest) {
  // Initialize payload if needed
  const payload = await getPayload({ config })

  // Create mock request object compatible with PayloadRequest
  const payloadReq = {
    url: req.url,
    method: 'GET',
    headers: req.headers,
    payload,
    // Add other required properties
  }

  // Use the MCP handler
  const handler = mcpServerHandler({
    toolDescriptors: [], // Will be populated from config
    apiKey: process.env.MCP_API_KEY || '',
    serverName: 'PayloadCMS MCP Server',
    serverDescription: 'MCP server for PayloadCMS',
  })

  return handler(payloadReq)
}

export async function POST(req: NextRequest) {
  // Similar implementation for POST requests
}
```

### 2. Environment Variables

Set in Vercel dashboard:

```
MCP_API_KEY=your-production-api-key
```

### 3. Claude Desktop Configuration

```json
{
  "mcpServers": {
    "payloadcms-production": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "https://your-app.vercel.app/api/mcp/sse?api_key=your-api-key"
      ]
    }
  }
}
```

## Testing Your MCP Server

### 1. Test Tool Listing

```bash
curl -H "Authorization: Bearer your-api-key" \
     http://localhost:3001/mcp/list_tools
```

### 2. Test Tool Invocation

```bash
curl -X POST \
     -H "Authorization: Bearer your-api-key" \
     -H "Content-Type: application/json" \
     -d '{
       "tool": "posts_list",
       "input": {
         "where": { "status": { "equals": "published" } },
         "limit": 5
       }
     }' \
     http://localhost:3001/mcp/invoke
```

### 3. Test Claude Desktop Connection

Use the MCP Inspector to test your server:

```bash
npx @modelcontextprotocol/inspector http://localhost:3001/mcp/sse?api_key=your-api-key
```

## Configuration Options

| Option                 | Type                           | Default                   | Description                        |
| ---------------------- | ------------------------------ | ------------------------- | ---------------------------------- |
| `apiKey`               | string                         | `process.env.MCP_API_KEY` | API key for authentication         |
| `collections`          | CollectionMcpConfig[] \| 'all' | 'all'                     | Collections to expose              |
| `defaultOperations`    | ToolOperations                 | `{list: true, get: true}` | Default operations for collections |
| `port`                 | number                         | 3001                      | Server port                        |
| `host`                 | string                         | '0.0.0.0'                 | Server host                        |
| `enableHttpTransport`  | boolean                        | true                      | Enable HTTP server                 |
| `enableStdioTransport` | boolean                        | true                      | Enable stdio transport             |
| `serverName`           | string                         | 'PayloadCMS MCP Server'   | Server name                        |
| `serverDescription`    | string                         | Auto-generated            | Server description                 |
| `disabled`             | boolean                        | false                     | Disable the plugin                 |

## Troubleshooting

### Common Issues

1. **"Invalid or missing API key"**
   - Ensure `MCP_API_KEY` is set in your environment
   - Check that the API key is being passed correctly in requests

2. **"Tool not found"**
   - Verify that the collection is included in the plugin configuration
   - Check that the operation is enabled in the collection's operations config

3. **"Collection not found in registered collections"**
   - Ensure imported collections are also added to the main collections array
   - Check collection slug matches between import and registration

### Debug Mode

Enable debug logging:

```typescript
payloadPluginMcp({
  // ... other options
  debug: true, // Enable debug logging
})
```

### Health Check

Check server status:

```bash
curl http://localhost:3001/health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- 📖 [Documentation](https://github.com/your-repo/payload-plugin-mcp)
- 🐛 [Issue Tracker](https://github.com/your-repo/payload-plugin-mcp/issues)
- 💬 [Discussions](https://github.com/your-repo/payload-plugin-mcp/discussions)

## Related

- [PayloadCMS](https://payloadcms.com) - The headless CMS
- [Model Context Protocol](https://modelcontextprotocol.io) - The protocol specification
- [Claude Desktop](https://claude.ai/desktop) - AI assistant with MCP support
