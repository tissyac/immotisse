# 📋 Système d'Upload pour Inscription

## 📄 Vue d'ensemble

Le formulaire d'inscription a été amélioré pour permettre l'upload direct de documents (Carte NIN et Registre de Commerce) au lieu de simplement passer une URL.

## ✨ Nouvelles Fonctionnalités

### 1. **Upload de Carte NIN / Passeport**
- DocumentType: `nin`
- Formats acceptés: PDF, images (JPG, PNG, etc.)
- Taille max: 5 MB
- Champ requis: ✅ OUI
- Description: Preuve d'identité du gérant

### 2. **Upload de Registre de Commerce (RC)**
- DocumentType: `rc`
- Formats acceptés: PDF, images (JPG, PNG, etc.)
- Taille max: 5 MB
- Champ requis: ✅ OUI
- Description: Document officiel d'enregistrement

---

## 🔧 Architecture Technique

### Composant Frontend: `DocumentUploadWidget.jsx`

```javascript
<DocumentUploadWidget 
  label="📤 Cliquez ou glissez votre document NIN"
  documentType="nin"
  value={form.ninDocument}
  onFileUploaded={(url) => setForm({...form, ninDocument: url})}
/>
```

**Props:**
- `label` (string): Texte du bouton d'upload
- `documentType` (string): Type de document (nin, rc, etc.)
- `value` (string): URL du fichier stocké
- `onFileUploaded` (function): Callback après upload réussi

**Fonctionnalités:**
- ✅ Drag & drop support
- ✅ Validation de taille (max 5MB)
- ✅ Affichage du statut (uploading, success, error)
- ✅ Affichage du nom du fichier
- ✅ Sans authentification requise

### Route Backend: `POST /upload/uploadPublic`

**Endpoint:** `http://localhost:3000/upload/uploadPublic`

**Méthode:** POST
**Body:** FormData avec fichier
**Authentification:** ❌ NON requise
**Response:**
```json
{
  "success": true,
  "fileUrl": "/uploads/1712876543_document.pdf",
  "filename": "1712876543_document.pdf",
  "size": 245000,
  "mimetype": "application/pdf"
}
```

### Stockage des Fichiers

- **Répertoire:** `/back/uploads/`
- **Nommage:** Timestamp + nom original
- **URL d'accès:** `/uploads/{filename}`
- **Accès public:** ✅ OUI (statique)

---

## 🎯 Flux d'Utilisation

### Vue Utilisateur (Frontend)

1. **Accéder au formulaire d'inscription**
   ```
   /signup
   ```

2. **Section 1: Information Gérant**
   - Remplir: Nom, Prénom, Date/Lieu de naissance, Téléphone, NIN
   - **↓ NEW**
   - Cliquer/glisser pour upload NIN

3. **Section 2: Information Entreprise**
   - Remplir: Nom entreprise, Téléphone, Adresse, GPS
   - **↓ NEW**
   - Remplir: Numéro RC
   - **↓ NEW**
   - Cliquer/glisser pour upload RC
   - Remplir: Email

4. **Soumettre le formulaire**
   - Bouton: "Envoyer la demande"

### Données Envoyées au Backend

```json
{
  "name": "Dupont",
  "firstName": "Jean",
  "birthDate": "1990-01-15",
  "birthPlace": "Paris",
  "phone": "+212612345678",
  "nin": "AB123456789",
  "ninDocument": "/uploads/1712876543_AB123456789.pdf",
  "companyName": "Immobilia SPA",
  "companyPhone": "+212636789012",
  "companyAddress": "123 Rue Principale",
  "companyLocation": "33.5731,-7.5898",
  "rcNumber": "RC-2024-001234",
  "rcDocument": "/uploads/1712876549_RC_2024_001234.pdf",
  "companyEmail": "info@immobilia.ma"
}
```

---

## 📊 Validation

### Côté Client
- Taille max: 5 MB
- Format: PDF ou images
- Champs requis: NIN document + RC document

