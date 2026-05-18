const nodemailer = require('nodemailer');
let transporter;
let sgMail = null;
let useSendGrid = false;

const initEmailService = () => {
  // Configuration flexible pour différents fournisseurs
  if (process.env.SENDGRID_API_KEY) {
    console.log('📧 Initialisation SendGrid API...');
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    useSendGrid = true;
  } else if (process.env.SMTP_USER && process.env.SMTP_PASS && !process.env.SMTP_USER.includes('votre.email') && !process.env.SMTP_PASS.includes('votre_mot')) {
    // Configuration Gmail ou service SMTP générique
    console.log('📧 Initialisation SMTP générique...');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true' ? true : false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
      greetingTimeout: 15000,
      maxConnections: 1,
      maxMessages: 5,
      logger: true,
      debug: process.env.NODE_ENV !== 'production'
    });
  } else {
    console.error('❌ Aucun service email configuré. Configurez SENDGRID_API_KEY ou SMTP_USER/SMTP_PASS');
    return;
  }
  console.log('✅ Service email initialisé avec timeouts configurés (15s)');
};

const getEmailFrom = () => {
  return process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@immotiss.com';
};

const doSendMail = async (mailOptions) => {
  if (useSendGrid && sgMail) {
    const msg = {
      to: mailOptions.to,
      from: mailOptions.from || getEmailFrom(),
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text
    };
    if (mailOptions.cc) msg.cc = mailOptions.cc;
    if (mailOptions.bcc) msg.bcc = mailOptions.bcc;

    const [response] = await sgMail.send(msg);
    const messageId = response.headers ? response.headers['x-message-id'] || response.headers['X-Message-Id'] : undefined;
    return { messageId: messageId || response.statusCode, response };
  }

  if (!transporter) initEmailService();
  if (!transporter) {
    throw new Error('SMTP non initialisé. Vérifiez SENDGRID_API_KEY ou SMTP_USER/SMTP_PASS.');
  }

  return transporter.sendMail(mailOptions);
};

const sendApprovalEmail = async (email, username, password, companyName) => {
  try {
    console.log('📧 [sendApprovalEmail] START - email:', email, 'transporter exists:', !!transporter);
    
    if (!transporter && !useSendGrid) {
      console.log('📧 [sendApprovalEmail] email service undefined, initializing...');
      initEmailService();
    }
    
    if (!transporter && !useSendGrid) {
      const errorMessage = 'Service email non initialisé. Vérifiez SENDGRID_API_KEY ou SMTP_USER/SMTP_PASS.';
      console.error('❌ [sendApprovalEmail]', errorMessage);
      return { success: false, error: errorMessage };
    }

    console.log('📧 [sendApprovalEmail] email service ready', { useSendGrid, transporter: !!transporter });

    const mailOptions = {
      from: getEmailFrom(),
      to: email,
      subject: '✅ Validation de votre inscription - Immotiss',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>Bienvenue sur Immotiss!</h1>
          </div>
          <div style="padding: 20px; background-color: #f5f7fb;">
            <p>Bonjour,</p>
            <p>Votre inscription pour l'entreprise <strong style="color: #0f172a;">${escapeHtml(companyName)}</strong> a été approuvée.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0f172a;">
              <p><strong>Vos identifiants de connexion :</strong></p>
              <p><strong>Email :</strong> ${escapeHtml(email)}</p>
              <p><strong>Mot de passe :</strong> <code style="background-color: #e2e8f0; padding: 8px 12px; border-radius: 4px;">${escapeHtml(password)}</code></p>
            </div>
            
            <p style="color: #666; font-size: 14px;">⚠️ Veuillez changer ce mot de passe lors de votre première connexion.</p>
            
            <p>
              <a href="http://localhost:5173/login" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Se connecter
              </a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe Immotiss</p>
          </div>
        </div>
      `
    };

    const result = await doSendMail(mailOptions);
    console.log(`✅ [sendApprovalEmail] Email sent successfully to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ [sendApprovalEmail] Erreur lors de l\'envoi du mail:', error.message, error);
    return { success: false, error: error.message || error.toString() || 'Erreur inconnue lors de l\'envoi' };
  }
};

