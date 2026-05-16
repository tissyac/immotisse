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
    const crypto = require('crypto');
    const timestamp = Math.round(Date.now() / 1000);
    
    // Créer les paramètres à signer (dans l'ordre alphabétique)
    // NOTE: resource_type est dans l'URL (/video/upload), pas dans le formulaire
    const paramsToSign = {
      folder: 'immotisse-uploads',
      timestamp: timestamp.toString()
    };

    // Créer la string à signer : paramètres en ordre alphabétique + clé secrète
    const sortedKeys = Object.keys(paramsToSign).sort();
    const paramString = sortedKeys.map(key => `${key}=${paramsToSign[key]}`).join('&');
    const stringToSign = `${paramString}${apiSecret}`;
    
    // Calculer la signature SHA-1
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    // DEBUG: Log pour vérifier la signature
    console.log('📋 DEBUG Signature Cloudinary:');
    console.log('  - paramsToSign:', paramsToSign);
    console.log('  - sortedKeys:', sortedKeys);
    console.log('  - stringToSign (sans secret):', paramString);
    console.log('  - signature:', signature);
    console.log('  - resourceType envoyé:', resourceType);

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

// Endpoint pour signatures avancées (utilisé par Cloudinary Upload Widget)
router.post('/sign', authMiddleware, express.json(), (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ message: 'Cloudinary non configuré correctement.' });
  }

  try {
    const crypto = require('crypto');

    // Le widget envoie les params à signer (params_to_sign). Nous acceptons
    // un objet avec les clés/valeurs nécessaires. Exemple: { source: 'uw', timestamp: '...', folder: '...' }
    const incoming = req.body || {};
    const paramsToSign = incoming.params || incoming;

    // Filtrer les clés vides et s'assurer que les valeurs sont des chaînes
    const filtered = {};
    Object.keys(paramsToSign || {}).forEach((k) => {
      const v = paramsToSign[k];
      if (v !== undefined && v !== null && String(v) !== '') filtered[k] = String(v);
    });

    // Si aucun param fourni, refuse
    if (Object.keys(filtered).length === 0) {
      return res.status(400).json({ message: 'Aucun paramètre à signer fourni.' });
    }

    // Construire la string à signer (paramètres en ordre alphabétique)
    const sortedKeys = Object.keys(filtered).sort();
    const paramString = sortedKeys.map((key) => `${key}=${filtered[key]}`).join('&');
    const stringToSign = `${paramString}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    console.log('🔐 Widget signature request:', { filtered, paramString, signature });

    res.json({
      apiKey,
      cloudName,
      signature,
      upload_params: {
        folder: filtered.folder || 'immotisse-uploads'
      }
    });
  } catch (error) {
    console.error('Erreur signature Cloudinary (POST):', error);
    res.status(500).json({ message: 'Impossible de générer la signature Cloudinary.' });
  }
});

module.exports = router;
