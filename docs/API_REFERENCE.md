# API Reference

## Table of Contents

- [Plugin Configuration](#plugin-configuration)
- [Collection Configuration](#collection-configuration)
- [Global Configuration](#global-configuration)
- [MCP Tools](#mcp-tools)
- [Authentication](#authentication)
- [Media Upload](#media-upload)
- [Rich Text Processing](#rich-text-processing)
- [Error Handling](#error-handling)

## Plugin Configuration

### `PayloadPluginMcp`

The main plugin function that returns a PayloadCMS plugin configuration.

```typescript
function PayloadPluginMcp(pluginOptions: PayloadPluginMcpConfig): (config: Config) => Config
```

#### Parameters

- `pluginOptions` - Configuration object for the plugin

#### Returns

A function that takes a PayloadCMS config and returns the modified config with the plugin installed.

#### Example

```typescript
import { buildConfig } from 'payload/config'
import { PayloadPluginMcp } from 'payloadcms-mcp-plugin'

export default buildConfig({
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

## Collection Configuration

### `CollectionMcpConfig`

Configuration for exposing collections via MCP tools.

```typescript
type CollectionMcpConfig =
  | CollectionConfig
  | {
      collection: CollectionConfig
      options: CollectionMcpOptions
    }
```

### `CollectionMcpOptions`

Options for configuring how a collection is exposed via MCP.

```typescript
interface CollectionMcpOptions {
  /**
   * Operations to enable for this collection
   */
  operations?: ToolOperations

  /**
   * Custom tool naming prefix (defaults to collection slug)
   */
  toolPrefix?: string

  /**
   * Custom description for this collection's tools
   */
  description?: string

  /**
   * Fields to exclude from schemas
   */
  excludeFields?: string[]

  /**
   * Additional metadata for this collection
   */
  metadata?: Record<string, any>
}
```

#### Properties

- `operations` - Object specifying which operations to enable
- `toolPrefix` - Custom prefix for tool names (defaults to collection slug)
- `description` - Custom description for the collection's tools
- `excludeFields` - Array of field names to exclude from MCP schemas
- `metadata` - Additional metadata to include with the collection

#### Example

```typescript
{
  collection: Posts,
  options: {
    operations: {
      list: true,
      get: true,
      create: true,
      update: false,
      delete: false,
    },
    toolPrefix: 'blog',
    description: 'Blog post management tools',
    excludeFields: ['internalNotes', 'draftContent'],
  },
}
```

## Global Configuration

### `GlobalMcpConfig`

Configuration for exposing globals via MCP tools.

```typescript
type GlobalMcpConfig =
  | GlobalConfig
  | {
      global: GlobalConfig
      options: CollectionMcpOptions
    }
```

**Note**: Globals only support `get` and `update` operations.

## MCP Tools

### Tool Naming Convention

Tools are automatically generated with the naming pattern:

- `{collection}_{operation}` for collections
- `{global}_{operation}` for globals

Examples:

- `posts_list` - List posts collection
- `users_get` - Get user by ID
- `settings_get` - Get global settings
- `settings_update` - Update global settings

### Available Operations

#### `list` Operation

Retrieves a paginated list of documents.

**Tool Name**: `{collection}_list`

**Arguments**:

```typescript
{
  limit?: number        // Number of documents to return (default: 10)
  page?: number         // Page number (default: 1)
  where?: object        // PayloadCMS where clause
  sort?: string         // Sort field (default: 'createdAt')
  depth?: number        // Population depth (default: 1)
}
```

**Response**:

```typescript
{
  docs: Document[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}
```

#### `get` Operation

Retrieves a single document by ID.

**Tool Name**: `{collection}_get` or `{global}_get`

**Arguments**:

```typescript
{
  id: string           // Document ID (required)
  depth?: number       // Population depth (default: 1)
}
```

**Response**: The document object

#### `create` Operation

Creates a new document.

**Tool Name**: `{collection}_create`

**Arguments**:

```typescript
{
  data: object         // Document data (required)
  depth?: number       // Population depth (default: 1)
}
```

**Response**: The created document

#### `update` Operation

Updates an existing document.

**Tool Name**: `{collection}_update` or `{global}_update`

**Arguments**:

```typescript
{
  id: string           // Document ID (required)
  data: object         // Update data (required)
  depth?: number       // Population depth (default: 1)
}
```

**Response**: The updated document

#### `delete` Operation

Deletes a document.

**Tool Name**: `{collection}_delete`

**Arguments**:

```typescript
{
  id: string // Document ID (required)
}
```

**Response**: Success confirmation

## Authentication

### API Key Authentication

The plugin uses API key authentication for all MCP requests.

**Header**: `Authorization: Bearer {apiKey}`

**Environment Variable**: `MCP_API_KEY`

### Token-Based Authentication

For more granular access control, the plugin supports token-based authentication.

#### Token Types

- **User Token**: Impersonates a specific user
- **Service Token**: Uses scoped permissions
- **Admin Token**: Full access

#### Token Management

Tokens are stored in the `mcp-tokens` collection and can be managed through the PayloadCMS admin interface.

## Media Upload

### `media_upload` Tool

Uploads media files directly to PayloadCMS.

**Arguments**:

```typescript
{
  base64Data?: string  // Base64 encoded file data
  url?: string         // URL to download file from
  filename: string     // Filename (required)
  mimeType: string     // MIME type (required)
  alt?: string         // Alt text
  fileSize?: number    // File size in bytes
}
```

**Response**:

```typescript
{
  id: string
  filename: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
  url: string
  sizes: {
    thumbnail?: { url: string, width: number, height: number }
    card?: { url: string, width: number, height: number }
    tablet?: { url: string, width: number, height: number }
  }
}
```

### `media_upload_chunk` Tool

Uploads large files in chunks.

**Arguments**:

```typescript
{
  uploadId?: string    // Upload ID (for subsequent chunks)
  chunkIndex: number   // Current chunk index (0-based)
  totalChunks: number  // Total number of chunks
  chunkData: string    // Base64 encoded chunk data
  filename: string     // Filename (required for first chunk)
  mimeType: string     // MIME type (required for first chunk)
  alt?: string         // Alt text
  fileSize?: number    // Total file size (required for first chunk)
}
```

**Response**:

```typescript
// First chunk
{
  success: true
  uploadId: string
}

// Subsequent chunks
{
  success: true
  chunksReceived: number
}

// Final chunk
{
  success: true
  id: string
  url: string
  sizes: object
}
```

### `media_check_size` Tool

Checks file size and recommends upload strategy.

**Arguments**:

```typescript
{
  fileSize: number // File size in bytes (required)
}
```

**Response**:

```typescript
{
  isValid: boolean
  strategy: 'direct' | 'chunked' | 'url'
  reason: string
  maxSize: number
}
```

## Rich Text Processing

### Lexical Rich Text Support

The plugin automatically handles Lexical rich text fields:

- **List Operations**: Rich text is truncated to specified length
- **Get Operations**: Full rich text content is returned
- **Create/Update Operations**: Rich text is properly processed

### Configuration

```typescript
richText: {
  truncateInList: 200 // Truncate rich text in list responses
}
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```typescript
{
  success: false
  error: {
    message: string
    code: string
    details?: any
  }
}
```

### Common Error Codes

- `AUTHENTICATION_FAILED` - Invalid or missing API key
- `INVALID_INPUT` - Invalid input data
- `COLLECTION_NOT_FOUND` - Collection doesn't exist
- `DOCUMENT_NOT_FOUND` - Document not found
- `PERMISSION_DENIED` - Insufficient permissions
- `VALIDATION_ERROR` - Data validation failed
- `INTERNAL_ERROR` - Internal server error

### Error Handling Example

```typescript
try {
  const result = await mcp.call('posts_create', {
    data: { title: 'New Post' },
  })
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    console.error('Validation failed:', error.details)
  } else if (error.code === 'PERMISSION_DENIED') {
    console.error('Permission denied')
  } else {
    console.error('Unexpected error:', error.message)
  }
}
```

## Configuration Examples

### Basic Setup

```typescript
PayloadPluginMcp({
  apiKey: process.env.MCP_API_KEY,
  collections: 'all',
})
```

### Selective Collection Exposure

```typescript
PayloadPluginMcp({
  apiKey: process.env.MCP_API_KEY,
  collections: [
    Posts,
    Users,
    {
      collection: Media,
      options: {
        operations: { list: true, get: true },
        excludeFields: ['internalMetadata'],
      },
    },
  ],
})
```

### Custom Operations

```typescript
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
})
```

### Media Configuration

```typescript
PayloadPluginMcp({
  apiKey: process.env.MCP_API_KEY,
  collections: 'all',
  media: {
    enableChunking: true,
  },
})
```

### Token Configuration

```typescript
PayloadPluginMcp({
  apiKey: process.env.MCP_API_KEY,
  collections: 'all',
  tokens: {
    slug: 'api-tokens',
    admin: {
      label: 'API Tokens',
      description: 'Manage API access tokens',
    },
    access: {
      read: ({ req }) => req.user?.role === 'admin',
      create: ({ req }) => req.user?.role === 'editor',
    },
  },
})
```
