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
 * Upload a single image to Cloudinary
 * @param fileBuffer - Buffer of the image
 * @param folder - Cloudinary folder name
 * @returns {Promise<{ url: string, publicId: string }>} - Image URL & Public ID
 */
export const uploadSingleImage = async (
  fileBuffer: Buffer,
  folder: string = 'khata'
): Promise<{ url: string; publicId: string }> => {
  // Validate Cloudinary configuration
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    const missing = [];
    if (!config.cloudinary.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!config.cloudinary.apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!config.cloudinary.apiSecret) missing.push('CLOUDINARY_API_SECRET');
    throw new Error(`Cloudinary configuration missing: ${missing.join(', ')}. Please check your .env file.`);
  }

  // Validate buffer
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Invalid file buffer: buffer is empty or null');
  }

  console.log('Uploading to Cloudinary:', {
    cloudName: config.cloudinary.cloudName,
    folder: `evenly/${folder}`,
    bufferSize: fileBuffer.length,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `evenly/${folder}` },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
          });
          return reject(new Error(`Cloudinary upload failed: ${error.message} (HTTP ${error.http_code || 'N/A'})`));
        }
        
        if (!result || !result.secure_url) {
          console.error('Cloudinary upload returned invalid result:', result);
          return reject(new Error('Cloudinary upload failed: Invalid response from Cloudinary'));
        }

        console.log('Cloudinary upload successful:', {
          url: result.secure_url,
          publicId: result.public_id,
        });

        resolve({
          url: result.secure_url,
          publicId: result.public_id || '',
        });
      }
    );
    
    // Handle stream errors
    stream.on('error', (streamError) => {
      console.error('Cloudinary stream error:', streamError);
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
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

