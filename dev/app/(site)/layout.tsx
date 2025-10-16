import React from 'react'
import Header from '../../components/ui/Header.tsx'

import './styles.css'

export const metadata = {
  title: {
    default: 'PayloadCMS MCP Plugin',
    template: '%s | PayloadCMS MCP Plugin',
  },
  description:
    'A comprehensive PayloadCMS plugin that creates an MCP (Model Context Protocol) server compatible with Claude Desktop and other AI assistants. Automatically generates MCP tools for all your PayloadCMS collections. Built by Antler Digital.',
  keywords: [
    'PayloadCMS',
    'MCP',
    'Model Context Protocol',
    'Claude Desktop',
    'AI',
    'CMS',
    'Plugin',
    'TypeScript',
    'Node.js',
    'API',
    'Automation',
  ],
  authors: [{ name: 'Antler Digital', url: 'https://antler.digital/' }],
  creator: 'Antler Digital',
  publisher: 'Antler Digital',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://payload-plugin-mcp.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://payload-plugin-mcp.vercel.app',
    title: 'PayloadCMS MCP Plugin',
    description:
      'A comprehensive PayloadCMS plugin that creates an MCP (Model Context Protocol) server compatible with Claude Desktop and other AI assistants. Built by Antler Digital.',
    siteName: 'PayloadCMS MCP Plugin',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PayloadCMS MCP Plugin - Connect your CMS to AI assistants',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PayloadCMS MCP Plugin',
    description:
      'A comprehensive PayloadCMS plugin that creates an MCP (Model Context Protocol) server compatible with Claude Desktop and other AI assistants. Built by Antler Digital.',
    images: ['/og-image.png'],
    creator: '@antlerdigital',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta name="theme-color" content="#1f2937" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PayloadCMS MCP Plugin" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                  },
                },
              },
            }
          `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <Header />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  )
}
