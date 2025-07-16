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

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { payloadPluginMcp } from 'payload-plugin-mcp'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
        },
        {
          name: 'status',
          type: 'select',
          options: ['draft', 'published'],
          defaultValue: 'draft',
        },
      ],
    },
    {
      slug: 'users',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
    },
  ],
  plugins: [
    payloadPluginMcp({
      // API key from environment variable
      apiKey: process.env.MCP_API_KEY,
      
      // Collections to expose (default: 'all')
      collections: {
        posts: true,
        users: true,
      },
      
      // Operations to enable (default: list and get only)
      operations: {
        list: true,
        get: true,
        create: false, // Set to true to enable creation
        update: false, // Set to true to enable updates
        delete: false, // Set to true to enable deletion
      },
      
      // Server configuration
      port: parseInt(process.env.MCP_SERVER_PORT || '3001'),
      host: process.env.MCP_SERVER_HOST || '0.0.0.0',
      
      // Server identification
      serverName: 'My PayloadCMS MCP Server',
      serverDescription: 'MCP server providing access to PayloadCMS collections',
    }),
  ],
  // ... rest of your config
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
🔧 Collections exposed: posts, users
🛠️  Tools generated: 4
🌐 MCP HTTP server: http://0.0.0.0:3001/mcp
📡 SSE endpoint: http://0.0.0.0:3001/mcp/sse
🔐 Authentication: Enabled
```

## Generated Tools

For each collection, the plugin generates tools based on enabled operations:

### List Tools (`{collection}_list`)
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

### Get Tools (`{collection}_get`)
```json
{
  "name": "posts_get",
  "description": "Get a single document by ID from the posts collection",
  "input": {
    "id": "document-id-here",
    "depth": 1
  }
}
```

### Create Tools (`{collection}_create`)
```json
{
  "name": "posts_create",
  "description": "Create a new document in the posts collection",
  "input": {
    "data": {
      "title": "New Post Title",
      "content": { "type": "richText", "content": "..." },
      "status": "draft"
    },
    "depth": 1
  }
}
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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | `process.env.MCP_API_KEY` | API key for authentication |
| `collections` | object \| 'all' | 'all' | Collections to expose |
| `operations` | object | `{list: true, get: true}` | Operations to enable |
| `port` | number | 3001 | Server port |
| `host` | string | '0.0.0.0' | Server host |
| `enableHttpTransport` | boolean | true | Enable HTTP server |
| `enableStdioTransport` | boolean | true | Enable stdio transport |
| `serverName` | string | 'PayloadCMS MCP Server' | Server name |
| `serverDescription` | string | Auto-generated | Server description |
| `disabled` | boolean | false | Disable the plugin |

## Troubleshooting

### Common Issues

1. **"Invalid or missing API key"**
   - Ensure `MCP_API_KEY` is set in your environment
   - Check that the API key is being passed correctly in requests

2. **"Tool not found"**
   - Verify that the collection is included in the plugin configuration
   - Check that the operation is enabled in the `operations` config

3. **"Payload instance not available"**
   - Ensure PayloadCMS is properly initialized
   - Check that the request has access to the payload instance

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

## Advanced Usage

### Custom Tool Filtering

```typescript
payloadPluginMcp({
  collections: {
    posts: true,
    users: true,
    // Exclude sensitive collections
    // secrets: false (default)
  },
  operations: {
    list: true,
    get: true,
    create: true, // Enable for specific use cases
    update: false, // Disable for safety
    delete: false, // Disable for safety
  },
})
```

### Standalone Server

Create a standalone MCP server without PayloadCMS:

```typescript
import { createStandaloneMcpServer, generateToolDescriptors } from 'payload-plugin-mcp'

// Mock collections for demonstration
const mockCollections = [
  {
    slug: 'posts',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'content', type: 'richText' },
    ],
  },
]

const toolDescriptors = generateToolDescriptors(mockCollections, {
  list: true,
  get: true,
})

await createStandaloneMcpServer(toolDescriptors, {
  port: 3001,
  apiKey: 'your-api-key',
  serverName: 'Demo MCP Server',
})
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
