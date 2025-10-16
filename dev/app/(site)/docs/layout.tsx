import React from 'react'
import Link from 'next/link'
import SideNavigation from '../../../components/ui/SideNavigation.tsx'
import MdxWithToc from '../../../components/ui/MdxWithToc.tsx'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation | PayloadCMS MCP Plugin',
  description:
    'Complete documentation for the PayloadCMS MCP Plugin. Learn how to integrate your PayloadCMS with Claude Desktop and other AI assistants using the Model Context Protocol.',
  openGraph: {
    title: 'PayloadCMS MCP Plugin | Documentation',
    description:
      'Complete documentation for the PayloadCMS MCP Plugin. Learn how to integrate your PayloadCMS with Claude Desktop and other AI assistants.',
    type: 'website',
  },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Side Navigation */}
      <SideNavigation />

      {/* Main Content */}
      <div className="lg:ml-80 xl:mr-80">
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
            <MdxWithToc>
              <div className="prose prose-lg dark:prose-invert max-w-none">{children}</div>
            </MdxWithToc>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p className="mb-2">Made with ❤️ by</p>
                <a
                  href="https://antler.digital/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
                >
                  Antler Digital
                </a>
                <p className="mt-2 text-xs">
                  Modern web applications that are fast, secure, and scalable
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
