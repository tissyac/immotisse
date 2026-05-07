import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import MultiFileUpload from './MultiFileUpload';

function ClientMessageForm({ offerId, onMessageSent }) {
  const { user, token } = useContext(AuthContext);
  const [contactInfo, setContactInfo] = useState({
    name: user?.companyName || '',
    email: user?.companyEmail || '',
    phone: user?.companyPhone || ''
  });
  const [form, setForm] = useState({
    subject: '',
    content: '',
    attachments: []
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.subject.trim() || !form.content.trim() || !contactInfo.name.trim() || !contactInfo.phone.trim()) {
      setMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const adminResponse = await fetch('https://immotisse.onrender.com/auth/admin-id', {
        headers: user ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!adminResponse.ok) {
        throw new Error('Impossible de contacter l\'administration');
      }

      const { adminId } = await adminResponse.json();

      if (user) {
        const messageData = {
          recipient: adminId,
          subject: form.subject,
          content: form.content,
          type: 'client_to_admin',
          relatedOffer: offerId,
          attachments: form.attachments
        };

        const response = await fetch('https://immotisse.onrender.com/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(messageData)
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'envoi');
        }
      } else {
        const contactData = {
          name: contactInfo.name,
          email: contactInfo.email,
          phone: contactInfo.phone,
          subject: form.subject,
          message: form.content,
          offer: offerId
        };

        const response = await fetch('https://immotisse.onrender.com/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactData)
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'envoi');
        }
      }

      setMessage('✅ Message envoyé avec succès !');
      setForm({ subject: '', content: '', attachments: [] });
      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error('Erreur envoi message:', error);
      setMessage('❌ Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentUpload = (files) => {
    setForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="client-message-form">
      <h3>📧 Contacter l'agence</h3>
      <p>Envoyez un message à l'administration pour toute question concernant cette offre.</p>

      <form onSubmit={handleSubmit}>
        <div className="contact-info-block">
          <div className="contact-info-header">
            <div>
              <h4>Vos coordonnées</h4>
              <p>Ces informations sont optionnelles et permettent à IMMOTISSE de mieux vous répondre.</p>
            </div>
          </div>

          <div className="form-group">
            <label>Nom complet *</label>
            <input
              type="text"
              value={contactInfo.name}
              onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Votre nom"
              required
            />
          </div>

          <div className="contact-fields-grid">
            <div className="form-group">
              <label>Email (optionnel)</label>
              <input
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Votre email"
              />
            </div>

            <div className="form-group">
              <label>Téléphone *</label>
              <input
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Votre numéro de téléphone"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Sujet *</label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Objet de votre message"
            required
          />
        </div>

        <div className="form-group">
          <label>Message *</label>
          <textarea
            rows="6"
            value={form.content}
            onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Décrivez votre demande..."
            required
          />
        </div>

        {user && (
          <div className="form-group">
            <label>Pièces jointes (optionnel)</label>
            <MultiFileUpload
              onFilesUploaded={handleAttachmentUpload}
              accept="image/*,.pdf"
              maxFiles={3}
              label="Ajouter des pièces jointes"
            />

            {form.attachments.length > 0 && (
              <div className="attachments-list">
                <h4>Pièces jointes ({form.attachments.length})</h4>
                {form.attachments.map((url, index) => (
                  <div key={index} className="attachment-item">
                    <span>{url.split('/').pop()}</span>
                    <button type="button" onClick={() => removeAttachment(index)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={sending} className="send-message-btn">
          {sending ? 'Envoi en cours...' : '📤 Envoyer le message'}
        </button>

        {message && <div className="message-result">{message}</div>}
      </form>
    </div>
  );
}

export default ClientMessageForm;
