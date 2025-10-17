// Specialized AI Agent Assistant Types

export interface AgentType {
  key: string;
  name: string;
  description: string;
  endpoint: string;
  supportedFileTypes: string[];
  options?: Record<string, any>; // For agent-specific settings
}

export const AGENT_TYPES: AgentType[] = [
  {
    key: 'pdf-summarizer',
    name: 'PDF Summarizer',
    description: 'Summarizes long PDFs into concise bullet points or executive summaries.',
    endpoint: '/api/agent/pdf-summarize',
    supportedFileTypes: ['pdf'],
    options: { modes: ['TL;DR', 'Detailed'] }
  },
  {
    key: 'document-translator',
    name: 'Document Translator',
    description: 'Translates PDFs, Word docs, or text files into your chosen language.',
    endpoint: '/api/agent/translate',
    supportedFileTypes: ['pdf', 'document', 'text'],
    options: { languages: ['en', 'es', 'fr', 'de', 'zh', 'ar', 'ru', 'tr'] }
  },
  {
    key: 'contract-analyzer',
    name: 'Contract/Policy Analyzer',
    description: 'Extracts key terms, risks, deadlines, and obligations from contracts or policies.',
    endpoint: '/api/agent/contract-analyze',
    supportedFileTypes: ['pdf', 'document'],
  },
  {
    key: 'table-extractor',
    name: 'Table Extractor',
    description: 'Finds and exports tables from PDFs/Word to CSV or Excel.',
    endpoint: '/api/agent/extract-tables',
    supportedFileTypes: ['pdf', 'document'],
  },
  {
    key: 'presentation-generator',
    name: 'Presentation Generator',
    description: 'Turns document content into a PowerPoint deck.',
    endpoint: '/api/agent/make-pptx',
    supportedFileTypes: ['pdf', 'document'],
    options: { modes: ['Summary Deck', 'Detailed Deck'] }
  },
  {
    key: 'qa-tutor',
    name: 'Q&A Tutor',
    description: 'Ask questions about study materials and get answers, explanations, and quizzes.',
    endpoint: '/api/agent/qa-tutor',
    supportedFileTypes: ['pdf', 'document'],
  },
  {
    key: 'multi-file-compare',
    name: 'Multi-file Compare',
    description: 'Compares two or more documents and highlights differences or missing sections.',
    endpoint: '/api/agent/compare',
    supportedFileTypes: ['pdf', 'document'],
  }
];
