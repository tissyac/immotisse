# 📍 Fonctionnalités Location - Documentation

## Vue d'ensemble

Le système immobilier propose deux types de location avec des champs et fonctionnalités distincts:

### 1️⃣ **Location Longue Durée**
Annonces classiques de location résidentielle ou commerciale long terme.

#### Champs disponibles:
- 📝 Description
- 📍 Adresse
- 📐 Superficie (m²)
- 🏠 Type de bien (Studio, T2, T3, etc.)
- 🛏️ État (Meublé / Non meublé)
- 💳 Loyer mensuel (en MAD)
- 💰 Avances requises (ex: "3 mois de loyer")
- 📸 Photos
- 🎬 Vidéo

#### Structure de données:
```javascript
{
  mainCategory: 'location',
  subCategory: 'longue_duree',
  title: 'Studio étudiant - Agadir',
  description: 'Petit studio moderne...',
  address: 'Avenue Hassan II',
  area: 35,
  price: 2000,
  paymentTerms: 'Par mois',
  propertyType: 'Studio',
  furnished: true,  // Nouveau champ
  advance: '3 mois de loyer',  // Nouveau champ
  images: [...],
  videos: [...]
}
```

---

### 2️⃣ **Location Courte Durée**
Annonces avec gestion de disponibilité via calendrier (type Airbnb)

#### Champs disponibles:
- 📝 Description
- 📍 Adresse
- 📐 Superficie (m²)
- 🏠 Type de bien (T2, T3, Appartement, etc.)
- 🛋️ Équipements (WiFi, climatisation, cuisine équipée, etc.)
- 💳 Prix par nuit
- 📅 **Calendrier de disponibilité** (NOUVEAU)
- 📸 Photos
- 🎬 Vidéo

#### Structure de données:
```javascript
{
  mainCategory: 'location',
  subCategory: 'courte_duree',
  title: 'Appartement meublé centre-ville Fès',
  description: 'T3 confortable...',
  address: 'Rue des Almoravides',
  area: 85,
  price: 1500,
  paymentTerms: 'Par nuit',
  propertyType: 'Appartement',
  apartmentTypes: ['T3 (3 pièces)'],
  equipment: ['wifi', 'climatisation', 'cuisine équipée', 'balcon'],
  availabilityCalendar: [
    {
      startDate: '2026-04-15',
      endDate: '2026-04-20'
    },
    {
      startDate: '2026-04-22',
      endDate: '2026-05-05'
    }
  ],
  images: [...],
  videos: [...]
}
```

---

## 📅 Calendrier de Disponibilité

### Pour les promoteurs/agences:
- **Mise à jour des disponibilités**: Les promoteurs bloquent les dates déjà réservées
- **Format**: Périodes de disponibilité avec dates de début et fin
- **Synchronisation**: Automatique avec les réservations confirmées

### Pour les clients:
- **Visualisation**: Affichage clair des périodes disponibles
- **Sélection**: Choix des dates de réservation
- **Réservation**: Réservation directe depuis la page de détails

### Rendu frontend:
```
📅 Jours disponibles
15 avr → 20 avr 2026
22 avr → 05 mai 2026
10 mai → 30 juin 2026
```

---

## 🔧 Modifications Techniques

### 1. Modèle MongoDB (`models/Offer.js`)
```javascript
const availabilitySchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
}, { _id: false });

// Champs location
furnished: Boolean,           // Location long terme
advance: String,              // Location long terme
availabilityCalendar: [availabilitySchema]  // Location court terme
```

### 2. Frontend - OfferDetails.jsx

#### Fonction Calendar:
```javascript
const renderAvailabilityCalendar = () => {
  if (!offer.availabilityCalendar || offer.availabilityCalendar.length === 0) {
    return null;
  }
  
  return (
    <div className="availability-calendar">
      <h3>📅 Jours disponibles</h3>
      <div className="availability-list">
        {offer.availabilityCalendar.map((period, idx) => (
          <div key={idx} className="availability-period">
            {/* Affichage des dates */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### Affichage conditionnel:
```javascript
{offer.mainCategory === 'location' && offer.subCategory === 'courte_duree' && renderAvailabilityCalendar()}
```

### 3. Styles CSS (`calendar-styles.css`)
- `.availability-calendar`: Conteneur principal
- `.availability-period`: Style des périodes
- `.period-date`: Style des dates
- Couleur thème: vert (#10b981)

---

## 📊 Champs par Type de Location

| Champ | Longue Durée | Courte Durée |
|-------|:------------:|:------------:|
| Description | ✅ | ✅ |
| Adresse | ✅ | ✅ |
| Superficie | ✅ | ✅ |
| Type de bien | ✅ | ✅ |
| Équipements | ❌ | ✅ |
| Meublé | ✅ | ❌ |
| Avances | ✅ | ❌ |
| **Calendrier** | ❌ | ✅ |
| Photos | ✅ | ✅ |
| Vidéo | ✅ | ✅ |

---

## 🚀 Fonctionnalités Futures

### Phase 2:
- [ ] Système de réservation complet (panier, paiement)
- [ ] Dashboard de gestion du calendrier pour promoteurs
- [ ] Notifications de nouvelles réservations
- [ ] Historique des réservations

### Phase 3:
- [ ] Avis clients et notes
- [ ] System de paiement intégré (Stripe/PayPal)
- [ ] Contrats de location numériques
- [ ] API de synchronisation calendrier (Google Calendar, iCal)

---

## 📱 Navigation

```
Home
├── Category: Location
│   ├── Courte Durée → Offres avec calendrier
│   └── Longue Durée → Offres classiques
│
└── Offre Détails
    ├── Images/Galerie
    ├── Caractéristiques (champs adaptés)
    ├── 📅 Calendrier (si courte durée)
    ├── Photos supplémentaires
    ├── Vidéos
    └── CTA: Contacter l'agence
```

---

## ✅ Tests

### Frontend:
1. Naviguer vers `/category/location`
2. Cliquer sur "Courte durée"
3. Voir l'offre avec calendrier
4. Naviguer vers `/category/location/longue_duree`
5. Voir offres sans calendrier

### API:
```bash
# Courte durée (avec calendrier)
GET /offers?status=approved&mainCategory=location&subCategory=courte_duree

# Longue durée (sans calendrier)
GET /offers?status=approved&mainCategory=location&subCategory=longue_duree
```

---

## 📝 Données de test

Deux offres de location sont pré-chargées:

1. **Appartement meublé - Fès** (Courte durée)
   - 85 m², T3, 1500 MAD/nuit
   - Calendrier: 3 périodes de disponibilité
   - Équipements: WiFi, climatisation, cuisine équipée, balcon

2. **Studio étudiant - Agadir** (Longue durée)
   - 35 m², Meublé
   - 2000 MAD/mois
   - Avance: 3 mois de loyer

---

## 🎯 Points clés

✅ **Deux types de location distincts** - Longue durée (classique) et Courte durée (avec calendrier)
✅ **Calendrier intégré** - Pour la courte durée uniquement
✅ **UI adaptée** - Champs et affichage différents par type
✅ **Architecture extensible** - Facile d'ajouter nouvelles fonctionnalités
✅ **Données persistantes** - MongoDB stocke toutes les informations
