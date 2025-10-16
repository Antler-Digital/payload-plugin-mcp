import React from 'react'
import Link from 'next/link'
import DarkModeToggle from '../../../components/ui/DarkModeToggle'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Documentation
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
                Complete guide to using the PayloadCMS MCP Plugin
              </p>
            </div>
            <DarkModeToggle />
          </div>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">{children}</div>
      </div>
    </div>
  )
}
