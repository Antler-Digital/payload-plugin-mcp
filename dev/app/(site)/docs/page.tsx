import React from 'react'
import Link from 'next/link'
import DarkModeToggle from '../../../components/ui/DarkModeToggle.tsx'

export default function DocsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mr-4">
              Documentation
            </h1>
            <DarkModeToggle />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Complete guide to using the PayloadCMS MCP Plugin
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/docs/getting-started"
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-shadow"
          >
            <div className="text-2xl mb-3">🚀</div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Getting Started</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Installation, configuration, and your first steps with the plugin
            </p>
          </Link>

          <Link
            href="/docs/api-reference"
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-shadow"
          >
            <div className="text-2xl mb-3">📚</div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">API Reference</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Complete API documentation and configuration options
            </p>
          </Link>

          <Link
            href="/docs/troubleshooting"
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-shadow"
          >
            <div className="text-2xl mb-3">🔧</div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Troubleshooting</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Common issues and solutions to help you get unstuck
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
