import type { CollectionSlug, Config, CollectionConfig } from 'payload'
import { mcpServerHandler } from './endpoints/mcpServerHandler.js'
import { generateToolDescriptors, analyzeCollection } from './lib/toolGenerator.js'
import { startMcpServer } from './lib/mcpServer.js'
import { CollectionMcpConfig, ToolOperations, CollectionAnalysis } from './types/index.js'

export type PayloadPluginMcpConfig = {
  /**
   * API key from environment variable for authentication
   */
  apiKey?: string
  /**
   * Collections to expose via MCP tools
   * Can be:
   * - 'all' to expose all collections with default operations
   * - Array of CollectionConfig (imported collections)
   * - Array of { collection: CollectionConfig, options: CollectionMcpOptions }
   */
  collections?: CollectionMcpConfig[] | 'all'
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
   * Default operations to enable (can be overridden per collection)
   */
  defaultOperations?: ToolOperations
}

export const payloadPluginMcp =
  (pluginOptions: PayloadPluginMcpConfig = {}) =>
  (config: Config): Config => {
    // Default options
    const options: Required<Omit<PayloadPluginMcpConfig, 'collections'>> & { 
      collections: CollectionMcpConfig[] | 'all' 
    } = {
      apiKey: pluginOptions.apiKey || process.env.MCP_API_KEY || '',
      collections: pluginOptions.collections || 'all',
      disabled: pluginOptions.disabled || false,
      port: pluginOptions.port || 3001,
      host: pluginOptions.host || '0.0.0.0',
      enableHttpTransport: pluginOptions.enableHttpTransport !== false,
      enableStdioTransport: pluginOptions.enableStdioTransport !== false,
      serverName: pluginOptions.serverName || 'PayloadCMS MCP Server',
      serverDescription: pluginOptions.serverDescription || 'MCP server for PayloadCMS collections',
      defaultOperations: {
        list: true,
        get: true,
        create: false,
        update: false,
        delete: false,
        ...pluginOptions.defaultOperations,
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

    // Get collections to expose with their MCP configurations
    const collectionsToExpose = getCollectionsToExpose(config.collections, options.collections, options.defaultOperations)
    
    // Generate tool descriptors from collections
    const toolDescriptors = generateToolDescriptors(collectionsToExpose)

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

      // Log per-collection configurations
      collectionsToExpose.forEach(collection => {
        const ops = collection.mcpOptions?.operations || options.defaultOperations
        const enabledOps = Object.entries(ops).filter(([_, enabled]) => enabled).map(([op]) => op)
        console.log(`   📋 ${collection.slug}: ${enabledOps.join(', ')}`)
      })
    }

    return config
  }

/**
 * Process collections configuration and return collections with their MCP options
 */
function getCollectionsToExpose(
  allCollections: CollectionConfig[],
  collectionsOption: CollectionMcpConfig[] | 'all',
  defaultOperations: ToolOperations
): CollectionAnalysis[] {
  if (collectionsOption === 'all') {
    // Return all collections with default operations, properly analyzed
    return allCollections.map(collection => 
      analyzeCollection(collection, {
        operations: defaultOperations,
      })
    )
  }

  // Process configured collections
  const result: CollectionAnalysis[] = []

  for (const configItem of collectionsOption) {
    let collection: CollectionConfig
    let mcpOptions: any = {}

    if ('collection' in configItem && 'options' in configItem) {
      // { collection: CollectionConfig, options: CollectionMcpOptions }
      collection = configItem.collection
      mcpOptions = {
        operations: { ...defaultOperations, ...configItem.options.operations },
        ...configItem.options,
      }
    } else {
      // Direct CollectionConfig
      collection = configItem as CollectionConfig
      mcpOptions = {
        operations: defaultOperations,
      }
    }

    // Find the collection in allCollections to ensure it's registered
    const registeredCollection = allCollections.find(c => c.slug === collection.slug)
    if (registeredCollection) {
      // Use the registered collection for analysis to ensure we have the complete config
      result.push(analyzeCollection(registeredCollection, mcpOptions))
    } else {
      console.warn(`PayloadCMS MCP Plugin: Collection '${collection.slug}' not found in registered collections`)
    }
  }

  return result
}

export * from './types/index.js'
