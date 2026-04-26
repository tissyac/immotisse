// routes/promotionRoutes.js
const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');

// GET toutes les promotions
router.get('/', async (req, res) => {
  const promotions = await Promotion.find();
  res.json(promotions);
});

// GET promotion par ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const promotion = await Promotion.findById(id);
  if (!promotion) return res.send("Promotion non trouvée ❌");
  res.json(promotion);
});

// POST : ajouter promotion
router.post('/', async (req, res) => {
  const { title, description, city, images, video, apartmentTypes, totalUnits, totalFloors, hasElevator, user } = req.body;
  const promotion = new Promotion({ title, description, city, images, video, apartmentTypes, totalUnits, totalFloors, hasElevator, user });
  await promotion.save();
  res.send("Promotion ajoutée ✅");
});

// PUT : modifier promotion (seulement propriétaire)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, ...update } = req.body;
  const promotion = await Promotion.findOne({ _id: id, user: userId });
  if (!promotion) return res.status(404).send("Promotion non trouvée ou pas autorisée ❌");
  Object.assign(promotion, update);
  await promotion.save();
  res.send("Promotion modifiée ✅");
});

// DELETE promotion (propriétaire)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const promotion = await Promotion.findOneAndDelete({ _id: id, user: userId });
  if (!promotion) return res.status(404).send("Promotion non trouvée ou pas autorisée ❌");
  res.send("Promotion supprimée ✅");
});

// GET promotions d’un user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const promotions = await Promotion.find({ user: userId });
  res.json(promotions);
});

module.exports = router;