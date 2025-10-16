'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation.js'
import DarkModeToggle from './DarkModeToggle.tsx'

const navigationItems = [
  {
    title: 'Overview',
    href: '/docs/readme',
    icon: '📖',
    description: 'Complete project documentation',
  },
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    icon: '🚀',
    description: 'Installation and setup guide',
  },
  {
    title: 'API Reference',
    href: '/docs/api-reference',
    icon: '📚',
    description: 'Complete API documentation',
  },
  {
    title: 'Troubleshooting',
    href: '/docs/troubleshooting',
    icon: '🔧',
    description: 'Common issues and solutions',
  },
  {
    title: 'Changelog',
    href: '/docs/changelog',
    icon: '📝',
    description: 'Version history and releases',
  },
  {
    title: 'Contributing',
    href: '/docs/contributing',
    icon: '🤝',
    description: 'Contribution guidelines',
  },
]

export default function SideNavigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
          aria-label="Toggle navigation menu"
        >
          <svg
            className="w-6 h-6 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Side navigation */}
      <div
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Documentation</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">PayloadCMS MCP Plugin</p>
            </div>
            <div className="hidden lg:block">
              <DarkModeToggle />
            </div>
          </div>

          {/* Navigation items */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-start p-3 rounded-lg transition-colors duration-200 group
                    ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <span className="text-2xl mr-3 flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p className="mb-2">Made with ❤️ by</p>
              <a
                href="https://github.com/Antler-Digital"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                Antler Digital
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
