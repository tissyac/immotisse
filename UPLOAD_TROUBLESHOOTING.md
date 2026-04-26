# 🔧 Troubleshooting - Erreurs Upload

## ❌ Problème: "Erreur lors de l'upload" (Message générique)

### Causes Possibles:

**1. Type de fichier non accepté**
- ❌ Fichier `.txt`, `.doc`, `.xlsx`, `.exe`
- ✅ Acceptés: PDF, JPEG, PNG, GIF, WebP
- **Solution**: Convertir le fichier au bon format

**2. Fichier trop volumineux**
- ❌ Fichier > 10 MB
- **Solution**: Compresser ou réduire la taille

**3. Serveur backend non accessible**
- ❌ Erreur réseau
- ❌ Serveur pas démarré
- **Solution**: 
  ```bash
  cd /back
  npm start
  # Doit afficher: Serveur lancé sur http://localhost:3000
  ```

**4. Dossier `uploads/` n'existe pas**
- ❌ Permission refusée
- **Solution**: 
  ```bash
  mkdir -p /back/uploads
  chmod 755 /back/uploads
  ```

---

## 📋 Checklist de Diagnostic

### 1. Vérifier le serveur

```bash
# Terminal 1 - Vérifier le serveur
curl http://localhost:3000/
# Devrait retourner: {"message":"Serveur backend fonctionne 🚀"}
```

### 2. Vérifier le dossier uploads

```bash
# Dossier existe?
ls -la /back/uploads/

# Permissions correctes?
# Doit être: drwxr-xr-x ou similaire
```

### 3. Test Upload Direct (cURL)

```bash
# Créer un fichier test
echo "Test PDF" > test.pdf

# Essayer l'upload
curl -X POST http://localhost:3000/upload/uploadPublic \
  -F "file=@test.pdf"

# Réponse attendue:
# {"success":true,"fileUrl":"/uploads/test-123456.pdf",...}
```

### 4. Vérifier la Console Navigateur

1. Ouvrir DevTools (F12)
2. Aller à l'onglet "Network"
3. Remplir le formulaire et upload
4. Chercher la requête POST `/uploadPublic`
5. Vérifier:
   - Status: 200 (succès) ou 400/500 (erreur)
   - Response body: message d'erreur détaillé

### 5. Vérifier les Logs Serveur

```bash
# Terminal où npm start s'exécute
# Chercher les messages comme:
# Upload attempt: test.pdf, MIME: application/pdf, Size: 1024
# OU
# Multer error: ...
```

---

## 🐛 Erreurs Spécifiques

### Erreur: "Type de fichier non autorisé"

**Cause**: Le fichier n'a pas le bon format MIME

**Solution**:
- Acceptés: PDF, JPEG, PNG, GIF, WebP
- Refusés: DOC, XLSX, TXT, EXE, etc.

**Test**:
```javascript
// Console navigateur
const file = document.querySelector('input[type=file]').files[0];
console.log('MIME:', file.type);
console.log('Taille:', file.size, 'bytes');
```

### Erreur: "Fichier trop volumineux"

**Cause**: Fichier > 10 MB (limite serveur)

**Solution**:
1. Compresser le PDF (avec ILovePDF, etc.)
2. Réduire la résolution de l'image
3. Contacter admin pour augmenter la limite

### Erreur: "Aucun fichier sélectionné"

**Cause**: FormData vide

**Solution**:
1. Vérifier que le fichier est vraiment sélectionné
2. Vérifier que l'input `type="file"` fonctionne
3. Recharger la page

### Erreur Réseau: ERR_CONNECTION_REFUSED

**Cause**: Serveur backend pas démarré ou URL incorrecte

**Solution**:
```bash
# Démarrer le serveur
cd /back
npm start

# Vérifier l'URL dans DocumentUploadWidget.jsx
# Doit être: http://localhost:3000/upload/uploadPublic
```

---

## ✅ Checklist de Vérification

- [ ] Serveur backend démarré (`npm start`)
- [ ] Dossier `/back/uploads/` existe
- [ ] Fichier est en format PDF ou image
- [ ] Fichier < 10 MB
- [ ] Vérifier console navigateur (F12 → Network)
- [ ] Vérifier les logs du serveur
- [ ] Test avec cURL réussit

---

## 🧪 Test Upload Automatisé

```bash
# Dans le terminal /back
node test-upload.js

# Output attendu:
# ✅ Serveur backend connecté
# ✅ Fichier test créé
# 📤 Envoi du fichier...
# ✅ Upload réussi!
# 📍 URL du fichier: /uploads/test-123456.pdf
# ✅ Fichier accessible
```

---

## 🔍 Vérification Complète

### Step 1: Backend OK?
```bash
curl http://localhost:3000/ | grep "fonctionne"
# ✅ Doit voir: "Serveur backend fonctionne 🚀"
```

### Step 2: Uploads Folder OK?
```bash
ls -la /back/uploads/
# ✅ Doit voir le dossier avec permissions
```

### Step 3: Upload Route OK?
```bash
# Créer test.pdf
touch test.pdf

# Test upload
curl -X POST http://localhost:3000/upload/uploadPublic \
  -F "file=@test.pdf" \
  -H "Accept: application/json"

# ✅ Doit voir: "success": true
```

### Step 4: Frontend OK?
1. Ouvrir http://localhost:5179/signup
2. Regarder console (F12)
3. Chercher "Upload error" ou "Upload attempt"
4. Tester upload manuellement

---

## 📞 Logs Diagnostiques

### Console Navigateur (F12 → Console)

**Avant upload:**
```javascript
// Vérifier les props
console.log('DocumentUploadWidget loaded');
```

**Pendant upload:**
```
⏳ Upload en cours...
```

**Après upload réussi:**
```
✅ test.pdf uploadé avec succès
```

**Après erreur:**
```
❌ Erreur: Type de fichier non autorisé: text/plain
```

### Logs Serveur (Terminal `npm start`)

**Upload réussi:**
```
Upload attempt: test.pdf, MIME: application/pdf, Size: 1024
```

**Format non accepté:**
```
Upload attempt: test.txt, MIME: text/plain, Size: 100
Multer error: Type de fichier non autorisé: text/plain
```

**Fichier trop volumineux:**
```
Multer error: File too large (size exceeds 10MB limit)
```

---

## ✨ Solutions Rapides

**Upload ne fonctionne pas du tout?**
1. Redémarrer le serveur backend: `npm start`
2. Recharger la page frontend: `Ctrl+Shift+R`
3. Vérifier les logs: voir section "Logs Diagnostiques"

**Erreur "Erreur lors de l'upload" sans détails?**
1. Ouvrir F12 → Console
2. Vérifier le message d'erreur
3. Appliquer la solution correspondante

**Fichier uploadé mais pas trouvé?**
1. Vérifier dans `/back/uploads/`
2. Tester accès: `curl http://localhost:3000/uploads/filename`
3. Vérifier permissions du fichier

---

## 🚀 Après la Fix

1. **Recharger le frontend:**
   ```bash
   # Terminal client
   cd client && npm run dev
   ```

2. **Tester l'upload:**
   - Aller à `/signup`
   - Upload PDF
   - ✅ Voir message de succès

3. **Vérifier dans DB:**
   ```bash
   # MongoDB
   db.requests.findOne()
   # Doit voir ninDocument: "/uploads/..."
   ```

---

Besoin d'aide? Vérifiez les logs serveur et navigateur! 🔍
