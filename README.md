# PayloadCMS MCP Plugin

A comprehensive PayloadCMS plugin that creates an MCP (Model Context Protocol) server compatible with Claude Desktop. This plugin automatically generates MCP tools for all your PayloadCMS collections and provides both embedded and standalone server options.

## Features

- 🚀 **Automatic Tool Generation**: Generates MCP tools for all PayloadCMS collections
- 🔐 **API Key Authentication**: Secure authentication using environment variables
- 🌐 **HTTP Transport**: Reliable HTTP-based MCP communication
- ☁️ **Vercel Ready**: Optimized for serverless deployment
- 🛠️ **Comprehensive Operations**: List, get, create, update, and delete operations
- 📊 **Rich JSON Schemas**: Automatically generated schemas from collection fields
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

```bash
openssl rand -base64 32 # => eg ACDlHFY0DoreUVnxB62dSPUU++AFg8M5W3fWy6mtyD4=
```

```env
# Required: API key for MCP server authentication
MCP_API_KEY=your-secret-api-key-here
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
    // other plugins...
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

```bash
✅ PayloadCMS MCP Plugin initialized
🔧 Collections exposed: posts, users, media
🛠️  Tools generated: 8
🌐 MCP HTTP server: http://0.0.0.0:3000/api/plugin/mcp
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

## HTTP vs SSE: Why We Chose HTTP

This plugin uses **HTTP transport** instead of Server-Sent Events (SSE) for MCP communication. Here's why:

### Comparison Table

| Aspect             | HTTP                            | SSE                             |
| ------------------ | ------------------------------- | ------------------------------- |
| **Connection**     | Request/response, stateless     | Persistent, long-lived          |
| **Data Flow**      | Client requests data            | Server can push data anytime    |
| **Use Cases**      | Standard CRUD operations        | Real-time updates, streaming    |
| **Complexity**     | Lower (simple request/response) | Higher (connection management)  |
| **Performance**    | Better for one-off operations   | Better for frequent updates     |
| **Serverless**     | Excellent (stateless)           | Challenging (timeout limits)    |
| **Debugging**      | Easier to debug                 | More complex to troubleshoot    |
| **PayloadCMS Fit** | Perfect for CMS operations      | Overkill for most CMS use cases |

### Why HTTP is Better for PayloadCMS

1. **CRUD Operations**: Most CMS operations are request/response based
2. **Serverless Friendly**: Works perfectly with Vercel/Netlify deployments
3. **Simpler Architecture**: Easier to maintain and debug
4. **Stateless Design**: Fits well with PayloadCMS's architecture
5. **Better Performance**: For typical CMS operations, HTTP is more efficient

### SSE Roadmap

**Server-Sent Events support is on our roadmap** and will be added in a future release. SSE will be valuable for:

- Real-time notifications when content is published
- Live progress updates for bulk operations
- Streaming responses for large data exports
- Live collaboration features

## Claude Desktop Integration

Claude Desktop loads the `claude_desktop_config.json` file when it starts up.
It will send requests to the endpoints created by the plugin and will become available in your tools.

### Method 1: Production (Hosted Servers)

Add to your `claude_desktop_config.json`:

The `npx mcp-remote -y` will execute a remote dependency needed to run the plugin.
For example, this would work if deployed to Vercel (eg you-domain.vercel.app/api/plugin/mcp)

