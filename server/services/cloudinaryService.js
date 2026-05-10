const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Vérifier si Cloudinary est configuré
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET;

console.log(`☁️  Cloudinary ${isCloudinaryConfigured ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ⚠️ (utilisant fallback local)'}`);

let upload;

if (isCloudinaryConfigured) {
  // Storage Cloudinary
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'immotisse-uploads',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'webm'],
      resource_type: 'auto'
    }
  });
  upload = multer({ storage: storage });
  console.log('📤 Upload: Cloudinary');
} else {
  // Fallback: Storage local
  const uploadDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000000);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${timestamp}-${randomNum}${ext}`);
    }
  });

  upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 500 } // 500MB
  });
  console.log('📤 Upload: Système de fichiers local');
}

module.exports = {
  cloudinary,
  upload,
  isCloudinaryConfigured
};