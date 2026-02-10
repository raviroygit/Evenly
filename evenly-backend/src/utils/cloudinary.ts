import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { config } from '../config/config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Validate image file type and size
 * @param fileBuffer - Buffer of the image
 * @param mimetype - MIME type of the file
 * @returns {boolean} - True if valid, throws error otherwise
 */
const validateImageFile = (fileBuffer: Buffer, mimetype?: string): void => {
  // Validate buffer
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Invalid file: buffer is empty or null');
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (fileBuffer.length > maxSize) {
    throw new Error(`File too large: maximum size is 10MB, got ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
  }

  // Supported image formats
  const supportedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ];

  // Check mimetype if provided
  if (mimetype) {
    const isSupported = supportedMimeTypes.includes(mimetype.toLowerCase());
    if (!isSupported) {
      throw new Error(
        `Unsupported image format: ${mimetype}. Supported formats: JPEG, PNG, GIF, WebP, BMP, SVG. ` +
        `Note: HEIC/HEIF images (iPhone photos) need to be converted to JPEG first.`
      );
    }
  }

  // Validate file signature (magic numbers) for common formats
  const fileSignature = fileBuffer.slice(0, 12).toString('hex');

  const validSignatures = [
    'ffd8ff',      // JPEG
    '89504e47',    // PNG
    '47494638',    // GIF
    '52494646',    // WebP (RIFF)
    '424d',        // BMP
    '3c3f786d6c',  // SVG (<?xml)
    '3c737667',    // SVG (<svg)
  ];

  const isValidSignature = validSignatures.some(sig => fileSignature.startsWith(sig));

  if (!isValidSignature) {
    throw new Error(
      'Invalid image file: file signature not recognized. ' +
      'Please ensure you are uploading a valid image file (JPEG, PNG, GIF, WebP, BMP, or SVG).'
    );
  }
};

/**
 * Upload a single image to Cloudinary
 * @param fileBuffer - Buffer of the image
 * @param folder - Cloudinary folder name
 * @param mimetype - Optional MIME type for validation
 * @returns {Promise<{ url: string, publicId: string }>} - Image URL & Public ID
 */
export const uploadSingleImage = async (
  fileBuffer: Buffer,
  folder: string = 'khata',
  mimetype?: string
): Promise<{ url: string; publicId: string }> => {
  // Validate Cloudinary configuration
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    const missing = [];
    if (!config.cloudinary.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!config.cloudinary.apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!config.cloudinary.apiSecret) missing.push('CLOUDINARY_API_SECRET');
    throw new Error(`Cloudinary configuration missing: ${missing.join(', ')}. Please check your .env file.`);
  }

  // Validate image file
  try {
    validateImageFile(fileBuffer, mimetype);
    console.log(`[Cloudinary] Validation passed - File size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB, MIME: ${mimetype || 'unknown'}`);
  } catch (validationError: any) {
    console.error('[Cloudinary] Validation failed:', validationError.message);
    throw validationError;
  }

  console.log('[Cloudinary] Starting upload to folder:', folder);


  return new Promise((resolve, reject) => {
    // Set a timeout for the upload (60 seconds)
    const uploadTimeout = setTimeout(() => {
      reject(new Error('Cloudinary upload timeout: Upload took longer than 60 seconds'));
    }, 60000);

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `evenly/${folder}`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
        timeout: 60000, // 60 second timeout for Cloudinary API
      },
      (error, result) => {
        clearTimeout(uploadTimeout); // Clear timeout on completion

        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message} (HTTP ${error.http_code || 'N/A'})`));
        }

        if (!result || !result.secure_url) {
          return reject(new Error('Cloudinary upload failed: Invalid response from Cloudinary'));
        }

        console.log('[Cloudinary] Image uploaded successfully:', result.secure_url);

        resolve({
          url: result.secure_url,
          publicId: result.public_id || '',
        });
      }
    );

    // Handle stream errors
    stream.on('error', (streamError) => {
      clearTimeout(uploadTimeout);
      reject(new Error(`Cloudinary stream error: ${streamError.message}`));
    });

    Readable.from(fileBuffer).pipe(stream);
  });
};

/**
 * Upload multiple images to Cloudinary
 * @param fileBuffers - Array of image buffers
 * @param folder - Cloudinary folder name
 * @returns {Promise<{ url: string, publicId: string }[]>} - Array of image URLs
 */
export const uploadMultipleImages = async (
  fileBuffers: Buffer[],
  folder: string = 'khata'
): Promise<{ url: string; publicId: string }[]> => {
  return Promise.all(
    fileBuffers.map((buffer) => uploadSingleImage(buffer, folder))
  );
};

/**
 * Delete an image from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns {Promise<boolean>} - True if deleted, false otherwise
 */
export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    return false;
  }
};

