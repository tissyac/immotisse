const express = require('express');
const cloudinary = require('cloudinary').v2;
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sign', authMiddleware, (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  console.log('Cloudinary config check:', {
    cloudName: cloudName ? 'SET' : 'MISSING',
    apiKey: apiKey ? 'SET' : 'MISSING',
    apiSecret: apiSecret ? 'SET' : 'MISSING',
    uploadPreset: uploadPreset || 'NOT_SET'
  });

  if (!cloudName) {
    return res.status(500).json({ message: 'Cloudinary n\'est pas configuré correctement. CLOUDINARY_CLOUD_NAME manquant.' });
  }

  // Priorité à l'upload signé pour plus de sécurité et de contrôle
  if (!apiKey || !apiSecret) {
    return res.status(500).json({ message: 'Cloudinary n\'est pas configuré correctement. CLOUDINARY_API_KEY ou CLOUDINARY_API_SECRET manquant.' });
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = {
      folder: 'immotisse-uploads',
      resource_type: 'auto',
      timestamp
    };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    res.json({
      apiKey,
      cloudName,
      timestamp,
      signature,
      folder: 'immotisse-uploads',
      resourceType: 'auto',
      unsigned: false
    });
  } catch (error) {
    console.error('Erreur signature Cloudinary :', error);
    res.status(500).json({ message: 'Impossible de générer la signature Cloudinary.' });
  }
});

module.exports = router;
