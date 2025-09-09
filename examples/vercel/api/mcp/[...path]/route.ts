import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../payload.config'

// This is the Vercel API route handler for MCP endpoints
// It integrates with the existing Payload MCP plugin

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Initialize Payload
    const payload = await getPayload({ config })
    
    // Get the MCP plugin endpoint handler
    // The plugin automatically registers endpoints at /plugin/mcp
    const url = new URL(request.url)
    const mcpPath = '/plugin/mcp'
    
    // Create a new request pointing to the plugin endpoint
    const mcpRequest = new Request(
      `${url.origin}${mcpPath}${url.search}`,
      {
        method: 'GET',
        headers: request.headers,
      }
    )
    
    // The plugin handles the request through Payload's endpoint system
    // This is automatically available when the plugin is configured
    const response = await fetch(mcpRequest)
    
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('MCP API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Initialize Payload
    const payload = await getPayload({ config })
    
    // Get the request body
    const body = await request.text()
    
    // Get the MCP plugin endpoint handler
    const url = new URL(request.url)
    const mcpPath = '/plugin/mcp'
    
    // Create a new request pointing to the plugin endpoint
    const mcpRequest = new Request(
      `${url.origin}${mcpPath}${url.search}`,
      {
        method: 'POST',
        headers: request.headers,
        body: body,
      }
    )
    
    // The plugin handles the request through Payload's endpoint system
    const response = await fetch(mcpRequest)
    
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('MCP API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}