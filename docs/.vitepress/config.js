export default {
  title: 'Payload MCP Plugin',
  description: 'A PayloadCMS plugin that integrates with MCP (Model Context Protocol) to enable AI model communication',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'GitHub', link: 'https://github.com/Antler-Digital/payload-plugin-mcp' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/getting-started' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Configuration', link: '/guide/configuration' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Plugin Architecture', link: '/guide/architecture' },
            { text: 'Tool Generation', link: '/guide/tool-generation' },
            { text: 'Authentication', link: '/guide/authentication' }
          ]
        },
        {
          text: 'Advanced Usage',
          items: [
            { text: 'Custom Operations', link: '/guide/custom-operations' },
            { text: 'Deployment', link: '/guide/deployment' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Plugin Options', link: '/api/plugin-options' },
            { text: 'Collection Configuration', link: '/api/collection-config' },
            { text: 'Generated Tools', link: '/api/generated-tools' },
            { text: 'HTTP Endpoints', link: '/api/endpoints' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Setup', link: '/examples/basic-setup' },
            { text: 'Advanced Configuration', link: '/examples/advanced-config' },
            { text: 'E-commerce', link: '/examples/ecommerce' },
            { text: 'Content Management', link: '/examples/cms' },
            { text: 'Vercel Deployment', link: '/examples/vercel' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Antler-Digital/payload-plugin-mcp' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 Antler Digital'
    },

    editLink: {
      pattern: 'https://github.com/Antler-Digital/payload-plugin-mcp/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  },

  head: [
    ['meta', { name: 'theme-color', content: '#3c82f6' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'Payload MCP Plugin' }],
    ['meta', { name: 'og:image', content: '/og-image.png' }]
  ]
}