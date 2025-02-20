// Supported video formats and their MIME types
const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
]

// Maximum file size (100MB in bytes)
const MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024 //3GB

interface ValidationResult {
  isValid: boolean
  error?: string
}

export const uploadValidation = {
  validate: (file: File): ValidationResult => {
    // Check file type
    // if (!SUPPORTED_VIDEO_FORMATS.includes(file.type)) {
    //   return {
    //     isValid: false,
    //     error: `Unsupported file type. Supported formats: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`,
    //   }
    // }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large. Maximum size is 3GB`, // change to 5GB later
      }
    }

    //add other validation checks such as duration, resolution, etc.

    return {
      isValid: true,
    }
  },
}
