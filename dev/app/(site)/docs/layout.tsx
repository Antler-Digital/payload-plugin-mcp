import React from 'react'
import Link from 'next/link'
import SideNavigation from '../../../components/ui/SideNavigation.tsx'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Side Navigation */}
      <SideNavigation />

      {/* Main Content */}
      <div className="lg:ml-80">
        <div className="min-h-screen py-8">
          <div className="max-w-4xl mx-auto px-6">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link
                href="/docs"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mb-4 inline-block text-sm"
              >
                ← Back to Documentation
              </Link>
            </div>

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