const sendOfferApprovalEmail = async (email, companyName, offerTitle) => {
  try {
    if (!transporter && !useSendGrid) initEmailService();
    if (!transporter && !useSendGrid) {
      const errorMessage = 'Service email non initialisé. Vérifiez SENDGRID_API_KEY ou SMTP_USER/SMTP_PASS.';
      console.error('❌', errorMessage);
      return { success: false, error: errorMessage };
    }

    await doSendMail({
      from: process.env.SMTP_USER || getEmailFrom(),
      to: email,
      subject: '✅ Votre offre a été approuvée - Immotiss',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>Offre Approuvée!</h2>
          </div>
          <div style="padding: 20px; background-color: #f5f7fb;">
            <p>Bonjour,</p>
            <p>Votre offre <strong>"${escapeHtml(offerTitle)}"</strong> a été approuvée et est maintenant visible sur le site Immotiss.</p>
            <p>Vous pouvez la consulter et la gérer depuis votre espace personnel.</p>
            <p style="color: #666; font-size: 12px;">L'équipe Immotiss</p>
          </div>
        </div>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du mail:', error);
    return { success: false, error: error.message };
  }
};

const sendOfferRejectionEmail = async (email, companyName, offerTitle, reason) => {
  try {
    if (!transporter) initEmailService();

    await doSendMail({
      from: process.env.SMTP_USER || getEmailFrom(),
      to: email,
      subject: '❌ Votre offre a été rejetée - Immotiss',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>Offre Rejetée</h2>
          </div>
          <div style="padding: 20px; background-color: #f5f7fb;">
            <p>Bonjour,</p>
            <p>Votre offre <strong>"${escapeHtml(offerTitle)}"</strong> a été rejetée.</p>
            ${reason ? `<p><strong>Raison :</strong> ${escapeHtml(reason)}</p>` : ''}
            <p>Veuillez corriger votre offre et la soumettre à nouveau.</p>
          </div>
        </div>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du mail:', error);
    return { success: false, error: error.message };
  }
};

const sendMessageNotificationEmail = async (email, senderName, senderEmail, subject, preview) => {
  try {
    if (!transporter && !useSendGrid) initEmailService();
    if (!transporter && !useSendGrid) {
      const errorMessage = 'Service email non initialisé. Vérifiez SENDGRID_API_KEY ou SMTP_USER/SMTP_PASS.';
      console.error('❌', errorMessage);
      return { success: false, error: errorMessage };
    }

    await doSendMail({
      from: process.env.SMTP_USER || getEmailFrom(),
      to: email,
      subject: `Nouveau message de ${senderName} - Immotiss`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>Nouveau message reçu</h2>
          </div>
          <div style="padding: 20px; background-color: #f5f7fb;">
            <p>Bonjour,</p>
            <p>Vous avez reçu un nouveau message de <strong>${escapeHtml(senderName)}</strong> (${escapeHtml(senderEmail)}).</p>
            <p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
            <p><strong>Message :</strong></p>
            <p>${escapeHtml(preview)}</p>
            <p style="color: #666; font-size: 14px;">Connectez-vous à votre espace admin pour répondre.</p>
          </div>
        </div>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du mail de notification message:', error);
    return { success: false, error: error.message };
  }
};

const sendContactNotificationEmail = async (email, name, replyEmail, message, phone, offerTitle) => {
  try {
    if (!transporter && !useSendGrid) initEmailService();
    if (!transporter && !useSendGrid) {
      const errorMessage = 'Service email non initialisé. Vérifiez SENDGRID_API_KEY ou SMTP_USER/SMTP_PASS.';
      console.error('❌', errorMessage);
      return { success: false, error: errorMessage };
    }

    await doSendMail({
      from: process.env.SMTP_USER || getEmailFrom(),
      to: email,
      subject: 'Nouveau message contact client - Immotiss',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>Nouveau contact reçu</h2>
          </div>
          <div style="padding: 20px; background-color: #f5f7fb;">
            <p>Bonjour,</p>
            <p>Vous avez reçu un nouveau message de <strong>${escapeHtml(name)}</strong>.</p>
            <p><strong>Email :</strong> ${escapeHtml(replyEmail)}</p>
            ${phone ? `<p><strong>Téléphone :</strong> ${escapeHtml(phone)}</p>` : ''}
            ${offerTitle ? `<p><strong>Offre concernée :</strong> ${escapeHtml(offerTitle)}</p>` : ''}
            <p><strong>Message :</strong></p>
            <p>${escapeHtml(message)}</p>
          </div>
        </div>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du mail de contact:', error);
    return { success: false, error: error.message };
  }
};

const sendRequestRejectionEmail = async (email, companyName, reason) => {
  try {
    if (!transporter && !useSendGrid) initEmailService();
    if (!transporter && !useSendGrid) {
      const errorMessage = 'Service email non initialisé. Vérifiez SENDGRID_API_KEY ou SMTP_USER/SMTP_PASS.';
      console.error('❌', errorMessage);
      return { success: false, error: errorMessage };
    }

    const mailOptions = {
      from: getEmailFrom(),
      to: email,
      subject: '❌ Votre inscription a été rejetée - Immotiss',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>Inscription rejetée</h1>
          </div>
          <div style="padding: 20px; background-color: #f5f7fb;">
            <p>Bonjour,</p>
            <p>La demande d'inscription pour l'entreprise <strong>${escapeHtml(companyName)}</strong> a été rejetée.</p>
            ${reason ? `<p><strong>Motif :</strong> ${escapeHtml(reason)}</p>` : '<p>Aucune raison précise n\'a été fournie.</p>'}
            <p>Si nécessaire, veuillez corriger les informations et soumettre une nouvelle demande.</p>
          </div>
        </div>
      `
    };

    const result = await doSendMail(mailOptions);
    console.log(`✅ Rejection email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du mail de rejet:', error);
    return { success: false, error: error.message || error.toString() || 'Erreur inconnue lors de l\'envoi' };
  }
};

const sendExistingUserEmail = async (email, username, companyName) => {
  try {
    console.log('📧 [sendExistingUserEmail] START - email:', email, 'transporter exists:', !!transporter, 'useSendGrid:', useSendGrid);
    
    if (!transporter && !useSendGrid) {
      console.log('📧 [sendExistingUserEmail] email service undefined, initializing...');
      initEmailService();
    }
    
    if (!transporter && !useSendGrid) {
      const errorMessage = 'Service email non initialisé. Vérifiez SENDGRID_API_KEY ou SMTP_USER/SMTP_PASS.';
      console.error('❌ [sendExistingUserEmail]', errorMessage);
      return { success: false, error: errorMessage };
    }

    console.log('📧 [sendExistingUserEmail] email service ready', { useSendGrid, transporter: !!transporter });

    const mailOptions = {
      from: getEmailFrom(),
      to: email,
      subject: 'ℹ️ Compte existant - Immotiss',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>Compte déjà existant</h2>
          </div>
          <div style="padding: 20px; background-color: #f5f7fb;">
            <p>Bonjour,</p>
            <p>Un compte avec l'email <strong>${escapeHtml(email)}</strong> existe déjà sur Immotiss.</p>
            <p>Vous pouvez vous connecter avec votre identifiant : <strong>${escapeHtml(username)}</strong>.</p>
            <p>Si vous avez oublié votre mot de passe, utilisez la fonctionnalité "Mot de passe oublié" pour le réinitialiser.</p>
            <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe Immotiss</p>
          </div>
        </div>
      `
    };

    console.log('📧 [sendExistingUserEmail] Envoi du mail à', email);
    const result = await doSendMail(mailOptions);
    console.log(`✅ [sendExistingUserEmail] Email sent successfully to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ [sendExistingUserEmail] Erreur lors de l\'envoi du mail:', error.message, error);
    return { success: false, error: error.message || error.toString() };
  }
};

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  initEmailService,
  sendApprovalEmail,
  sendTestEmail,
  sendOfferApprovalEmail,
  sendOfferRejectionEmail,
  sendMessageNotificationEmail,
  sendContactNotificationEmail,
  sendRequestRejectionEmail,
  sendExistingUserEmail
};

// Fonction utilitaire pour envoyer un email de test
async function sendTestEmail(email) {
  try {
    if (!transporter && !useSendGrid) initEmailService();
    if (!transporter && !useSendGrid) {
      const errorMessage = 'Service email non initialisé. Vérifiez SENDGRID_API_KEY ou SMTP_USER/SMTP_PASS.';
      console.error('❌', errorMessage);
      return { success: false, error: errorMessage };
    }

    const res = await doSendMail({
      from: getEmailFrom(),
      to: email,
      subject: 'Test email Immotiss',
      text: 'Ceci est un email de test envoyé depuis le backend Immotiss pour vérifier la configuration SMTP.'
    });
    console.log('✅ Test email sent:', res.messageId);
    return { success: true, messageId: res.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du test email:', error);
    return { success: false, error: error.message || error.toString() };
  }
}
