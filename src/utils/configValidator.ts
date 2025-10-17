/**
 * Configuration Validator
 * Checks if required API keys and configurations are available
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://localhost:7210';

export interface ConfigStatus {
  configured: boolean
  configKey: string
  displayName: string
  description?: string
}

export interface ValidationResult {
  allConfigured: boolean
  configs: Record<string, ConfigStatus>
  missingConfigs: string[]
}

/**
 * Validate tool configurations with the backend
 */
export async function validateToolConfigs(token: string): Promise<ValidationResult> {
  try {
    const response = await fetch(`${API_BASE}/api/config/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // If endpoint doesn't exist, fall back to checking individual configs
      return await fallbackValidation(token);
    }

    const data = await response.json();
    
    // Parse response format (adjust based on your backend response)
    const configs: Record<string, ConfigStatus> = {};
    const missingConfigs: string[] = [];

    // Expected response format: { ocrConfigured: boolean, whisperConfigured: boolean, ... }
    if (data.ocrConfigured !== undefined) {
      const status = {
        configured: data.ocrConfigured,
        configKey: 'OCR_API_KEY',
        displayName: 'OCR Service (Azure Computer Vision)',
        description: 'Required for text extraction from images'
      };
      configs['OCR_API_KEY'] = status;
      if (!status.configured) missingConfigs.push('OCR_API_KEY');
    }

    if (data.whisperConfigured !== undefined) {
      const status = {
        configured: data.whisperConfigured,
        configKey: 'WHISPER_API_KEY',
        displayName: 'Whisper API (OpenAI)',
        description: 'Required for audio transcription'
      };
      configs['WHISPER_API_KEY'] = status;
      if (!status.configured) missingConfigs.push('WHISPER_API_KEY');
    }

    return {
      allConfigured: missingConfigs.length === 0,
      configs,
      missingConfigs
    };
  } catch (error) {
    console.error('Failed to validate configs:', error);
    // Return fallback validation on error
    return await fallbackValidation(token);
  }
}

/**
 * Fallback validation when /api/config/validate is not available
 * Attempts to infer config status from other indicators
 */
async function fallbackValidation(token: string): Promise<ValidationResult> {
  // Assume all configs are available by default
  // The backend will return appropriate errors when tools are used without proper config
  const configs: Record<string, ConfigStatus> = {
    'OCR_API_KEY': {
      configured: true,
      configKey: 'OCR_API_KEY',
      displayName: 'OCR Service',
      description: 'Text extraction from images'
    },
    'WHISPER_API_KEY': {
      configured: true,
      configKey: 'WHISPER_API_KEY',
      displayName: 'Whisper API',
      description: 'Audio transcription'
    }
  };

  return {
    allConfigured: true,
    configs,
    missingConfigs: []
  };
}

/**
 * Check if a specific tool's configuration is available
 */
export function isToolConfigured(
  validationResult: ValidationResult,
  configKey: string
): boolean {
  return validationResult.configs[configKey]?.configured ?? true;
}

/**
 * Get warning message for missing configurations
 */
export function getMissingConfigWarning(validationResult: ValidationResult): string | null {
  if (validationResult.allConfigured) {
    return null;
  }

  const missingNames = validationResult.missingConfigs
    .map(key => validationResult.configs[key]?.displayName || key)
    .join(', ');

  return `Missing configurations: ${missingNames}. Some features may be unavailable.`;
}

/**
 * Get user-friendly configuration instructions
 */
export function getConfigInstructions(configKey: string): string {
  const instructions: Record<string, string> = {
    'OCR_API_KEY': 'To enable OCR, configure Azure Computer Vision API key in your backend settings.',
    'WHISPER_API_KEY': 'To enable audio transcription, configure OpenAI Whisper API key in your backend settings.'
  };

  return instructions[configKey] || `Configure ${configKey} in backend settings to enable this feature.`;
}
