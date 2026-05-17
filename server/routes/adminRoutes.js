const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/authMiddleware');
const { sendTestEmail, initEmailService } = require('../services/emailService');

// GET /admin/diagnose - Diagnostic des variables email
router.get('/diagnose', adminMiddleware, async (req, res) => {
  try {
    // Vérifier les variables d'environnement
    const hasSMTPUSER = !!process.env.SMTP_USER;
    const hasSMTPPASS = !!process.env.SMTP_PASS;
    const smtpService = process.env.SMTP_SERVICE || 'gmail';
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT || 587;

    // Ré-initialiser le service email
    initEmailService();

    res.json({
      status: 'diagnostic',
      variables: {
        SMTP_USER: hasSMTPUSER ? `${process.env.SMTP_USER?.substring(0, 5)}...` : '❌ manquant',
        SMTP_USER_FULL: process.env.SMTP_USER || 'UNDEFINED',
        SMTP_PASS: hasSMTPPASS ? '✅ présent' : '❌ manquant',
        SMTP_SERVICE: smtpService,
        SMTP_HOST: smtpHost,
        SMTP_PORT: smtpPort
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur /admin/diagnose:', error);
    res.status(500).json({ success: false, message: 'Erreur diagnostic', error: error.message });
  }
});

// POST /admin/test-email { email }
router.post('/test-email', adminMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email manquant' });

    const result = await sendTestEmail(email);
    if (!result.success) return res.status(500).json({ success: false, message: 'Envoi échoué', error: result.error });

    res.json({ success: true, message: 'Email de test envoyé', messageId: result.messageId });
  } catch (error) {
    console.error('❌ Erreur /admin/test-email:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
