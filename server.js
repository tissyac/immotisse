const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const promotionRoutes = require('./routes/promotionRoutes');
const requestRoutes = require('./routes/requestRoutes');
const offerRoutes = require('./routes/offerRoutes');
const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const auditRoutes = require('./routes/auditRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { initEmailService } = require('./services/emailService');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialiser le service email
initEmailService();

// Servir les fichiers uploadés
app.use('/uploads', express.static('uploads'));

// connexion MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://immotiss:immotiss@ac-vghjhak-shard-00-00.y1f6snf.mongodb.net:27017,ac-vghjhak-shard-00-01.y1f6snf.mongodb.net:27017,ac-vghjhak-shard-00-02.y1f6snf.mongodb.net:27017/?ssl=true&replicaSet=atlas-686yp3-shard-0&authSource=admin&appName=Cluster0")
.then(() => console.log("MongoDB connecté ✅"))
.catch(err => console.log(err));

// route test
app.get('/', (req, res) => {
  res.json({ message: 'Serveur backend fonctionne 🚀' });
});

app.use('/promotions', promotionRoutes);
app.use('/offers', offerRoutes);
app.use('/auth', authRoutes);
app.use('/contacts', contactRoutes);
app.use('/requests', requestRoutes);
app.use('/upload', uploadRoutes);
app.use('/audit', auditRoutes);
app.use('/messages', messageRoutes);

// lancement serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

