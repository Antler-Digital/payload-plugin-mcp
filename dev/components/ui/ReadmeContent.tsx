'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation.js'
import TableOfContents from './TableOfContents.tsx'

interface ReadmeContentProps {
  children: React.ReactNode
}

export default function ReadmeContent({ children }: ReadmeContentProps) {
  const [headings, setHeadings] = useState<any[]>([])
  const pathname = usePathname()

  const extractHeadings = () => {
    // Extract headings from the rendered content
    const headingElements = document.querySelectorAll('h2, h3, h4, h5, h6')
    const extractedHeadings: any[] = []

    headingElements.forEach((element) => {
      const level = parseInt(element.tagName.charAt(1))
      const text = element.textContent || ''

      // Skip if it's the table of contents heading
      if (text.toLowerCase().includes('table of contents')) {
        return
      }

      // Create ID if it doesn't exist
      let id = element.id
      if (!id) {
        id = text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
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

  useEffect(() => {
    // Reset headings when pathname changes
    setHeadings([])

    // Wait for content to be fully rendered
    const timer = setTimeout(extractHeadings, 100)
    return () => clearTimeout(timer)
  }, [children, pathname])

  // Also run when the page loads
  useEffect(() => {
    extractHeadings()
  }, [pathname])

  return (
    <>
      {children}
      <TableOfContents headings={headings} />
    </>
  )
}
