import type { CollectionSlug, Config, CollectionConfig } from 'payload'
import { mcpServerHandler } from './endpoints/mcpServerHandler.js'
import { generateToolDescriptors } from './lib/toolGenerator.js'
import { startMcpServer } from './lib/mcpServer.js'
import { AuthConfig } from './types/index.js'

export type PayloadPluginMcpConfig = {
  /**
   * API key from environment variable for authentication
   */
  apiKey?: string
  /**
   * List of collections to expose via MCP tools
   */
  collections?: Partial<Record<CollectionSlug, true>> | 'all'
  /**
   * Whether the plugin is disabled
   */
  disabled?: boolean
  /**
   * Port for the MCP server (default: 3001)
   */
  port?: number
  /**
   * Host for the MCP server (default: '0.0.0.0')
   */
  host?: string
  /**
   * Whether to enable HTTP transport (for Vercel deployment)
   */
  enableHttpTransport?: boolean
  /**
   * Whether to enable stdio transport (for local development)
   */
  enableStdioTransport?: boolean
  /**
   * Server name for identification
   */
  serverName?: string
  /**
   * Server description
   */
  serverDescription?: string
  /**
   * Additional tool operations to enable
   */
  operations?: {
    list?: boolean
    get?: boolean
    create?: boolean
    update?: boolean
    delete?: boolean
  }
}

export const payloadPluginMcp =
  (pluginOptions: PayloadPluginMcpConfig = {}) =>
  (config: Config): Config => {
    // Default options
    const options: Required<PayloadPluginMcpConfig> = {
      apiKey: process.env.MCP_API_KEY || '',
      collections: pluginOptions.collections || 'all',
      disabled: pluginOptions.disabled || false,
      port: pluginOptions.port || 3001,
      host: pluginOptions.host || '0.0.0.0',
      enableHttpTransport: pluginOptions.enableHttpTransport !== false,
      enableStdioTransport: pluginOptions.enableStdioTransport !== false,
      serverName: pluginOptions.serverName || 'PayloadCMS MCP Server',
      serverDescription: pluginOptions.serverDescription || 'MCP server for PayloadCMS collections',
      operations: {
        list: true,
        get: true,
        create: false,
        update: false,
        delete: false,
        ...pluginOptions.operations,
      },
    }

    // If the plugin is disabled, return config unchanged
    if (options.disabled) {
      return config
    }

    // Validate API key
    if (!options.apiKey) {
      console.warn('PayloadCMS MCP Plugin: No API key provided. Set MCP_API_KEY environment variable for authentication.')
    }

    // Initialize collections array if it doesn't exist
    if (!config.collections) {
      config.collections = []
    }

    // Initialize endpoints array if it doesn't exist
    if (!config.endpoints) {
      config.endpoints = []
    }

    // Get collections to expose
    const collectionsToExpose = getCollectionsToExpose(config.collections, options.collections)
    
    // Generate tool descriptors from collections
    const toolDescriptors = generateToolDescriptors(collectionsToExpose, options.operations)

    // Add MCP server endpoints
    config.endpoints.push(
      {
        handler: mcpServerHandler({ 
          toolDescriptors, 
          apiKey: options.apiKey,
          serverName: options.serverName,
          serverDescription: options.serverDescription,
        }),
        method: 'get',
        path: '/mcp/list_tools',
      },
      {
        handler: mcpServerHandler({ 
          toolDescriptors, 
          apiKey: options.apiKey,
          serverName: options.serverName,
          serverDescription: options.serverDescription,
        }),
        method: 'post',
        path: '/mcp/invoke',
      },
      {
        handler: mcpServerHandler({ 
          toolDescriptors, 
          apiKey: options.apiKey,
          serverName: options.serverName,
          serverDescription: options.serverDescription,
        }),
        method: 'get',
        path: '/mcp/schemas/:tool',
      },
      // SSE endpoint for HTTP transport
      {
        handler: mcpServerHandler({ 
          toolDescriptors, 
          apiKey: options.apiKey,
          serverName: options.serverName,
          serverDescription: options.serverDescription,
        }),
        method: 'get',
        path: '/mcp/sse',
      }
    )

    // Start MCP server if HTTP transport is enabled
    if (options.enableHttpTransport) {
      const serverConfig = {
        toolDescriptors,
        port: options.port,
        host: options.host,
        apiKey: options.apiKey,
        serverName: options.serverName,
        serverDescription: options.serverDescription,
        enableStdio: options.enableStdioTransport,
      }

      // Start the server asynchronously
      startMcpServer(serverConfig).catch((error) => {
        console.error('Failed to start MCP server:', error)
      })
    }

    // Enhance onInit to log server information
    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // Execute any existing onInit functions
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }

      // Log MCP server information
      console.log(`✅ PayloadCMS MCP Plugin initialized`)
      console.log(`🔧 Collections exposed: ${collectionsToExpose.map(c => c.slug).join(', ')}`)
      console.log(`🛠️  Tools generated: ${toolDescriptors.length}`)
      
      if (options.enableHttpTransport) {
        console.log(`🌐 MCP HTTP server: http://${options.host}:${options.port}/mcp`)
        console.log(`📡 SSE endpoint: http://${options.host}:${options.port}/mcp/sse`)
      }
      
      if (options.apiKey) {
        console.log(`🔐 Authentication: Enabled`)
      } else {
        console.log(`⚠️  Authentication: Disabled (set MCP_API_KEY environment variable)`)
      }
    }

    return config
  }

function getCollectionsToExpose(
  allCollections: CollectionConfig[],
  collectionsOption: Partial<Record<CollectionSlug, true>> | 'all'
): CollectionConfig[] {
  if (collectionsOption === 'all') {
    return allCollections
  }

  return allCollections.filter((collection) => {
    return collectionsOption[collection.slug as CollectionSlug] === true
  })
}

export * from './types/index.js'
