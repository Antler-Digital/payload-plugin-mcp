import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contributing | PayloadCMS MCP Plugin',
  description:
    'Contributing guide for the PayloadCMS MCP Plugin. Learn how to contribute to the project, submit issues, and help improve the plugin.',
  openGraph: {
    title: 'PayloadCMS MCP Plugin | Contributing',
    description:
      'Contributing guide for the PayloadCMS MCP Plugin. Learn how to contribute to the project, submit issues, and help improve the plugin.',
    type: 'article',
  },
  keywords: [
    'PayloadCMS',
    'MCP',
    'contributing',
    'open source',
    'development',
    'pull requests',
    'issues',
    'community',
  ],
}

export default function ContributingLayout({ children }: { children: React.ReactNode }) {
  return children
}
