import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Troubleshooting | PayloadCMS MCP Plugin',
  description:
    'Troubleshooting guide for the PayloadCMS MCP Plugin. Common issues, solutions, and debugging tips for integrating PayloadCMS with Claude Desktop.',
  openGraph: {
    title: 'PayloadCMS MCP Plugin | Troubleshooting',
    description:
      'Troubleshooting guide for the PayloadCMS MCP Plugin. Common issues, solutions, and debugging tips for integrating PayloadCMS with Claude Desktop.',
    type: 'article',
  },
  keywords: [
    'PayloadCMS',
    'MCP',
    'troubleshooting',
    'debugging',
    'issues',
    'solutions',
    'help',
    'support',
  ],
}

export default function TroubleshootingLayout({ children }: { children: React.ReactNode }) {
  return children
}
