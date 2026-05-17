// routes/requestRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');
const { sendApprovalEmail, sendRequestRejectionEmail, sendExistingUserEmail } = require('../services/emailService');
const { adminMiddleware } = require('../middleware/authMiddleware');
const { logAction } = require('../services/auditService');

// POST : envoyer une demande
router.post('/', async (req, res) => {
  try {
    const { ninDocument, rcDocument } = req.body;

    // Vérifier les documents obligatoires
    if (!ninDocument) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document NIN/Passeport manquant' 
      });
    }

    if (!rcDocument) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document Registre de Commerce manquant' 
      });
    }

    console.log('📝 Nouvelle demande reçue:', {
      name: req.body.name,
      companyName: req.body.companyName,
      ninDocument: ninDocument ? '✅ présent' : '❌ manquant',
      rcDocument: rcDocument ? '✅ présent' : '❌ manquant'
    });

    const request = new Request(req.body);
    await request.save();
    
    console.log('✅ Demande sauvegardée:', request._id);
    
    res.json({ 
      success: true, 
      message: "Demande envoyée ✅",
      requestId: request._id
    });
  } catch (error) {
    console.error('❌ Erreur création demande:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur lors de l'enregistrement de la demande",
      error: error.message
    });
  }
});

// GET : voir toutes les demandes (admin)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.log(error);
    res.status(500).send("Erreur serveur");
  }
});

// POST : approuver une demande (admin)
router.post('/:id/approve', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    
    console.log('📝 Approbation demande:', { id, adminNote });
    
    const request = await Request.findById(id);
    if (!request) {
      console.error('❌ Demande non trouvée:', id);
      return res.status(404).json({ message: "Demande non trouvée" });
    }

    // Vérifier si un utilisateur existe déjà avec cet email avant de créer
    const existingUserCheck = await User.findOne({ $or: [{ companyEmail: request.companyEmail }, { username: request.companyEmail }] });
    if (existingUserCheck) {
      console.log('ℹ️ Utilisateur existe déjà, pas de création:', existingUserCheck._id);
      request.status = 'approved';
      request.adminNote = adminNote || 'Approuvée (utilisateur existant)';
      await request.save();

      // Audit log (sans crash si erreur)
      try {
        await logAction('approve', 'request', request._id, req.user?.userId || 'admin', {
          status: 'approved',
          notes: request.adminNote
        });
      } catch (auditError) {
        console.warn('⚠️  Erreur audit log (non bloquant):', auditError.message);
      }

      // Notifier l'utilisateur existant
      let emailStatus = { success: false, error: 'non envoyé' };
      try {
        console.log('📧 [approve] Appel sendExistingUserEmail pour:', existingUserCheck.companyEmail || existingUserCheck.username);
        emailStatus = await sendExistingUserEmail(existingUserCheck.companyEmail || existingUserCheck.username, existingUserCheck.username || existingUserCheck.companyEmail, request.companyName);
        console.log('📧 [approve] Résultat sendExistingUserEmail:', emailStatus);
      } catch (emailError) {
        console.error('⚠️  [approve] Erreur email existing user notification:', emailError.message, emailError);
        emailStatus = { success: false, error: emailError.message };
      }

      return res.json({
        success: true,
        message: 'Demande approuvée — utilisateur existant',
        username: existingUserCheck.username || existingUserCheck.companyEmail,
        emailStatus
      });
    }

    const generatedPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const user = new User({
      username: request.companyEmail,
      password: hashedPassword,
      name: request.name,
      firstName: request.firstName || '',
      birthDate: request.birthDate,
      birthPlace: request.birthPlace,
      nin: request.nin ? String(request.nin) : '',
      ninDocument: request.ninDocument,
      phone: request.phone,
      companyName: request.companyName,
      companyType: request.companyType || 'promoteur',
      companyAddress: request.companyAddress,
      companyLocation: request.companyLocation,
      companyPhone: request.companyPhone,
      companyEmail: request.companyEmail,
      rcNumber: request.rcNumber ? String(request.rcNumber) : '',
      rcDocument: request.rcDocument,
      hasAgreement: request.hasAgreement,
      status: 'approved'
    });

    try {
      await user.save();
      console.log('✅ Utilisateur créé:', user._id);

      request.status = 'approved';
      request.adminNote = adminNote || 'Approuvée par l\'administration';
      await request.save();
      console.log('✅ Demande approuvée');
    } catch (saveError) {
      // Gérer les erreurs de clef dupliquée (utilisateur déjà existant)
      console.error('⚠️ Erreur création utilisateur:', saveError.message);
      if (saveError.code === 11000) {
        // Trouver l'utilisateur existant et continuer
        const existingUser = await User.findOne({ companyEmail: request.companyEmail }) || await User.findOne({ username: request.companyEmail });
        if (existingUser) {
          console.log('ℹ️ Utilisateur existe déjà:', existingUser._id);
          request.status = 'approved';
          request.adminNote = adminNote || 'Approuvée (utilisateur existant)';
          await request.save();
          console.log('✅ Demande approuvée (utilisateur existant)');

          // Ne pas exposer de mot de passe, indiquer que l'utilisateur existe
          return res.json({
            success: true,
            message: 'Demande approuvée — utilisateur existant',
            username: existingUser.username || existingUser.companyEmail,
            note: 'L\'utilisateur existait déjà, aucun nouveau compte créé.'
          });
        }
      }

      // Si autre erreur, la renvoyer
      console.error('❌ Impossible de créer l\'utilisateur:', saveError);
      return res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'utilisateur', error: saveError.message });
    }

    // Audit log (sans crash si erreur)
    try {
      await logAction('approve', 'request', request._id, req.user?.userId || 'admin', {
        status: 'approved',
        notes: request.adminNote
      });
      console.log('✅ Audit log enregistré');
    } catch (auditError) {
      console.warn('⚠️  Erreur audit log (non bloquant):', auditError.message);
    }

    // Envoyer un email (sans crash si erreur)
    let emailStatus = { success: false, error: 'non envoyé' };
    try {
      console.log('📧 [approve] Appel sendApprovalEmail pour:', request.companyEmail);
      emailStatus = await sendApprovalEmail(request.companyEmail, request.companyEmail, generatedPassword, request.companyName);
      console.log('📧 [approve] Résultat sendApprovalEmail:', emailStatus);
    } catch (emailError) {
      console.error('⚠️  [approve] Erreur email approbation:', emailError.message, emailError);
      emailStatus = { success: false, error: emailError.message };
    }

    res.json({
      success: true,
      message: "Demande approuvée et utilisateur créé",
      username: request.companyEmail,
      password: generatedPassword,
      emailStatus: emailStatus
    });

  } catch (error) {
    console.error('❌ Erreur approbation:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors de l'approbation", 
      error: error.message || 'Erreur interne' 
    });
  }
});

