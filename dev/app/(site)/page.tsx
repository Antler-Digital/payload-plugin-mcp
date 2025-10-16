import { redirect } from 'next/navigation.js'

export default function HomePage() {
  // Redirect to README as the front page
  redirect('/docs/readme')
}