```json
{
  "mcpServers": {
    "payloadcms": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://your-domain.com/api/plugin/mcp",
        "--header",
        "Authorization: Bearer ${MCP_API_KEY}",
        "--header",
        "Content-Type: application/json"
      ],
      "env": {
        "MCP_API_KEY": "your-api-key"
      }
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
        "mcp-remote",
        "http://localhost:3000/api/plugin/mcp",
        "--header",
        "Authorization: Bearer ${MCP_API_KEY}"
      ],
      "env": {
        "MCP_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Cursor Integration

Cursor is an AI-powered code editor that supports MCP (Model Context Protocol) servers. You can use this plugin with Cursor to interact with your PayloadCMS data directly from your development environment.

### Setting Up Cursor MCP

1. **Install the MCP Extension** (if not already installed)
   - Open Cursor
   - Go to Extensions and search for "MCP" or "Model Context Protocol"
   - Install the official MCP extension

2. **Configure MCP Server in Cursor**

   Add your PayloadCMS MCP server to Cursor's MCP configuration:

   **For Local Development:**

   ```json
   {
     "mcpServers": {
       "payloadcms-local": {
         "command": "npx",
         "args": [
           "-y",
           "mcp-remote",
           "http://localhost:3000/api/plugin/mcp",
           "--header",
           "Authorization: Bearer ${MCP_API_KEY}"
         ],
         "env": {
           "MCP_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

   **For Production:**

   ```json
   {
     "mcpServers": {
       "payloadcms-production": {
         "command": "npx",
         "args": [
           "-y",
           "mcp-remote",
           "https://your-domain.com/api/plugin/mcp",
           "--header",
           "Authorization: Bearer ${MCP_API_KEY}",
           "--header",
           "Content-Type: application/json"
         ],
         "env": {
           "MCP_API_KEY": "your-production-api-key"
         }
       }
     }
   }
   ```

3. **Restart Cursor**
   - Close and reopen Cursor to load the new MCP configuration
   - The PayloadCMS tools should now be available in Cursor's AI chat

### Using PayloadCMS Tools in Cursor

Once configured, you can use your PayloadCMS collections directly in Cursor's AI chat:

**Example Commands:**

- "List all published posts from my CMS"
- "Create a new user with email john@example.com"
- "Update the post with ID 123 to set status to published"
- "Show me the latest 5 media files"
- "Delete the user with ID 456"

**Cursor will automatically:**

- Use the appropriate MCP tools based on your collection configuration
- Handle authentication with your API key
- Format responses in a developer-friendly way
- Provide context about your CMS structure

### Benefits of Using Cursor with PayloadCMS

- **Direct CMS Access**: Query and modify your CMS data without leaving your editor
- **Code Context**: Cursor understands your codebase and can suggest CMS operations based on your current work
- **Automated Workflows**: Create content, manage users, and update data as part of your development workflow
- **Real-time Integration**: Changes made through Cursor are immediately reflected in your CMS

### Troubleshooting Cursor Integration

1. **Tools Not Appearing**
   - Verify your MCP server is running (`pnpm dev`)
   - Check that the API key is correctly set in Cursor's environment
   - Restart Cursor after configuration changes

2. **Authentication Errors**
   - Ensure `MCP_API_KEY` matches between your PayloadCMS config and Cursor
   - Test the API key with curl first (see Testing section below)

3. **Connection Issues**
   - For local development, ensure your PayloadCMS server is running on the correct port
   - For production, verify the URL is accessible and CORS is properly configured

## Testing Your MCP Server

### 1. Test Tool Listing

```bash
curl -H "Authorization: Bearer your-api-key" \
     http://localhost:3000/api/plugin/mcp
```

### 2. Test Tool Invocation

```bash
curl -X POST \
     -H "Authorization: Bearer your-api-key" \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/call",
       "params": {
         "name": "posts_list",
         "arguments": {
           "where": { "status": { "equals": "published" } },
           "limit": 5
         }
       }
     }' \
     http://localhost:3000/api/plugin/mcp
```

### 3. Test with MCP Inspector

Use the MCP Inspector to test your server:

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/api/plugin/mcp
```

This will open the MCP Inspector at `http://localhost:6274` where you can:

- Enter your Authorization header (`Bearer your-api-key`)
- Test MCP tool execution
- Explore available tools and their schemas
- Debug connection issues

## API Endpoints

The plugin creates the following endpoints:

- `GET /api/plugin/mcp` - Discovery endpoint (lists available tools)
- `POST /api/plugin/mcp` - JSON-RPC 2.0 endpoint for MCP protocol
- `OPTIONS /api/plugin/mcp` - CORS preflight handling

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

### 1. Create an MCP token for production

```bash
openssl rand -base64 32
```

### 2. Environment Variables

Set in Vercel dashboard:

```
MCP_API_KEY=your-production-api-key
```

### 2. Claude Desktop Configuration

```json
{
  "mcpServers": {
    "payloadcms-production": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://your-app.vercel.app/api/mcp",
        "--header",
        "Authorization: Bearer ${MCP_API_KEY}",
        "--header",
        "application/json"
      ],
      "env": {
        "MCP_API_KEY": "your-production-api-key"
      }
    }
  }
}
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
curl http://localhost:3000/api/plugin/mcp
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

- 📖 [Documentation](https://github.com/Antler-Digital/payload-plugin-mcp)
- 🐛 [Issue Tracker](https://github.com/Antler-Digital/payload-plugin-mcp/issues)

## Related

- [PayloadCMS](https://payloadcms.com) - The headless CMS
- [Model Context Protocol](https://modelcontextprotocol.io) - The protocol specification
- [Claude Desktop](https://claude.ai/desktop) - AI assistant with MCP support
