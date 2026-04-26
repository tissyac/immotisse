const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function fixAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://immotiss:immotiss@ac-vghjhak-shard-00-00.y1f6snf.mongodb.net:27017,ac-vghjhak-shard-00-01.y1f6snf.mongodb.net:27017,ac-vghjhak-shard-00-02.y1f6snf.mongodb.net:27017/?ssl=true&replicaSet=atlas-686yp3-shard-0&authSource=admin&appName=Cluster0");
    console.log('✅ MongoDB connecté');

    // Créer/mettre à jour l'utilisateur admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await User.findOneAndUpdate(
      { companyEmail: 'admin@immotiss.com' },
      {
        name: 'Admin',
        firstName: 'System',
        companyName: 'Admin Panel',
        companyEmail: 'admin@immotiss.com',
        password: hashedPassword,
        phone: '+212612345678',
        nin: '123456789012345678',
        ninDocument: 'nin.pdf',
        rcNumber: '01/02RC',
        rcDocument: 'rc.pdf',
        companyAddress: '123 Admin Street',
        companyLocation: 'Admin Office',
        companyPhone: '+212612345678',
        birthDate: new Date('1990-01-01'),
        birthPlace: 'Maroc',
        username: 'admin',
        role: 'admin',
        status: 'approved'
      },
      { upsert: true, new: true, returnDocument: 'after' }
    );

    console.log('\n✅ ADMIN FIXÉ!');
    console.log('═══════════════════════════════════════');
    console.log('  Email: admin@immotiss.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('  Status: approved');
    console.log('═══════════════════════════════════════\n');

    // Vérifier
    const checkAdmin = await User.findOne({ companyEmail: 'admin@immotiss.com' });
    console.log('✅ Vérification: role =', checkAdmin.role);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixAdmin();
