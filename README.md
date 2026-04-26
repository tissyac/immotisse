# IMMOTISS - Plateforme Immobilière Web

## 🚀 Démarrage Rapide (3 étapes - 2 minutes)

### 1. Terminal 1 - Démarrer le Backend
```bash
cd c:\Users\HP\OneDrive\Desktop\back
npm start
```
✅ Vous verrez:
```
Serveur lancé sur http://localhost:3000
MongoDB connecté ✅
```

### 2. Terminal 2 - Démarrer le Frontend
```bash
cd c:\Users\HP\OneDrive\Desktop\back\client
npm run dev
```
✅ Vous verrez:
```
➜ Local: http://localhost:5174
```

### 3. Navigateur - Accéder à l'application
```
http://localhost:5174
```

---

## 👤 Compte Admin (pour tester)

```
Email: admin@immotiss.com
Password: admin123
```

---

## 📱 Les 3 Interfaces

### 1. Interface Client (Public)
```
◆ Voir les offres immobilières
◆ Filtrer par prix, ville, surface, équipements
◆ Pagination
◆ Bouton S'inscrire (pour devenir promoteur)
◆ Bouton Se connecter (pour promoteurs/admin)
```

### 2. Interface Promoteur
```
◆ Créer des offres immobilières
◆ Upload d'images/PDF
◆ Voir ses offres avec statut (pending/approved)
◆ Se déconnecter
```

### 3. Interface Admin
```
◆ Onglet Demandes → Approuver les inscriptions
◆ Onglet Offres → Approuver les annonces
◆ Onglet Contacts → Voir les messages clients
◆ Onglet Audit → Logs de toutes les actions
◆ Onglet Statistiques → Tableaux de bord
```

---

## 📊 Données de Test

**6 Offres pré-chargées** (toutes approuvées et visibles):
```
1. Promotion Casablanca - 50 villas - 2,500,000 DH
2. Immeuble bureaux Rabat - 45,000,000 DH
3. Villa Marrakech - 3,800,000 DH
4. Appart Fès - 1,500 DH/mois
5. Studio Agadir - 2,000 DH/mois
6. Terrains Tanger - 850,000 DH
```

---

## 📧 Configuration Email (IMPORTANT!)

### Pour que les notifications par email fonctionnent:

#### Option 1: Gmail (Rapide)
```
1. Aller à: https://myaccount.google.com/apppasswords
2. App: Mail, Device: Windows
3. Google génère 16 caractères
4. Éditer .env:
   SMTP_USER=votre.email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
5. Relancer: npm start
```

#### Option 2: SendGrid
```
1. Créer compte: https://sendgrid.com/
2. Générer API Key
3. Éditer .env:
   SMTP_SERVICE=sendgrid
   SENDGRID_API_KEY=SG.xxxxx
4. Relancer: npm start
```

---

## ✅ Vérification que tout fonctionne

### Test 1: Voir les 6 offres
```
URL: http://localhost:5174
Doit afficher: Grille avec 6 offres immobilières
```

### Test 2: Filtrer les offres
```
1. Entrer "Casablanca" en filtrant ville
2. Doit afficher: 1 offre (Promotion Casablanca)
```

### Test 3: Admin login
```
1. Cliquer "Se connecter"
2. Email: admin@immotiss.com
3. Password: admin123
4. Doit aller à: Panneau d'Administration
```

### Test 4: Admin approuve une demande
```
1. S'inscrire comme promoteur (avec votre email)
2. Se connecter en admin
3. Onglet Demandes → Cliquer Approuver
4. ✅ Email envoyé au promoteur avec password
```

### Test 5: Promoteur crée une offre
```
1. Promoteur se connecte (avec credentials reçus)
2. Va à Espace Promoteur
3. Remplit formulaire et crée offre
4. Admin approuve l'offre
5. Offre visible publiquement ✅
```

---

## 🗂️ Structure du Projet

