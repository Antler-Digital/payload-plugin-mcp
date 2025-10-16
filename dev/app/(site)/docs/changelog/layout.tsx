import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog | PayloadCMS MCP Plugin',
  description:
    'Changelog for the PayloadCMS MCP Plugin. Track all updates, new features, bug fixes, and breaking changes.',
  openGraph: {
    title: 'PayloadCMS MCP Plugin | Changelog',
    description:
      'Changelog for the PayloadCMS MCP Plugin. Track all updates, new features, bug fixes, and breaking changes.',
    type: 'article',
  },
  keywords: [
    'PayloadCMS',
    'MCP',
    'changelog',
    'updates',
    'releases',
    'version history',
    'new features',
    'bug fixes',
  ],
}

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return children
}
