'use client'

import React, { useState, useEffect } from 'react'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  headings: Heading[]
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-20% 0% -35% 0%',
        threshold: 0,
      },
    )

    // Observe all headings
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [headings])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -100 // Account for fixed header and some padding
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <div className="hidden xl:block fixed right-0 top-16 h-[calc(100vh-4rem)] w-84 overflow-y-auto bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-40">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Table of Contents
        </h3>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => scrollToHeading(heading.id)}
              className={`
                block w-full text-left px-2 py-1 rounded text-sm transition-colors duration-200
                ${
                  activeId === heading.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
              style={{
                paddingLeft: `${(heading.level - 1) * 12 + 8}px`,
              }}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

// Utility function to extract headings from MDX content
export function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings: Heading[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()

    // Skip the main title (level 1) and table of contents
    if (level === 1 || text.toLowerCase().includes('table of contents')) {
      continue
    }

    // Create a URL-friendly ID
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    headings.push({
      id,
      text,
      level,
    })
  }

  return headings
}
