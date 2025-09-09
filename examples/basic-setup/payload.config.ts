import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { PayloadPluginMcp } from 'payload-plugin-mcp'

// Example collections
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
      ],
      defaultValue: 'draft',
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
  ],
}

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Posts, Users],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb://localhost:27017/payload-mcp-basic',
  }),
  editor: lexicalEditor({}),
  plugins: [
    // Basic MCP plugin setup - exposes all collections with read-only access
    PayloadPluginMcp({
      apiKey: process.env.MCP_API_KEY,
      collections: 'all',
      defaultOperations: {
        list: true,
        get: true,
        create: false,
        update: false,
        delete: false,
      },
    }),
  ],
  typescript: {
    outputFile: './payload-types.ts',
  },
})