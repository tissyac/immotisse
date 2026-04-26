const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

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

      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('✅ Upload réussi:', fileUrl);
      res.json({
        success: true,
        fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
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
      console.log('📝 req.file:', req.file ? `${req.file.filename} (${req.file.size} bytes)` : 'UNDEFINED');
      
      if (!req.file) {
        console.log('❌ Aucun fichier reçu');
        return res.status(400).json({ 
          success: false,
          message: 'Aucun fichier sélectionné' 
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('✅ Upload réussi:', fileUrl);
      res.json({
        success: true,
        fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
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

      const files = req.files.map(file => ({
        fileUrl: `/uploads/${file.filename}`,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      }));

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
