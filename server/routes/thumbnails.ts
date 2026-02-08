import { RequestHandler } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Thumbnail cache configuration
const CACHE_DIR = path.join(process.cwd(), "public", "thumbnails");
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface ThumbnailCache {
  [key: string]: {
    filename: string;
    cachedAt: number;
    originalUrl: string;
    size: number;
    contentType: string;
  };
}

// In-memory cache metadata (in production, use Redis or database)
const thumbnailCache: ThumbnailCache = {};

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch (error) {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

// Generate cache key from URL
function generateCacheKey(url: string): string {
  return crypto.createHash("md5").update(url).digest("hex");
}

// Check if cached file is still valid
function isCacheValid(cachedAt: number): boolean {
  return Date.now() - cachedAt < CACHE_DURATION;
}

// Download and cache thumbnail
async function downloadThumbnail(
  url: string,
  cacheKey: string,
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent": "CoinKrazy-ThumbnailBot/1.0",
        Accept: "image/*",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `Failed to fetch thumbnail: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !ALLOWED_FORMATS.includes(contentType)) {
      console.error(`Invalid content type: ${contentType}`);
      return null;
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      console.error(`File too large: ${contentLength} bytes`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    if (uint8Array.length > MAX_FILE_SIZE) {
      console.error(
        `File too large after download: ${uint8Array.length} bytes`,
      );
      return null;
    }

    // Determine file extension
    const extension = getExtensionFromContentType(contentType);
    const filename = `${cacheKey}${extension}`;
    const filepath = path.join(CACHE_DIR, filename);

    // Save to cache directory
    await fs.writeFile(filepath, uint8Array);

    // Update cache metadata
    thumbnailCache[cacheKey] = {
      filename,
      cachedAt: Date.now(),
      originalUrl: url,
      size: uint8Array.length,
      contentType,
    };

    return filename;
  } catch (error) {
    console.error(`Error downloading thumbnail from ${url}:`, error);
    return null;
  }
}

// Get file extension from content type
function getExtensionFromContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

// Clean up expired cache files
async function cleanupExpiredCache() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const now = Date.now();

    for (const file of files) {
      const cacheKey = file.split(".")[0];
      const cacheEntry = thumbnailCache[cacheKey];

      if (!cacheEntry || !isCacheValid(cacheEntry.cachedAt)) {
        try {
          await fs.unlink(path.join(CACHE_DIR, file));
          delete thumbnailCache[cacheKey];
          console.log(`Cleaned up expired thumbnail: ${file}`);
        } catch (error) {
          console.error(`Failed to delete expired thumbnail ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Cache cleanup error:", error);
  }
}

// Get or fetch thumbnail
export const getThumbnail: RequestHandler = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        error: "URL parameter required",
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format",
      });
    }

    await ensureCacheDir();

    const cacheKey = generateCacheKey(url);
    const cachedEntry = thumbnailCache[cacheKey];

    // Check if we have a valid cached version
    if (cachedEntry && isCacheValid(cachedEntry.cachedAt)) {
      const cachedPath = path.join(CACHE_DIR, cachedEntry.filename);

      try {
        await fs.access(cachedPath);
        return res.json({
          success: true,
          url: `/thumbnails/${cachedEntry.filename}`,
          cached: true,
          contentType: cachedEntry.contentType,
          size: cachedEntry.size,
        });
      } catch (error) {
        // Cache file doesn't exist, remove from memory cache
        delete thumbnailCache[cacheKey];
      }
    }

    // Download and cache new thumbnail
    const filename = await downloadThumbnail(url, cacheKey);

    if (!filename) {
      return res.status(404).json({
        success: false,
        error: "Failed to fetch thumbnail",
        fallbackUrl: "/placeholder.svg",
      });
    }

    res.json({
      success: true,
      url: `/thumbnails/${filename}`,
      cached: false,
      contentType: thumbnailCache[cacheKey].contentType,
      size: thumbnailCache[cacheKey].size,
    });
  } catch (error) {
    console.error("Get thumbnail error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      fallbackUrl: "/placeholder.svg",
    });
  }
};

