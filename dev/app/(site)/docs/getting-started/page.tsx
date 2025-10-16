import React from 'react'
import Link from 'next/link'

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link
            href="/docs"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Documentation
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Getting Started
          </h1>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Prerequisites</h2>
          <ul>
            <li>Node.js 18.20.2+ or 20.9.0+ or 22.0.0+</li>
            <li>Payload CMS 3.0.0+</li>
            <li>pnpm 9+ (recommended) or npm</li>
          </ul>

          <h2>Installation</h2>
          <p>Install the plugin using your preferred package manager:</p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <h4 className="text-gray-900 dark:text-gray-100">pnpm</h4>
            <code className="block bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded">
              pnpm add payload-plugin-mcp
            </code>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <h4 className="text-gray-900 dark:text-gray-100">npm</h4>
            <code className="block bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded">
              npm install payload-plugin-mcp
            </code>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <h4 className="text-gray-900 dark:text-gray-100">yarn</h4>
            <code className="block bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded">
              yarn add payload-plugin-mcp
            </code>
          </div>

          <h2>Environment Setup</h2>
          <p>
            Create or update your <code>.env</code> file with the required configuration:
          </p>

          <div className="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-lg mb-4">
            <pre className="text-sm">
              {`# Required: API key for MCP server authentication
MCP_API_KEY=your-secret-api-key-here

# Optional: Server configuration
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=0.0.0.0`}
            </pre>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> Generate a secure API key using a tool like{' '}
                  <code className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1 rounded">
                    openssl rand -hex 32
                  </code>{' '}
                  or use a UUID generator.
                </p>
              </div>
            </div>
          </div>

          <h2>Basic Configuration</h2>
          <p>Add the plugin to your Payload configuration:</p>

          <div className="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-lg mb-4">
            <pre className="text-sm">
              {`// payload.config.ts
import { buildConfig } from 'payload'
import { PayloadPluginMcp } from 'payload-plugin-mcp'

export default buildConfig({
  collections: [
    // your existing collections
  ],
  plugins: [
    PayloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: 'all', // Expose all collections
      defaultOperations: {
        list: true,    // Enable listing documents
        get: true,     // Enable getting single documents
        create: false, // Disable creation (read-only by default)
        update: false, // Disable updates (read-only by default)
        delete: false, // Disable deletion (read-only by default)
      },
    }),
  ],
})`}
            </pre>
          </div>

          <h2>Start Your Application</h2>
          <p>Start your Payload CMS application:</p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <code className="block bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded">
              pnpm dev
            </code>
          </div>

          <p>You should see output similar to:</p>

          <div className="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-lg mb-4">
            <pre className="text-sm">
              {`✅ PayloadCMS MCP Plugin initialized
🔧 Collections exposed: posts, users, media
🛠️  Tools generated: 6
🌐 MCP HTTP server: http://0.0.0.0:3000/api/plugin/mcp
🔐 Authentication: Enabled
   📋 posts: list, get
   📋 users: list, get
   📋 media: list, get`}
            </pre>
          </div>

          <h2>Verify Installation</h2>
          <p>Test that the plugin is working by making a request to the MCP endpoint:</p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <code className="block bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded">
              curl -H "Authorization: Bearer your-api-key" http://localhost:3000/api/plugin/mcp
            </code>
          </div>

          <p>
            You should receive a response with information about available tools and the server
            status.
          </p>

          <h2>Test with MCP Inspector</h2>
          <p>Use the MCP Inspector to test your server:</p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <code className="block bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded">
              npx @modelcontextprotocol/inspector http://localhost:3000/api/plugin/mcp
            </code>
          </div>

          <p>
            This will open the MCP Inspector at <code>http://localhost:6274</code> where you can:
          </p>
          <ul>
            <li>
              Enter your Authorization header (<code>Bearer your-api-key</code>)
            </li>
            <li>Test MCP tool execution</li>
            <li>Explore available tools and their schemas</li>
            <li>Debug connection issues</li>
          </ul>

          <h2>Next Steps</h2>
          <ul>
            <li>Configure collections for more advanced setups (see README.md)</li>
            <li>Set up Claude Desktop integration (see README.md)</li>
            <li>Deploy to production (see examples/vercel/)</li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Important:</strong> Never commit your API key to version control. Always
                  use environment variables for sensitive configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
