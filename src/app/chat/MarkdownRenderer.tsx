import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './markdown.css';

interface MarkdownRendererProps {
  children: string;
  darkMode?: boolean;
}

export default function MarkdownRenderer({ children, darkMode = false }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with ChatGPT-style spacing and sizing
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-gray-100" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-sm font-semibold mt-2 mb-1 text-gray-800 dark:text-gray-200" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-sm font-semibold mt-2 mb-1 text-gray-700 dark:text-gray-300" {...props} />
          ),
          
          // Paragraphs with proper spacing
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-7 text-gray-800 dark:text-gray-200" {...props} />
          ),
          
          // Lists with better styling
          ul: ({ node, ...props }) => (
            <ul className="mb-4 ml-6 list-disc space-y-2 text-gray-800 dark:text-gray-200" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-2 text-gray-800 dark:text-gray-200" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-7" {...props} />
          ),
          
          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className={`border-l-4 pl-4 py-2 my-4 italic ${
                darkMode 
                  ? 'border-gray-600 bg-gray-800/50 text-gray-300' 
                  : 'border-gray-300 bg-gray-50 text-gray-700'
              }`}
              {...props}
            />
          ),
          
          // Inline code
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            return !inline && language ? (
              // Code block with syntax highlighting
              <div className="my-4 rounded-lg overflow-hidden">
                <div className={`flex items-center justify-between px-4 py-2 text-xs font-mono ${
                  darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-800 text-gray-300'
                }`}>
                  <span>{language}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(String(children));
                    }}
                    className="hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  style={darkMode ? oneDark : oneLight}
                  language={language}
                  PreTag="div"
                  className="!mt-0 !mb-0"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              // Inline code
              <code
                className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                  darkMode 
                    ? 'bg-gray-800 text-red-400 border border-gray-700' 
                    : 'bg-gray-100 text-red-600 border border-gray-200'
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          
          // Tables
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-x-auto">
              <table className={`min-w-full border-collapse ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`} {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'} {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className={`px-4 py-2 text-left font-semibold border ${
              darkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-900'
            }`} {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className={`px-4 py-2 border ${
              darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-800'
            }`} {...props} />
          ),
          
          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className={`my-6 border-t ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`} {...props} />
          ),
          
          // Strong/Bold
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />
          ),
          
          // Emphasis/Italic
          em: ({ node, ...props }) => (
            <em className="italic text-gray-800 dark:text-gray-200" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}