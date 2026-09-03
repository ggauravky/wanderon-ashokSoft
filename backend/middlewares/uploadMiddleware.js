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

// Document / Ticket MIME & extension validator (PDF + standard images)
const documentFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  
  const ext = (file.originalname || '').toLowerCase().split('.').pop();
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid document type (${file.mimetype}). Allowed formats: PDF, JPG, PNG, WEBP.`), false);
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

// Single document/ticket upload (PDF or Image, max 20 MB)
export const uploadSingleDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
}).single('document');

// Multiple documents/tickets upload (max 10 files, 20 MB each)
export const uploadMultipleDocuments = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
}).array('documents', 10);

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
      return res.status(400).json({ message: 'File too large. Images max 10MB, Documents max 20MB, Videos max 100MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};
