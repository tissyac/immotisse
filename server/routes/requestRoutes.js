// routes/requestRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');
const { sendApprovalEmail, sendRequestRejectionEmail } = require('../services/emailService');
const { adminMiddleware } = require('../middleware/authMiddleware');

// POST : envoyer une demande
router.post('/', async (req, res) => {
  try {
    const request = new Request(req.body);
    await request.save();
    res.send("Demande envoyée ✅");
  } catch (error) {
    console.log(error);
    res.status(500).send("Erreur serveur");
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
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: "Demande non trouvée" });

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
      companyAddress: request.companyAddress,
      companyLocation: request.companyLocation,
      companyPhone: request.companyPhone,
      companyEmail: request.companyEmail,
      rcNumber: request.rcNumber ? String(request.rcNumber) : '',
      rcDocument: request.rcDocument,
      hasAgreement: request.hasAgreement,
      status: 'approved'
    });

    await user.save();
    request.status = 'approved';
    request.adminNote = adminNote || 'Approuvée par l\'administration';
    await request.save();

    // Envoyer un email
    const emailResult = await sendApprovalEmail(request.companyEmail, request.companyEmail, generatedPassword, request.companyName);
    if (!emailResult.success) {
      console.error('Erreur email approbation :', emailResult.error);
    }

    res.json({
      message: "Demande approuvée et email envoyé",
      username: request.companyEmail,
      password: generatedPassword,
      emailStatus: emailResult
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message || 'Erreur interne' });
  }
});

// POST : refuser une demande (admin)
router.post('/:id/reject', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: "Demande non trouvée" });

    request.status = 'rejected';
    request.adminNote = adminNote || 'Rejetée par l\'administration';
    await request.save();

    const emailResult = await sendRequestRejectionEmail(request.companyEmail, request.companyName, request.adminNote);
    if (!emailResult.success) {
      console.error('Erreur email rejet :', emailResult.error);
    }
    
    res.json({ 
      message: "Demande refusée",
      request: request,
      emailStatus: emailResult
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message || 'Erreur interne' });
  }
});

module.exports = router;