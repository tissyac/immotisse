require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkAdmin() {
  try {
    console.log('🔍 Vérification de l\'admin...\n');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    // Connexion MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');

    // Récupérer l'admin
    const admin = await User.findOne({ companyEmail: 'admin@immotiss.com' });
    
    if (!admin) {
      console.log('❌ ERREUR: Aucun admin trouvé avec email: admin@immotiss.com');
      process.exit(1);
    }

    console.log('📋 ENREGISTREMENT COMPLET DE L\'ADMIN:');
    console.log('═══════════════════════════════════════');
    console.log('ID:', admin._id);
    console.log('Prénom:', admin.firstName);
    console.log('Nom:', admin.name);
    console.log('Email:', admin.companyEmail);
    console.log('Status:', admin.status);
    console.log('Role:', admin.role);
    console.log('RoleType:', typeof admin.role);
    console.log('');
    
    // Vérifier chaque champ
    console.log('✅ Champs requis:');
    console.log('  - firstName:', admin.firstName ? '✅' : '❌');
    console.log('  - name:', admin.name ? '✅' : '❌');
    console.log('  - companyEmail:', admin.companyEmail ? '✅' : '❌');
    console.log('  - status:', admin.status ? `✅ (${admin.status})` : '❌');
    console.log('  - role:', admin.role ? `✅ (${admin.role})` : '❌ MANQUANT!');
    console.log('  - password:', admin.password ? '✅ (haché)' : '❌');
    console.log('');

    // Afficher l'objet brut
    console.log('📦 Objet JSON complet:');
    console.log(JSON.stringify(admin.toObject(), null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    process.exit(1);
  }
}

checkAdmin();
