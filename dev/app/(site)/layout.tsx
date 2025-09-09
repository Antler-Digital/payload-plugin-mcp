import React from 'react'
import Link from 'next/link'

import './styles.css'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>PayloadCMS MCP Plugin</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-xl font-bold text-gray-900">
                PayloadCMS MCP Plugin
              </Link>
              <div className="flex space-x-8">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
                <Link href="/docs" className="text-gray-600 hover:text-gray-900">
                  Documentation
                </Link>
                <a
                  href="https://github.com/Antler-Digital/payload-plugin-mcp"
                  className="text-gray-600 hover:text-gray-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/payload-plugin-mcp"
                  className="text-gray-600 hover:text-gray-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  NPM
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
