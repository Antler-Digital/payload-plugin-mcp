'use client'

import React from 'react'
import CodeBlock from '../../../components/ui/CodeBlock.tsx'

export default function CodeBlockTest() {
  const testCode = `// TypeScript example
interface User {
  id: number
  name: string
  email: string
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`
}

const user: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
}

console.log(greetUser(user))`

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">CodeBlock Test</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">TypeScript Code Block</h2>
          <CodeBlock
            code={testCode}
            language="typescript"
            filename="example.ts"
            showLineNumbers={true}
            copyable={true}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">JavaScript Code Block</h2>
          <CodeBlock
            code={`function hello() {
  console.log("Hello, World!")
  return "success"
}`}
            language="javascript"
            filename="hello.js"
            showLineNumbers={true}
            copyable={true}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Bash Code Block</h2>
          <CodeBlock
            code={`#!/bin/bash
echo "Installing dependencies..."
npm install
echo "Build complete!"`}
            language="bash"
            filename="build.sh"
            showLineNumbers={true}
            copyable={true}
          />
        </div>
      </div>
    </div>
  )
}
