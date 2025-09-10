import React from 'react'
import Link from 'next/link'

export default function ApiReferencePage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/docs" className="text-blue-600 hover:text-blue-500 mb-4 inline-block">
            ← Back to Documentation
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Reference</h1>
        </div>

        <div className="prose prose-lg max-w-none">
          <h2>Table of Contents</h2>
          <ul>
            <li>
              <a href="#plugin-configuration">Plugin Configuration</a>
            </li>
            <li>
              <a href="#collection-configuration">Collection Configuration</a>
            </li>
            <li>
              <a href="#global-configuration">Global Configuration</a>
            </li>
            <li>
              <a href="#mcp-tools">MCP Tools</a>
            </li>
            <li>
              <a href="#authentication">Authentication</a>
            </li>
            <li>
              <a href="#api-endpoints">API Endpoints</a>
            </li>
            <li>
              <a href="#media-upload">Media Upload</a>
            </li>
            <li>
              <a href="#rich-text-processing">Rich Text Processing</a>
            </li>
            <li>
              <a href="#error-handling">Error Handling</a>
            </li>
          </ul>

          <h2 id="plugin-configuration">Plugin Configuration</h2>

          <h3>PayloadPluginMcp</h3>
          <p>The main plugin function that returns a PayloadCMS plugin configuration.</p>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <code className="block bg-white p-2 rounded">
              function PayloadPluginMcp(pluginOptions: PayloadPluginMcpConfig): (config: Config)
              =&gt; Config
            </code>
          </div>

          <h4>Parameters</h4>
          <ul>
            <li>
              <code>pluginOptions</code> - Configuration object for the plugin
            </li>
          </ul>

          <h4>Returns</h4>
          <p>
            A function that takes a PayloadCMS config and returns the modified config with the
            plugin installed.
          </p>

          <h4>Example</h4>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4">
            <pre className="text-sm">
              {`import { buildConfig } from 'payload'
import { PayloadPluginMcp } from 'payload-plugin-mcp'

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
})`}
            </pre>
          </div>

          <h2 id="collection-configuration">Collection Configuration</h2>

          <h3>Collection Options</h3>
          <p>Configure which collections to expose and their operations:</p>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <code className="block bg-white p-2 rounded">
              collections: 'all' | string[] | CollectionConfig[]
            </code>
          </div>

          <h4>Options</h4>
          <ul>
            <li>
              <code>'all'</code> - Expose all collections with default operations
            </li>
            <li>
              <code>string[]</code> - Array of collection names to expose
            </li>
            <li>
              <code>CollectionConfig[]</code> - Detailed configuration for each collection
            </li>
          </ul>

          <h4>CollectionConfig Interface</h4>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4">
            <pre className="text-sm">
              {`interface CollectionConfig {
  collection: Collection
  options?: {
    operations?: {
      list?: boolean
      get?: boolean
      create?: boolean
      update?: boolean
      delete?: boolean
    }
    toolPrefix?: string
    description?: string
    excludeFields?: string[]
  }
}`}
            </pre>
          </div>

          <h2 id="global-configuration">Global Configuration</h2>

          <h3>PayloadPluginMcpConfig Interface</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4">
            <pre className="text-sm">
              {`interface PayloadPluginMcpConfig {
  apiKey: string
  collections: 'all' | CollectionConfig[]
  defaultOperations?: {
    list?: boolean
    get?: boolean
    create?: boolean
    update?: boolean
    delete?: boolean
  }
  serverPort?: number
  serverHost?: string
  serverName?: string
  serverDescription?: string
  enableHttpTransport?: boolean
  enableStdioTransport?: boolean
  disabled?: boolean
  debug?: boolean
}`}
            </pre>
          </div>

          <h2 id="mcp-tools">MCP Tools</h2>

          <p>
            The plugin automatically generates MCP tools for each collection based on the configured
            operations:
          </p>

          <h3>Generated Tools</h3>
          <ul>
            <li>
              <code>{`{collection}_list`}</code> - List documents in a collection
            </li>
            <li>
              <code>{`{collection}_get`}</code> - Get a single document by ID
            </li>
            <li>
              <code>{`{collection}_create`}</code> - Create a new document
            </li>
            <li>
              <code>{`{collection}_update`}</code> - Update an existing document
            </li>
            <li>
              <code>{`{collection}_delete`}</code> - Delete a document
            </li>
          </ul>

          <h3>Tool Schema</h3>
          <p>
            Each tool includes a JSON schema generated from the collection's field definitions,
            ensuring type safety and validation.
          </p>

          <h2 id="authentication">Authentication</h2>

          <p>
            The plugin uses API key authentication. Include the API key in the Authorization header:
          </p>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <code className="block bg-white p-2 rounded">
              Authorization: Bearer your-api-key-here
            </code>
          </div>

          <p>Alternatively, you can pass the API key as a query parameter:</p>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <code className="block bg-white p-2 rounded">?api_key=your-api-key-here</code>
          </div>

          <h2 id="api-endpoints">API Endpoints</h2>

          <p>The plugin creates the following endpoints:</p>

          <ul>
            <li>
              <code>GET /api/plugin/mcp</code> - Discovery endpoint (lists available tools)
            </li>
            <li>
              <code>POST /api/plugin/mcp</code> - JSON-RPC 2.0 endpoint for MCP protocol
            </li>
            <li>
              <code>OPTIONS /api/plugin/mcp</code> - CORS preflight handling
            </li>
          </ul>

          <h3>Testing Endpoints</h3>

          <h4>Discovery</h4>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <code className="block bg-white p-2 rounded">
              curl -H "Authorization: Bearer your-api-key" http://localhost:3000/api/plugin/mcp
            </code>
          </div>

          <h4>Tool Invocation</h4>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <code className="block bg-white p-2 rounded">
              {`curl -X POST \\
     -H "Authorization: Bearer your-api-key" \\
     -H "Content-Type: application/json" \\
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/call",
       "params": {
         "name": "posts_list",
         "arguments": {
           "limit": 5
         }
       }
     }' \\
     http://localhost:3000/api/plugin/mcp`}
            </code>
          </div>

          <h2 id="media-upload">Media Upload</h2>

          <p>
            Media uploads are handled automatically through PayloadCMS's built-in media handling.
            The plugin exposes media collections with appropriate MCP tools for:
          </p>

          <ul>
            <li>Listing media files</li>
            <li>Getting media file details</li>
            <li>Uploading new media files</li>
            <li>Updating media metadata</li>
            <li>Deleting media files</li>
          </ul>

          <h2 id="rich-text-processing">Rich Text Processing</h2>

          <p>
            Rich text fields are automatically processed to extract plain text content for AI
            consumption while preserving the original rich text structure for display.
          </p>

          <h2 id="error-handling">Error Handling</h2>

          <p>The plugin includes comprehensive error handling with standardized error responses:</p>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4">
            <pre className="text-sm">
              {`interface McpError {
  error: {
    code: string
    message: string
    details?: any
  }
}`}
            </pre>
          </div>

          <h3>Common Error Codes</h3>
          <ul>
            <li>
              <code>AUTHENTICATION_FAILED</code> - Invalid or missing API key
            </li>
            <li>
              <code>COLLECTION_NOT_FOUND</code> - Collection doesn't exist
            </li>
            <li>
              <code>DOCUMENT_NOT_FOUND</code> - Document doesn't exist
            </li>
            <li>
              <code>VALIDATION_ERROR</code> - Invalid input data
            </li>
            <li>
              <code>PERMISSION_DENIED</code> - Operation not allowed
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