// Preload thumbnails for a list of games
export const preloadThumbnails: RequestHandler = async (req, res) => {
  try {
    const { urls } = req.body;

    if (!Array.isArray(urls)) {
      return res.status(400).json({
        success: false,
        error: "URLs array required",
      });
    }

    await ensureCacheDir();

    const results = await Promise.allSettled(
      urls.slice(0, 20).map(async (url: string) => {
        // Limit to 20 URLs
        try {
          new URL(url); // Validate URL
          const cacheKey = generateCacheKey(url);
          const cachedEntry = thumbnailCache[cacheKey];

          // Skip if already cached and valid
          if (cachedEntry && isCacheValid(cachedEntry.cachedAt)) {
            return {
              url,
              status: "cached",
              thumbnailUrl: `/thumbnails/${cachedEntry.filename}`,
            };
          }

          const filename = await downloadThumbnail(url, cacheKey);
          return {
            url,
            status: filename ? "downloaded" : "failed",
            thumbnailUrl: filename
              ? `/thumbnails/${filename}`
              : "/placeholder.svg",
          };
        } catch (error) {
          return {
            url,
            status: "invalid",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),
    );

    const processed = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          url: urls[index],
          status: "error",
          error: result.reason?.message || "Processing failed",
        };
      }
    });

    res.json({
      success: true,
      results: processed,
      processed: processed.length,
      successful: processed.filter(
        (r) => r.status === "downloaded" || r.status === "cached",
      ).length,
    });
  } catch (error) {
    console.error("Preload thumbnails error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get cache statistics
export const getCacheStats: RequestHandler = async (req, res) => {
  try {
    await ensureCacheDir();

    const files = await fs.readdir(CACHE_DIR);
    const stats = await Promise.all(
      files.map(async (file) => {
        const filepath = path.join(CACHE_DIR, file);
        const stat = await fs.stat(filepath);
        return {
          filename: file,
          size: stat.size,
          modified: stat.mtime,
        };
      }),
    );

    const totalSize = stats.reduce((sum, stat) => sum + stat.size, 0);
    const validCacheEntries = Object.keys(thumbnailCache).filter((key) =>
      isCacheValid(thumbnailCache[key].cachedAt),
    ).length;

    res.json({
      success: true,
      stats: {
        totalFiles: files.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        validCacheEntries,
        cacheDir: CACHE_DIR,
        maxFileSize: MAX_FILE_SIZE,
        cacheDuration: CACHE_DURATION,
      },
      files: stats,
    });
  } catch (error) {
    console.error("Get cache stats error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Clear cache
export const clearCache: RequestHandler = async (req, res) => {
  try {
    await ensureCacheDir();

    const files = await fs.readdir(CACHE_DIR);

    await Promise.all(
      files.map(async (file) => {
        const filepath = path.join(CACHE_DIR, file);
        await fs.unlink(filepath);
      }),
    );

    // Clear memory cache
    for (const key in thumbnailCache) {
      delete thumbnailCache[key];
    }

    res.json({
      success: true,
      message: `Cleared ${files.length} cached thumbnails`,
      deletedFiles: files.length,
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Serve cached thumbnails
export const serveThumbnail: RequestHandler = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename || filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({
        success: false,
        error: "Invalid filename",
      });
    }

    const filepath = path.join(CACHE_DIR, filename);

    try {
      await fs.access(filepath);

      const cacheKey = filename.split(".")[0];
      const cacheEntry = thumbnailCache[cacheKey];

      if (cacheEntry) {
        res.setHeader("Content-Type", cacheEntry.contentType);
        res.setHeader("Cache-Control", "public, max-age=604800"); // 7 days
        res.setHeader(
          "Last-Modified",
          new Date(cacheEntry.cachedAt).toUTCString(),
        );
      }

      res.sendFile(filepath);
    } catch (error) {
      res.status(404).json({
        success: false,
        error: "Thumbnail not found",
      });
    }
  } catch (error) {
    console.error("Serve thumbnail error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Schedule periodic cache cleanup
setInterval(cleanupExpiredCache, 6 * 60 * 60 * 1000); // Every 6 hours

// Initialize cache on startup
ensureCacheDir().catch(console.error);
