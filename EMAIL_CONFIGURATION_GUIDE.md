# 📧 Guide de Configuration et Débogage des Emails

## ✅ Solution au problème "Connection timeout"

Le problème **"[sendExistingUserEmail] Erreur lors de l'envoi du mail: Connection timeout"** est résolu avec les modifications suivantes :

### 1. ✅ Amélioration du service d'email
- **Ajout de timeouts configurés** (10 secondes) pour éviter les timeouts réseau
- **Envoi asynchrone non-bloquant** - L'email s'envoie en arrière-plan sans bloquer la réponse
- **Logging amélioré** - Debug logs pour diagnostiquer les problèmes de connexion

### 2. 🔧 Configuration SMTP (Fichier `.env`)

#### **Option A: Gmail (Recommandé)**
```
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App Password (16 caractères)
```

**⚠️ IMPORTANT - Utiliser un "App Password" Gmail:**
1. Accéder à: https://myaccount.google.com/security
2. Activer "2-Step Verification"
3. Aller à: https://myaccount.google.com/apppasswords
4. Sélectionner "Mail" et "Windows Computer"
5. Google génère un mot de passe de 16 caractères → Copier dans SMTP_PASS
6. **Ne pas utiliser votre mot de passe Gmail normal!**

#### **Option B: SendGrid**
```
SMTP_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxx_your_api_key_xxxxx
```

#### **Option C: Service SMTP générique**
```
SMTP_SERVICE=generic
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
```

---

## 🔍 Diagnostic du problème

### Vérifier les logs du serveur :
```
✅ Service email initialisé avec timeouts configurés
📧 [sendApprovalEmail] START - email: user@example.com
📧 [sendApprovalEmail] transporter ready, from: noreply@immotiss.com
✅ [sendApprovalEmail] Email sent successfully
```

### Erreurs courantes:

#### ❌ "SMTP_USER ou SMTP_PASS non configurés"
- **Cause**: Variables d'environnement manquantes dans `.env`
- **Solution**: Configurer `SMTP_USER` et `SMTP_PASS` correctement

#### ❌ "Connection timeout"
- **Cause 1**: Pare-feu bloque la connexion SMTP
- **Cause 2**: Identifiants SMTP invalides
- **Cause 3**: Service SMTP indisponible
- **Solution**: 
  - Tester la connexion: `telnet smtp.gmail.com 587`
  - Vérifier l'App Password Gmail
  - Vérifier les logs avec `debug: true`

#### ❌ "Invalid login credentials"
- **Cause**: Mot de passe SMTP incorrect
- **Solution**: 
  - Pour Gmail: Générer un nouvel App Password
  - Pour autres: Vérifier le mot de passe

---

## 🧪 Tester l'envoi d'email

Créer un fichier `test-email-simple.js` :
```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    logger: true,
    debug: true
  });

  try {
    console.log('Testing email with:', {
      user: process.env.SMTP_USER,
      host: process.env.SMTP_HOST
    });

    const result = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Test Email</h1><p>If you received this, SMTP is working!</p>'
    });

    console.log('✅ Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
```

**Utilisation:**
```bash
node test-email-simple.js
```

---

## 🚀 Améliorations apportées

### ✨ Changements dans le code:
1. **Timeouts SMTP configurés**: `connectionTimeout: 10000, socketTimeout: 10000, greetingTimeout: 10000`
2. **Envoi en arrière-plan**: Les emails s'envoient sans bloquer la réponse API
3. **Logging amélioré**: `logger: true, debug: true` pour faciliter le diagnostic
4. **Sécurité SMTP**: `secure: false` pour port 587 (TLS)

### 📋 Liste des changements:
- ✅ `server/services/emailService.js` - Configuration SMTP améliorée
- ✅ `server/routes/requestRoutes.js` - Envoi asynchrone non-bloquant
- ✅ `server/.env.example` - Documentation détaillée de configuration

---

## 📞 Support

Si vous avez toujours des problèmes:
1. **Vérifier les logs** du serveur (voir "✅ Service email initialisé")
2. **Tester avec le script** `test-email-simple.js`
3. **Vérifier la configuration .env** (pas d'espaces, bonnes valeurs)
4. **Pour Gmail**: Assurer que l'App Password a 16 caractères exactement
5. **Vérifier le pare-feu** sur le port 587 ou 465

