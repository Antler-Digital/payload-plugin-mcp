import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import type { 
  McpServerConfig,
  ToolDescriptor,
  McpListToolsResponse,
  McpInvokeRequest,
  McpInvokeResponse,
  McpSchemaResponse,
  McpRequest,
  McpResponse,
  McpInitializeParams,
  McpInitializeResponse,
  SseEvent,
} from '../types/index.js'

let serverInstance: any = null

/**
 * Start the MCP server
 */
export async function startMcpServer(config: McpServerConfig): Promise<void> {
  // Don't start multiple servers
  if (serverInstance) {
    console.log('MCP server already running')
    return
  }

  const fastify = Fastify({ 
    logger: process.env.NODE_ENV === 'development',
    // Add request timeout for long-running requests
    requestTimeout: 60000,
  })

  serverInstance = fastify

  // Add CORS support
  await fastify.register(import('@fastify/cors'), {
    origin: true,
    credentials: true,
  })

  // Authentication middleware
  if (config.apiKey) {
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
      // Skip auth for preflight requests and health checks
      if (request.method === 'OPTIONS' || request.url === '/health') {
        return
      }

      const authHeader = request.headers.authorization
      const query = request.query as Record<string, any>
      const apiKey = authHeader?.replace('Bearer ', '') || query?.api_key || query?.apiKey

      if (!apiKey || apiKey !== config.apiKey) {
        reply.code(401).send({
          error: {
            code: 401,
            message: 'Invalid or missing API key',
          },
        })
        return
      }
    })
  }

  // Health check endpoint
  fastify.get('/health', async () => {
    return { 
      status: 'healthy', 
      server: config.serverName,
      timestamp: new Date().toISOString(),
      tools: config.toolDescriptors.length,
    }
  })

  // MCP endpoints
  registerMcpEndpoints(fastify, config)

  // Start server
  try {
    await fastify.listen({ 
      port: config.port, 
      host: config.host,
    })
    
    console.log(`🚀 MCP Server started on http://${config.host}:${config.port}`)
    console.log(`📡 SSE endpoint: http://${config.host}:${config.port}/mcp/sse`)
    console.log(`🛠️  Tools available: ${config.toolDescriptors.length}`)
    
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    throw error
  }
}

/**
 * Stop the MCP server
 */
export async function stopMcpServer(): Promise<void> {
  if (serverInstance) {
    await serverInstance.close()
    serverInstance = null
    console.log('MCP server stopped')
  }
}

/**
 * Register MCP endpoints
 */
