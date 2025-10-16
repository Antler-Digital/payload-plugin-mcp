'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation.js'
import TableOfContents, { extractHeadings, Heading } from './TableOfContents'

interface MdxWithTocProps {
  children: React.ReactNode
  content?: string
}

export default function MdxWithToc({ children, content }: MdxWithTocProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const pathname = usePathname()

  useEffect(() => {
    // Reset headings when pathname changes
    setHeadings([])

    // Extract headings from the content if provided
    if (content) {
      const extractedHeadings = extractHeadings(content)
      setHeadings(extractedHeadings)
    } else {
      // Fallback: extract headings from the DOM after render
      const extractFromDOM = () => {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        const extractedHeadings: Heading[] = []

        headingElements.forEach((element) => {
          const level = parseInt(element.tagName.charAt(1))
          const text = element.textContent || ''

          // Skip the main title (level 1) and table of contents
          if (level === 1 || text.toLowerCase().includes('table of contents')) {
            return
          }

          // Create a URL-friendly ID
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()

          // Ensure the element has the ID
          if (!element.id) {
            element.id = id
          }

          extractedHeadings.push({
            id,
            text,
            level,
          })
        })

        setHeadings(extractedHeadings)
      }

      // Run immediately
      extractFromDOM()

      // Also run after a short delay to catch any dynamically rendered content
      const timeoutId = setTimeout(extractFromDOM, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [content, pathname])

  return (
    <>
      {children}
      <TableOfContents headings={headings} />
    </>
  )
}
