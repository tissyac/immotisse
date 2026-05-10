const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { logAction } = require('../services/auditService');
const router = express.Router();
const User = require('../models/User');

// POST : login utilisateur
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('📍 Login attempt pour:', email);
    const user = await User.findOne({ companyEmail: email, status: 'approved' });
    
    if (!user) return res.status(400).json({ message: 'Email ou mot de passe invalide' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Email ou mot de passe invalide' });

    const token = jwt.sign(
      { userId: user._id, email: user.companyEmail, role: user.role, companyType: user.companyType || 'promoteur' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = {
      token,
      user: {
        userId: user._id,
        name: user.name,
        firstName: user.firstName,
        companyName: user.companyName,
        companyType: user.companyType || 'promoteur',
        role: user.role,
        status: user.status,
        companyEmail: user.companyEmail
      }
    };
    console.log('📤 Réponse envoyée:', JSON.stringify(response).substring(0, 200));
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST : vérifier le token
router.post('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
});

// GET : vérifier le token (compatibilité navigateur / GET)
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
});

// GET : obtenir l'ID de l'admin (pour la messagerie)
router.get('/admin-id', async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin non trouvé' });
    }
    res.json({ adminId: admin._id });
  } catch (error) {
    console.error('Erreur récupération admin ID:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : profil de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur récupération profil utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : mettre à jour le profil de l'utilisateur connecté
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { companyName, companyType, companyEmail, name, firstName, companyPhone, companyAddress, rcNumber, iceNumber } = req.body;
    const pendingProfile = { companyName, companyType, companyEmail, name, firstName, companyPhone, companyAddress, rcNumber, iceNumber };
    Object.keys(pendingProfile).forEach((key) => pendingProfile[key] === undefined && delete pendingProfile[key]);

    if (Object.keys(pendingProfile).length === 0) {
      return res.status(400).json({ message: 'Aucune donnée fournie pour la mise à jour du profil.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    user.pendingProfile = pendingProfile;
    user.pendingProfileStatus = 'pending';
    user.pendingProfileRequestedAt = new Date();
    await user.save();

    res.json({
      message: 'Vos modifications ont été soumises. Elles seront appliquées après approbation de l’administration.',
      pendingProfile: user.pendingProfile,
      pendingProfileStatus: user.pendingProfileStatus,
      pendingProfileRequestedAt: user.pendingProfileRequestedAt
    });
  } catch (error) {
    console.error('Erreur mise à jour profil :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST : approuver les modifications de profil d’un utilisateur (admin seulement)
router.post('/users/:id/approve-profile', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.pendingProfileStatus !== 'pending' || !user.pendingProfile) {
      return res.status(400).json({ message: 'Aucune modification de profil en attente pour cet utilisateur.' });
    }

    Object.assign(user, user.pendingProfile);
    user.pendingProfile = undefined;
    user.pendingProfileStatus = 'none';
    user.pendingProfileRequestedAt = undefined;
    await user.save();

    await logAction('approve', 'user', user._id, req.user.userId, {
      notes: 'Modification de profil approuvée'
    });

    res.json({ message: 'Modification de profil approuvée et appliquée.' });
  } catch (error) {
    console.error('Erreur approbation profil :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST : rejeter les modifications de profil d’un utilisateur (admin seulement)
router.post('/users/:id/reject-profile', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.pendingProfileStatus !== 'pending' || !user.pendingProfile) {
      return res.status(400).json({ message: 'Aucune modification de profil en attente pour cet utilisateur.' });
    }

    user.pendingProfile = undefined;
    user.pendingProfileStatus = 'none';
    user.pendingProfileRequestedAt = undefined;
    await user.save();

    await logAction('reject', 'user', user._id, req.user.userId, {
      notes: 'Modification de profil rejetée'
    });

    res.json({ message: 'Modification de profil rejetée.' });
  } catch (error) {
    console.error('Erreur rejet profil :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : supprimer le compte de l'utilisateur connecté
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Compte supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur suppression du compte :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : changer le mot de passe
router.put('/me/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Veuillez renseigner l’ancien et le nouveau mot de passe.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Mot de passe actuel invalide.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur changement mot de passe :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : liste des utilisateurs (admin seulement)
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Erreur récupération utilisateurs :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : supprimer un utilisateur (admin seulement)
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  console.log('🔴 Route DELETE /users/:id appelée pour userId:', req.params.id);
  console.log('👤 Utilisateur authentifié:', req.user);
  
  try {
    const userId = req.params.id;
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Utilisateur non trouvé:', userId);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Empêcher la suppression d'un admin
    if (user.role === 'admin') {
      console.log('🚫 Tentative de suppression d\'un admin:', user.companyName);
      return res.status(403).json({ message: 'Impossible de supprimer un compte administrateur' });
    }
    
    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId);

    // Audit log
    await logAction('delete', 'user', user._id, req.user.userId, {
      notes: `Utilisateur supprimé: ${user.companyName || user.username}`
    });
    
    console.log(`✅ Utilisateur supprimé: ${user.companyName} (${userId})`);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : nettoyer toute la base de données (admin seulement)
router.delete('/admin/clear-all-data', adminMiddleware, async (req, res) => {
  try {
    const Offer = require('../models/Offer');
    const Message = require('../models/Message');
    const Request = require('../models/Request');
    const Contact = require('../models/Contact');
    const Audit = require('../models/Audit');
    const History = require('../models/History');
    const Promotion = require('../models/Promotion');

    console.log('🔥 Suppression de toutes les données...');

    const collections = [
      { name: 'Offers', model: Offer },
      { name: 'Messages', model: Message },
      { name: 'Requests', model: Request },
      { name: 'Contacts', model: Contact },
      { name: 'Audits', model: Audit },
      { name: 'Histories', model: History },
      { name: 'Promotions', model: Promotion },
    ];

    const results = {};
    for (const col of collections) {
      const count = await col.model.countDocuments();
      if (count > 0) {
        await col.model.deleteMany({});
        results[col.name] = `${count} supprimé(s)`;
      }
    }

    console.log('✨ Base de données nettoyée:', results);
    res.json({
      message: 'Base de données nettoyée avec succès',
      cleared: results
    });
  } catch (error) {
    console.error('❌ Erreur nettoyage base de données:', error);
    res.status(500).json({ message: 'Erreur lors du nettoyage de la base de données' });
  }
});

module.exports = router;

