const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

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
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));

// Initialiser le service email
initEmailService();

const fs = require('fs');
const uploadStaticDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadStaticDir)) {
  fs.mkdirSync(uploadStaticDir, { recursive: true });
}

// Servir les fichiers uploadés
app.use('/uploads', express.static(uploadStaticDir));

// connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
const FALLBACK_URI = process.env.FALLBACK_MONGODB_URI || 'mongodb://127.0.0.1:27017/immotisse';

const connectMongo = async () => {
  try {
    await mongoose.connect(MONGODB_URI || FALLBACK_URI);
    console.log('MongoDB connecté ✅');
  } catch (primaryError) {
    console.warn('Connexion MongoDB principale échouée :', primaryError.message);
    if (MONGODB_URI && MONGODB_URI !== FALLBACK_URI) {
      try {
        console.log('Tentative de connexion à MongoDB local...');
        await mongoose.connect(FALLBACK_URI);
        console.log('MongoDB local connecté ✅');
      } catch (fallbackError) {
        console.error('Échec de la connexion locale MongoDB :', fallbackError.message);
        process.exit(1);
      }
    } else {
      console.error('Aucune URI MongoDB valide trouvée.');
      process.exit(1);
    }
  }
};

connectMongo();

app.use('/promotions', promotionRoutes);
app.use('/offers', offerRoutes);
app.use('/auth', authRoutes);
app.use('/contacts', contactRoutes);
app.use('/requests', requestRoutes);
app.use('/upload', uploadRoutes);
app.use('/audit', auditRoutes);
app.use('/messages', messageRoutes);

// Servir le frontend construit si disponible
const clientBuildPath = path.resolve(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// route de statut de l'API
app.get('/api/status', (req, res) => {
  res.json({ message: 'Serveur backend fonctionne 🚀' });
});

// lancement serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

