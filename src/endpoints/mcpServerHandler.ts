import type { PayloadRequest } from 'payload'
import type { 
  McpServerHandlerConfig,
  McpListToolsResponse,
  McpInvokeRequest,
  McpInvokeResponse,
  McpSchemaResponse,
  McpInitializeParams,
  McpInitializeResponse,
  McpRequest,
  McpResponse,
  SseEvent
} from '../types/index.js'

/**
 * Create MCP server handler for PayloadCMS endpoints
 */
export function mcpServerHandler(config: McpServerHandlerConfig) {
  return async (req: PayloadRequest): Promise<Response> => {
    try {
      // Handle authentication
      if (config.apiKey) {
        const authHeader = req.headers.get('authorization')
        const apiKey = authHeader?.replace('Bearer ', '') || req.query?.api_key || req.query?.apiKey

        if (!apiKey || apiKey !== config.apiKey) {
          return new Response(
            JSON.stringify({ 
              error: { 
                code: 401, 
                message: 'Invalid or missing API key' 
              } 
            }),
            { 
              status: 401, 
              headers: { 'Content-Type': 'application/json' } 
            }
          )
        }
      }

      const url = new URL(req.url || '', `http://${req.headers.get('host')}`)
      const path = url.pathname
      const method = req.method?.toUpperCase()

      // Handle different MCP endpoints
      if (path.endsWith('/list_tools') && method === 'GET') {
        return handleListTools(config)
      }

      if (path.endsWith('/invoke') && method === 'POST') {
        return handleInvoke(req, config)
      }

      if (path.includes('/schemas/') && method === 'GET') {
        return handleSchemas(req, config)
      }

      if (path.endsWith('/sse') && method === 'GET') {
        return handleSSE(req, config)
      }

      // Handle MCP protocol messages (for SSE and WebSocket)
      if (method === 'POST' && req.headers.get('content-type')?.includes('application/json')) {
        return handleMcpMessage(req, config)
      }

      return new Response('Not Found', { status: 404 })

    } catch (error) {
      console.error('MCP Server Handler Error:', error)
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 500, 
            message: 'Internal server error' 
          } 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }
  }
}

/**
 * Handle list tools endpoint
 */
async function handleListTools(config: McpServerHandlerConfig): Promise<Response> {
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

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Handle tool invocation endpoint
 */
async function handleInvoke(req: PayloadRequest, config: McpServerHandlerConfig): Promise<Response> {
  try {
    // Check if the request has a json method and body
    if (!req.json || typeof req.json !== 'function') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Request body is required',
          },
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    const requestBody = await req.json() as McpInvokeRequest
    const { tool, input } = requestBody

    // Find the tool descriptor
    const toolDescriptor = config.toolDescriptors.find(t => t.name === tool)
    if (!toolDescriptor) {
      const response: McpInvokeResponse = {
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${tool}' not found`,
        },
      }
      return new Response(JSON.stringify(response), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Execute the tool
    const result = await executeTool(toolDescriptor, input, req)
    
    const response: McpInvokeResponse = {
      success: true,
      result,
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Tool invocation error:', error)
    const response: McpInvokeResponse = {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Handle schema endpoint
 */
async function handleSchemas(req: PayloadRequest, config: McpServerHandlerConfig): Promise<Response> {
  const url = new URL(req.url || '', `http://${req.headers.get('host')}`)
  const toolName = url.pathname.split('/').pop()

  if (!toolName) {
    return new Response('Tool name required', { status: 400 })
  }

  const toolDescriptor = config.toolDescriptors.find(t => t.name === toolName)
  if (!toolDescriptor) {
    return new Response('Tool not found', { status: 404 })
  }

  const response: McpSchemaResponse = {
    input: toolDescriptor.inputSchema,
    output: toolDescriptor.outputSchema,
  }

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Handle Server-Sent Events endpoint for HTTP transport
 */
async function handleSSE(req: PayloadRequest, config: McpServerHandlerConfig): Promise<Response> {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  }

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial endpoint event
      const endpointUrl = `http://${req.headers.get('host')}/mcp/invoke`
      const endpointEvent: SseEvent = {
        event: 'endpoint',
        data: JSON.stringify({ uri: endpointUrl }),
      }
      
      controller.enqueue(encoder.encode(formatSseEvent(endpointEvent)))
      
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
      
      controller.enqueue(encoder.encode(formatSseEvent(messageEvent)))

      // Keep connection alive with periodic ping
      const keepAlive = setInterval(() => {
        try {
          const pingEvent: SseEvent = {
            event: 'ping',
            data: JSON.stringify({ timestamp: Date.now() }),
          }
          controller.enqueue(encoder.encode(formatSseEvent(pingEvent)))
        } catch (error) {
          clearInterval(keepAlive)
          controller.close()
        }
      }, 30000) // 30 seconds

      // Clean up on close
      req.signal?.addEventListener('abort', () => {
        clearInterval(keepAlive)
        controller.close()
      })
    },
  })

  return new Response(stream, { headers })
}

/**
 * Handle MCP protocol messages (JSON-RPC 2.0)
 */
async function handleMcpMessage(req: PayloadRequest, config: McpServerHandlerConfig): Promise<Response> {
  try {
    // Check if the request has a json method and body
    if (!req.json || typeof req.json !== 'function') {
      return new Response(
        JSON.stringify({ 
          jsonrpc: '2.0',
          error: { 
            code: -32700, 
            message: 'Parse error' 
          } 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    const message = await req.json() as McpRequest

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

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      })
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

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (message.method === 'tools/call') {
      const { name, arguments: args } = message.params as { name: string; arguments: any }
      
      const toolDescriptor = config.toolDescriptors.find(t => t.name === name)
      if (!toolDescriptor) {
        const response: McpResponse = {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32601,
            message: `Tool '${name}' not found`,
          },
        }
        return new Response(JSON.stringify(response), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const result = await executeTool(toolDescriptor, args, req)
      
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

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Method not found
    const response: McpResponse = {
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32601,
        message: `Method '${message.method}' not found`,
      },
    }

    return new Response(JSON.stringify(response), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('MCP message handling error:', error)
    return new Response(
      JSON.stringify({ 
        jsonrpc: '2.0',
        error: { 
          code: -32603, 
          message: 'Internal error' 
        } 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}

/**
 * Execute a tool with the given input
 */
async function executeTool(toolDescriptor: any, input: any, req: PayloadRequest): Promise<any> {
  const { collection, operation } = toolDescriptor

  // Get payload instance from request
  const payload = req.payload

  if (!payload) {
    throw new Error('Payload instance not available')
  }

  switch (operation) {
    case 'list':
      return await payload.find({
        collection,
        where: input.where || {},
        limit: input.limit || 10,
        page: input.page || 1,
        sort: input.sort,
        depth: input.depth || 1,
      })

    case 'get':
      return await payload.findByID({
        collection,
        id: input.id,
        depth: input.depth || 1,
      })

    case 'create':
      return await payload.create({
        collection,
        data: input.data,
        depth: input.depth || 1,
      })

    case 'update':
      return await payload.update({
        collection,
        id: input.id,
        data: input.data,
        depth: input.depth || 1,
      })

    case 'delete':
      return await payload.delete({
        collection,
        id: input.id,
      })

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