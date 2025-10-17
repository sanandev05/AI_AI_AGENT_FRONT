/**
 * File Upload API Service
 * Handles file uploads, retrieval, and deletion
 * 
 * NOTE: The upload endpoint is automatically detected by trying multiple common patterns:
 * - /api/file/upload (singular)
 * - /api/upload
 * - /api/files
 * - /api/files/upload
 * - /api/agent/file/upload
 * 
 * If backend uses a different endpoint, add it to the possibleEndpoints array in uploadFile()
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://localhost:7210';

// Supported file types and their MIME types
export const SUPPORTED_FILE_TYPES = {
  pdf: ['application/pdf'],
  document: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword' // .doc (legacy)
  ],
  spreadsheet: [
    'text/csv', // .csv
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls (legacy)
  ],
  presentation: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint' // .ppt (legacy)
  ],
  image: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'],
  audio: [
    'audio/mpeg', // .mp3
    'audio/mp3',
    'audio/wav', // .wav
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/m4a'
  ],
  email: ['message/rfc822', 'application/vnd.ms-outlook'], // .eml
  calendar: ['text/calendar', 'application/ics'] // .ics
};

// Maximum file size: 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  downloadUrl: string;
  category?: 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'audio' | 'email' | 'calendar' | 'other';
}

export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  uploadedAt: string;
}

/**
 * Validate file type and size before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
    };
  }

  // Check if file type is supported
  const allSupportedTypes = Object.values(SUPPORTED_FILE_TYPES).flat();
  if (!allSupportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, XLSX, PPTX, PNG, MP3, WAV, CSV, EML, ICS`
    };
  }

  return { valid: true };
}

/**
 * Determine file category from MIME type
 */
export function getFileCategory(mimeType: string): 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'audio' | 'email' | 'calendar' | 'other' {
  if (SUPPORTED_FILE_TYPES.pdf.includes(mimeType)) return 'pdf';
  if (SUPPORTED_FILE_TYPES.document.includes(mimeType)) return 'document';
  if (SUPPORTED_FILE_TYPES.spreadsheet.includes(mimeType)) return 'spreadsheet';
  if (SUPPORTED_FILE_TYPES.presentation.includes(mimeType)) return 'presentation';
  if (SUPPORTED_FILE_TYPES.image.includes(mimeType)) return 'image';
  if (SUPPORTED_FILE_TYPES.audio.includes(mimeType)) return 'audio';
  if (SUPPORTED_FILE_TYPES.email.includes(mimeType)) return 'email';
  if (SUPPORTED_FILE_TYPES.calendar.includes(mimeType)) return 'calendar';
  return 'other';
}

/**
 * Smarter category detection: prefer MIME type, but fall back to file extension when MIME is generic/unknown.
 */
export function getCategoryForFile(mimeType?: string, fileName?: string): UploadedFile['category'] {
  const mime = (mimeType || '').toLowerCase();
  // First try by MIME
  const byMime = getFileCategory(mime || 'application/octet-stream');
  if (byMime !== 'other') return byMime;

  // Fallback by extension
  const name = (fileName || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'document';
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'spreadsheet';
  if (name.endsWith('.pptx') || name.endsWith('.ppt')) return 'presentation';
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif') || name.endsWith('.webp') || name.endsWith('.bmp')) return 'image';
  if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg') || name.endsWith('.webm') || name.endsWith('.m4a')) return 'audio';
  if (name.endsWith('.eml')) return 'email';
  if (name.endsWith('.ics')) return 'calendar';
  return 'other';
}

/**
 * Upload a file to the server
 * Uses POST with multipart/form-data
 * Tries multiple endpoint variations to find the correct one
 */
export async function uploadFile(
  file: File,
  token: string,
  onProgress?: (progress: number) => void
): Promise<FileUploadResponse> {
  // Validate file first
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Try multiple possible endpoints (backend might use any of these)
  const possibleEndpoints = [
    '/api/Files' // Use only the main Files endpoint for upload
  ];

  let lastError: Error | null = null;

  // Try each endpoint until one works
  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`🔄 Trying endpoint: POST ${API_BASE}${endpoint}`);
      const result = await attemptUpload(file, `${API_BASE}${endpoint}`, token, onProgress);
      console.log(`✅ Success! Working endpoint: POST ${API_BASE}${endpoint}`);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('405')) {
        console.log(`❌ 405 Method Not Allowed for ${endpoint}, trying next...`);
        lastError = error;
        continue;
      } else {
        // If it's not a 405, it might be a real error, throw it
        throw error;
      }
    }
  }

  // If we get here, none of the endpoints worked
  console.error('❌ All endpoints failed with 405. Available endpoints to try:', possibleEndpoints);
  throw lastError || new Error('File upload failed: No working endpoint found');
}

/**
 * Attempt upload to a specific endpoint
 */
async function attemptUpload(
  file: File,
  uploadUrl: string,
  token: string,
  onProgress?: (progress: number) => void
): Promise<FileUploadResponse> {
  const formData = new FormData();
  // Backend expects the file under the field name "file"
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      console.log(`📡 Upload response: ${xhr.status} ${xhr.statusText}`);
      console.log(`📡 Response headers:`, xhr.getAllResponseHeaders());
      console.log(`📡 Response body:`, xhr.responseText);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log('✅ Upload successful:', response);
          resolve(response);
        } catch (e) {
          console.error('❌ Invalid response format:', xhr.responseText);
          reject(new Error('Invalid response format'));
        }
      } else if (xhr.status === 405) {
        // 405 means the endpoint exists but doesn't accept POST method
        reject(new Error(`405 Method Not Allowed: ${uploadUrl}`));
      } else {
        console.error(`❌ Upload failed: ${xhr.status} ${xhr.statusText}`, xhr.responseText);
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      console.error('❌ Network error during upload');
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      console.error('❌ Upload cancelled');
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', uploadUrl);
    // Set Authorization header - FormData will automatically set Content-Type with boundary
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    // DO NOT set Content-Type manually - let the browser set it with multipart boundary
    xhr.send(formData);
  });
}

/**
 * Get list of uploaded files
 */
export async function getFiles(token: string): Promise<UploadedFile[]> {
  const response = await fetch(`${API_BASE}/api/Files`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Map response to UploadedFile format and add category
  const list = Array.isArray(data) ? data : (data.files || [])
  return list.map((file: any) => ({
    id: file.name || file.fileId || file.id,
    fileName: file.name || file.fileName,
    fileSize: file.size || file.fileSize,
    mimeType: file.mimeType || 'application/octet-stream',
    uploadedAt: file.createdUtc || file.uploadedAt,
    downloadUrl: file.downloadUrl || `${API_BASE}/api/Files/${encodeURIComponent(file.name || file.fileName)}`,
    category: getCategoryForFile(file.mimeType, file.name || file.fileName)
  }));
}

/**
 * Delete a file
 */
export async function deleteFile(fileName: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/Files/${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
  }
}

/**
 * Get download URL for a file
 */
export function getDownloadUrl(fileName: string): string {
  return `${API_BASE}/api/Files/${encodeURIComponent(fileName)}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
