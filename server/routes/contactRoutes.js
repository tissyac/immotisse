const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const User = require('../models/User');
const { sendContactNotificationEmail } = require('../services/emailService');

// POST : envoyer un message de contact client
router.post('/', async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();

    let offerTitle = '';
    if (contact.offer) {
      const Offer = require('../models/Offer');
      const offer = await Offer.findById(contact.offer);
      if (offer) {
        offerTitle = offer.title;
      }
    }

    const admin = await User.findOne({ role: 'admin' });
    if (admin && admin.companyEmail) {
      await sendContactNotificationEmail(
        admin.companyEmail,
        req.body.name || 'Client',
        req.body.email || 'Non renseigné',
        req.body.message || '',
        req.body.phone || '',
        offerTitle
      );
    }

    res.send('Message envoyé à l\'administration ✅');
  } catch (error) {
    console.log(error);
    res.status(500).send('Erreur serveur');
  }
});

// GET : voir tous les messages de contact (admin)
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.log(error);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