function registerMcpEndpoints(fastify: any, config: McpServerConfig): void {
  // List tools endpoint
  fastify.get('/mcp/list_tools', async () => {
    const response: McpListToolsResponse = {
      tools: config.toolDescriptors.map(descriptor => ({
        name: descriptor.name,
        description: descriptor.description,
        inputSchema: descriptor.inputSchema,
        outputSchema: descriptor.outputSchema,
      })),
      serverInfo: {
        name: config.serverName,
        description: config.serverDescription,
        version: '1.0.0',
      },
    }
    return response
  })

  // Tool invocation endpoint
  fastify.post('/mcp/invoke', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tool, input } = request.body as McpInvokeRequest

      const toolDescriptor = config.toolDescriptors.find(t => t.name === tool)
      if (!toolDescriptor) {
        reply.code(404)
        return {
          success: false,
          error: {
            code: 'TOOL_NOT_FOUND',
            message: `Tool '${tool}' not found`,
          },
        } as McpInvokeResponse
      }

      // For standalone server, we need to simulate payload operations
      // This would typically connect to a PayloadCMS instance
      const result = await executeStandaloneTool(toolDescriptor, input)

      return {
        success: true,
        result,
      } as McpInvokeResponse

    } catch (error) {
      console.error('Tool invocation error:', error)
      reply.code(500)
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      } as McpInvokeResponse
    }
  })

  // Schema endpoint
  fastify.get('/mcp/schemas/:tool', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { tool: string }
    const { tool: toolName } = params

    const toolDescriptor = config.toolDescriptors.find(t => t.name === toolName)
    if (!toolDescriptor) {
      reply.code(404).send('Tool not found')
      return
    }

    const response: McpSchemaResponse = {
      input: toolDescriptor.inputSchema,
      output: toolDescriptor.outputSchema,
    }

    return response
  })

  // SSE endpoint for HTTP transport
  fastify.get('/mcp/sse', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    })

    // Send initial endpoint event
    const host = request.headers.host || `${config.host}:${config.port}`
    const protocol = request.headers['x-forwarded-proto'] || 'http'
    const endpointUrl = `${protocol}://${host}/mcp/invoke`
    
    const endpointEvent: SseEvent = {
      event: 'endpoint',
      data: JSON.stringify({ uri: endpointUrl }),
    }
    
    reply.raw.write(formatSseEvent(endpointEvent))
    
    // Send server capabilities
    const initResponse: McpInitializeResponse = {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      serverInfo: {
        name: config.serverName,
        version: '1.0.0',
      },
    }
    
    const messageEvent: SseEvent = {
      event: 'message',
      data: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        result: initResponse,
      }),
    }
    
    reply.raw.write(formatSseEvent(messageEvent))

    // Keep connection alive with periodic ping
    const keepAlive = setInterval(() => {
      try {
        const pingEvent: SseEvent = {
          event: 'ping',
          data: JSON.stringify({ timestamp: Date.now() }),
        }
        reply.raw.write(formatSseEvent(pingEvent))
      } catch (error) {
        clearInterval(keepAlive)
      }
    }, 30000) // 30 seconds

    // Clean up on client disconnect
    request.raw.on('close', () => {
      clearInterval(keepAlive)
    })

    // Don't end the response, keep the stream open
  })

  // MCP JSON-RPC 2.0 endpoint
  fastify.post('/mcp', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const message = request.body as McpRequest

      if (message.method === 'initialize') {
        const params = message.params as McpInitializeParams
        
        const response: McpResponse = {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            protocolVersion: params.protocolVersion,
            capabilities: {
              tools: {
                listChanged: false,
              },
            },
            serverInfo: {
              name: config.serverName,
              version: '1.0.0',
            },
          } as McpInitializeResponse,
        }

        return response
      }

      if (message.method === 'tools/list') {
        const response: McpResponse = {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            tools: config.toolDescriptors.map(descriptor => ({
              name: descriptor.name,
              description: descriptor.description,
              inputSchema: descriptor.inputSchema,
            })),
          },
        }

        return response
      }

      if (message.method === 'tools/call') {
        const { name, arguments: args } = message.params as { name: string; arguments: any }
        
        const toolDescriptor = config.toolDescriptors.find(t => t.name === name)
        if (!toolDescriptor) {
          reply.code(404)
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32601,
              message: `Tool '${name}' not found`,
            },
          } as McpResponse
        }

        const result = await executeStandaloneTool(toolDescriptor, args)
        
        const response: McpResponse = {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        }

        return response
      }

      // Method not found
      reply.code(404)
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: `Method '${message.method}' not found`,
        },
      } as McpResponse

    } catch (error) {
      console.error('MCP message handling error:', error)
      reply.code(500)
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
        },
      }
    }
  })
}

/**
 * Execute a tool in standalone mode (without PayloadCMS instance)
 * This is a simulation for demonstration purposes
 */
async function executeStandaloneTool(toolDescriptor: ToolDescriptor, input: any): Promise<any> {
  // In a real implementation, this would connect to your PayloadCMS instance
  // For now, we'll return mock data to demonstrate the structure

  const { collection, operation } = toolDescriptor

  switch (operation) {
    case 'list':
      return {
        docs: [
          {
            id: 'example-1',
            title: `Example ${collection} document 1`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'example-2', 
            title: `Example ${collection} document 2`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        totalDocs: 2,
        limit: input.limit || 10,
        totalPages: 1,
        page: input.page || 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }

    case 'get':
      return {
        id: input.id,
        title: `Example ${collection} document`,
        content: `This is a mock document from the ${collection} collection.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

    case 'create':
      return {
        id: `new-${Date.now()}`,
        ...input.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

    case 'update':
      return {
        id: input.id,
        ...input.data,
        updatedAt: new Date().toISOString(),
      }

    case 'delete':
      return {
        id: input.id,
        message: `Document ${input.id} deleted from ${collection}`,
      }

    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}

/**
 * Format an SSE event
 */
function formatSseEvent(event: SseEvent): string {
  let formatted = ''
  
  if (event.event) {
    formatted += `event: ${event.event}\n`
  }
  
  if (event.id) {
    formatted += `id: ${event.id}\n`
  }
  
  if (event.retry) {
    formatted += `retry: ${event.retry}\n`
  }
  
  formatted += `data: ${event.data}\n\n`
  
  return formatted
}

/**
 * Create a standalone MCP server (for use without PayloadCMS)
 */
export async function createStandaloneMcpServer(
  toolDescriptors: ToolDescriptor[],
  options: {
    port?: number
    host?: string
    apiKey?: string
    serverName?: string
    serverDescription?: string
  } = {}
): Promise<void> {
  const config: McpServerConfig = {
    toolDescriptors,
    port: options.port || 3001,
    host: options.host || '0.0.0.0',
    apiKey: options.apiKey || '',
    serverName: options.serverName || 'Standalone MCP Server',
    serverDescription: options.serverDescription || 'Standalone MCP server for tool demonstrations',
    enableStdio: false,
  }

  await startMcpServer(config)
}