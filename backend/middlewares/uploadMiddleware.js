import multer from 'multer';

// Use memory storage so we can pipe buffers to Cloudinary directly
const storage = multer.memoryStorage();

// Image MIME type validator
const imageFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, AVIF, SVG`), false);
  }
};

// Video MIME type validator
const videoFilter = (req, file, cb) => {
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/mpeg'];
  if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid video type: ${file.mimetype}. Allowed: MP4, WebM, MOV, AVI, MKV`), false);
  }
};

// Combined image + video MIME type validator
const mediaFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/mpeg'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

// Single image upload (max 10 MB)
export const uploadSingleImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).single('image');

// Multiple images upload (max 10 files, 10 MB each)
export const uploadMultipleImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).array('images', 10);

// Single video upload (max 100 MB)
export const uploadSingleVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
}).single('video');

// Combined media (image or video), single file
export const uploadSingleMedia = multer({
  storage,
  fileFilter: mediaFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
}).single('media');

// Multer error handler middleware
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Images max 10MB, Videos max 100MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};