// POST : refuser une demande (admin)
router.post('/:id/reject', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    
    console.log('📝 Rejet demande:', { id, adminNote });
    
    const request = await Request.findById(id);
    if (!request) {
      console.error('❌ Demande non trouvée:', id);
      return res.status(404).json({ message: "Demande non trouvée" });
    }

    request.status = 'rejected';
    request.adminNote = adminNote || 'Rejetée par l\'administration';
    await request.save();
    console.log('✅ Demande rejetée');

    // Audit log (sans crash si erreur)
    try {
      await logAction('reject', 'request', request._id, req.user?.userId || 'admin', {
        status: 'rejected',
        notes: request.adminNote
      });
      console.log('✅ Audit log enregistré');
    } catch (auditError) {
      console.warn('⚠️  Erreur audit log (non bloquant):', auditError.message);
    }

    // Envoyer un email (sans crash si erreur)
    let emailStatus = { success: false, error: 'non envoyé' };
    try {
      emailStatus = await sendRequestRejectionEmail(request.companyEmail, request.companyName, request.adminNote);
      console.log('✅ Email rejet résultat:', emailStatus);
    } catch (emailError) {
      console.error('⚠️  Erreur email rejet:', emailError.message);
      emailStatus = { success: false, error: emailError.message };
    }
    
    res.json({ 
      success: true,
      message: "Demande refusée",
      request: request,
      emailStatus: emailStatus
    });
  } catch (error) {
    console.error('❌ Erreur rejet:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors du rejet", 
      error: error.message || 'Erreur interne' 
    });
  }
});

module.exports = router;