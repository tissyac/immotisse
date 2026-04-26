const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { sendMessageNotificationEmail } = require('../services/emailService');

// POST : envoyer un message (authentifié)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { recipient, subject, content, type, relatedOffer, attachments } = req.body;
    const sender = req.user.userId;

    const message = new Message({
      sender,
      recipient,
      subject,
      content,
      type,
      relatedOffer,
      attachments: attachments || []
    });

    await message.save();

    // Marquer comme délivré si le destinataire existe
    message.status = 'delivered';
    await message.save();

    const recipientUser = await User.findById(recipient);
    if (recipientUser && recipientUser.companyEmail) {
      const senderUser = await User.findById(sender);
      const senderName = senderUser ? (senderUser.companyName || `${senderUser.firstName} ${senderUser.name}`) : 'Utilisateur';
      const senderEmail = senderUser ? senderUser.companyEmail : 'N/A';
      await sendMessageNotificationEmail(
        recipientUser.companyEmail,
        senderName,
        senderEmail,
        subject,
        content.substring(0, 240)
      );
    }

    res.json({ success: true, message: 'Message envoyé avec succès' });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du message' });
  }
});

// GET : récupérer les messages reçus (authentifié)
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messages = await Message.find({ recipient: userId })
      .populate('sender', 'companyName name firstName companyEmail')
      .populate('relatedOffer', 'title')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : récupérer les messages envoyés (authentifié)
router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messages = await Message.find({ sender: userId })
      .populate('recipient', 'companyName name firstName companyEmail')
      .populate('relatedOffer', 'title')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Erreur récupération messages envoyés:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : marquer un message comme lu (authentifié)
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.userId;

    const message = await Message.findOneAndUpdate(
      { _id: messageId, recipient: userId },
      { isRead: true, status: 'read' },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    res.json({ success: true, message: 'Message marqué comme lu' });
  } catch (error) {
    console.error('Erreur marquage message lu:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : tous les messages pour admin (admin seulement)
router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('sender', 'companyName name firstName companyEmail')
      .populate('recipient', 'companyName name firstName companyEmail')
      .populate('relatedOffer', 'title')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Erreur récupération tous messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : statistiques des messages (admin)
router.get('/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ isRead: false });
    const clientMessages = await Message.countDocuments({ type: 'client_to_admin' });
    const companyMessages = await Message.countDocuments({ type: { $in: ['company_to_admin', 'admin_to_company'] } });

    res.json({
      total: totalMessages,
      unread: unreadMessages,
      clientMessages,
      companyMessages
    });
  } catch (error) {
    console.error('Erreur stats messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;