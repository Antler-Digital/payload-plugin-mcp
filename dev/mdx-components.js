import Link from 'next/link'
import CodeBlock from './components/ui/CodeBlock.tsx'

export function useMDXComponents(components) {
  return {
    // Override the default <a> tag with Next.js Link
    a: ({ href, children, ...props }) => {
      // Check if it's an internal link
      if (href && (href.startsWith('/') || href.startsWith('#'))) {
        return (
          <Link href={href} {...props}>
            {children}
          </Link>
        )
      }
      // External links
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      )
    },
    // Custom code block styling with react-code-block
    pre: ({ children, ...props }) => {
      // Extract code content and language from the code element inside pre
      const codeElement = children?.props?.children
      const codeClassName = children?.props?.className || ''
      const match = /language-(\w+)/.exec(codeClassName)
      const language = match ? match[1] : 'text'

      if (codeElement && typeof codeElement === 'string') {
        return (
          <div className="my-6">
            <CodeBlock
              code={codeElement}
              language={language}
              showLineNumbers={true}
              copyable={true}
            />
          </div>
        )
      }

      return (
        <pre
          className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"
          {...props}
        >
          {children}
        </pre>
      )
    },
    // Custom code inline styling
    code: ({ children, ...props }) => {
      // Check if it's inside a pre tag (code block)
      const isCodeBlock = props.className?.includes('language-')
      if (isCodeBlock) {
        return <code {...props}>{children}</code>
      }
      // Inline code
      return (
        <code
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 py-0.5 rounded text-sm"
          {...props}
        >
          {children}
        </code>
      )
    },
    // Custom blockquote styling
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 mb-6"
        {...props}
      >
        {children}
      </blockquote>
    ),
    // Custom table styling
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto mb-6">
        <table
          className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th
        className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-left font-semibold text-gray-900 dark:text-gray-100"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
        {...props}
      >
        {children}
      </td>
    ),
    // Custom heading styles with dark mode
    h1: ({ children, ...props }) => (
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 mt-8" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-6" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4" {...props}>
        {children}
      </h4>
    ),
    // Custom paragraph styling
    p: ({ children, ...props }) => (
      <p className="text-gray-900 dark:text-gray-100 mb-4 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    // Custom list styling
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc list-inside text-gray-900 dark:text-gray-100 mb-4 space-y-2"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal list-inside text-gray-900 dark:text-gray-100 mb-4 space-y-2"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </li>
    ),
    // Custom hr styling
    hr: ({ ...props }) => <hr className="border-gray-200 dark:border-gray-700 my-8" {...props} />,
    // Merge with any additional components passed in
    ...components,
  }
}
