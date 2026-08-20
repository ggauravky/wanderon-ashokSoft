import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Ensure local upload fallback directory exists
const LOCAL_UPLOAD_DIR = path.resolve('./uploads');
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

const isCloudinaryConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Configure Cloudinary SDK
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('☁️  Cloudinary SDK configured and ready.');
} else {
  console.warn('⚠️  Cloudinary credentials not set. Running in Local Fallback Upload Mode.');
}

// ─── Local Fallback Save ────────────────────────────────────────────
const saveLocalFallback = (buffer, originalName, subfolder = 'misc') => {
  const ext = path.extname(originalName) || '.bin';
  const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
  const subDir = path.join(LOCAL_UPLOAD_DIR, subfolder);
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
  const filepath = path.join(subDir, filename);
  fs.writeFileSync(filepath, buffer);
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return {
    source: 'local_fallback',
    public_id: `local/${subfolder}/${filename}`,
    secure_url: `${backendUrl}/uploads/${subfolder}/${filename}`,
    url: `${backendUrl}/uploads/${subfolder}/${filename}`,
    format: ext.replace('.', ''),
    resource_type: subfolder === 'videos' ? 'video' : 'image',
    original_filename: originalName
  };
};

// ─── Upload Image ────────────────────────────────────────────────────
export const uploadImage = async (buffer, originalName = 'image', folder = 'wanderluxe/images') => {
  if (!isCloudinaryConfigured()) {
    console.log(`[LOCAL UPLOAD] Saving image: ${originalName}`);
    return saveLocalFallback(buffer, originalName, 'images');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        transformation: [
          { quality: 'auto:good', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary Image Upload Error: ${error.message}`));
        resolve({
          source: 'cloudinary',
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          resource_type: 'image',
          original_filename: originalName
        });
      }
    );
    uploadStream.end(buffer);
  });
};

// ─── Upload Video ────────────────────────────────────────────────────
export const uploadVideo = async (buffer, originalName = 'video', folder = 'wanderluxe/videos') => {
  if (!isCloudinaryConfigured()) {
    console.log(`[LOCAL UPLOAD] Saving video: ${originalName}`);
    return saveLocalFallback(buffer, originalName, 'videos');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        chunk_size: 6000000
      },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary Video Upload Error: ${error.message}`));
        resolve({
          source: 'cloudinary',
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          format: result.format,
          duration: result.duration,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          resource_type: 'video',
          original_filename: originalName
        });
      }
    );
    uploadStream.end(buffer);
  });
};

// ─── Upload from Base64 / Data URI ──────────────────────────────────
export const uploadBase64Media = async (base64Data, folder = 'wanderluxe/misc', resourceType = 'image') => {
  if (!isCloudinaryConfigured()) {
    // Decode base64 and store locally
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    const ext = matches ? matches[1].split('/')[1] : 'bin';
    const rawBuffer = Buffer.from(matches ? matches[2] : base64Data, 'base64');
    const subfolder = resourceType === 'video' ? 'videos' : 'images';
    return saveLocalFallback(rawBuffer, `base64_upload.${ext}`, subfolder);
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Data,
      {
        folder,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true
      },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary Base64 Upload Error: ${error.message}`));
        resolve({
          source: 'cloudinary',
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          format: result.format,
          bytes: result.bytes,
          resource_type: resourceType
        });
      }
    );
  });
};

// ─── Delete Media by Public ID ───────────────────────────────────────
export const deleteMedia = async (publicId, resourceType = 'image') => {
  if (!isCloudinaryConfigured() || String(publicId).startsWith('local/')) {
    // Handle local file deletion
    const localPath = path.join(LOCAL_UPLOAD_DIR, String(publicId).replace('local/', ''));
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    return { result: 'ok', source: 'local_fallback', public_id: publicId };
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: resourceType },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary Delete Error: ${error.message}`));
        resolve({ result: result.result, public_id: publicId, source: 'cloudinary' });
      }
    );
  });
};

// ─── Generate Cloudinary Optimized Transformation URLs ──────────────
export const getOptimizedUrl = (publicId, { width, height, quality = 'auto', format = 'auto' } = {}) => {
  if (!isCloudinaryConfigured()) return publicId;
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill', gravity: 'auto', quality, fetch_format: format }
    ]
  });
};

export default { uploadImage, uploadVideo, uploadBase64Media, deleteMedia, getOptimizedUrl };
