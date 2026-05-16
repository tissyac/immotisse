const express = require('express');
const cloudinary = require('cloudinary').v2;
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sign', authMiddleware, (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName) {
    return res.status(500).json({ message: 'Cloudinary n\'est pas configuré correctement. CLOUDINARY_CLOUD_NAME manquant.' });
  }

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ message: 'Cloudinary n\'est pas configuré correctement. CLOUDINARY_API_KEY ou CLOUDINARY_API_SECRET manquant.' });
  }

  const allowedResourceTypes = ['auto', 'image', 'video'];
  const requestedResourceType = (req.query.resourceType || 'auto').toLowerCase();
  if (!allowedResourceTypes.includes(requestedResourceType)) {
    return res.status(400).json({ message: 'ResourceType Cloudinary non valide.' });
  }

  const resourceType = requestedResourceType;

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = {
      folder: 'immotisse-uploads',
      timestamp
    };
    if (resourceType !== 'auto') {
      paramsToSign.resource_type = resourceType;
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    res.json({
      apiKey,
      cloudName,
      timestamp,
      signature,
      folder: 'immotisse-uploads',
      resourceType,
      unsigned: false
    });
  } catch (error) {
    console.error('Erreur signature Cloudinary :', error);
    res.status(500).json({ message: 'Impossible de générer la signature Cloudinary.' });
  }
});

module.exports = router;
