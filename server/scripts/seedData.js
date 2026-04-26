const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Offer = require('../models/Offer');

async function seedData() {
  try {
    // Connexion MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://immotiss:immotiss@ac-vghjhak-shard-00-00.y1f6snf.mongodb.net:27017,ac-vghjhak-shard-00-01.y1f6snf.mongodb.net:27017,ac-vghjhak-shard-00-02.y1f6snf.mongodb.net:27017/?ssl=true&replicaSet=atlas-686yp3-shard-0&authSource=admin&appName=Cluster0");
    console.log('✅ MongoDB connecté');

    // 1️⃣ CRÉER COMPTE ADMIN
    console.log('\n📝 Création du compte admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await User.findOneAndUpdate(
      { companyEmail: 'admin@immotiss.com' },
      {
        name: 'Admin',
        firstName: 'System',
        companyName: 'Admin Panel',
        companyEmail: 'admin@immotiss.com',
        password: hashedPassword,
        phone: '+212612345678',
        NIN: '123456789012345678',
        role: 'admin',
        status: 'approved'
      },
      { upsert: true, new: true }
    );
    console.log('✅ Admin créé:', adminUser.companyEmail);
    console.log('   Email: admin@immotiss.com');
    console.log('   Mot de passe: admin123');

    // 2️⃣ CRÉER DES OFFRES DE TEST
    console.log('\n📝 Création des offres de test...');

    const offres = [
      {
        user: adminUser._id,
        mainCategory: 'promotion',
        subCategory: 'maison',
        title: 'Promotion Casablanca - 50 villas modernes',
        description: 'Projet immobilier de prestige avec villas climatisées, piscine, parking privé. Localisation privilégiée près du centre-ville. Accès direct à la plage, commerces, écoles et hôpitaux à proximité.',
        address: 'Boulevard de la Corniche',
        city: 'Casablanca',
        area: 350,
        price: 2500000,
        paymentTerms: 'Versements échelonnés (10% acompte, solde sur 5 ans)',
        apartmentTypes: ['Villa 3 chambres', 'Villa 4 chambres', 'Villa 5 chambres'],
        propertyType: 'Villa',
        elevator: true,
        parking: true,
        floor: 0,
        projectStatus: 'en_construction',
        finishingState: 'semi_fini',
        availability: 'livraison_date',
        deliveryDate: new Date('2026-10-31'),
        equipment: ['climatisation', 'piscine', 'jardin', 'cuisine équipée'],
        images: [
          'https://via.placeholder.com/800x600?text=Villa+Facade',
          'https://via.placeholder.com/800x600?text=Villa+Salon',
          'https://via.placeholder.com/800x600?text=Villa+Chambre'
        ],
        videos: [
          'https://www.w3schools.com/html/mov_bbb.mp4',
          'https://www.w3schools.com/html/mov_bbb.mp4'
        ],
        status: 'approved',
        isPublished: true
      },
      {
        user: adminUser._id,
        mainCategory: 'promotion',
        subCategory: 'courte_duree',
        title: 'Immeuble de bureaux - Quartier financier',
        description: 'Immeuble neuf 8 étages avec 2 ascenseurs, parkings sous-terrain, espace restauration. Bâtiment classé HQE, certifié durable et écologique. Grandes baies vitrées avec vue panoramique.',
        address: 'Avenue Mohammed VI',
        city: 'Rabat',
        area: 5000,
        price: 45000000,
        paymentTerms: 'Financement possible (70% crédit bancaire)',
        apartmentTypes: ['Bureau 50m²', 'Bureau 100m²', 'Suite 150m²'],
        propertyType: 'Immeuble commercial',
        elevator: true,
        parking: true,
        floor: 0,
        projectStatus: 'pret_livraison',
        finishingState: 'fini',
        availability: 'immediatement',
        equipment: ['climatisation', 'sécurité 24/24', 'internet haut débit'],
        images: [
          'https://via.placeholder.com/800x600?text=Bureau+Facade',
          'https://via.placeholder.com/800x600?text=Bureau+Interieur'
        ],
        videos: [
          'https://www.w3schools.com/html/mov_bbb.mp4'
        ],
        status: 'approved',
        isPublished: true
      },
      {
        user: adminUser._id,
        mainCategory: 'vente',
        subCategory: 'terrain',
        title: 'Terrain constructible à Marrakech',
        description: 'Magnifique terrain constructible en plein centre-ville de Marrakech. Idéal pour projet immobilier ou investissement. Terrain plat avec accès facile.',
        address: 'Route de l\'Ourika, Gueliz',
        city: 'Marrakech',
        area: 500,
        price: 1500000,
        access: 'Accès bitumé depuis la route principale',
        viabilise: true,
        images: [
          'https://via.placeholder.com/800x600?text=Terrain+Marrakech',
          'https://via.placeholder.com/800x600?text=Terrain+Vue'
        ],
        videos: [
          'https://www.w3schools.com/html/mov_bbb.mp4'
        ],
        status: 'approved',
        isPublished: true
      },
      {
        user: adminUser._id,
        mainCategory: 'vente',
        subCategory: 'maison',
        title: 'Villa moderne à Casablanca',
        description: 'Belle villa de 4 chambres avec jardin privatif. Construction récente, matériaux de qualité. Quartier résidentiel calme et sécurisé.',
        address: 'Boulevard de la Corniche',
        city: 'Casablanca',
        area: 250,
        price: 3200000,
        propertyType: 'Villa individuelle',
        finishingState: 'fini',
        images: [
          'https://via.placeholder.com/800x600?text=Villa+Facade',
          'https://via.placeholder.com/800x600?text=Villa+Salon',
          'https://via.placeholder.com/800x600?text=Villa+Jardin'
        ],
        videos: [
          'https://www.w3schools.com/html/mov_bbb.mp4'
        ],
        status: 'approved',
        isPublished: true
      },
      {
        user: adminUser._id,
        mainCategory: 'vente',
        subCategory: 'locaux_commerciaux',
        title: 'Local commercial centre-ville Rabat',
        description: 'Local commercial de 120m² en plein centre-ville. Idéal pour commerce de détail ou bureau. Excellente visibilité et fréquentation.',
        address: 'Avenue Mohammed V',
        city: 'Rabat',
        area: 120,
        price: 2800000,
        facadeCount: 2,
        finishingState: 'semi_fini',
        images: [
          'https://via.placeholder.com/800x600?text=Local+Commercial',
          'https://via.placeholder.com/800x600?text=Local+Interieur'
        ],
        videos: [
          'https://www.w3schools.com/html/mov_bbb.mp4'
        ],
        status: 'approved',
        isPublished: true
      },
      {
        user: adminUser._id,
        mainCategory: 'location',
        subCategory: 'courte_duree',
        title: 'Appartement meublé centre-ville Fès',
        description: 'T3 confortable, entièrement équipé. Proche des commerces et attractions touristiques. Rues piétonnes célèbres à 2 min à pied.',
        address: 'Rue des Almoravides',
        city: 'Fès',
        area: 85,
        price: 1500,
        paymentTerms: 'Par nuit',
        apartmentTypes: ['T3 (3 pièces)'],
        propertyType: 'Appartement',
        elevator: false,
        parking: true,
        floor: 2,
        projectStatus: 'conception',
        finishingState: 'fini',
        availability: 'immediatement',
        equipment: ['wifi', 'climatisation', 'cuisine équipée', 'balcon', 'salle de bain privée', 'linge de lit'],
        availabilityCalendar: [
          { startDate: new Date('2026-04-15'), endDate: new Date('2026-04-20') },
          { startDate: new Date('2026-04-22'), endDate: new Date('2026-05-05') },
          { startDate: new Date('2026-05-10'), endDate: new Date('2026-06-30') }
        ],
        images: [
          'https://via.placeholder.com/800x600?text=Appart+Salon',
          'https://via.placeholder.com/800x600?text=Appart+Chambre'
        ],
        videos: [
          'https://www.w3schools.com/html/mov_bbb.mp4'
        ],
        status: 'approved',
        isPublished: true
      },
      {
        user: adminUser._id,
        mainCategory: 'location',
        subCategory: 'longue_duree',
        title: 'Studio étudiant - Agadir',
        description: 'Petit studio moderne idéal pour étudiant. Meublé, internet inclus.',
        address: 'Avenue Hassan II',
        city: 'Agadir',
        area: 35,
        price: 2000,
        paymentTerms: 'Par mois',
        propertyType: 'Studio',
        furnished: true,
        advance: '3 mois de loyer',
        elevator: true,
        parking: false,
        floor: 3,
        images: ['https://via.placeholder.com/600x400?text=Studio+Agadir'],
        status: 'approved',
        isPublished: true
      },
      {
        user: adminUser._id,
        mainCategory: 'promotion',
        subCategory: 'terrain',
        title: 'Terrains constructibles Tanger',
        description: '10 terrains de 500m² chacun. Zone bien desservie avec tous les services.',
        address: 'Zone Périphérique Nord',
        city: 'Tanger',
        area: 500,
        price: 850000,
        paymentTerms: 'Versements trimestriels',
        propertyType: 'Terrain',
        elevator: false,
        parking: false,
        floor: 0,
        equipment: ['électricité', 'eau', 'route d\'accès'],
        images: ['https://via.placeholder.com/600x400?text=Terrain+Tanger'],
        status: 'approved',
        isPublished: true
      }
    ];

    // Supprimer les anciennes offres de test
    await Offer.deleteMany({ user: adminUser._id });

    // Insérer les nouvelles offres
    const createdOffers = await Offer.insertMany(offres);
    console.log(`✅ ${createdOffers.length} offres créées avec succès!`);

    createdOffers.forEach((offer, idx) => {
      console.log(`   ${idx + 1}. ${offer.title} - ${offer.city}`);
    });

    console.log('\n✅ DONNÉES DE TEST IMPORTÉES AVEC SUCCÈS!\n');
    console.log('═══════════════════════════════════════════');
    console.log('ACCÈS ADMIN:');
    console.log('  Email: admin@immotiss.com');
    console.log('  Password: admin123');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seedData();
