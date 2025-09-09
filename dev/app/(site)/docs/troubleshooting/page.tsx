import React from 'react'
import Link from 'next/link'

export default function TroubleshootingPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/docs" className="text-blue-600 hover:text-blue-500 mb-4 inline-block">
            ← Back to Documentation
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Troubleshooting Guide</h1>
          <p className="text-xl text-gray-600">
            This guide helps you resolve common issues when using the PayloadCMS MCP Integration
            Plugin.
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <h2>Table of Contents</h2>
          <ul>
            <li>
              <a href="#common-issues">Common Issues</a>
            </li>
            <li>
              <a href="#authentication-problems">Authentication Problems</a>
            </li>
            <li>
              <a href="#collection-issues">Collection Issues</a>
            </li>
            <li>
              <a href="#mcp-protocol-errors">MCP Protocol Errors</a>
            </li>
            <li>
              <a href="#performance-issues">Performance Issues</a>
            </li>
            <li>
              <a href="#deployment-issues">Deployment Issues</a>
            </li>
            <li>
              <a href="#debug-mode">Debug Mode</a>
            </li>
            <li>
              <a href="#getting-help">Getting Help</a>
            </li>
          </ul>

          <h2 id="common-issues">Common Issues</h2>

          <h3>1. Plugin Not Loading</h3>
          <p>
            <strong>Symptoms</strong>: Plugin doesn't appear in admin, MCP endpoint not accessible
          </p>

          <p>
            <strong>Possible Causes</strong>:
          </p>
          <ul>
            <li>
              Plugin not properly imported in <code>payload.config.ts</code>
            </li>
            <li>Syntax errors in configuration</li>
            <li>Missing dependencies</li>
          </ul>

          <p>
            <strong>Solutions</strong>:
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4">
            <pre className="text-sm">
              {`// Ensure proper import
import { PayloadPluginMcp } from 'payload-plugin-mcp'

// Check plugin configuration
export default buildConfig({
  plugins: [
    PayloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: 'all',
    }),
  ],
})`}
            </pre>
          </div>

          <p>
            <strong>Verification</strong>:
          </p>
          <ul>
            <li>Check browser console for errors</li>
            <li>Verify plugin appears in PayloadCMS admin</li>
            <li>
              Test MCP endpoint at <code>/api/plugin/mcp</code>
            </li>
          </ul>

          <h3>2. MCP Endpoint Not Responding</h3>
          <p>
            <strong>Symptoms</strong>: HTTP 404 or connection refused when accessing MCP endpoint
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>Verify the plugin is properly configured</li>
            <li>Check that the server is running on the correct port</li>
            <li>
              Ensure the endpoint path is correct: <code>/api/plugin/mcp</code>
            </li>
          </ul>

          <h3>3. Collections Not Appearing</h3>
          <p>
            <strong>Symptoms</strong>: No collections available in MCP tools
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>Check collection configuration in plugin options</li>
            <li>Verify collections are properly defined in PayloadCMS</li>
            <li>Ensure collections have the required fields</li>
          </ul>

          <h2 id="authentication-problems">Authentication Problems</h2>

          <h3>1. Invalid API Key</h3>
          <p>
            <strong>Symptoms</strong>: HTTP 401 Unauthorized responses
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>
              Verify <code>MCP_API_KEY</code> environment variable is set
            </li>
            <li>Check that the API key matches what's configured in the plugin</li>
            <li>Ensure the API key is included in the Authorization header</li>
          </ul>

          <h3>2. Missing Authorization Header</h3>
          <p>
            <strong>Symptoms</strong>: HTTP 401 Unauthorized responses
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <code className="block bg-white p-2 rounded">
              curl -H "Authorization: Bearer your-api-key" http://localhost:3000/api/plugin/mcp
            </code>
          </div>

          <h2 id="collection-issues">Collection Issues</h2>

          <h3>1. Collection Not Found</h3>
          <p>
            <strong>Symptoms</strong>: Error when trying to access collection tools
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>Verify collection name is correct</li>
            <li>Check that collection is included in plugin configuration</li>
            <li>Ensure collection is properly defined in PayloadCMS</li>
          </ul>

          <h3>2. Field Validation Errors</h3>
          <p>
            <strong>Symptoms</strong>: Validation errors when creating/updating documents
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>Check field requirements in collection schema</li>
            <li>Verify data types match field definitions</li>
            <li>Ensure required fields are provided</li>
          </ul>

          <h2 id="mcp-protocol-errors">MCP Protocol Errors</h2>

          <h3>1. Invalid Tool Request</h3>
          <p>
            <strong>Symptoms</strong>: MCP protocol errors in Claude Desktop
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>Verify tool names match generated tools</li>
            <li>Check parameter schemas match expected format</li>
            <li>Ensure proper MCP protocol compliance</li>
          </ul>

          <h3>2. Tool Execution Errors</h3>
          <p>
            <strong>Symptoms</strong>: Tools fail to execute or return errors
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>Check server logs for detailed error messages</li>
            <li>Verify collection permissions</li>
            <li>Ensure database connection is working</li>
          </ul>

          <h3>3. MCP Inspector Connection Issues</h3>
          <p>
            <strong>Symptoms</strong>: Can't connect to MCP server using the inspector
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>
              Use the correct endpoint: <code>http://localhost:3000/api/plugin/mcp</code>
            </li>
            <li>Ensure the server is running before starting the inspector</li>
            <li>Check that the Authorization header is properly formatted</li>
            <li>Verify there are no CORS issues</li>
          </ul>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <code className="block bg-white p-2 rounded">
              npx @modelcontextprotocol/inspector http://localhost:3000/api/plugin/mcp
            </code>
          </div>

          <h2 id="performance-issues">Performance Issues</h2>

          <h3>1. Slow Response Times</h3>
          <p>
            <strong>Symptoms</strong>: MCP tools take too long to respond
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>Check database query performance</li>
            <li>Consider adding database indexes</li>
            <li>Limit the number of documents returned in list operations</li>
            <li>Use pagination for large datasets</li>
          </ul>

          <h3>2. Memory Issues</h3>
          <p>
            <strong>Symptoms</strong>: High memory usage or out of memory errors
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>Limit the number of collections exposed</li>
            <li>Use pagination for large datasets</li>
            <li>Consider disabling operations that aren't needed</li>
          </ul>

          <h2 id="deployment-issues">Deployment Issues</h2>

          <h3>1. Vercel Deployment</h3>
          <p>
            <strong>Symptoms</strong>: Plugin not working in production
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>Ensure environment variables are set in Vercel</li>
            <li>Check that the plugin is included in the build</li>
            <li>Verify the API route is properly configured</li>
            <li>
              Use the correct production endpoint: <code>/api/plugin/mcp</code>
            </li>
          </ul>

          <h3>2. Environment Variables</h3>
          <p>
            <strong>Symptoms</strong>: Configuration not working in production
          </p>

          <p>
            <strong>Solutions</strong>:
          </p>
          <ul>
            <li>Set all required environment variables in your deployment platform</li>
            <li>Verify variable names match exactly</li>
            <li>Check that sensitive values are properly secured</li>
          </ul>

          <h2 id="debug-mode">Debug Mode</h2>

          <p>Enable debug mode to get more detailed logging:</p>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4">
            <pre className="text-sm">
              {`// Add to your payload.config.ts
PayloadPluginMcp({
  apiKey: process.env.MCP_API_KEY,
  collections: 'all',
  debug: true, // Enable debug logging
})`}
            </pre>
          </div>

          <p>This will provide detailed logs about:</p>
          <ul>
            <li>Plugin initialization</li>
            <li>Collection processing</li>
            <li>Tool generation</li>
            <li>Request/response details</li>
          </ul>

          <h2 id="getting-help">Getting Help</h2>

          <p>If you're still experiencing issues:</p>

          <ul>
            <li>
              Check the{' '}
              <a href="https://github.com/Antler-Digital/payload-plugin-mcp/issues">
                GitHub Issues
              </a>{' '}
              for similar problems
            </li>
            <li>Create a new issue with detailed information about your setup</li>
            <li>Include relevant logs and configuration details</li>
            <li>Provide steps to reproduce the issue</li>
          </ul>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Pro Tip:</strong> When reporting issues, include your PayloadCMS version,
                  Node.js version, and a minimal reproduction case.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
