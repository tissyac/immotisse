const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { adminMiddleware } = require('../middleware/authMiddleware');
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
      { userId: user._id, email: user.companyEmail, role: user.role },
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

module.exports = router;

