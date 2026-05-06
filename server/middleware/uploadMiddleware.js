const multer = require('multer');
const path = require('path');

const fs = require('fs');
const uploadDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 1024 * 1024 * 1024 // 1GB max for videos
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Check by extension for more flexibility
    const allowedExtensions = [
      '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', 
      '.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v',
      '.3gp', '.3g2', '.mpg', '.mpeg', '.ogv', '.ogg', '.mts', '.m2ts'
    ];
    
    const allowedMimes = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'video/x-matroska', 'video/webm', 'video/3gpp', 'video/3gp',
      'video/mpeg', 'video/ogg', 'video/x-m4v', 'video/x-ms-wmv',
      'application/octet-stream' // Fallback for misidentified types
    ];
    
    console.log(`Upload attempt: ${file.originalname}, Extension: ${ext}, MIME: ${file.mimetype}, Size: ${file.size}`);
    
    // Check extension
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(`Type de fichier non autorisé: ${ext || file.mimetype}. Formats acceptés: PDF, Images (JPG, PNG, GIF, WebP), Vidéos (MP4, MOV, AVI, MKV, WebM, OGV, 3GP).`);
      error.status = 400;
      cb(error);
    }
  }
});

module.exports = upload;
