const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/authMiddleware');
const { getAuditHistory } = require('../services/auditService');

// GET : audit logs avec filtres et pagination
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const filters = {};
    const paging = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    // Filtres optionnels
    if (req.query.action) filters.action = req.query.action;
    if (req.query.entity) filters.entity = req.query.entity;
    if (req.query.userId) filters.userId = req.query.userId;

    // Filtre par date
    if (req.query.startDate || req.query.endDate) {
      filters.timestamp = {};
      if (req.query.startDate) filters.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filters.timestamp.$lte = new Date(req.query.endDate);
    }

    const result = await getAuditHistory(filters, paging);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des logs' });
  }
});

// GET : statistiques d'audit
router.get('/stats/overview', adminMiddleware, async (req, res) => {
  try {
    const Audit = require('../models/Audit');
    
    const totalActions = await Audit.countDocuments();
    const actionCounts = await Audit.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);
    const entityCounts = await Audit.aggregate([
      { $group: { _id: '$entity', count: { $sum: 1 } } }
    ]);

    // Derniers 10 jours
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const recentActivity = await Audit.countDocuments({ timestamp: { $gte: tenDaysAgo } });

    res.json({
      totalActions,
      actionCounts,
      entityCounts,
      recentActivityLast10Days: recentActivity
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur' });
  }
});

module.exports = router;
