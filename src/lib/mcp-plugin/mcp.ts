/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMcpHandler } from 'mcp-handler'
import { BasePayload, Config } from 'payload'
// import { baseTools } from './tools/base-tools'
import {
  defaultOperations,
  getCollectionsToExpose,
  getGlobalsToExpose,
} from './utils/get-collections-to-expose.js'
import { executeTool, generateToolDescriptors } from './utils/tool-generator.js'
import { buildInputZodShape } from './utils/zod-schema.js'
import type { PayloadPluginMcpConfig } from './types/index.js'
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import crypto from 'crypto'
import { runWithAuthContext } from './auth-context.js'
import { z } from 'zod'

import {
  uploadMedia,
  createMediaUploadTools,
  determineUploadStrategy,
  validateFileSize,
  MediaUploadOptions,
} from './utils/media-upload.js'

type RegisteredToolSummary = {
  name: string
  collection: string
  operation: string
  description: string
}
let registeredTools: RegisteredToolSummary[] = []
export const getRegisteredTools = (): RegisteredToolSummary[] => registeredTools

let cachedRouteHandler: ((request: Request) => Promise<Response>) | null = null
let cachedInitialized = false
let payloadInstance: BasePayload | null = null

/**
 * Build (once) and return the MCP route handler. Subsequent calls reuse the same instance.
 */
