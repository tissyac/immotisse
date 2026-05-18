const express = require('express');
const cors = require('cors');
const router = express.Router();
const { upload, isCloudinaryConfigured } = require('../services/cloudinaryService');
const { authMiddleware } = require('../middleware/authMiddleware');

const corsOptions = {
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Origin', 'X-Requested-With', 'Accept']
};

router.options('/upload', cors(corsOptions));
router.options('/uploadPublic', cors(corsOptions));
router.options('/uploadMultiple', cors(corsOptions));

// POST : upload un fichier (authentifié)
router.post('/upload', authMiddleware, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('❌ Upload error:', err.message);
      return res.status(400).json({ 
        success: false,
        message: err.message || 'Erreur lors du traitement du fichier'
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'Aucun fichier sélectionné' 
        });
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;
      let fileUrl = '';
      
      if (isCloudinaryConfigured) {
        // Get Cloudinary URL from multiple possible fields
        fileUrl = req.file.path || req.file.location || req.file.secure_url || req.file.url;
        
        // Ensure protocol is included
        if (fileUrl && !fileUrl.startsWith('http')) {
          fileUrl = `https://${fileUrl}`;
        }
        
        console.log('☁️  Cloudinary upload:', {
          path: req.file.path,
          location: req.file.location,
          secure_url: req.file.secure_url,
          final_url: fileUrl
        });
      } else {
        fileUrl = `${baseUrl}/uploads/${req.file.filename}`; // Local storage
        console.log('📁 Local storage upload:', fileUrl);
      }
      
      console.log('✅ Upload réussi:', fileUrl);
      res.json({
        success: true,
        fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        public_id: req.file.filename // Pour suppression future si besoin
      });
    } catch (error) {
      console.error('❌ Handler error:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Erreur lors de l\'upload' 
      });
    }
  });
});

// POST : upload un fichier SANS authentification (pour inscription)
router.post('/uploadPublic', (req, res) => {
  console.log('\n📨 === REQUÊTE /uploadPublic reçue ===');
  
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('❌ MULTER ERROR:', err.message);
      return res.status(400).json({ 
        success: false,
        message: err.message || 'Erreur lors du traitement du fichier'
      });
    }

    try {
      console.log('📝 req.file complet:', JSON.stringify(req.file, null, 2));
      
      if (!req.file) {
        console.log('❌ Aucun fichier reçu');
        return res.status(400).json({ 
          success: false,
          message: 'Aucun fichier sélectionné' 
        });
      }

      // Déterminer l'URL du fichier
      let fileUrl = '';
      
      if (isCloudinaryConfigured) {
        // Avec Cloudinary, récupérer l'URL depuis la réponse
        // multer-storage-cloudinary stocke l'URL dans req.file.path ou req.file.location
        fileUrl = req.file.path || req.file.location || req.file.url;
        
        console.log('☁️  Cloudinary response:', {
          path: req.file.path,
          location: req.file.location,
          url: req.file.url,
          secure_url: req.file.secure_url,
          filename: req.file.filename,
          final_url: fileUrl,
          full_file_object: Object.keys(req.file)
        });
        
        // Cloudinary sometimes returns without protocol, ensure it's https
        if (fileUrl && !fileUrl.startsWith('http')) {
          fileUrl = `https://${fileUrl}`;
          console.log('🔧 Fixed Cloudinary URL with https protocol');
        }
      } else {
        // Local storage
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const baseUrl = `${protocol}://${host}`;
        fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
        
        console.log('📁 Local storage:', fileUrl);
      }

      if (!fileUrl) {
        console.error('❌ ERREUR: Impossible de déterminer l\'URL du fichier');
        return res.status(500).json({ 
          success: false,
          message: 'Impossible de traiter le fichier'
        });
      }

      console.log('✅ Upload réussi:', fileUrl);
      res.json({
        success: true,
        fileUrl,
        filename: req.file.filename || req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        public_id: req.file.filename || req.file.public_id
      });
    } catch (error) {
      console.error('❌ Handler error:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Erreur lors de l\'upload' 
      });
    }
  });
});

// POST : upload plusieurs fichiers (authentifié)
router.post('/uploadMultiple', authMiddleware, (req, res) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      console.error('❌ Upload error:', err.message);
      return res.status(400).json({ 
        success: false,
        message: err.message || 'Erreur lors du traitement des fichiers'
      });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Aucun fichier sélectionné' 
        });
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;
      const files = req.files.map(file => {
        let fileUrl = '';
        if (isCloudinaryConfigured) {
          fileUrl = file.path || file.location || file.secure_url || file.url;
          // Ensure protocol is included
          if (fileUrl && !fileUrl.startsWith('http')) {
            fileUrl = `https://${fileUrl}`;
          }
        } else {
          fileUrl = `${baseUrl}/uploads/${file.filename}`; // Local storage
        }
        
        return {
          fileUrl,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          public_id: file.filename // Pour suppression future si besoin
        };
      });

      console.log(`✅ ${files.length} fichiers uploadés`);
      res.json({
        success: true,
        files,
        count: files.length
      });
    } catch (error) {
      console.error('❌ Handler error:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Erreur lors de l\'upload' 
      });
    }
  });
});

module.exports = router;
