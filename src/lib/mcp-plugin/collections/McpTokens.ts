import type { CollectionConfig } from 'payload'
import crypto from 'crypto'

export const McpTokens: CollectionConfig = {
  slug: 'mcp-tokens',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'user', 'type', 'active', 'expiresAt'],
    description:
      'MCP API tokens. User-linked tokens impersonate the user; service/admin tokens use scopes only.',
  },
  access: {
    read: ({ req }) => (req.user && 'role' in req.user && req.user.role === 'admin' ? true : { user: { equals: req.user?.id } }),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => (req.user && 'role' in req.user && req.user.role === 'admin' ? true : { user: { equals: req.user?.id } }),
    delete: ({ req }) => Boolean(req.user && 'role' in req.user && req.user.role === 'admin'),
    admin: ({ req }) => Boolean(req.user && 'role' in req.user && req.user.role === 'admin'),
  },
  timestamps: true,
  fields: [
    { name: 'label', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'User Token', value: 'user' },
        { label: 'Service Token', value: 'service' },
        { label: 'Admin Token', value: 'admin' },
      ],
    },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    {
      name: 'scopes',
      type: 'array',
      admin: {
        description:
          'Custom scopes for this token. Leave empty to use default scopes based on token type. Format: collections:{collection}:{operation} (e.g., collections:users:read, collections:media:create) or media:upload, mcp:describe. Use collections:*:* for full access.',
      },
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'expiresAt', type: 'date' },
    { name: 'tokenHash', type: 'text', required: true, admin: { readOnly: true } },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, operation }) => {
        if (operation === 'create' && data) {
          try {
            const plain: string = (data as any)._plainToken || ''
            const token = crypto.createHash('sha256').update(plain).digest('hex')
            ;(data as any).tokenHash = token
          } catch (error) {
            console.error('Error hashing token', error)
          }
        }
      },
    ],
  },
}
