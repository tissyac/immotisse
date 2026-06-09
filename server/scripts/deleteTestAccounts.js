const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function deleteTestAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://immotiss:immotiss@ac-vghjhak-shard-00-00.y1f6snf.mongodb.net:27017,ac-vghjhak-shard-00-01.y1f6snf.mongodb.net:27017,ac-vghjhak-shard-00-02.y1f6snf.mongodb.net:27017/?ssl=true&replicaSet=atlas-686yp3-shard-0&authSource=admin&appName=Cluster0");
    console.log('✅ MongoDB connecté');

    // Récupérer le compte admin
    const admin = await User.findOne({ companyEmail: 'admin@immotiss.com' });
    
    if (!admin) {
      console.log('❌ Compte admin non trouvé!');
      process.exit(1);
    }

    console.log('\n📋 Comptes actuels:');
    const allUsers = await User.find({});
    console.log(`   Total: ${allUsers.length} comptes`);
    console.log(`   Admin: ${admin.companyName} (${admin.companyEmail})`);

    // Supprimer tous les comptes sauf l'admin
    const result = await User.deleteMany({ _id: { $ne: admin._id } });

    console.log('\n✅ SUPPRESSION EFFECTUÉE');
    console.log('═══════════════════════════════════════');
    console.log(`  Comptes supprimés: ${result.deletedCount}`);
    console.log(`  Compte conservé: admin@immotiss.com`);
    console.log('═══════════════════════════════════════\n');

    // Vérification finale
    const finalCount = await User.countDocuments();
    console.log(`✅ Vérification: ${finalCount} compte(s) restant(s)\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

deleteTestAccounts();
