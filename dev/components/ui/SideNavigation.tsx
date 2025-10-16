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

          {/* External Links Section */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              External Links
            </h3>
            <div className="space-y-2">
              <a
                href="https://github.com/Antler-Digital/payload-plugin-mcp"
                className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="font-medium text-sm">GitHub Repository</span>
              </a>
              <a
                href="https://www.npmjs.com/package/payload-plugin-mcp"
                className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg
                  className="w-5 h-5 mr-3 flex-shrink-0 fill-current"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 9.781v10.667h8.885v1.771h7.115v-1.771h16v-10.667zM8.885 18.661h-1.771v-5.333h-1.781v5.333h-3.552v-7.104h7.104zM14.219 18.661v1.787h-3.552v-8.891h7.115v7.109h-3.563zM30.224 18.661h-1.776v-5.333h-1.781v5.333h-1.781v-5.333h-1.771v5.333h-3.563v-7.104h10.672zM14.219 13.333h1.781v3.557h-1.781z" />
                </svg>
                <span className="font-medium text-sm">NPM Package</span>
              </a>
            </div>
          </div>

          {/* Theme Toggle Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
