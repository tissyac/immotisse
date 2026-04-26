const mongoose = require('mongoose');
require('dotenv').config();

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://immotiss:immotiss@ac-vghjhak-shard-00-00.y1f6snf.mongodb.net:27017,ac-vghjhak-shard-00-01.y1f6snf.mongodb.net:27017,ac-vghjhak-shard-00-02.y1f6snf.mongodb.net:27017/?ssl=true&replicaSet=atlas-686yp3-shard-0&authSource=admin&appName=Cluster0")
  .then(async () => {
    console.log("MongoDB connecté ✅");
    
    const db = mongoose.connection;
    
    try {
      // Supprimer toutes les offres
      const result = await db.collection('offers').deleteMany({});
      console.log(`✅ ${result.deletedCount} offres supprimées`);
      
      process.exit(0);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error("Erreur de connexion MongoDB:", err);
    process.exit(1);
  });
