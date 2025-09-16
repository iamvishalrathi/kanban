const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Create uploads directory if it doesn't exist
const createUploadDirs = async () => {
  const uploadDirs = [
    path.join(__dirname, '..', 'public', 'uploads'),
    path.join(__dirname, '..', 'public', 'uploads', 'avatars'),
    path.join(__dirname, '..', 'public', 'uploads', 'attachments'),
    path.join(__dirname, '..', 'public', 'uploads', 'boards')
  ];

  for (const dir of uploadDirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Initialize directories
createUploadDirs().catch(console.error);

// Configure storage for profile pictures
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// Configure storage for card attachments
const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'attachments'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

// Configure storage for board backgrounds
const boardBackgroundStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'boards'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `board-bg-${req.params.boardId || 'temp'}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// File filter for attachments
const attachmentFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/',
    'application/zip',
    'application/x-zip-compressed'
  ];

  const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
  
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed!'), false);
  }
};

// Create upload configurations
const uploadProfilePicture = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

const uploadAttachment = multer({
  storage: attachmentStorage,
  fileFilter: attachmentFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
    files: 5 // Max 5 files at once
  }
});

const uploadBoardBackground = multer({
  storage: boardBackgroundStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

// Error handling middleware
const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!' || 
      error.message === 'File type not allowed!') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

module.exports = {
  uploadProfilePicture,
  uploadAttachment,
  uploadBoardBackground,
  handleUploadErrors,
  createUploadDirs
};