export const getMcpRequestHandler = (
  payload: BasePayload,
  config: Config,
  options: PayloadPluginMcpConfig,
) => {
  if (cachedRouteHandler && cachedInitialized) return cachedRouteHandler
  payloadInstance = payload

  // Precompute and expose tool list for discovery endpoints even before the
  // underlying MCP server initializer runs (some transports lazy-initialize).
  try {
    const preCollections = getCollectionsToExpose(
      config.collections || [],
      options.collections || 'all',
      options.defaultOperations || defaultOperations,
    )
    const preGlobals = getGlobalsToExpose(
      (config as any).globals || [],
      (options as any).globals || 'all',
      options.defaultOperations || defaultOperations,
    )
    const preDescriptors = generateToolDescriptors([...preCollections, ...preGlobals])
    registeredTools = preDescriptors.map((t) => ({
      name: t.name,
      collection: String(t.collection),
      operation: String(t.operation),
      description: t.description,
    }))
  } catch (_ignore) {
    // noop: discovery can still proceed; tools may remain empty until init
  }

  const routeHandler = createMcpHandler(
    (server) => {
      const collectionsToExpose = getCollectionsToExpose(
        config.collections || [],
        options.collections || 'all',
        options.defaultOperations || defaultOperations,
      )
      const globalsToExpose = getGlobalsToExpose(
        (config as any).globals || [],
        (options as any).globals || 'all',
        options.defaultOperations || defaultOperations,
      )
      const analyses = [...collectionsToExpose, ...globalsToExpose]

      // Generate tool descriptors from collections and register tools with Zod param schemas
      const toolDescriptors = generateToolDescriptors(analyses).map((td) => td)

      // Add media upload tools if media collection is exposed
      const hasMediaCollection = analyses.some((a) => a.slug === 'media')
      // Respect media chunking option (defaults to disabled)
      const enableChunking = Boolean((options as any)?.media?.enableChunking)
      const mediaTools = hasMediaCollection
        ? createMediaUploadTools().filter((t) =>
            enableChunking ? true : t.name !== 'media_upload_chunk',
          )
        : []
      const allTools = [...toolDescriptors, ...mediaTools]

      registeredTools = allTools.map((t: any) => ({
        name: t.name,
        collection: String(t.collection || (t.name?.startsWith('media_') ? 'media' : 'utility')),
        operation: String(t.operation || (t.name?.startsWith('media_') ? 'utility' : 'utility')),
        description: t.description,
      }))
      console.log(
        '[MCP] Registering tools:',
        allTools.map((t) => t.name),
      )

      allTools.forEach((tool) => {
        // Handle media upload tools specially
        // IMPORTANT: Multiple concurrent uploads are supported!
        // Each upload gets a unique uploadId, allowing parallel uploads
        // MCP clients can safely upload multiple files simultaneously
        if (
          tool.name === 'media_upload' ||
          tool.name === 'media_upload_chunk' ||
          tool.name === 'media_check_size'
        ) {
          // Create Zod schema shape from the inputSchema definition
          const schemaShape = Object.entries((tool as any).inputSchema.properties || {}).reduce(
            (acc, [key, value]: [string, any]) => {
              let fieldSchema: any = z.any()
              if (value.type === 'string') fieldSchema = z.string()
              else if (value.type === 'number') fieldSchema = z.number()
              else if (value.type === 'boolean') fieldSchema = z.boolean()
              else if (value.type === 'object') fieldSchema = z.record(z.any(), z.any())

              // Make optional if not in required array
              const required = (tool as any).inputSchema.required || []
              if (!required.includes(key)) {
                fieldSchema = fieldSchema.optional()
              }

              acc[key] = fieldSchema
              return acc
            },
            {} as Record<string, any>,
          )

          server.tool(
            tool.name,
            tool.description,
            schemaShape,
            async (input: Record<string, unknown>) => {
              console.log(`[MCP] Executing media tool: ${tool.name}`, { input })

              try {
                // Media tools use same auth context; scopes are enforced in verifyToken
                if (tool.name === 'media_check_size') {
                  // Handle size check utility
                  const fileSize = input.fileSize as number
                  const validation = validateFileSize(fileSize, config)
                  const strategy = validation.valid
                    ? determineUploadStrategy(fileSize, config, { enableChunking })
                    : null

                  return {
                    content: [
                      {
                        type: 'text',
                        text: JSON.stringify({
                          valid: validation.valid,
                          maxSize: validation.maxSize,
                          maxSizeMB: (validation.maxSize / 1024 / 1024).toFixed(2),
                          fileSizeMB: (fileSize / 1024 / 1024).toFixed(2),
                          error: validation.error,
                          recommendedStrategy: strategy,
                        }),
                      },
                    ],
                  }
                } else {
                  // Handle media upload
                  // Type assertion is safe here as we've validated the schema
                  const uploadOptions = input as unknown as MediaUploadOptions
                  const result = await uploadMedia(payload, uploadOptions, config, {
                    enableChunking,
                  })

                  return {
                    content: [{ type: 'text', text: JSON.stringify(result) }],
                  }
                }
              } catch (error) {
                console.error(`[MCP] Media tool error:`, error)
                return {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                      }),
                    },
                  ],
                }
              }
            },
          )
          return // Skip the regular tool registration below
        }

        // Regular tool registration for non-media tools
        const analysis = analyses.find((c) => c.slug === (tool as any).collection)
        if (!analysis) return
        // Skip utility operations as they don't have standard CRUD operations
        if ((tool as any).operation === 'utility') return
        const paramsShape = buildInputZodShape(analysis, (tool as any).operation as any)

        server.tool(
          tool.name,
          tool.description,
          paramsShape,
          async (input: Record<string, unknown>) => {
            // Shallow redaction of sensitive fields
            const redacted: Record<string, unknown> = JSON.parse(JSON.stringify(input || {}))
            const redactKeys = ['password', 'token', 'apiKey', 'secret', 'resetToken']
            if (redacted && typeof redacted === 'object') {
              for (const key of redactKeys) {
                if (key in redacted) (redacted as Record<string, unknown>)[key] = '***'
              }
              if ('data' in redacted && redacted.data && typeof redacted.data === 'object') {
                for (const key of redactKeys) {
                  if ((redacted.data as Record<string, unknown>)[key] !== undefined) {
                    ;(redacted.data as Record<string, unknown>)[key] = '***'
                  }
                }
              }
            }

            console.log(`[MCP] Executing tool: ${tool.name}`, {
              collection: (tool as any).collection,
              operation: (tool as any).operation,
              input: redacted,
            })

            const result = await executeTool(
              tool as any, // Type assertion needed for special tools
              input,
              payload,
              analysis,
              analysis.mcpOptions?.operations || defaultOperations,
              { richText: options.richText },
            )

            return {
              content: [{ type: 'text', text: JSON.stringify(result) }],
            }
          },
        )
      })

      // Discovery tools
      server.tool(
        'list_collections',
        'List collections available to MCP with their enabled operations',
        {},
        async () => {
          const { getAuthContext } = await import('./auth-context.js')
          const auth = getAuthContext()
          const scopes = auth?.scopes || []
          if (!scopes.includes('collections:*:*') && !scopes.includes('mcp:describe')) {
            return { content: [{ type: 'text', text: 'Unauthorized: missing mcp:describe scope' }] }
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  analyses.map((c) => ({
                    slug: c.slug,
                    hasUpload: c.hasUpload,
                    hasAuth: c.hasAuth,
                    timestamps: c.timestamps,
                    operations: c.mcpOptions?.operations || defaultOperations,
                    isGlobal: Boolean(c.isGlobal),
                  })),
                ),
              },
            ],
          }
        },
      )

      server.tool(
        'describe_collection',
        'Describe a collection schema and MCP config',
        { slug: z.string().describe('Collection slug') },
        async (args: { [x: string]: any }) => {
          const { getAuthContext } = await import('./auth-context.js')
          const auth = getAuthContext()
          const scopes = auth?.scopes || []
          if (!scopes.includes('collections:*:*') && !scopes.includes('mcp:describe')) {
            return { content: [{ type: 'text', text: 'Unauthorized: missing mcp:describe scope' }] }
          }
          const slug = args.slug as string
          const analysis = analyses.find((c) => c.slug === slug)
          return {
            content: [
              { type: 'text', text: analysis ? JSON.stringify(analysis) : 'Collection not found' },
            ],
          }
        },
      )
    },
    {
      // Optional server options
    },
    {
      // Optional config
      // redisUrl: process.env.REDIS_URL,
      basePath: '/api/plugin',
      maxDuration: 60,
      verboseLogs: true,
    },
  )

  cachedRouteHandler = routeHandler
  cachedInitialized = true
  return routeHandler
}

