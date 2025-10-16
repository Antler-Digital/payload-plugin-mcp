import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Getting Started Guide | PayloadCMS MCP Plugin',
  description:
    'Step-by-step getting started guide for the PayloadCMS MCP Plugin. Learn how to install, configure, and set up your first MCP integration.',
  openGraph: {
    title: 'PayloadCMS MCP Plugin | Getting Started Guide',
    description:
      'Step-by-step getting started guide for the PayloadCMS MCP Plugin. Learn how to install, configure, and set up your first MCP integration.',
    type: 'article',
  },
  keywords: [
    'PayloadCMS',
    'MCP',
    'getting started',
    'tutorial',
    'setup',
    'installation',
    'configuration',
    'beginner',
  ],
}

export default function GettingStartedLayout({ children }: { children: React.ReactNode }) {
  return children
}
