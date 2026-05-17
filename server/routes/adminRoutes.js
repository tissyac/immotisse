const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/authMiddleware');
const { sendTestEmail } = require('../services/emailService');

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
