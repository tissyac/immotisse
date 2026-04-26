# 🏢 Guide - Gestion des Locations (Promoteurs/Agences)

## 📋 Table des matières
1. [Types de Location](#types-de-location)
2. [Création d'Offres](#création-doffres)
3. [Gestion du Calendrier](#gestion-du-calendrier)
4. [Bonnes Pratiques](#bonnes-pratiques)

---

## Types de Location

### 🏠 Location Longue Durée
**Durée**: Plus de 3 mois (généralement 1+ ans)

#### Quand l'utiliser:
- Appartements/Studios pour résidents long terme
- Logements étudiants
- Logements de fonction
- Petits commerces

#### Champs à remplir:
| Champ | Type | Obligatoire | Notes |
|-------|------|:-----------:|-------|
| Titre | Texte | ✅ | Ex: "Studio meublé - Marrakech" |
| Description | Texte long | ✅ | Détails, commodités, commodités |
| Adresse | Texte | ✅ | Complète avec numéro |
| Ville | Texte | ✅ | Marrakech, Casablanca, etc. |
| Superficie | Nombre (m²) | ✅ | Ex: 45 |
| Type de bien | Sélection | ✅ | Studio, T2, T3, Appartement, etc. |
| Loyer (MAD) | Nombre | ✅ | Prix mensuel |
| **État** | Oui/Non | ✅ | Meublé ou non meublé |
| **Avances** | Texte | ✅ | Ex: "3 mois de loyer" ou "2 mois" |
| Étage | Nombre | ❌ | Si applicable |
| Ascenseur | Oui/Non | ❌ | Pour immeubles |
| Parking | Oui/Non | ❌ | |
| Photos | Images | ✅ | Min 1, recommandé 3-5 |
| Vidéo | Vidéo | ❌ | Visite virtuelle (optionnel) |

#### Exemple de remplissage:
```
Titre: Studio moderne - Avenue Hassan II Agadir
Description: Studio équipé, lumineux, calme et sécurisé.
              Cuisine équipée, salle de bain récente.
              Quartier résidentiel, proche des commodités.
Adresse: 12 Avenue Hassan II
Ville: Agadir
Superficie: 35 m²
Type: Studio
Loyer: 2000 MAD
État: Meublé ✅
Avances: 3 mois de loyer
Photos: [4 photos de qualité]
```

---

### 🏨 Location Courte Durée
**Durée**: 1 nuit à 3 mois (tourisme, affaires, séjours temporaires)

#### Quand l'utiliser:
- Gîtes touristiques
- Appartements Airbnb-like
- Logements touristiques
- Résidences saisonnières

#### Champs à remplir:
| Champ | Type | Obligatoire | Notes |
|-------|------|:-----------:|-------|
| Titre | Texte | ✅ | Ex: "Apt T3 meublé centre-ville Fès" |
| Description | Texte long | ✅ | Vue, ambiance, accès, points chauds |
| Adresse | Texte | ✅ | Complète |
| Ville | Texte | ✅ | |
| Superficie | Nombre (m²) | ✅ | |
| Type de bien | Sélection | ✅ | T2, T3, Appartement, Maison, etc. |
| Prix (MAD) | Nombre | ✅ | **Par nuit** |
| **Équipements** | Multiple | ✅ | WiFi, Climatisation, Cuisine, etc. |
| **Calendrier** | Dates | ✅ | Périodes de disponibilité |
| Photos | Images | ✅ | Min 1, recommandé 5+ |
| Vidéo | Vidéo | ❌ | Très recommandé |

#### Équipements (à sélectionner):
- 🌐 WiFi haute vitesse
- ❄️ Climatisation
- 🍳 Cuisine équipée
- 🛏️ Draps inclus
- 🧹 Nettoyage inclus
- 📺 Télévision
- 🚗 Parking gratuit
- 🏊 Piscine
- 🛁 Baignoire
- 🚿 Douche
- 🌳 Balcon/Terrasse
- Et plus...

#### Exemple de remplissage:
```
Titre: Appartement T3 meublé centre-ville Fès
Description: Bel appartement au cœur de la médina, proche
             des restaurants et terrasses. Entièrement équipé,
             silencieux, idéal pour familles ou groupes.
Adresse: 15 Rue des Almoravides
Ville: Fès
Superficie: 85 m²
Type: Appartement
Prix: 1500 MAD par nuit
Équipements: [WiFi, Climatisation, Cuisine, Draps, Balcon]
Calendrier: Dates disponibles (voir ci-dessous)
Photos: [6 photos professionnelles]
Vidéo: [Tour virtuel 2min]
```

---

## Création d'Offres

### Étape 1️⃣: Accéder au Dashboard
1. Connectez-vous avec votre compte agence
2. Cliquez sur "Mon Dashboard" dans l'en-tête
3. Section "📝 Créer une nouvelle offre"

### Étape 2️⃣: Remplir le formulaire

#### Sélection de catégorie:
```
Catégorie principale
├── Promotion (projets neufs)
├── Vente (immeubles à vendre)
└── Location ← Vous êtes ici
    ├── Courte Durée 🏨
    └── Longue Durée 🏠
```

#### Champs génériques (tous les types):
- ✏️ **Titre**: Clair et attractif
- 📝 **Description**: 200-500 caractères, points clés
- 📍 **Adresse**: Numéro, rue, code postal
- 🌆 **Ville**: Marrakech, Fès, Casablanca...
- 💰 **Prix**: Montant en MAD
- 📐 **Superficie**: En m²
- 📸 **Photos**: Glisser-déposer ou sélectionner
- 🎬 **Vidéo**: Lien URL (optionnel)

### Étape 3️⃣: Sauvegarder

1. Cliquez sur "✨ Créer l'offre"
2. Attendez la confirmation "✅ Offre créée"
3. L'offre est en attente de validation admin (24-48h)

---

## Gestion du Calendrier

### 📅 Calendrier de Disponibilité (Courte Durée SEULEMENT)

**Pourquoi?** Les clients voient directement quand vous êtes disponibles.

### Comment ajouter des périodes:

#### Lors de la création:
1. Allez à la section "📅 Gérer les disponibilités"
2. Sélectionnez "Date de début" (ex: 15 avril 2026)
3. Sélectionnez "Date de fin" (ex: 20 avril 2026)
4. Cliquez "➕ Ajouter période"
5. Répétez pour chaque période disponible

**Exemple:**
```
15 avril 2026 → 20 avril 2026  [✕ Supprimer]
22 avril 2026 → 05 mai 2026    [✕ Supprimer]
10 mai 2026  → 30 juin 2026    [✕ Supprimer]
```

### Modèles de disponibilité:

#### Modèle 1️⃣: Ouvert toute l'année
```
1 janvier 2026 → 31 décembre 2026
```

#### Modèle 2️⃣: Saison touristique
```
1 avril 2026 → 15 novembre 2026
```
(Fermé en hiver)

#### Modèle 3️⃣: Par périodes
```
15 mars 2026 → 30 avril 2026    (Printemps)
1 juillet 2026 → 31 août 2026   (Été)
15 septembre 2026 → 31 octobre  (Automne)
```

#### Modèle 4️⃣: Jours spécifiques
```
7 février 2026 → 14 février 2026 (Saint-Valentin)
18 mars 2026 → 2 avril 2026       (Pâques)
```

---

## Gestion Ultérieure

### ❌ Bloquer une date (réservation)

Après une réservation confirmée, vous devez **bloquer** la période:

1. Cherchez votre offre dans "Mes offres"
2. Cliquez sur "Modifier"
3. Allez au calendrier
4. **Supprimez** la période réservée
5. Sauvegardez

**Exemple:**
```
AVANT:     22 avril 2026 → 05 mai 2026
APRÈS LA RÉSERVATION (22-28 avril):
           29 avril 2026 → 05 mai 2026
```

### ✏️ Ajouter une nouvelle période

1. Modifiez l'offre
2. Ajoutez la nouvelle période au calendrier
3. Sauvegardez

### 🔄 Synchroniser avec autres plateformes

**🚀 Futures intégrations:**
- Google Calendar
- Calendly
- iCal
- Airbnb

---

## Bonnes Pratiques

### ✅ Avant de publier

**Titre:**
- ✅ Bon: "Appartement T3 meublé centre-ville Fès"
- ❌ Mauvais: "apt" ou "chambre"

**Description:**
- ✅ Bon: Détails + points forts + zone
- ❌ Mauvais: "Un logement"

**Prix:**
- ✅ Bon: 1500 MAD/nuit (courte) ou 2500 MAD/mois (longue)
- ❌ Mauvais: Prix flou ou non réaliste

**Photos:**
- ✅ Bon: 4-8 photos de haute qualité
- ✅ Bon: Salon, chambre, salle de bain, cuisine, entrypoint
- ❌ Mauvais: Photos floues ou sombres
- ❌ Mauvais: Une seule photo

**Équipements (Courte Durée):**
- ✅ Bon: [WiFi, Climatisation, Cuisine équipée, Balcon]
- ❌ Mauvais: [] (vide)

**Calendrier (Courte Durée):**
- ✅ Bon: 3+ périodes de disponibilités
- ✅ Bon: Mis à jour à chaque réservation
- ❌ Mauvais: Calendrier vide
- ❌ Mauvais: Dates anciennes

### 📊 Optimiser le taux de réservation

1. **Photos de qualité** → Première impression → +40% réservations
2. **Description détaillée** → Clarifie le besoin → +25%
3. **Calendrier à jour** → Pas de surprise → +30%
4. **Prix compétitif** → Comparable au marché → +35%
5. **Équipements complets** → CUT les objections → +20%

### 🆙 Format de prix recommandé

**Location Longue Durée:**
- Studio: 1000-2500 MAD/mois
- T2: 1500-3500 MAD/mois
- T3: 2500-5000 MAD/mois
- T4+: 3500-7000+ MAD/mois

**Location Courte Durée:**
- Studio: 400-800 MAD/nuit
- T2: 600-1200 MAD/nuit
- T3: 1000-2000 MAD/nuit
- T4+: 1500-3000+ MAD/nuit

*Ajustez selon la localisation, les commodités et la saison*

### ❓ Questions Fréquentes

**Q: Pourquoi mon offre n'apparaît pas?**
A: Elle est peut-être en attente de validation admin. Patientez 24-48h.

**Q: Puis-je changer le prix après publication?**
A: Oui, modifier l'offre et mettre à jour.

**Q: Comment gérer plusieurs réservations chevauchantes?**
A: Vérifiez le calendrier! Les dates se chevauchent ne doivent pas être disponibles.

**Q: Est-ce gratuit de publier?**
A: Oui! La publication est gratuite. Des commissions futures sur les réservations.

**Q: Puis-je avoir plusieurs offres?**
A: Oui, sans limite!

---

## 📞 Support

- **Email**: support@immotiss.com
- **Chat**: Disponible sur le dashboard
- **FAQ**: https://immotiss.ma/help
- **Numéro**: +212 6XX XXX XXX

---

Dernière mise à jour: Avril 2026
