import { Metadata } from 'next'
import ReadmeContent from '../../../../components/ui/ReadmeContent.tsx'

export const metadata: Metadata = {
  title: 'Getting Started | PayloadCMS MCP Plugin',
  description:
    'Get started with the PayloadCMS MCP Plugin. Learn how to install, configure, and integrate your PayloadCMS with Claude Desktop and other AI assistants using the Model Context Protocol.',
  openGraph: {
    title: 'PayloadCMS MCP Plugin | Getting Started',
    description:
      'Get started with the PayloadCMS MCP Plugin. Learn how to install, configure, and integrate your PayloadCMS with Claude Desktop and other AI assistants.',
    type: 'article',
  },
  keywords: [
    'PayloadCMS',
    'MCP',
    'Model Context Protocol',
    'Claude Desktop',
    'AI',
    'getting started',
    'installation',
    'configuration',
    'tutorial',
  ],
}

export default function ReadmeLayout({ children }: { children: React.ReactNode }) {
  return <ReadmeContent>{children}</ReadmeContent>
}
