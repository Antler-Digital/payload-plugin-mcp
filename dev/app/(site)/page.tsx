/* eslint-disable jsx-a11y/accessible-emoji */
export default function HomePage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>PayloadCMS MCP Plugin</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-50">
        <div className="min-h-screen py-12">
          <div className="max-w-4xl mx-auto px-6">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">PayloadCMS MCP Plugin</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                A comprehensive PayloadCMS plugin that creates an MCP (Model Context Protocol)
                server compatible with Claude Desktop
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-2xl mb-3">🚀</div>
                <h3 className="font-semibold text-gray-900 mb-2">Automatic Tool Generation</h3>
                <p className="text-gray-600">
                  Generates MCP tools for all PayloadCMS collections automatically
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-2xl mb-3">🔐</div>
                <h3 className="font-semibold text-gray-900 mb-2">API Key Authentication</h3>
                <p className="text-gray-600">Secure authentication using environment variables</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-2xl mb-3">🌐</div>
                <h3 className="font-semibold text-gray-900 mb-2">Multiple Transport Options</h3>
                <p className="text-gray-600">Supports both HTTP/SSE and stdio transports</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-2xl mb-3">☁️</div>
                <h3 className="font-semibold text-gray-900 mb-2">Vercel Ready</h3>
                <p className="text-gray-600">Optimized for serverless deployment</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-2xl mb-3">🛠️</div>
                <h3 className="font-semibold text-gray-900 mb-2">Comprehensive Operations</h3>
                <p className="text-gray-600">List, get, create, update, and delete operations</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-2xl mb-3">📝</div>
                <h3 className="font-semibold text-gray-900 mb-2">Claude Desktop Integration</h3>
                <p className="text-gray-600">Ready to use with Claude Desktop out of the box</p>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-white rounded-lg p-8 shadow-sm border mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Install</h3>
                  <code className="block bg-gray-100 p-3 rounded font-mono text-sm">
                    pnpm install payload-plugin-mcp
                  </code>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. Configure</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {`// payload.config.ts
import { payloadPluginMcp } from 'payload-plugin-mcp'

export default buildConfig({
  plugins: [
    payloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: 'all',
    }),
  ],
})`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Environment</h3>
                  <code className="block bg-gray-100 p-3 rounded font-mono text-sm">
                    MCP_API_KEY=your-secret-api-key-here
                  </code>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                href="https://github.com/Antler-Digital/payload-plugin-mcp"
                rel="noopener noreferrer"
                target="_blank"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    clipRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    fillRule="evenodd"
                  />
                </svg>
                View on GitHub
              </a>

              <a
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                href="https://www.npmjs.com/package/payload-plugin-mcp"
                rel="noopener noreferrer"
                target="_blank"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h2.665v5.331zm12 0h-1.334v-4h-1.332v4h-1.336v-4h-1.33v4h-1.336V8.667h6.668v5.331z" />
                </svg>
                View on NPM
              </a>
            </div>

            {/* Footer */}
            <div className="text-center mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600">
                Made with ❤️ by{' '}
                <a
                  className="text-blue-600 hover:text-blue-500"
                  href="https://github.com/Antler-Digital"
                >
                  Antler Digital
                </a>
              </p>
              <p className="text-sm text-gray-500 mt-2">Licensed under MIT • Version 1.0.0</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
