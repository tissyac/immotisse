const express = require('express');
const cloudinary = require('cloudinary').v2;
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sign', authMiddleware, (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({ message: 'Cloudinary n\'est pas configuré correctement.' });
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = {
      timestamp,
      folder: 'immotisse-uploads',
      resource_type: 'auto'
    };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

    res.json({
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      timestamp,
      signature,
      folder: 'immotisse-uploads',
      resourceType: 'auto'
    });
  } catch (error) {
    console.error('Erreur signature Cloudinary :', error);
    res.status(500).json({ message: 'Impossible de générer la signature Cloudinary.' });
  }
});

module.exports = router;
