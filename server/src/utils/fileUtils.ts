/**
 * Get the appropriate MIME content type for a file extension
 * @param ext File extension (including the dot, e.g. '.mp4')
 * @returns MIME content type string
 */
export function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.srt': 'application/x-subrip',
    '.vtt': 'text/vtt',
  }

  return contentTypes[ext.toLowerCase()] || 'application/octet-stream'
}
