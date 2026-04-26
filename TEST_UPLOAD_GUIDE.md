# 🎯 Guide de Test - Système d'Upload NIN/RC

## ✅ Checklist de Vérification

### 1. **Frontend - Formulaire d'Inscription**

- [ ] URL accessible: http://localhost:5179/signup
- [ ] Section "Information Gérant" affichée
- [ ] Champs présents: Nom, Prénom, Date naissance, Lieu, Téléphone, NIN
- [ ] **NEW** - Bouton upload NIN visible avec texte "📄 📤 Cliquez ou glissez..."
- [ ] Section "Information Entreprise" affichée
- [ ] Champs présents: Nom entreprise, Tél, Adresse, GPS, RC
- [ ] **NEW** - Bouton upload RC visible avec texte "📄 📤 Cliquez ou glissez..."
- [ ] Email de contact en bas
- [ ] Bouton "Envoyer la demande" présent

### 2. **Upload NIN - Test Drag & Drop**

1. Préparer un fichier test:
   - Nom: `test_nin.pdf` (ou image)
   - Taille: < 5 MB
   
2. Remplir les champs:
   ```
   Nom: Dupont
   Prénom: Jean
   Date: 15/01/1990
   Lieu: Casablanca
   Tél: +212612345678
   NIN: AB123456789
   ```

3. Cliquer sur le widget NIN:
   - [ ] Zone DevCom bleue avec bordure pointillée
   - [ ] Cible accepte drag & drop
   - [ ] Couleur change au hover

4. Sélectionner fichier:
   - [ ] Fichier accepté (PDF ou image)
   - [ ] Message "⏳ Upload en cours..."
   - [ ] Après 2-3 sec: "✅ test_nin.pdf uploadé avec succès"
   - [ ] Affichage "✓ Fichier: test_nin.pdf"

5. Vérifier fichier sur serveur:
   ```bash
   ls -la /back/uploads/
   # Devrait voir: 1712876543_test_nin.pdf (ou similaire)
   ```

### 3. **Upload RC - Test Click**

1. Remplir les champs entreprise:
   ```
   Nom entreprise: Immobilia SPA
   Tél entreprise: +212636789012
   Adresse: 123 Rue Hassan II
   GPS: 33.5731,-7.5898
   RC: RC-2024-001234
   ```

2. Cliquer sur le widget RC:
   - [ ] Fenêtre de sélection fichier s'ouvre
   - [ ] Format: PDF ou Images
   - [ ] Max size: 5 MB

3. Sélectionner fichier `test_rc.pdf`:
   - [ ] Upload en cours
   - [ ] "✅ test_rc.pdf uploadé avec succès"
   - [ ] Affichage "✓ Fichier: test_rc.pdf"

### 4. **Remplir Email et Soumettre**

1. Email:
   ```
   info@immobilia.ma
   ```

2. Soumettre:
   - [ ] Cliquer "Envoyer la demande"
   - [ ] Message: "✅ Demande envoyée. L'admin validera votre compte prochainement."
   - [ ] Formulaire vide à nouveau

3. Vérifier en DB:
   ```javascript
   // MongoDB
   db.requests.findOne({nin: "AB123456789"})
   // Doit voir:
   // {
   //   ninDocument: "/uploads/1712876543_test_nin.pdf",
   //   rcDocument: "/uploads/1712876549_test_rc.pdf",
   //   ...
   // }
   ```

### 5. **Erreurs Volontaires**

**Test A - Fichier trop volumineux (>5MB)**
1. Créer fichier > 5 MB
2. Upload
3. Résultat attendu: "❌ Le fichier est trop volumineux (max 5MB)"

**Test B - Mauvais format**
1. Tenter upload `.txt` ou `.exe`
2. Résultat: Fichier rejeté (input accepte uniquement image et PDF)

**Test C - Re-upload**
1. Upload d'abord NIN
2. Affichage "✓ Fichier: test_nin.pdf"
3. Cliquer à nouveau sur widget
4. Sélectionner autre fichier
5. Résultat: Nouveau fichier uploadé

### 6. **Vérification API**

```bash
# Terminal 1 - Vérifier les uploads
curl -X GET http://localhost:3000/uploads/1712876543_test_nin.pdf
# Résultat: 200 OK + fichier accessible

# Terminal 2 - Vérifier la request
curl -X GET http://localhost:3000/requests \
  -H "Authorization: Bearer <token_admin>"
# Voir la request avec les URLs des documents
```

### 7. **Interface Admin**

Dans le dashboard admin:
1. Naviguer vers "📋 Demandes en attente"
2. Voir la nouvelle request
3. **NEW** - Voir liens prévisualisables:
   - "📄 Voir NIN" → Ouvre `/uploads/xxx`
   - "📄 Voir RC" → Ouvre `/uploads/xxx`
4. Approver ou rejeter

---

## 🐛 Troubleshooting

### Problème: Upload widget non visible
**Solution:**
- Vérifier que CSS est importé dans Signup.jsx
- Vérifier que DocumentUploadWidget.jsx existe
- Recharger la page (F5)
- Ouvrir console (F12) pour voir erreurs

### Problème: Upload échoue silencieusement
**Solution:**
- Vérifier que `/upload/uploadPublic` route existe
- Vérifier que dossier `/back/uploads/` existe et est accessible
- Vérifier console navigateur (F12 → Network → POST /uploadPublic)
- Vérifier logs serveur

### Problème: Fichier uploadé mais pas sauvegardé
**Solution:**
- Vérifier que la fonction `onFileUploaded` est appelée
- Sauvegarder le formulaire immédiatement après
- Vérifier que `form.ninDocument` contient l'URL

### Problème: Page blanche/erreur compilation
**Solution:**
1. Terminal: `cd client && npm run dev`
2. Vérifier:
   - Syntax errors en console
   - Import paths corrects
   - Tous les fichiers existent

---

## 📊 Données de Test

### NIN Document
```
Fichier: test_nin.jpg (ou PDF)
Contenu: Carte d'identité (image ou scan)
Taille: ~200-500 KB
Format: JPG/PNG/PDF
```

### RC Document
```
Fichier: test_rc.pdf
Contenu: Registre de commerce (scan PDF)
Taille: ~300-800 KB
Format: PDF (recommandé)
```

---

## ✅ Checklist Finale

- [ ] Formulaire charge sans erreur
- [ ] Uploads widget pour NIN et RC visibles
- [ ] Drag & drop fonctionne
- [ ] Click pour sélectionner fichier fonctionne
- [ ] Messages de succès affichés
- [ ] Fichiers visibles dans `/back/uploads/`
- [ ] Request créée en DB avec URLs
- [ ] Admin peut voir les documents
- [ ] Les fichiers sont accessibles via navigateur

---

## 🚀 Prochaines Étapes

1. **Admin Dashboard:**
   - Ajouter prévisualisation des images
   - Ajouter boutons télécharger/supprimer

2. **Sécurité:**
   - Ajouter scan antivirus (ClamAV)
   - Limiter les uploads par IP (rate limiting)

3. **UX:**
   - Ajouter barre de progression
   - Ajouter crop/rotate pour images
   - Ajouter édition avant confirmation

---

**Dernière mise à jour:** Avril 2026
