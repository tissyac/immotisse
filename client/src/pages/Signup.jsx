import { useState } from 'react';
import DocumentUploadWidget from '../components/DocumentUploadWidget';
import '../styles/document-upload.css';
import '../styles/signup.css';

function Signup() {
  const [form, setForm] = useState({
    name: '',
    firstName: '',
    birthDate: '',
    birthPlace: '',
    phone: '',
    nin: '',
    ninDocument: '',
    companyName: '',
    companyPhone: '',
    companyAddress: '',
    companyLocation: '',
    rcNumber: '',
    rcDocument: '',
    companyEmail: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  const update = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
  };

  // Fonction pour récupérer la localisation GPS
  const getLocation = () => {
    setIsLocating(true);
    setLocationMessage('');

    if (!navigator.geolocation) {
      setLocationMessage('❌ Géolocalisation non supportée par votre navigateur');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const gpsCoords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setForm({ ...form, companyLocation: gpsCoords });
        setLocationMessage(`✓ Position récupérée: ${gpsCoords}`);
        setIsLocating(false);
      },
      (error) => {
        let errorMsg = '❌ Impossible de récupérer votre position';
        
        if (error.code === 1) {
          errorMsg = '❌ Permission de localisation refusée. Vérifiez les paramètres de votre navigateur.';
        } else if (error.code === 2) {
          errorMsg = '❌ Position non disponible. Vérifiez votre connexion GPS.';
        } else if (error.code === 3) {
          errorMsg = '❌ Délai d\'attente dépassé.';
        }
        
        setLocationMessage(errorMsg);
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3008/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setMessageType('success');
        setMessage('✓ Demande envoyée avec succès! L\'admin validera votre compte prochainement.');
        setForm({
          name: '',
          firstName: '',
          birthDate: '',
          birthPlace: '',
          phone: '',
          nin: '',
          ninDocument: '',
          companyName: '',
          companyPhone: '',
          companyAddress: '',
          companyLocation: '',
          rcNumber: '',
          rcDocument: '',
          companyEmail: ''
        });
      } else {
        setMessageType('error');
        setMessage('✕ Erreur lors de l\'envoi du formulaire. Veuillez réessayer.');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('✕ Erreur réseau. Veuillez vérifier votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setForm({
      name: '',
      firstName: '',
      birthDate: '',
      birthPlace: '',
      phone: '',
      nin: '',
      ninDocument: '',
      companyName: '',
      companyPhone: '',
      companyAddress: '',
      companyLocation: '',
      rcNumber: '',
      rcDocument: '',
      companyEmail: ''
    });
    setMessage('');
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        {/* Header */}
        <div className="signup-header">
          <h1>Formulaire d'Inscription</h1>
          <p>Créez un compte pour votre agence ou votre entreprise de promotion immobilière</p>
        </div>

        {/* Form Card */}
        <div className="signup-form-card">
          <form onSubmit={submit}>
            {/* Manager Information Section */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon">👤</div>
                <h2>Information Gérant</h2>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Nom <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Votre nom de famille"
                    value={form.name}
                    onChange={update('name')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Prénom <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Votre prénom"
                    value={form.firstName}
                    onChange={update('firstName')}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Date de naissance <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={update('birthDate')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Lieu de naissance <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ville, Pays"
                    value={form.birthPlace}
                    onChange={update('birthPlace')}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Téléphone <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+225 00 00 00 00"
                    value={form.phone}
                    onChange={update('phone')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    NIN <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Numéro d'identification national"
                    value={form.nin}
                    onChange={update('nin')}
                    required
                  />
                </div>
              </div>

              {/* NIN Document Upload */}
              <div className="document-section">
                <div className="document-section-title">
                  📄 Carte d'Identité / Passeport (NIN)
                </div>
                <DocumentUploadWidget
                  label="📤 Cliquez ou glissez votre document NIN (PDF/Image)"
                  documentType="nin"
                  value={form.ninDocument}
                  onFileUploaded={(url) => setForm({ ...form, ninDocument: url })}
                />
                <p className="form-helper">Format accepté: PDF, JPG, PNG, GIF, WebP (Max 10MB)</p>
              </div>
            </div>

            {/* Company Information Section */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon">🏢</div>
                <h2>Information Entreprise</h2>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Nom de l'entreprise <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Dénomination sociale"
                    value={form.companyName}
                    onChange={update('companyName')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Téléphone entreprise <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+225 00 00 00 00"
                    value={form.companyPhone}
                    onChange={update('companyPhone')}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Adresse entreprise <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Rue, Numéro, Code postal..."
                    value={form.companyAddress}
                    onChange={update('companyAddress')}
                    required
                  />
                </div>
              </div>

              {/* GPS Location Section */}
              <div className="form-group">
                <label>
                  Coordonnées GPS <span className="optional">(optionnel)</span>
                </label>
                <div className="location-input-group">
                  <input
                    type="text"
                    placeholder="latitude, longitude (ex: 6.8276, -5.2893)"
                    value={form.companyLocation}
                    onChange={update('companyLocation')}
                  />
                  <button 
                    type="button"
                    onClick={getLocation}
                    disabled={isLocating}
                    className="location-btn"
                    title="Récupérer ma position actuelle"
                  >
                    {isLocating ? '⏳ Localisation...' : '📍 Ma Position'}
                  </button>
                </div>
                {locationMessage && (
                  <div className={`location-message ${locationMessage.includes('✓') ? 'success' : 'error'}`}>
                    {locationMessage}
                  </div>
                )}
                <p className="form-helper">Cliquez sur "Ma Position" pour récupérer automatiquement vos coordonnées GPS</p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Numéro Registre de Commerce <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Numéro RCCM"
                    value={form.rcNumber}
                    onChange={update('rcNumber')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Email de contact <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="contact@entreprise.com"
                    value={form.companyEmail}
                    onChange={update('companyEmail')}
                    required
                  />
                </div>
              </div>

              {/* RC Document Upload */}
              <div className="document-section">
                <div className="document-section-title">
                  📋 Registre de Commerce (RC)
                </div>
                <DocumentUploadWidget
                  label="📤 Cliquez ou glissez votre document RC (PDF/Image)"
                  documentType="rc"
                  value={form.rcDocument}
                  onFileUploaded={(url) => setForm({ ...form, rcDocument: url })}
                />
                <p className="form-helper">Format accepté: PDF, JPG, PNG, GIF, WebP (Max 10MB)</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button 
                type="reset" 
                onClick={reset}
              >
                Annuler
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? '⏳ Envoi en cours...' : 'Envoyer la Demande'}
              </button>
            </div>

            {/* Messages */}
            {message && (
              <div className={`alert ${messageType}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