### Côté Serveur
- (À implémenter selon besoins)
- Validation du format MIME
- Scan antivirus (optionnel)
- Validation du contenu PDF

---

## 🎨 Styles

### DocumentUploadWidget

**Normal:**
```
┌─────────────────────────────────────────┐
│ 📄 📤 Cliquez ou glissez votre document │
└─────────────────────────────────────────┘
```

**Après upload:**
```
┌─────────────────────────────────────────┐
│ 📄 📤 Cliquez ou glissez votre document │
└─────────────────────────────────────────┘
✓ Fichier: mon_document.pdf
✅ Document uploadé
```

**En erreur:**
```
┌─────────────────────────────────────────┐
│ 📄 📤 Cliquez ou glissez votre document │
└─────────────────────────────────────────┘
❌ Erreur: Le fichier est trop volumineux
```

---

## 🔒 Sécurité

### Mesures Implémentées
1. ✅ **Validation taille:** Max 5 MB
2. ✅ **Types MIME:** PDF et images uniquement
3. ✅ **Nommage sécurisé:** Timestamp + aléatoire
4. ✅ **Protection CSRF:** (Implicite via FormData)

### Mesures Recommandées (Futures)
1. **Antivirus:** Scanner les uploads
2. **Rate limiting:** Limiter les uploads par IP
3. **Admin Review:** Interface d'admin pour vérifier documents
4. **Expiration:** Supprimer les documents après délai

---

## 🚀 Points d'Intégration

### Admin Dashboard

L'admin doit pouvoir:
1. Voir les documents uploadés
2. Vérifier les documents avant d'approuver
3. Télécharger les documents pour archivage
4. Rejeter si documents insuffisants

### Base de Données

Les URLs des documents sont stockées dans:
- **Model:** `Request`
- **Champs:** `ninDocument`, `rcDocument`
- **Type:** String (URL)

---

## 📞 FAQ

**Q: Quels formats acceptez-vous?**
A: PDF et images (JPG, PNG, JPEG, WebP, etc.)

**Q: Quelle est la taille maximale?**
A: 5 MB par fichier

**Q: Où sont stockés les fichiers?**
A: Dans `/back/uploads/` sur le serveur

**Q: Les fichiers sont-ils accessibles publiquement?**
A: Oui, via `/uploads/{filename}`

**Q: Puis-je re-upload un document?**
A: Oui, cliquez simplement sur le widget à nouveau

**Q: Que se passe-t-il après l'upload?**
A: La demande est envoyée à l'admin pour validation

---

## 🔄 Flux Complet (User Perspective)

```
┌──────────────────────────┐
│  INSCRIPTION (Signup)    │
└───────────┬──────────────┘
            │
    ┌───────▼─────────┐
    │ Remplir formulaire
    │ + Upload NIN     │
    │ + Upload RC      │
    └───────┬─────────┘
            │
    ┌───────▼──────────────┐
    │ Soumettre demande    │
    └───────┬──────────────┘
            │
    ┌───────▼──────────────────────┐
    │ REQUEST CRÉÉE               │
    │ Status: PENDING             │
    │ Admin review les docs       │
    └───────┬──────────────────────┘
            │
    ┌───────▼────────────┐
    │ ADMIN VALIDE OU    │
    │ REJETTE            │
    └───────┬────────────┘
            │
    ┌───────▼──────────────┐
    │ Si APPROVED:         │
    │ User créé (ACTIVE)   │
    │ Accès dashboard      │
    └──────────────────────┘
```

---

## 📦 Dépendances

- **Frontend:** React (useState)
- **Backend:** Express, Multer, Node.js
- **Middleware:** uploadMiddleware.js

## ✅ Tests

**Via Frontend:**
1. Naviguer vers `/signup`
2. Remplir le formulaire
3. Upload cartes NIN et RC
4. Soumettre

**Vérification:**
- Fichiers présents dans `/back/uploads/`
- URLs dans `Request` collection MongoDB
- Fichiers accessibles via navigateur

---

Dernière mise à jour: Avril 2026
