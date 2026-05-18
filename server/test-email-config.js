const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('\n🔍 EMAIL CONFIGURATION TEST\n');
console.log('Variables configurées:');
console.log('  SMTP_SERVICE:', process.env.SMTP_SERVICE);
console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || 587);
console.log('  SMTP_USER:', process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '...' : '❌ Non configuré');
console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '✅ Configuré (' + process.env.SMTP_PASS.length + ' caractères)' : '❌ Non configuré');
console.log('\n');

async function testEmail() {
  // Validation des variables requises
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ ERREUR: SMTP_USER et SMTP_PASS doivent être configurés dans .env');
    console.error('   Consulter EMAIL_CONFIGURATION_GUIDE.md pour les instructions');
    process.exit(1);
  }

  // Créer le transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' ? true : false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    greetingTimeout: 10000,
    logger: true,
    debug: true
  });

  console.log('📊 Configuration du transporter:');
  console.log('  Host:', transporter.options.host);
  console.log('  Port:', transporter.options.port);
  console.log('  Secure:', transporter.options.secure);
  console.log('  Auth user:', transporter.options.auth.user);
  console.log('  Timeouts: 10s');
  console.log('\n');

  try {
    console.log('⏳ Étape 1: Vérification de la connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP valide!\n');

    console.log('⏳ Étape 2: Envoi d\'un email de test...');
    const testEmail = process.env.TEST_EMAIL || process.env.SMTP_USER;
    
    const result = await transporter.sendMail({
      from: process.env.SMTP_USER || 'noreply@immotiss.com',
      to: testEmail,
      subject: '🧪 Test d\'Email - Immotiss',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>✅ Email de Test</h1>
          </div>
          <div style="padding: 20px; background-color: #f5f7fb;">
            <p>Bonjour,</p>
            <p>Cet email a été envoyé avec succès!</p>
            <p><strong>Le système d'email fonctionne correctement.</strong></p>
            <p style="color: #666; font-size: 12px;">
              Envoyé le: ${new Date().toLocaleString('fr-FR')}<br>
              Message ID: ${result.messageId || 'N/A'}
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ Email envoyé avec succès!\n');
    console.log('Détails:');
    console.log('  À:', testEmail);
    console.log('  Message ID:', result.messageId);
    console.log('\n🎉 Le système d\'email est opérationnel!\n');

  } catch (error) {
    console.error('\n❌ ERREUR lors du test:\n');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('\n🔧 Solutions possibles:');

    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      console.error('  1. Vérifier la connectivité réseau');
      console.error('  2. Vérifier que le port 587 n\'est pas bloqué');
      console.error('  3. Augmenter les timeouts si nécessaire');
    } else if (error.message.includes('auth') || error.message.includes('credentials')) {
      console.error('  1. Vérifier les identifiants SMTP_USER et SMTP_PASS');
      console.error('  2. Pour Gmail: Utiliser un App Password (16 caractères)');
      console.error('  3. Vérifier que 2-Step Verification est activé pour Gmail');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('  1. Vérifier le serveur SMTP_HOST');
      console.error('  2. Vérifier la connexion internet');
    }

    console.error('\n📖 Consulter EMAIL_CONFIGURATION_GUIDE.md pour plus d\'aide\n');
    process.exit(1);
  }
}

testEmail();