// Wrap your handler with authorization
const verifyToken = async (
  req: Request,
  bearerToken?: string,
): Promise<AuthInfo | { error: string; details: string } | undefined> => {
  try {
    const url = new URL(req.url)
    const tokenFromQuery = url.searchParams.get('token') || ''
    const token = (bearerToken || tokenFromQuery || '').trim()

    if (!token) {
      return {
        error: 'missing_token',
        details: 'No token provided in Authorization header or query parameter',
      }
    }

    // Support legacy env key for emergencies
    if (process.env.MCP_API_KEY && token === process.env.MCP_API_KEY) {
      return {
        token,
        scopes: ['collections:*:*', 'media:upload', 'mcp:describe'],
        clientId: 'env-key',
        extra: { userId: 'env-key', role: 'admin' },
      }
    }

    // Lookup in Tokens collection by SHA-256 hash
    if (!payloadInstance) {
      return {
        error: 'payload_instance_missing',
        details: 'Payload instance is not available for token lookup',
      }
    }
    const match = await (payloadInstance as BasePayload).find({
      collection: (globalThis as any).__MCP_TOKEN_SLUG__ || 'mcp-tokens',
      where: {
        tokenHash: { equals: token },
        active: { equals: true },
      },
      depth: 0,
    })

    if (!match?.docs?.length) {
      return {
        error: 'token_not_found',
        details: `Token hash ${token.substring(0, 8)}... not found in collection or token is inactive`,
      }
    }

    const doc = match.docs[0]

    // Check expiry
    if (doc.expiresAt) {
      const exp = new Date(doc.expiresAt)
      if (Number.isFinite(exp.getTime()) && exp.getTime() < Date.now()) {
        return {
          error: 'token_expired',
          details: `Token expired at ${doc.expiresAt}`,
        }
      }
    }

    const scopes: string[] = Array.isArray(doc.scopes)
      ? doc.scopes.map((s: any) => s?.value).filter(Boolean)
      : []

    // Default scopes based on type when none are explicitly set
    const defaultScopes = (): string[] => {
      switch (doc.type) {
        case 'admin':
          return ['collections:*:*', 'media:upload', 'mcp:describe']
        case 'service':
          return ['collections:*:read', 'media:upload', 'mcp:describe']
        default:
          return ['collections:*:read', 'mcp:describe']
      }
    }

    const resolvedScopes = scopes.length ? scopes : defaultScopes()

    // Resolve user (if present) to attach role and set req.user later via AsyncLocalStorage consumer
    const userId = typeof doc.user === 'string' ? doc.user : doc.user?.id
    const userRole = doc.user?.role || undefined

    return {
      token,
      scopes: resolvedScopes,
      clientId: String(doc.id),
      extra: {
        tokenId: String(doc.id),
        userId: userId ? String(userId) : undefined,
        role: userRole,
      },
    }
  } catch (e) {
    console.warn('[MCP] token verification failed', e)
    return {
      error: 'verification_error',
      details: `Token verification failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
    }
  }
}

// Make authorization required
export const authHandler =
  (_handler: (req: Request) => Promise<Response>) => async (req: Request) => {
    try {
      // Handle authentication manually to support both Bearer tokens and query parameters
      const authHeader = req.headers.get('authorization') || ''
      const bearer = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7)
        : undefined
      const auth = await verifyToken(req, bearer)

      if (!auth) {
        return new Response(
          JSON.stringify({
            error: 'invalid_token',
            error_description: 'No authorization provided',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      // Check if verifyToken returned an error
      if ('error' in auth) {
        return new Response(
          JSON.stringify({
            error: auth.error,
            error_description: auth.details,
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      const ctx = {
        tokenId: (auth?.extra as any)?.tokenId,
        userId: (auth?.extra as any)?.userId,
        userRole: (auth?.extra as any)?.role,
        scopes: auth?.scopes || [],
      }
      return await runWithAuthContext(ctx, () => _handler(req))
    } catch (error) {
      console.error('[MCP] Auth handler error:', error)
      return new Response(
        JSON.stringify({
          error: 'server_error',
          error_description: 'Internal server error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  }
