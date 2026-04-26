const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
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
    fileSize: 100 * 1024 * 1024 // 100MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm',
      'video/3gpp',
      'video/3gp',
      'video/mpeg',
      'video/ogg'
    ];
    
    console.log(`Upload attempt: ${file.originalname}, MIME: ${file.mimetype}, Size: ${file.size}`);
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(`Type de fichier non autorisé: ${file.mimetype}. Formats acceptés : PDF, JPEG, PNG, GIF, WebP, MP4, MOV, AVI, MKV, WEBM.`);
      error.status = 400;
      cb(error);
    }
  }
});

module.exports = upload;
