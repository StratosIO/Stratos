import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import log from "../config/logger.js";
import { UPLOAD_CONFIG } from "../types/index.js";
import { THUMBNAIL_DIR_NAME, MIN_FILE_SIZE, THUMBNAIL_SIZE, THUMBNAIL_FORMAT } from "../types/index.js";

const execAsync = promisify(exec);



export const thumbnailUtils = {
  /**
   * Get the full path to the thumbnails directory
   */
  getThumbnailDirectory: () => {
    return path.join(UPLOAD_CONFIG.DIR, THUMBNAIL_DIR_NAME);
  },

  /**
   * Ensure the thumbnail directory exists
   */
  ensureThumbnailDirectory: async () => {
    try {
      const thumbnailDir = thumbnailUtils.getThumbnailDirectory();
      await fs.mkdir(thumbnailDir, {
        recursive: true,
        mode: UPLOAD_CONFIG.PERMISSIONS,
      });
    } catch (error) {
      log.error("Failed to create thumbnail directory:", error);
      throw new Error("Failed to initialize thumbnail directory");
    }
  },

  /**
   * Determine if a thumbnail should be generated based on file type and size
   */
  shouldGenerateThumbnail: (fileType: string, fileSize: number): boolean => {
    if (fileSize < MIN_FILE_SIZE) {
      return false;
    }

    const supportedTypes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska"
    ];

    return supportedTypes.includes(fileType.toLowerCase());
  },

  /**
   * Generate a thumbnail for the given file
   */
  generateThumbnail: async (
    filePath: string,
    fileId: string,
    fileType: string
  ): Promise<string | null> => {
    try {
      await thumbnailUtils.ensureThumbnailDirectory();
      
      const thumbnailPath = path.join(
        thumbnailUtils.getThumbnailDirectory(),
        `${fileId}_thumb.${THUMBNAIL_FORMAT}`
      );

      if (fileType.startsWith("image/")) {
        // Generate thumbnail for images
        await execAsync(
          `ffmpeg -i "${filePath}" -vf "scale=${THUMBNAIL_SIZE}:force_original_aspect_ratio=decrease" -q:v 2 "${thumbnailPath}"`
        );
      } else if (fileType.startsWith("video/")) {
        // Generate thumbnail for videos (first frame)
        // Try 1 second mark first, fallback to 0 seconds if that fails
        try {
          await execAsync(
            `ffmpeg -i "${filePath}" -ss 00:00:01.000 -vframes 1 -vf "scale=${THUMBNAIL_SIZE}:force_original_aspect_ratio=decrease" -q:v 2 "${thumbnailPath}"`
          );
        } catch {
          // Fallback to first frame
          await execAsync(
            `ffmpeg -i "${filePath}" -vframes 1 -vf "scale=${THUMBNAIL_SIZE}:force_original_aspect_ratio=decrease" -q:v 2 "${thumbnailPath}"`
          );
        }
      } else {
        // For unsupported types, return null
        return null;
      }

      // Verify thumbnail was created
      try {
        await fs.access(thumbnailPath);
        log.info(`Thumbnail generated for file ${fileId} at ${thumbnailPath}`);
        return thumbnailPath;
      } catch {
        log.warn(`Thumbnail generation failed for file ${fileId}`);
        return null;
      }
    } catch (error) {
      log.error(`Error generating thumbnail for file ${fileId}:`, error);
      return null;
    }
  },

  /**
   * Delete a thumbnail by file ID
   */
  deleteThumbnail: async (fileId: string): Promise<void> => {
    try {
      const thumbnailPath = path.join(
        thumbnailUtils.getThumbnailDirectory(),
        `${fileId}_thumb.${THUMBNAIL_FORMAT}`
      );
      
      await fs.unlink(thumbnailPath);
      log.info(`Thumbnail deleted: ${thumbnailPath}`);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code !== "ENOENT") {
          log.warn(`Error deleting thumbnail for file ${fileId}:`, error);
        }
      } else {
        log.warn(`Error deleting thumbnail for file ${fileId}:`, error);
      }
    }
  }
};