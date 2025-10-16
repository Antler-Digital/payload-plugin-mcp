'use client'

import React, { useState } from 'react'
import { CodeBlock as ReactCodeBlock } from 'react-code-block'
import { themes } from 'prism-react-renderer'

interface CodeBlockProps {
  code: string
  language: string
  filename?: string
  showLineNumbers?: boolean
  highlightLines?: string[]
  copyable?: boolean
  maxHeight?: string
}

export default function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = true,
  highlightLines = [],
  copyable = true,
  maxHeight = '400px',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="relative group">
      <ReactCodeBlock code={code} language={language} lines={highlightLines} theme={themes.vsDark}>
        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden shadow-lg border border-gray-700 dark:border-gray-600">
          {/* Header */}
          {(filename || copyable) && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 dark:bg-gray-900 border-b border-gray-700 dark:border-gray-600">
              {filename && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300 dark:text-gray-400 text-sm ml-2 font-mono">
                    {filename}
                  </span>
                </div>
              )}
              {copyable && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 text-gray-300 dark:text-gray-400 text-sm rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
          )}

          {/* Code Content */}
          <div className="overflow-auto code-block-container" style={{ maxHeight }}>
            <ReactCodeBlock.Code className="!p-0">
              {({ isLineHighlighted }) => (
                <div
                  className={`table-row ${
                    isLineHighlighted ? 'bg-blue-500/20 dark:bg-blue-400/20' : ''
                  }`}
                >
                  {showLineNumbers && (
                    <ReactCodeBlock.LineNumber className="table-cell px-4 py-1 text-sm text-gray-500 dark:text-gray-400 text-right select-none font-mono" />
                  )}
                  <ReactCodeBlock.LineContent className="table-cell w-full pr-4 py-1">
                    <ReactCodeBlock.Token />
                  </ReactCodeBlock.LineContent>
                </div>
              )}
            </ReactCodeBlock.Code>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-t border-gray-700 dark:border-gray-600">
            <div className="text-gray-400 dark:text-gray-500 text-xs font-mono uppercase">
              {language}
            </div>
            <div className="text-gray-500 dark:text-gray-600 text-xs">
              {code.split('\n').length} lines
            </div>
          </div>
        </div>
      </ReactCodeBlock>
    </div>
  )
}
