#!/usr/bin/env node

/**
 * MCP Server Validation Script
 * 
 * This script validates that the MCP server is working correctly by:
 * 1. Checking if the server is running
 * 2. Testing tool listing
 * 3. Testing tool invocation
 * 4. Validating schemas
 */

import { createStandaloneMcpServer } from '../lib/mcpServer.js'
import { generateToolDescriptors } from '../lib/toolGenerator.js'
import type { ToolDescriptor } from '../types/index.js'

const SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001'
const API_KEY = process.env.MCP_API_KEY || 'test-api-key'

interface ValidationResult {
  test: string
  passed: boolean
  message: string
  data?: any
}

class McpValidator {
  private results: ValidationResult[] = []
  private serverUrl: string
  private apiKey: string

  constructor(serverUrl: string, apiKey: string) {
    this.serverUrl = serverUrl
    this.apiKey = apiKey
  }

  private async makeRequest(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.serverUrl}${path}`
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    }

    return fetch(url, { ...options, headers })
  }

  private addResult(test: string, passed: boolean, message: string, data?: any): void {
    this.results.push({ test, passed, message, data })
    const status = passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status}: ${test} - ${message}`)
    if (data && !passed) {
      console.log('   Data:', JSON.stringify(data, null, 2))
    }
  }

  async validateHealthCheck(): Promise<void> {
    try {
      const response = await this.makeRequest('/health')
      const data = await response.json()

      if (response.ok && data.status === 'healthy') {
        this.addResult(
          'Health Check',
          true,
          `Server is healthy with ${data.tools} tools`,
          data
        )
      } else {
        this.addResult(
          'Health Check',
          false,
          `Server health check failed: ${response.status}`,
          data
        )
      }
    } catch (error) {
      this.addResult(
        'Health Check',
        false,
        `Failed to connect to server: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async validateListTools(): Promise<ToolDescriptor[]> {
    try {
      const response = await this.makeRequest('/mcp/list_tools')
      const data = await response.json()

      if (response.ok && Array.isArray(data.tools)) {
        this.addResult(
          'List Tools',
          true,
          `Found ${data.tools.length} tools`,
          { toolCount: data.tools.length, toolNames: data.tools.map((t: any) => t.name) }
        )
        return data.tools
      } else {
        this.addResult(
          'List Tools',
          false,
          `Failed to list tools: ${response.status}`,
          data
        )
        return []
      }
    } catch (error) {
      this.addResult(
        'List Tools',
        false,
        `Error listing tools: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return []
    }
  }

  async validateToolInvocation(tools: ToolDescriptor[]): Promise<void> {
    if (tools.length === 0) {
      this.addResult(
        'Tool Invocation',
        false,
        'No tools available to test'
      )
      return
    }

    // Test the first list tool if available
    const listTool = tools.find(tool => tool.name.endsWith('_list'))
    if (!listTool) {
      this.addResult(
        'Tool Invocation',
        false,
        'No list tool found to test'
      )
      return
    }

    try {
      const response = await this.makeRequest('/mcp/invoke', {
        method: 'POST',
        body: JSON.stringify({
          tool: listTool.name,
          input: {
            limit: 2,
            page: 1,
          },
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        this.addResult(
          'Tool Invocation',
          true,
          `Successfully invoked ${listTool.name}`,
          { result: data.result }
        )
      } else {
        this.addResult(
          'Tool Invocation',
          false,
          `Tool invocation failed for ${listTool.name}`,
          data
        )
      }
    } catch (error) {
      this.addResult(
        'Tool Invocation',
        false,
        `Error invoking tool: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async validateSchemas(tools: ToolDescriptor[]): Promise<void> {
    if (tools.length === 0) {
      this.addResult(
        'Schema Validation',
        false,
        'No tools available to validate schemas'
      )
      return
    }

    const tool = tools[0]
    try {
      const response = await this.makeRequest(`/mcp/schemas/${tool.name}`)
      const data = await response.json()

      if (response.ok && data.input && data.output) {
        this.addResult(
          'Schema Validation',
          true,
          `Schema validation passed for ${tool.name}`,
          { hasInput: !!data.input, hasOutput: !!data.output }
        )
      } else {
        this.addResult(
          'Schema Validation',
          false,
          `Schema validation failed for ${tool.name}`,
          data
        )
      }
    } catch (error) {
      this.addResult(
        'Schema Validation',
        false,
        `Error validating schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async validateSSE(): Promise<void> {
    try {
      const response = await this.makeRequest('/mcp/sse')

      if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
        this.addResult(
          'SSE Endpoint',
          true,
          'SSE endpoint is accessible',
          { contentType: response.headers.get('content-type') }
        )
      } else {
        this.addResult(
          'SSE Endpoint',
          false,
          `SSE endpoint failed: ${response.status}`,
          { contentType: response.headers.get('content-type') }
        )
      }
    } catch (error) {
      this.addResult(
        'SSE Endpoint',
        false,
        `Error accessing SSE endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async validateAuthentication(): Promise<void> {
    try {
      // Test without API key
      const response = await fetch(`${this.serverUrl}/mcp/list_tools`)
      
      if (response.status === 401) {
        this.addResult(
          'Authentication',
          true,
          'Authentication is properly enforced (401 without API key)'
        )
      } else {
        this.addResult(
          'Authentication',
          false,
          `Expected 401 without API key, got ${response.status}`,
          { status: response.status }
        )
      }
    } catch (error) {
      this.addResult(
        'Authentication',
        false,
        `Error testing authentication: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async runAllValidations(): Promise<void> {
    console.log(`🧪 Starting MCP Server Validation`)
    console.log(`🌐 Server URL: ${this.serverUrl}`)
    console.log(`🔐 API Key: ${this.apiKey ? '***' + this.apiKey.slice(-4) : 'Not set'}`)
    console.log('')

    // Run validations
    await this.validateHealthCheck()
    await this.validateAuthentication()
    
    const tools = await this.validateListTools()
    await this.validateToolInvocation(tools)
    await this.validateSchemas(tools)
    await this.validateSSE()

    this.printSummary()
  }

  private printSummary(): void {
    console.log('')
    console.log('📊 Validation Summary:')
    console.log('─'.repeat(50))

    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    const percentage = Math.round((passed / total) * 100)

    console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`)
    
    if (passed < total) {
      console.log(`❌ Failed: ${total - passed}`)
      console.log('')
      console.log('Failed tests:')
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  • ${r.test}: ${r.message}`))
    }

    console.log('')
    if (passed === total) {
      console.log('🎉 All validations passed! Your MCP server is working correctly.')
    } else {
      console.log('⚠️  Some validations failed. Please check the issues above.')
      process.exit(1)
    }
  }
}

// CLI execution
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const serverUrl = args.find(arg => arg.startsWith('--server='))?.split('=')[1] || SERVER_URL
  const apiKey = args.find(arg => arg.startsWith('--api-key='))?.split('=')[1] || API_KEY

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
MCP Server Validation Script

Usage:
  node validate-mcp.js [options]

Options:
  --server=URL       Server URL (default: ${SERVER_URL})
  --api-key=KEY     API key for authentication (default: from MCP_API_KEY env)
  --help, -h        Show this help message

Environment Variables:
  MCP_SERVER_URL    Default server URL
  MCP_API_KEY       Default API key

Examples:
  node validate-mcp.js
  node validate-mcp.js --server=https://my-server.com --api-key=my-key
`)
    return
  }

  // Start demo server if running locally
  if (serverUrl.includes('localhost') && args.includes('--start-demo')) {
    console.log('🚀 Starting demo MCP server...')
    
    // Create mock tool descriptors for demo
    const mockCollections = [
      {
        slug: 'posts',
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'richText' },
          { name: 'status', type: 'select', options: ['draft', 'published'] },
        ],
        timestamps: true,
      },
      {
        slug: 'users',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
        ],
        timestamps: true,
      },
    ]

    const toolDescriptors = generateToolDescriptors(mockCollections as any, {
      list: true,
      get: true,
    })

    await createStandaloneMcpServer(toolDescriptors, {
      port: parseInt(serverUrl.split(':').pop() || '3001'),
      apiKey,
      serverName: 'Demo MCP Server',
    })

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  const validator = new McpValidator(serverUrl, apiKey)
  await validator.runAllValidations()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error)
    process.exit(1)
  })
}

export { McpValidator }