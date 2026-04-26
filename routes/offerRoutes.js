const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const History = require('../models/History');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { logAction } = require('../services/auditService');
const { sendOfferApprovalEmail, sendOfferRejectionEmail } = require('../services/emailService');
const User = require('../models/User');

// GET toutes les offres approuvées (public) - avec pagination et filtres avancés
router.get('/', async (req, res) => {
  try {
    const filters = { status: 'approved', isPublished: true };
    
    // Filtres catégories
    if (req.query.mainCategory) filters.mainCategory = req.query.mainCategory;
    if (req.query.subCategory) filters.subCategory = req.query.subCategory;
    
    // Filtres localisation
    if (req.query.city) filters.city = new RegExp(req.query.city, 'i');
    if (req.query.address) filters.address = new RegExp(req.query.address, 'i');
    
    // Filtres prix
    if (req.query.minPrice || req.query.maxPrice) {
      filters.price = {};
      if (req.query.minPrice) filters.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filters.price.$lte = Number(req.query.maxPrice);
    }
    
    // Filtres surface
    if (req.query.minArea || req.query.maxArea) {
      filters.area = {};
      if (req.query.minArea) filters.area.$gte = Number(req.query.minArea);
      if (req.query.maxArea) filters.area.$lte = Number(req.query.maxArea);
    }
    
    // Filtres équipements
    if (req.query.elevator === 'true') filters.elevator = true;
    if (req.query.parking === 'true') filters.parking = true;
    
    // Recherche texte
    if (req.query.search) {
      filters.$or = [
        { title: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    // Tri
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };
    
    const offers = await Offer.find(filters)
      .populate('user', 'companyName companyEmail companyPhone')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Offer.countDocuments(filters);
    
    res.json({
      offers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET toutes les offres (admin) - avec pagination et filtres
router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.mainCategory) filters.mainCategory = req.query.mainCategory;
    if (req.query.user) filters.user = req.query.user;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const offers = await Offer.find(filters)
      .populate('user', 'companyName companyEmail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Offer.countDocuments(filters);
    
    res.json({
      offers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : statistiques simples (admin)
router.get('/admin/stats/overview', adminMiddleware, async (req, res) => {
  try {
    const totalOffers = await Offer.countDocuments();
    const approvedOffers = await Offer.countDocuments({ status: 'approved' });
    const pendingOffers = await Offer.countDocuments({ status: 'pending' });
    const rejectedOffers = await Offer.countDocuments({ status: 'rejected' });
    const byCategory = await Offer.aggregate([
      { $group: { _id: '$mainCategory', count: { $sum: 1 } } }
    ]);
    res.json({ totalOffers, approvedOffers, pendingOffers, rejectedOffers, byCategory });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET offres d'un utilisateur (avec pagination)
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    // Vérifier que l'utilisateur ne voit que ses propres offres (sauf admin)
    if (req.user.userId !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const offers = await Offer.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Offer.countDocuments({ user: req.params.userId });
    
    res.json({
      offers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET offre par ID
router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('user', 'companyName companyEmail');
    if (!offer) return res.status(404).send('Offre non trouvée');
    res.json(offer);
  } catch (error) {
    console.log(error);
    res.status(500).send('Erreur serveur');
  }
});

// POST : créer une offre (status pending ou brouillon, authentification requise)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const isDraft = Boolean(req.body.isDraft);
    const changeable = req.body.changeable === true || req.body.changeable === 'true';
    const viabilise = req.body.viabilise === true || req.body.viabilise === 'true';

    console.log('📝 CRÉATION OFFRE - Données reçues:');
    console.log('changeable (avant):', req.body.changeable, 'type:', typeof req.body.changeable);
    console.log('changeable (après normalisation):', changeable);
    console.log('viabilise (avant):', req.body.viabilise, 'type:', typeof req.body.viabilise);
    console.log('viabilise (après normalisation):', viabilise);

    const offer = new Offer({
      ...req.body,
      viabilise,
      changeable,
      user: req.user.userId,
      status: 'pending',
      isPublished: false,
      isDraft
    });

    console.log('✅ OFFRE CRÉÉE:');
    console.log('offer.changeable avant save:', offer.changeable);
    console.log('offer.viabilise avant save:', offer.viabilise);

    await offer.save();

    console.log('💾 APRÈS SAVE:');
    console.log('offer.changeable:', offer.changeable);
    console.log('offer.viabilise:', offer.viabilise);

    res.json({
      message: isDraft ? 'Offre enregistrée en brouillon' : 'Offre créée et en attente de validation',
      offerId: offer._id
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : modifier une offre par son propriétaire ou par l'admin
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updates = { ...req.body };
    updates.changeable = req.body.changeable === true || req.body.changeable === 'true';
    updates.viabilise = req.body.viabilise === true || req.body.viabilise === 'true';

    const offer = req.user.role === 'admin'
      ? await Offer.findById(req.params.id)
      : await Offer.findOne({ _id: req.params.id, user: req.user.userId });

    if (!offer) return res.status(404).json({ message: 'Offre non trouvée ou non autorisée' });

    // L'admin peut modifier une offre avant validation
    Object.assign(offer, updates);
    offer.isDraft = Boolean(updates.isDraft);
    offer.isPublished = false;
    if (!offer.isDraft) {
      offer.status = 'pending';
    }
    await offer.save();
    res.json({ message: offer.isDraft ? 'Offre mise à jour en brouillon' : 'Offre mise à jour et en attente de validation' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : supprimer une offre par son propriétaire
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const offer = await Offer.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    if (!offer) return res.status(404).json({ message: 'Offre non trouvée ou non autorisée' });
    res.json({ message: 'Offre supprimée' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST : approuver une offre (admin)
router.post('/:id/approve', adminMiddleware, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('user');
    if (!offer) return res.status(404).json({ message: 'Offre non trouvée' });
    
    const oldStatus = offer.status;
    offer.status = 'approved';
    offer.isPublished = true;
    offer.adminNote = req.body.adminNote || '';
    await offer.save();
    
    // Créer un historique
    await History.create({
      offer: offer._id,
      status: 'approved',
      previousStatus: oldStatus,
      changedBy: req.user.userId,
      reason: req.body.adminNote
    });
    
    // Audit log
    await logAction('approve', 'offer', offer._id, req.user.userId, {
      status: 'approved',
      notes: req.body.adminNote
    });
    
    // Envoyer un email au promoteur
    if (offer.user && offer.user.companyEmail) {
      await sendOfferApprovalEmail(
        offer.user.companyEmail,
        offer.user.companyName,
        offer.title
      );
    }
    
    res.json({ message: 'Offre validée et publiée' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST : rejeter une offre (admin)
router.post('/:id/reject', adminMiddleware, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('user');
    if (!offer) return res.status(404).json({ message: 'Offre non trouvée' });
    
    const oldStatus = offer.status;
    offer.status = 'rejected';
    offer.isPublished = false;
    offer.adminNote = req.body.adminNote || '';
    await offer.save();
    
    // Créer un historique
    await History.create({
      offer: offer._id,
      status: 'rejected',
      previousStatus: oldStatus,
      changedBy: req.user.userId,
      reason: req.body.adminNote
    });
    
    // Audit log
    await logAction('reject', 'offer', offer._id, req.user.userId, {
      status: 'rejected',
      notes: req.body.adminNote
    });
    
    // Envoyer un email au promoteur
    if (offer.user && offer.user.companyEmail) {
      await sendOfferRejectionEmail(
        offer.user.companyEmail,
        offer.user.companyName,
        offer.title,
        req.body.adminNote
      );
    }
    
    res.json({ message: 'Offre rejetée' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET: historique d'une offre
router.get('/:id/history', authMiddleware, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offre non trouvée' });
    
    // Vérifier l'accès (propriétaire ou admin)
    if (offer.user.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    const history = await History.find({ offer: req.params.id })
      .populate('changedBy', 'companyName')
      .sort({ timestamp: -1 });
    
    res.json(history);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
