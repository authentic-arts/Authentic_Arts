import { supabase } from '../lib/supabase.js';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Formats byte size to human-readable string (KB or MB)
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(2)} MB`;
}

/**
 * Validates whether the given file is an allowed image under the size limit
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a JPEG, PNG, WEBP, or GIF image.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${formatFileSize(file.size)}). Maximum allowed size is 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Gets image natural dimensions (width x height)
 */
export function getImageDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

/**
 * Optimizes/resizes large images on the client side before upload using HTML Canvas.
 * Keeps aspect ratio intact and downscales ultra-high-resolution images (e.g. 4000px+)
 * to save bandwidth, storage quota, and ensure fast load times.
 */
export async function optimizeImage(file, { maxWidth = 2048, maxHeight = 2048, quality = 0.88 } = {}) {
  // Do not modify GIFs (preserves animation) or SVGs
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // If image is already within acceptable dimensions and under 2MB, don't recompress
      if (width <= maxWidth && height <= maxHeight && file.size <= 2 * 1024 * 1024) {
        resolve(file);
        return;
      }

      // Calculate scaled dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output MIME type: prefer webp if original was webp or png, otherwise jpeg
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If optimization didn't reduce size, keep original
            resolve(file);
          } else {
            const optimizedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original
    };

    img.src = objectUrl;
  });
}

/**
 * Converts a File to Base64 Data URL (used as fallback if storage bucket is unavailable)
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an artwork image file to Supabase Storage.
 *
 * @param {File} file - The image file to upload.
 * @param {string} userId - ID of the authenticated artist/user.
 * @returns {Promise<{ url: string, fallback?: boolean, warning?: string, error?: string }>}
 */
export async function uploadArtworkImage(file, userId) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Client-side optimization
  let fileToUpload = file;
  try {
    fileToUpload = await optimizeImage(file);
  } catch (optErr) {
    console.warn('Image optimization skipped:', optErr);
  }

  // Generate safe unique storage path
  const timestamp = Date.now();
  const sanitizedName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '_')
    .replace(/_+/g, '_');
  const filePath = `${userId || 'common'}/${timestamp}_${sanitizedName}`;

  try {
    // Attempt upload to Supabase Storage bucket 'artworks'
    const { data, error } = await supabase.storage
      .from('artworks')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileToUpload.type,
      });

    if (error) {
      console.warn('Supabase Storage upload warning:', error.message);

      // Check if bucket not found or permissions issue
      const isBucketError =
        error.message?.toLowerCase().includes('bucket not found') ||
        error.message?.toLowerCase().includes('not found') ||
        error.statusCode === '404' ||
        error.status === 404;

      if (isBucketError) {
        console.info(
          'Storage bucket "artworks" not created yet in Supabase. Using optimized local fallback. Run migration 007 in your Supabase SQL editor to enable cloud storage.'
        );
        const dataUrl = await fileToDataUrl(fileToUpload);
        return {
          url: dataUrl,
          fallback: true,
          warning:
            'Notice: Image saved locally for preview/demo because the "artworks" Supabase storage bucket has not been initialized yet. Run migration 007_storage_artworks_bucket.sql in your Supabase SQL Editor.',
        };
      }

      throw new Error(`Upload failed: ${error.message}`);
    }

    // Retrieve public CDN URL
    const { data: urlData } = supabase.storage
      .from('artworks')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Could not retrieve public URL for uploaded artwork.');
    }

    return {
      url: urlData.publicUrl,
      fallback: false,
      error: null,
    };
  } catch (err) {
    console.error('uploadArtworkImage error:', err);

    // If bucket issue or network error, fallback to data URL to not break user workflow
    if (
      err.message?.toLowerCase().includes('bucket not found') ||
      err.message?.toLowerCase().includes('storage') ||
      err.message?.toLowerCase().includes('policy')
    ) {
      const dataUrl = await fileToDataUrl(fileToUpload);
      return {
        url: dataUrl,
        fallback: true,
        warning:
          'Image was saved locally as fallback. To enable permanent cloud hosting, run migration 007_storage_artworks_bucket.sql in your Supabase SQL Editor.',
      };
    }

    throw err;
  }
}
