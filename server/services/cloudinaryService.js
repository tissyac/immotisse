const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage pour les fichiers
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'immotisse-uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf'],
    resource_type: 'auto'
  }
});

const upload = multer({ storage: storage });

module.exports = {
  cloudinary,
  upload
};