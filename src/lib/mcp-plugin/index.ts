import type { Config, CollectionConfig } from 'payload'
import { authHandler, getMcpRequestHandler } from './mcp.js'
import { getRegisteredTools } from './mcp.js'
import type { PayloadPluginMcpConfig } from './types/index.js'
import { McpTokens } from './collections/index.js'

export const PayloadPluginMcp =
  (pluginOptions: PayloadPluginMcpConfig) =>
  (config: Config): Config => {
    const options: Required<Omit<PayloadPluginMcpConfig, 'collections'>> & {
      collections: PayloadPluginMcpConfig['collections']
      globals: NonNullable<PayloadPluginMcpConfig['globals']>
    } = {
      apiKey: pluginOptions.apiKey || process.env.MCP_API_KEY || '',
      collections: pluginOptions.collections || 'all',
      globals: pluginOptions.globals || 'all',
      defaultOperations: {
        list: true,
        get: true,
        create: false,
        update: false,
        delete: false,
        ...pluginOptions.defaultOperations,
      },

      media: {
        enableChunking: false,
        ...(pluginOptions.media || {}),
      },
      tokens: {
        slug: pluginOptions.tokens?.slug || 'mcp-tokens',
        admin: {
          label: pluginOptions.tokens?.admin?.label || 'MCP API Tokens',
          description:
            pluginOptions.tokens?.admin?.description ||
            'MCP API tokens. User-linked tokens impersonate the user; service/admin tokens use scopes only.',
          defaultColumns: pluginOptions.tokens?.admin?.defaultColumns || [
            'label',
            'user',
            'type',
            'active',
            'expiresAt',
          ],
        },
        access: pluginOptions.tokens?.access || {},
      },
      richText: {
        truncateInList: 200,
        ...(pluginOptions.richText || {}),
      },
    }

    // Validate API key
    if (!options.apiKey) {
      console.warn(
        'PayloadCMS MCP Plugin: No API key provided. Set MCP_API_KEY environment variable for authentication.',
      )
    }

    if (!config.collections) config.collections = []

    if (!config.endpoints) {
      config.endpoints = []
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    // Install plugin-scoped Tokens collection if not already present in project
    const tokensSlug = options.tokens.slug || 'mcp-tokens'
    const alreadyHasTokens = (config.collections || []).some(
      (c) => (c as CollectionConfig)?.slug === tokensSlug,
    )
    if (!alreadyHasTokens) {
      // Create a copy of the McpTokens collection with custom configuration
      const TokensCollection: CollectionConfig = {
        ...McpTokens,
        slug: tokensSlug,
        admin: {
          ...McpTokens.admin,
          ...(options.tokens.admin || {}),
        },
        access: {
          ...McpTokens.access,
          // Only override access controls if explicitly provided in plugin options
          ...(options.tokens.access?.read !== undefined && {
            read: options.tokens.access.read as any,
          }),
          ...(options.tokens.access?.create !== undefined && {
            create: options.tokens.access.create as any,
          }),
          ...(options.tokens.access?.update !== undefined && {
            update: options.tokens.access.update as any,
          }),
          ...(options.tokens.access?.delete !== undefined && {
            delete: options.tokens.access.delete as any,
          }),
          ...(options.tokens.access?.admin !== undefined && {
            admin: options.tokens.access.admin as any,
          }),
        },
      }
      config.collections?.push(TokensCollection)
    }
    ;(globalThis as any).__MCP_TOKEN_SLUG__ = tokensSlug

    config.endpoints.push({
      handler(req) {
        // Ensure server/tools are initialized for GET discovery
        getMcpRequestHandler(req.payload, config, options)
        return new Response(
          JSON.stringify({
            status: 'ok',
            endpoint: '/plugin/mcp',
            transport: 'HTTP',
            methods: ['POST'],
            tools: getRegisteredTools(),
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        )
      },
      method: 'get',
      path: '/plugin/mcp',
    })

    config.endpoints.push({
      handler(req) {
        const request = new Request(req.url || '', {
          method: req.method,
          headers: req.headers,
          body: req.body,
          ...(req.body ? { duplex: 'half' } : {}),
        })
        const routeHandler = getMcpRequestHandler(req.payload, config, options)
        return authHandler(routeHandler)(request)
      },
      method: 'post',
      path: '/plugin/mcp',
    })

    // Optional: OPTIONS for CORS/preflight when called from browsers
    config.endpoints.push({
      handler() {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        })
      },
      method: 'options',
      path: '/plugin/mcp',
    })

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // Ensure we are executing any existing onInit functions before running our own.
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }
      // Eager init MCP handler to register tools on cold start (serverless-friendly)
      try {
        getMcpRequestHandler(payload, config, options)
      } catch (err) {
        console.warn('PayloadCMS MCP Plugin: eager init failed', err)
      }
    }

    return config
  }
