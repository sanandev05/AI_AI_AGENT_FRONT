/**
 * File Tool Mapper
 * Maps uploaded files to appropriate AI tools and generates prompts
 */

import { type UploadedFile } from '@/services/fileAPI'

export type ToolType = 'PdfSummarize' | 'OCR' | 'AudioTranscribe' | 'DataAnalyze' | 'CsvToXlsx' | 'DocumentSummarize' | 'PresentationAnalyze' | 'EmailParser' | 'CalendarParser'

export interface ToolMapping {
  tool: ToolType
  displayName: string
  prompt: string
  description: string
  icon: string
}

/**
 * Get the recommended tool for a file based on its category
 */
export function getToolForFile(file: UploadedFile): ToolMapping | null {
  switch (file.category) {
    case 'pdf':
      return {
        tool: 'PdfSummarize',
        displayName: 'Summarize PDF',
        prompt: `Please summarize the PDF file "${file.fileName}" and provide key insights.`,
        description: 'Extract and summarize content from PDF',
        icon: '📄'
      }

    case 'image':
      return {
        tool: 'OCR',
        displayName: 'Extract Text (OCR)',
        prompt: `Please extract all text from the image "${file.fileName}" using OCR.`,
        description: 'Extract text from images using OCR',
        icon: '🔍'
      }

    case 'audio':
      return {
        tool: 'AudioTranscribe',
        displayName: 'Transcribe Audio',
        prompt: `Please transcribe the audio file "${file.fileName}" and provide a complete transcript.`,
        description: 'Transcribe audio to text using Whisper',
        icon: '🎤'
      }

    case 'spreadsheet':
      // Check if it's CSV (might need conversion) or XLSX (ready to analyze)
      if (file.mimeType === 'text/csv') {
        return {
          tool: 'DataAnalyze',
          displayName: 'Analyze Spreadsheet',
          prompt: `Please analyze the spreadsheet "${file.fileName}" and provide insights about the data, including statistics, patterns, and key findings.`,
          description: 'Analyze data and generate insights',
          icon: '📊'
        }
      } else {
        return {
          tool: 'DataAnalyze',
          displayName: 'Analyze Spreadsheet',
          prompt: `Please analyze the spreadsheet "${file.fileName}" and provide insights about the data, including statistics, patterns, and key findings.`,
          description: 'Analyze data and generate insights',
          icon: '📊'
        }
      }

    case 'document':
      return {
        tool: 'DocumentSummarize',
        displayName: 'Summarize Document',
        prompt: `Please summarize the document "${file.fileName}" and provide key insights.`,
        description: 'Extract and summarize content from Word documents',
        icon: '📝'
      }

    case 'presentation':
      return {
        tool: 'PresentationAnalyze',
        displayName: 'Analyze Presentation',
        prompt: `Please analyze the presentation "${file.fileName}" and provide a summary of the slides, key points, and insights.`,
        description: 'Extract content and analyze PowerPoint presentations',
        icon: '📊'
      }

    case 'email':
      return {
        tool: 'EmailParser',
        displayName: 'Parse Email',
        prompt: `Please parse the email "${file.fileName}" and extract sender, recipients, subject, date, and body content.`,
        description: 'Parse and extract email metadata and content',
        icon: '📧'
      }

    case 'calendar':
      return {
        tool: 'CalendarParser',
        displayName: 'Parse Calendar Event',
        prompt: `Please parse the calendar file "${file.fileName}" and extract event details including title, date, time, location, and attendees.`,
        description: 'Parse calendar files and extract event information',
        icon: '📅'
      }

    default:
      return null
  }
}

/**
 * Get all available tools for a file (some files support multiple operations)
 */
export function getAvailableToolsForFile(file: UploadedFile): ToolMapping[] {
  const tools: ToolMapping[] = []
  const primaryTool = getToolForFile(file)
  
  if (primaryTool) {
    tools.push(primaryTool)
  }

  // Spreadsheets can also be converted
  if (file.category === 'spreadsheet' && file.mimeType === 'text/csv') {
    tools.push({
      tool: 'CsvToXlsx',
      displayName: 'Convert CSV to XLSX',
      prompt: `Please convert the CSV file "${file.fileName}" to XLSX format.`,
      description: 'Convert CSV to Excel format',
      icon: '🔄'
    })
  }

  return tools
}

/**
 * Generate a prompt for using a specific tool with a file
 */
export function generateToolPrompt(file: UploadedFile, tool: ToolType, customInstructions?: string): string {
  let basePrompt = ''

  switch (tool) {
    case 'PdfSummarize':
      basePrompt = `Please summarize the PDF file "${file.fileName}".`
      break
    case 'OCR':
      basePrompt = `Please extract text from the image "${file.fileName}" using OCR.`
      break
    case 'AudioTranscribe':
      basePrompt = `Please transcribe the audio file "${file.fileName}".`
      break
    case 'DataAnalyze':
      basePrompt = `Please analyze the spreadsheet "${file.fileName}" and provide insights.`
      break
    case 'CsvToXlsx':
      basePrompt = `Please convert the CSV file "${file.fileName}" to XLSX format.`
      break
    case 'DocumentSummarize':
      basePrompt = `Please summarize the document "${file.fileName}".`
      break
    case 'PresentationAnalyze':
      basePrompt = `Please analyze the presentation "${file.fileName}" and summarize the slides.`
      break
    case 'EmailParser':
      basePrompt = `Please parse the email "${file.fileName}" and extract all metadata and content.`
      break
    case 'CalendarParser':
      basePrompt = `Please parse the calendar file "${file.fileName}" and extract event details.`
      break
  }

  if (customInstructions) {
    basePrompt += ` ${customInstructions}`
  }

  return basePrompt
}

/**
 * Check if a tool requires specific configuration
 */
export function getToolRequirements(tool: ToolType): {
  requiresApiKey: boolean
  configKey?: string
  displayName: string
} {
  switch (tool) {
    case 'OCR':
      return {
        requiresApiKey: true,
        configKey: 'OCR_API_KEY',
        displayName: 'OCR API (Azure Computer Vision or similar)'
      }
    case 'AudioTranscribe':
      return {
        requiresApiKey: true,
        configKey: 'WHISPER_API_KEY',
        displayName: 'OpenAI Whisper API'
      }
    case 'PdfSummarize':
    case 'DataAnalyze':
    case 'CsvToXlsx':
    case 'DocumentSummarize':
    case 'PresentationAnalyze':
    case 'EmailParser':
    case 'CalendarParser':
      return {
        requiresApiKey: false,
        displayName: tool
      }
    default:
      return {
        requiresApiKey: false,
        displayName: 'Unknown Tool'
      }
  }
}

/**
 * Format tool name for display
 */
export function formatToolName(tool: ToolType): string {
  const names: Record<ToolType, string> = {
    PdfSummarize: 'PDF Summary',
    OCR: 'Text Extraction (OCR)',
    AudioTranscribe: 'Audio Transcription',
    DataAnalyze: 'Data Analysis',
    CsvToXlsx: 'CSV to Excel',
    DocumentSummarize: 'Document Summary',
    PresentationAnalyze: 'Presentation Analysis',
    EmailParser: 'Email Parser',
    CalendarParser: 'Calendar Parser'
  }
  return names[tool] || tool
}
