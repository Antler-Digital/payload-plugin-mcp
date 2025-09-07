import type { CollectionConfig } from 'payload'

import crypto from 'crypto'

export const McpTokens: CollectionConfig = {
  slug: 'mcp-tokens',
  access: {
    admin: ({ req }) => Boolean(req.user && 'role' in req.user && req.user.role === 'admin'),
    create: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user && 'role' in req.user && req.user.role === 'admin'),
    read: ({ req }) => (req.user && 'role' in req.user && req.user.role === 'admin' ? true : { user: { equals: req.user?.id } }),
    update: ({ req }) => (req.user && 'role' in req.user && req.user.role === 'admin' ? true : { user: { equals: req.user?.id } }),
  },
  admin: {
    defaultColumns: ['label', 'user', 'type', 'active', 'expiresAt'],
    description:
      'MCP API tokens. User-linked tokens impersonate the user; service/admin tokens use scopes only.',
    useAsTitle: 'label',
  },
  fields: [
    { name: 'label', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'user',
      options: [
        { label: 'User Token', value: 'user' },
        { label: 'Service Token', value: 'service' },
        { label: 'Admin Token', value: 'admin' },
      ],
      required: true,
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
    { name: 'tokenHash', type: 'text', admin: { readOnly: true }, required: true },
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
  timestamps: true,
}
