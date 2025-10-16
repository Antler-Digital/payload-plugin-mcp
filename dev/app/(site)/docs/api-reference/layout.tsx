import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference | PayloadCMS MCP Plugin',
  description:
    'Complete API reference for the PayloadCMS MCP Plugin. Detailed documentation of all configuration options, methods, and interfaces.',
  openGraph: {
    title: 'PayloadCMS MCP Plugin | API Reference',
    description:
      'Complete API reference for the PayloadCMS MCP Plugin. Detailed documentation of all configuration options, methods, and interfaces.',
    type: 'article',
  },
  keywords: [
    'PayloadCMS',
    'MCP',
    'API',
    'reference',
    'documentation',
    'configuration',
    'interfaces',
    'methods',
  ],
}

export default function ApiReferenceLayout({ children }: { children: React.ReactNode }) {
  return children
}
