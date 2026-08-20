import { uploadImage, uploadVideo, uploadBase64Media, deleteMedia } from '../utils/cloudinaryService.js';

// @desc    Upload single or multiple images to Cloudinary
// @route   POST /api/upload/image
// @access  Private
export const uploadImageController = async (req, res) => {
  try {
    // Support single file (req.file) or multiple files (req.files)
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No image file(s) provided.' });
    }

    const folder = req.body.folder || 'wanderluxe/images';
    const results = [];

    for (const file of files) {
      const result = await uploadImage(file.buffer, file.originalname, folder);
      results.push(result);
    }

    const response = results.length === 1 ? results[0] : results;

    console.log(`✅ Image(s) uploaded: ${results.map(r => r.secure_url || r.url).join(', ')}`);

    res.status(201).json({
      success: true,
      message: `${results.length} image(s) uploaded successfully.`,
      data: response
    });
  } catch (error) {
    console.error('Image Upload Error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload image(s)' });
  }
};

// @desc    Upload single video to Cloudinary
// @route   POST /api/upload/video
// @access  Private
export const uploadVideoController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided.' });
    }

    const folder = req.body.folder || 'wanderluxe/videos';
    const result = await uploadVideo(req.file.buffer, req.file.originalname, folder);

    console.log(`✅ Video uploaded: ${result.secure_url || result.url}`);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully.',
      data: result
    });
  } catch (error) {
    console.error('Video Upload Error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload video' });
  }
};

// @desc    Upload media as base64 / data URI string
// @route   POST /api/upload/base64
// @access  Private
export const uploadBase64Controller = async (req, res) => {
  try {
    const { base64Data, folder, resourceType } = req.body;

    if (!base64Data) {
      return res.status(400).json({ message: 'base64Data field is required.' });
    }

    const result = await uploadBase64Media(
      base64Data,
      folder || 'wanderluxe/misc',
      resourceType || 'image'
    );

    console.log(`✅ Base64 media uploaded: ${result.secure_url || result.url}`);

    res.status(201).json({
      success: true,
      message: 'Media uploaded successfully.',
      data: result
    });
  } catch (error) {
    console.error('Base64 Upload Error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload media' });
  }
};

// @desc    Delete Cloudinary or local media asset by public ID
// @route   DELETE /api/upload/media
// @access  Private/Admin
export const deleteMediaController = async (req, res) => {
  try {
    const { publicId, resourceType } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'publicId is required to delete media.' });
    }

    const result = await deleteMedia(publicId, resourceType || 'image');

    console.log(`🗑️  Media deleted: ${publicId}`);

    res.json({
      success: true,
      message: 'Media asset deleted successfully.',
      data: result
    });
  } catch (error) {
    console.error('Delete Media Error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete media' });
  }
};
