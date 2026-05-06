const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Offer = require('./models/Offer');
const Message = require('./models/Message');
const User = require('./models/User');
const Request = require('./models/Request');
const Contact = require('./models/Contact');
const Audit = require('./models/Audit');
const History = require('./models/History');
const Promotion = require('./models/Promotion');

async function clearDatabase() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/immotisse';
    console.log('📍 URL:', mongoUrl);
    
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB\n');

    console.log('📋 Suppression des données...\n');

    // Delete all data
    const collections = [
      { name: 'Offers', model: Offer },
      { name: 'Messages', model: Message },
      { name: 'Users', model: User },
      { name: 'Requests', model: Request },
      { name: 'Contacts', model: Contact },
      { name: 'Audits', model: Audit },
      { name: 'Histories', model: History },
      { name: 'Promotions', model: Promotion },
    ];

    let totalDeleted = 0;
    for (const col of collections) {
      const count = await col.model.countDocuments();
      if (count > 0) {
        await col.model.deleteMany({});
        console.log(`  ✓ ${col.name.padEnd(15)}: ${count} document(s) supprimé(s)`);
        totalDeleted += count;
      } else {
        console.log(`  - ${col.name.padEnd(15)}: aucun document`);
      }
    }

    console.log('\n✨ Base de données vidée avec succès !');
    console.log(`📊 Total: ${totalDeleted} document(s) supprimé(s)\n`);
    
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la suppression:', err.message);
    process.exit(1);
  }
}

clearDatabase();
