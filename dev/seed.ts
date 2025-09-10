import type { Payload } from 'payload'

import { devUser } from './helpers/credentials.js'

export const seed = async (payload: Payload) => {
  // drop all collections
  await payload.delete({
    collection: 'users',
    where: {},
  })
  await payload.delete({
    collection: 'posts',
    where: {},
  })
  const { totalDocs } = await payload.count({
    collection: 'users',
    where: {
      email: {
        equals: devUser.email,
      },
    },
  })

  if (!totalDocs) {
    await payload.create({
      collection: 'users',
      data: devUser,
    })
  }

  const posts = await payload.find({
    collection: 'posts',
  })
  if (posts.docs.length === 0) {
    for (let i = 0; i < 10; i++) {
      await payload.create({
        collection: 'posts',
        data: {
          slug: `test-${i}`,
          title: `Test ${i}`,
        },
      })
    }
  }
}
