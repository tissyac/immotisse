#!/usr/bin/env node
// Script de test d'envoi d'email
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { initEmailService, sendTestEmail } = require('./services/emailService');

async function test() {
  console.log('🔧 Test envoi email...\n');
  console.log('📧 Configuration SMTP:');
  console.log('  - SMTP_USER:', process.env.SMTP_USER ? '✅ présent' : '❌ manquant');
  console.log('  - SMTP_PASS:', process.env.SMTP_PASS ? '✅ présent' : '❌ manquant');
  console.log('  - SMTP_SERVICE:', process.env.SMTP_SERVICE || 'défaut (Gmail)');
  console.log('  - SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ présent' : '❌ manquant\n');

  // Initialiser le service email
  initEmailService();

  // Envoyer un email de test
  const email = 'saratissemlal85@gmail.com';
  console.log(`📤 Envoi d'un email de test à: ${email}\n`);

  const result = await sendTestEmail(email);

  if (result.success) {
    console.log('✅ EMAIL ENVOYÉ AVEC SUCCÈS!');
    console.log('📬 Message ID:', result.messageId);
    console.log('\n📧 Vérifie ton email (et le dossier SPAM/Promotions)');
  } else {
    console.log('❌ ERREUR LORS DE L\'ENVOI:');
    console.log('📝 Erreur:', result.error);
    console.log('\n⚠️  Vérifications à faire:');
    console.log('  1. Assure-toi que les variables SMTP sont bien configurées dans .env');
    console.log('  2. Si tu utilises Gmail: utilise un "App Password" (pas ton mot de passe normal)');
    console.log('  3. Vérifie que "Accès des apps moins sécurisées" est activé (si applicable)');
  }

  process.exit(result.success ? 0 : 1);
}

test().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