```
back/                          # Backend Node.js + Express
├── models/                    # Schémas MongoDB
│   ├── User.js              # Utilisateurs (Admins, Promoteurs)
│   ├── Offer.js             # Offres immobilières
│   ├── Request.js           # Demandes d'inscription
│   ├── Audit.js             # Logs d'audit
│   └── History.js           # Historique des offres
├── routes/                    # API endpoints
│   ├── offerRoutes.js       # CRUD + Filtres + Approbations
│   ├── authRoutes.js        # Login + Token verification
│   ├── requestRoutes.js     # Inscription + Validation
│   ├── uploadRoutes.js      # Upload files
│   └── auditRoutes.js       # Logs + Stats
├── services/                  # Business logic
│   ├── emailService.js      # Notifications email
│   └── auditService.js      # Audit logging
├── middleware/                # Auth + Upload
├── scripts/
│   └── seedData.js           # Données de test
├── server.js                  # Point d'entrée
├── .env                       # Configuration (À remplir)
└── GUIDE_COMPLET.md          # Doc détaillée

client/                        # Frontend React + Vite
├── src/
│   ├── pages/                # 5 pages principales
│   │   ├── Home.jsx         # Browse + Filtres
│   │   ├── Login.jsx        # Authentification
│   │   ├── Signup.jsx       # Inscription
│   │   ├── PromoterDashboard.jsx # Gestion offres
│   │   └── AdminDashboard.jsx    # Panel admin
│   ├── context/              # État global (AuthContext)
│   ├── components/           # Composants (FileUpload)
│   ├── App.jsx              # Router principal
│   └── index.css            # Styles
├── package.json
└── vite.config.js
```

---

## 🐛 Troubleshooting Rapide

### Backend ne démarre pas
```
Error: EADDRINUSE :::3000
→ Port 3000 déjà utilisé
→ Changer PORT=4000 dans .env
```

### Frontend blanc/vide
```
→ Vérifier http://localhost:5174 (pas 5173)
→ Ouvrir Console (F12) pour voir les erreurs
→ npm run dev → relancer
```

### Offres não aparecem
```
→ Actualiser page (F5)
→ node scripts/seedData.js  (relancer seed)
→ Vérifier que Admin → Statistiques affiche 6 offres
```

### Emails ne s'envoient pas
```
→ .env: SMTP_USER et SMTP_PASS remplis?
→ Gmail: créer App Password (pas mot de passe compte)
→ npm start → relancer

Vérifier les logs du serveur:
"Email envoyé à..." → OK ✅
"Error sending email..." → Problème config
```

---

## 📚 Documentation Complète

Pour plus de détails, voir:
- **GUIDE_COMPLET.md** - Guide exhaustif (toutes les features, tests, déploiement)
- **RÉSUMÉ_FINAL.md** - Résumé visuel avec screenshots mentals

---

## 🎯 Commandes Utiles

```bash
# Développement
npm start               # Backend avec auto-reload
npm run dev            # Frontend avec Vite hot-reload
npm run build          # Build production frontend

# Data
node scripts/seedData.js   # Recharger 6 offres de test
node scripts/createAdmin.js # Créer nouveau compte admin

# Testing
npm test               # Lancer tests (si confgurés)
```

---

## 📞 Support Rapide

| Problème | Solution |
|----------|----------|
| Backend ne répond | Vérifier: npm start, MongoDB connecté ✅ |
| Frontend vide | Vérifier: F5, http://localhost:5174 |
| Login admin échoue | Email exact: admin@immotiss.com, Password: admin123 |
| Offres invisibles | node scripts/seedData.js |
| Emails non reçus | Configurer .env avec Gmail/SendGrid |

---

## 🚀 Vous êtes prêt!

✅ Backend complet
✅ Frontend complet  
✅ 3 interfaces fonctionnelles
✅ 6 offres de test
✅ Authentification sécurisée
✅ Approbations workflow

**Étape finale:** Configurer EMAIL (5 min) → Prêt pour production! 🎉

---

## 📄 Licence & Contact

IMMOTISS Platform - Immobilier Web
Contact: [Votre email]
