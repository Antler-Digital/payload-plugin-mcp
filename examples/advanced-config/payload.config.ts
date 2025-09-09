import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { PayloadPluginMcp } from 'payload-plugin-mcp'

// Advanced collection definitions
const Posts = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({}),
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
    },
  ],
}

const Categories = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color code for this category',
      },
    },
  ],
}

const Media = {
  slug: 'media',
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'textarea',
    },
  ],
}

const Users = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Author', value: 'author' },
      ],
      defaultValue: 'author',
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Twitter', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'GitHub', value: 'github' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes - not exposed via MCP',
      },
    },
  ],
}

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Posts, Categories, Media, Users],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb://localhost:27017/payload-mcp-advanced',
  }),
  editor: lexicalEditor({}),
  plugins: [
    // Advanced MCP plugin configuration with per-collection settings
    PayloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: [
        // Posts - Full CRUD operations for content management
        {
          collection: Posts,
          options: {
            operations: {
              list: true,
              get: true,
              create: true,
              update: true,
              delete: true,
            },
            toolPrefix: 'post',
            description: 'blog posts and articles',
            // Don't expose SEO fields in MCP tools (keep them internal)
            excludeFields: ['seo'],
          },
        },
        
        // Categories - Read and create only (structured data)
        {
          collection: Categories,
          options: {
            operations: {
              list: true,
              get: true,
              create: true,
              update: false,
              delete: false,
            },
            toolPrefix: 'category',
            description: 'content categories',
          },
        },
        
        // Media - File management with upload support
        {
          collection: Media,
          options: {
            operations: {
              list: true,
              get: true,
              create: true,
              update: true,
              delete: true,
            },
            toolPrefix: 'file',
            description: 'media files and images',
          },
        },
        
        // Users - Limited operations, exclude sensitive data
        {
          collection: Users,
          options: {
            operations: {
              list: true,
              get: true,
              create: false, // User creation handled through auth
              update: true,  // Allow profile updates
              delete: false, // Prevent accidental user deletion
            },
            toolPrefix: 'user',
            description: 'user profiles and authors',
            // Exclude sensitive/internal fields
            excludeFields: ['password', 'salt', 'hash', 'internalNotes'],
          },
        },
      ],
      
      // Default operations for any collections not explicitly configured
      defaultOperations: {
        list: true,
        get: true,
        create: false,
        update: false,
        delete: false,
      },
      
      // Enhanced media handling
      media: {
        enableChunking: true, // Enable chunked uploads for large files
      },
      
      // Custom token collection configuration
      tokens: {
        slug: 'mcp-api-tokens',
        admin: {
          label: 'API Tokens',
          description: 'Manage MCP API access tokens',
        },
      },
      
      // Rich text field handling
      richText: {
        truncateInList: 150, // Truncate rich text in list responses
      },
    }),
  ],
  typescript: {
    outputFile: './payload-types.ts',
  },
})