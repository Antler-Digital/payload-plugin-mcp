# Development Documentation Site

This directory contains the development version of the PayloadCMS MCP Plugin documentation site, built with Next.js and deployed to Vercel.

## Structure

```
dev/
├── app/
│   └── (site)/
│       ├── layout.tsx          # Main layout with navigation
│       ├── page.tsx            # Homepage
│       └── docs/               # Documentation pages
│           ├── page.tsx        # Documentation index
│           ├── getting-started/
│           │   └── page.tsx    # Getting started guide
│           ├── api-reference/
│           │   └── page.tsx    # API reference
│           └── troubleshooting/
│               └── page.tsx    # Troubleshooting guide
├── next.config.mjs             # Next.js configuration
└── README.md                   # This file
```

## Documentation Source

The documentation content is sourced from the main `docs/` folder in the repository root. The React components in `app/(site)/docs/` are manually converted from the MDX files to ensure proper Next.js compatibility.

## Key Features

- **Responsive Design**: Built with Tailwind CSS for mobile-first responsive design
- **Navigation**: Clean navigation header with links to all sections
- **Code Highlighting**: Syntax highlighting for code examples
- **Consistent Styling**: Matches the main plugin branding and design system

## Development

To run the development server:

```bash
cd dev
npm run dev
# or
pnpm dev
```

The site will be available at `http://localhost:3000`.

## Deployment

This site is automatically deployed to Vercel when changes are pushed to the main branch. The deployment configuration is in `vercel.json` in the repository root.

## Updating Documentation

When updating documentation:

1. Update the source files in the `docs/` folder
2. Manually convert any changes to the corresponding React components in `app/(site)/docs/`
3. Test the changes locally with `npm run dev`
4. Commit and push changes

## Navigation

The site includes:

- **Home**: Main landing page with features and quick start
- **Documentation**: Overview of all documentation sections
- **Getting Started**: Installation and setup guide
- **API Reference**: Complete API documentation
- **Troubleshooting**: Common issues and solutions

All pages include breadcrumb navigation and consistent styling.
