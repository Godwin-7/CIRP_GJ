// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
};

// General storage configuration with enhanced logging
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '..', 'uploads', destination);
      ensureDirectoryExists(uploadPath);
      console.log(`File destination set to: ${uploadPath}`);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      console.log(`Generated filename: ${uniqueName} for original: ${file.originalname}`);
      cb(null, uniqueName);
    }
  });
};

// Enhanced file filters with better error messages
const imageFilter = (req, file, cb) => {
  console.log(`Checking image file: ${file.originalname}, mimetype: ${file.mimetype}`);
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error(`Only image files are allowed. Received: ${file.mimetype}`), false);
  }
};

const pdfFilter = (req, file, cb) => {
  console.log(`Checking PDF file: ${file.originalname}, mimetype: ${file.mimetype}`);
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error(`Only PDF files are allowed. Received: ${file.mimetype}`), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  console.log(`Checking document file: ${file.originalname}, mimetype: ${file.mimetype}`);
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Only PDF, DOC, and DOCX files are allowed. Received: ${file.mimetype}`), false);
  }
};

// Domain image upload
exports.uploadDomainImage = multer({
  storage: createStorage('domains'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('image');

// Enhanced idea files upload with better field handling
exports.uploadIdeaFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath;
      
      if (file.fieldname === 'projectImage' || file.fieldname === 'additionalImages') {
        uploadPath = path.join(__dirname, '..', 'uploads', 'ideas');
      } else if (file.fieldname === 'projectPdf') {
        uploadPath = path.join(__dirname, '..', 'uploads', 'pdfs');
      } else {
        uploadPath = path.join(__dirname, '..', 'uploads', 'ideas');
      }
      
      ensureDirectoryExists(uploadPath);
      console.log(`Idea file destination for ${file.fieldname}: ${uploadPath}`);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      console.log(`Generated idea filename: ${uniqueName} for field: ${file.fieldname}`);
      cb(null, uniqueName);
    }
  }),
  fileFilter: (req, file, cb) => {
    console.log(`Processing idea file: ${file.fieldname}, ${file.originalname}`);
    
    if (file.fieldname === 'projectImage' || file.fieldname === 'additionalImages') {
      imageFilter(req, file, cb);
    } else if (file.fieldname === 'projectPdf') {
      pdfFilter(req, file, cb);
    } else {
      console.log(`Unknown field name: ${file.fieldname}, allowing through`);
      cb(null, true);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Maximum 10 files
  }
}).fields([
  { name: 'projectImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 5 },
  { name: 'projectPdf', maxCount: 1 }
]);

// FIXED: Enhanced author image upload to handle multiple field names
exports.uploadAuthorImage = multer({
  storage: createStorage('authors'),
  fileFilter: (req, file, cb) => {
    console.log(`Processing author file: ${file.fieldname}, ${file.originalname}, mimetype: ${file.mimetype}`);
    
    // Accept both profileImage and authorPhoto field names
    if (file.fieldname === 'profileImage' || file.fieldname === 'authorPhoto') {
      imageFilter(req, file, cb);
    } else {
      console.log(`Unexpected author field name: ${file.fieldname}`);
      cb(new Error(`Unexpected field name for author upload: ${file.fieldname}`), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'authorPhoto', maxCount: 1 }
]);

// Comment files upload
exports.uploadCommentFiles = multer({
  storage: createStorage('comments'),
  fileFilter: (req, file, cb) => {
    console.log(`Processing comment file: ${file.originalname}, mimetype: ${file.mimetype}`);
    
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error(`Only images and PDF files are allowed for comments. Received: ${file.mimetype}`), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3 // Maximum 3 files per comment
  }
}).array('attachments', 3);

// User profile image upload
exports.uploadUserProfileImage = multer({
  storage: createStorage('users'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
}).single('profileImage');

// Enhanced error handling middleware with detailed logging
exports.handleUploadErrors = (error, req, res, next) => {
  console.error('Upload error details:', {
    errorType: error.constructor.name,
    message: error.message,
    code: error.code,
    field: error.field,
    files: req.files ? Object.keys(req.files) : 'none',
    file: req.file ? req.file.fieldname : 'none'
  });
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 5MB for images and 10MB for documents.',
          error: 'FILE_TOO_LARGE'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files uploaded. Check the file limits for each field.',
          error: 'TOO_MANY_FILES'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: `Unexpected field name: ${error.field}. Please check your form field names.`,
          error: 'UNEXPECTED_FIELD'
        });
      
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many parts in multipart form.',
          error: 'TOO_MANY_PARTS'
        });
      
      case 'LIMIT_FIELD_KEY':
        return res.status(400).json({
          success: false,
          message: 'Field name too long.',
          error: 'FIELD_NAME_TOO_LONG'
        });
      
      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({
          success: false,
          message: 'Field value too long.',
          error: 'FIELD_VALUE_TOO_LONG'
        });
      
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many fields in form.',
          error: 'TOO_MANY_FIELDS'
        });
      
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`,
          error: 'UPLOAD_ERROR'
        });
    }
  }
  
  // Handle custom file filter errors
  if (error && error.message) {
    if (error.message.includes('Only') && error.message.includes('files are allowed')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INVALID_FILE_TYPE'
      });
    }
    
    if (error.message.includes('Unexpected field name')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'UNEXPECTED_FIELD_NAME'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `File upload error: ${error.message}`,
      error: 'UPLOAD_ERROR'
    });
  }
  
  // Pass other errors to the next error handler
  console.error('Unhandled upload error:', error);
  next(error);
};

// Utility function to clean up uploaded files on error
exports.cleanupUploadedFiles = (req) => {
  const filesToCleanup = [];
  
  if (req.file) {
    filesToCleanup.push(req.file.path);
  }
  
  if (req.files) {
    if (Array.isArray(req.files)) {
      filesToCleanup.push(...req.files.map(file => file.path));
    } else {
      Object.values(req.files).forEach(fileArray => {
        if (Array.isArray(fileArray)) {
          filesToCleanup.push(...fileArray.map(file => file.path));
        }
      });
    }
  }
  
  filesToCleanup.forEach(filepath => {
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
        console.log(`Cleaned up file: ${filepath}`);
      } catch (error) {
        console.error(`Failed to cleanup file ${filepath}:`, error.message);
      }
    }
  });
  
  return filesToCleanup.length;
};