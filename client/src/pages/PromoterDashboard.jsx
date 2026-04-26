import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import FileUploadWidget from '../components/FileUploadWidget';
import AvailabilityCalendarForm from '../components/AvailabilityCalendarForm';
import '../styles/PromoterDashboard.css';

const blankOfferForm = {
  mainCategory: '',
  subCategory: '',
  title: '',
  description: '',
  address: '',
  city: '',
  price: '',
  area: '',
  paymentTerms: '',
  propertyType: '',
  apartmentTypes: '',
  elevator: false,
  parking: false,
  floor: '',
  projectStatus: '',
  finishingState: '',
  availability: '',
  equipment: '',
  advance: '',
  access: '',
  viabilise: false,
  changeable: false,
  facadeCount: '',
  furnished: false,
  availabilityCalendar: [],
  images: [],
  videos: []
};

function PromoterDashboard() {
  const { user, token } = useContext(AuthContext);
  const [offers, setOffers] = useState([]);
  const [status, setStatus] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [form, setForm] = useState(blankOfferForm);
  const [createStep, setCreateStep] = useState(1);
  const [editingOffer, setEditingOffer] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', mainCategory: 'all', search: '' });
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, drafts: 0, views: 0, interactions: 0 });
  const [messages, setMessages] = useState([]);
  const [messageStats, setMessageStats] = useState({ sent: 0, received: 0, unread: 0 });
  const [companyMessage, setCompanyMessage] = useState({ subject: '', content: '' });
  const [companyMessageStatus, setCompanyMessageStatus] = useState('');

  useEffect(() => {
    if (user && token) {
      loadOffers();
      loadMessages();
    }
  }, [user, token, page]);

  useEffect(() => {
    const total = offers.length;
    const approved = offers.filter((o) => o.status === 'approved' && !o.isDraft).length;
    const pending = offers.filter((o) => o.status === 'pending' && !o.isDraft).length;
    const rejected = offers.filter((o) => o.status === 'rejected').length;
    const drafts = offers.filter((o) => o.isDraft).length;
    const views = offers.reduce((sum, o) => sum + (o.views || 0), 0);
    const interactions = offers.reduce((sum, o) => sum + (o.interactions || 0), 0);

    setStats({ total, approved, pending, rejected, drafts, views, interactions });

    const recentNotifications = offers
      .filter((o) => o.isDraft || o.status === 'approved' || o.status === 'rejected')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 6)
      .map((offer) => {
        const when = offer.updatedAt ? new Date(offer.updatedAt).toLocaleDateString('fr-FR') : '';
        if (offer.isDraft) {
          return { id: offer._id, title: offer.title || 'Brouillon enregistré', message: `Brouillon enregistré pour ${offer.title || 'cette offre'}.`, date: when, type: 'draft' };
        }
        if (offer.status === 'approved') {
          return { id: offer._id, title: offer.title, message: `Votre offre a été validée et publiée.`, date: when, type: 'approved' };
        }
        return { id: offer._id, title: offer.title, message: `Votre offre a été refusée.`, date: when, type: 'rejected' };
      });

    setNotifications(recentNotifications);
  }, [offers]);

  const loadOffers = async () => {
    try {
      setStatus('Chargement des offres...');
      const res = await fetch(`http://localhost:3008/offers/user/${user.userId}?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Impossible de charger les offres');
      const data = await res.json();
      setOffers(data.offers || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
      setStatus('');
    } catch (err) {
      setStatus(`Erreur: ${err.message}`);
    }
  };

  const loadMessages = async () => {
    try {
      const [sentRes, receivedRes, statsRes] = await Promise.all([
        fetch('http://localhost:3008/messages/sent', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3008/messages/received', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3008/messages/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (sentRes.ok) {
        const sentData = await sentRes.json();
        setMessageStats(prev => ({ ...prev, sent: sentData.length }));
      }

      if (receivedRes.ok) {
        const receivedData = await receivedRes.json();
        setMessages(receivedData);
        setMessageStats(prev => ({
          ...prev,
          received: receivedData.length,
          unread: receivedData.filter(m => !m.isRead).length
        }));
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await fetch(`http://localhost:3008/messages/${messageId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ));
      setMessageStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));
    } catch (error) {
      console.error('Erreur marquage message lu:', error);
    }
  };

  const handleCompanyMessageChange = (key) => (event) => {
    setCompanyMessage({ ...companyMessage, [key]: event.target.value });
  };

  const sendMessageToAdmin = async () => {
    if (!companyMessage.subject.trim() || !companyMessage.content.trim()) {
      setCompanyMessageStatus('Veuillez renseigner le sujet et le message.');
      return;
    }

    setCompanyMessageStatus('Envoi du message en cours...');
    try {
      const adminRes = await fetch('http://localhost:3008/auth/admin-id', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!adminRes.ok) throw new Error('Impossible de récupérer l\'admin');
      const { adminId } = await adminRes.json();

      const res = await fetch('http://localhost:3008/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient: adminId,
          subject: companyMessage.subject,
          content: companyMessage.content,
          type: 'company_to_admin'
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi du message');
      }

      setCompanyMessage({ subject: '', content: '' });
      setCompanyMessageStatus('✅ Votre message a bien été envoyé à l’administration.');
      loadMessages();
    } catch (err) {
      console.error('Erreur envoi message admin:', err);
      setCompanyMessageStatus(`❌ ${err.message}`);
    }
  };

  const normalizeBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

  const changeField = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm({ ...form, [key]: value });
  };

  const selectCategory = (category) => {
    setForm({ ...blankOfferForm, mainCategory: category, subCategory: '' });
    setCreateStep(category === 'promotion' ? 3 : 2);
    setEditingOffer(null);
  };

  const selectSubcategory = (subCategory) => {
    setForm({ ...form, subCategory });
    setCreateStep(3);
  };

  const handleFileUploaded = (fileUrl) => {
    setForm({ ...form, images: [...form.images, fileUrl] });
  };

  const handleVideoUploaded = (fileUrl) => {
    setForm({ ...form, videos: [...form.videos, fileUrl] });
  };

  const handleAvailabilityCalendarChange = (periods) => {
    setForm({ ...form, availabilityCalendar: periods });
  };

  const resetForm = () => {
    setForm(blankOfferForm);
    setCreateStep(1);
    setEditingOffer(null);
  };

  const validateOffer = () => {
    // Validation spéciale pour terrain/vente
    if (form.mainCategory === 'vente' && form.subCategory === 'terrain') {
      if (!form.description || !form.address || !form.area) {
        return "Veuillez renseigner la description, l'adresse et la superficie.";
      }
      return null;
    }
    // Validation spéciale pour maison/vente
    if (form.mainCategory === 'vente' && form.subCategory === 'maison') {
      if (!form.description || !form.address || !form.propertyType) {
        return "Veuillez renseigner la description, l'adresse et le type de bien.";
      }
      return null;
    }
    // Validation spéciale pour locaux_commerciaux/vente
    if (form.mainCategory === 'vente' && form.subCategory === 'locaux_commerciaux') {
      if (!form.description || !form.address || !form.area) {
        return "Veuillez renseigner la description, l'adresse et la superficie.";
      }
      return null;
    }
    // Validation spéciale pour longue_duree/location
    if (form.mainCategory === 'location' && form.subCategory === 'longue_duree') {
      if (!form.description || !form.address || !form.propertyType || !form.advance) {
        return "Veuillez renseigner la description, l'adresse, le type de bien et les avances demandées.";
      }
      return null;
    }
    if (form.mainCategory !== 'promotion' && (!form.title || !form.description || !form.address)) {
      return 'Veuillez renseigner le titre, la description et l’adresse.';
    }
    if (form.mainCategory === 'promotion' && (!form.description || !form.address || !form.paymentTerms || !form.apartmentTypes || !form.projectStatus)) {
      return 'Veuillez renseigner tous les champs obligatoires pour la promotion.';
    }
    if (form.mainCategory === 'vente') {
      if (!form.subCategory) return 'Choisissez une sous-catégorie vente.';
      if (form.subCategory !== 'maison' && !form.area) return 'Veuillez renseigner la superficie.';
      if (form.subCategory === 'maison' && !form.propertyType) return 'Veuillez renseigner le type de maison.';
      if (form.subCategory === 'locaux_commerciaux' && !form.facadeCount) return 'Veuillez renseigner le nombre de façades.';
    }
    if (form.mainCategory === 'location') {
      if (!form.subCategory) return 'Choisissez une sous-catégorie location.';
      if (form.subCategory !== 'longue_duree' && !form.area) return 'Veuillez renseigner la superficie.';
      if (form.subCategory !== 'longue_duree' && !form.propertyType) return 'Veuillez renseigner le type de bien.';
      if (form.subCategory === 'longue_duree' && !form.advance) return 'Veuillez indiquer les avances requises.';
      if (form.subCategory === 'courte_duree' && !form.equipment) return 'Veuillez indiquer les équipements.';
      if (form.subCategory === 'courte_duree' && (!Array.isArray(form.availabilityCalendar) || form.availabilityCalendar.length === 0)) return 'Veuillez renseigner le calendrier de réservation.';
    }
    if (form.mainCategory === 'promotion' && !form.paymentTerms) {
      return 'Veuillez renseigner le type de paiement pour la promotion.';
    }
    return null;
  };

  const buildPayload = (isDraft) => ({
    ...form,
    title: form.mainCategory === 'promotion' ? `Promotion - ${form.address}` : 
           (form.mainCategory === 'vente' && form.subCategory === 'terrain') ? `Terrain - ${form.address}` :
           (form.mainCategory === 'vente' && form.subCategory === 'maison') ? `Maison - ${form.address}` :
           (form.mainCategory === 'vente' && form.subCategory === 'locaux_commerciaux') ? `Locaux commerciaux - ${form.address}` :
           (form.mainCategory === 'location' && form.subCategory === 'longue_duree') ? `Location - ${form.address}` :
           form.title,
    price: form.price ? Number(form.price) : undefined,
    area: form.area ? Number(form.area) : undefined,
    floor: form.floor ? Number(form.floor) : undefined,
    facadeCount: form.facadeCount ? Number(form.facadeCount) : undefined,
    apartmentTypes: form.mainCategory === 'promotion' ? Number(form.apartmentTypes) : (form.apartmentTypes ? form.apartmentTypes.split(',').map((item) => item.trim()).filter(Boolean) : []),
    equipment: form.equipment ? form.equipment.split(',').map((item) => item.trim()).filter(Boolean) : [],
    availabilityCalendar: Array.isArray(form.availabilityCalendar) ? form.availabilityCalendar : [],
    viabilise: normalizeBoolean(form.viabilise),
    changeable: normalizeBoolean(form.changeable),
    isDraft,
    status: 'pending',
    isPublished: false
  });

  const submitOffer = async (isDraft = false) => {
    if (!isDraft) {
      const validationMessage = validateOffer();
      if (validationMessage) {
        setStatus(`❌ ${validationMessage}`);
        return;
      }
    }
    setStatus('Enregistrement en cours...');
    
    // DEBUG: Check form values for maison BEFORE building payload
    if (form.mainCategory === 'vente' && form.subCategory === 'maison') {
      console.log('🔍 FORM MAISON AVANT PAYLOAD:', {
        description: form.description,
        address: form.address,
        propertyType: form.propertyType
      });
    }

    // DEBUG: Check form values for terrain BEFORE building payload
    if (form.mainCategory === 'vente' && form.subCategory === 'terrain') {
      console.log('🔍 FORM TERRAIN AVANT PAYLOAD:', {
        changeable: form.changeable,
        viabilise: form.viabilise
      });
    }
    
    const payload = buildPayload(isDraft);

    // DEBUG: Log payload for maison
    if (form.mainCategory === 'vente' && form.subCategory === 'maison') {
      console.log('📤 PAYLOAD MAISON ENVOYÉ:', {
        mainCategory: payload.mainCategory,
        subCategory: payload.subCategory,
        description: payload.description,
        address: payload.address,
        propertyType: payload.propertyType
      });
    }

    // DEBUG: Log payload for terrain
    if (form.mainCategory === 'vente' && form.subCategory === 'terrain') {
      console.log('📤 PAYLOAD TERRAIN ENVOYÉ:', {
        mainCategory: payload.mainCategory,
        subCategory: payload.subCategory,
        changeable: payload.changeable,
        viabilise: payload.viabilise
      });
    }
    try {
      const url = editingOffer ? `http://localhost:3008/offers/${editingOffer._id}` : 'http://localhost:3008/offers';
      const method = editingOffer ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur serveur');
      }
      const data = await res.json();
      setStatus(`✅ ${data.message}`);
      resetForm();
      setActiveSection('offers');
      loadOffers();
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  const openEditOffer = (offer) => {
    setActiveSection('create');
    setEditingOffer(offer);
    setCreateStep(offer.mainCategory === 'promotion' ? 3 : 2);
    setForm({
      mainCategory: offer.mainCategory || '',
      subCategory: offer.subCategory || '',
      title: offer.title || '',
      description: offer.description || '',
      address: offer.address || '',
      city: offer.city || '',
      price: offer.price?.toString() || '',
      area: offer.area?.toString() || '',
      paymentTerms: offer.paymentTerms || '',
      propertyType: offer.propertyType || '',
      apartmentTypes: Array.isArray(offer.apartmentTypes) ? offer.apartmentTypes.join(', ') : offer.apartmentTypes || '',
      elevator: Boolean(offer.elevator),
      parking: Boolean(offer.parking),
      floor: offer.floor?.toString() || '',
      projectStatus: offer.projectStatus || '',
      finishingState: offer.finishingState || '',
      availability: offer.availability || '',
      equipment: Array.isArray(offer.equipment) ? offer.equipment.join(', ') : offer.equipment || '',
      advance: offer.advance || '',
      access: offer.access || '',
      viabilise: offer.viabilise === true || offer.viabilise === 'true',
      changeable: offer.changeable === true || offer.changeable === 'true',
      facadeCount: offer.facadeCount?.toString() || '',
      furnished: Boolean(offer.furnished),
      availabilityCalendar: Array.isArray(offer.availabilityCalendar) ? offer.availabilityCalendar : [],
      images: offer.images || [],
      videos: offer.videos || []
    });
  };

  const deleteOffer = async (offerId) => {
    if (!window.confirm('Supprimer cette offre ?')) return;
    try {
      const res = await fetch(`http://localhost:3008/offers/${offerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Impossible de supprimer');
      setStatus('✅ Offre supprimée');
      loadOffers();
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  const filteredOffers = offers.filter((offer) => {
    const statusMatch = filters.status === 'all' ||
      (filters.status === 'draft' && offer.isDraft) ||
      (filters.status === 'pending' && offer.status === 'pending' && !offer.isDraft) ||
      (filters.status === 'approved' && offer.status === 'approved') ||
      (filters.status === 'rejected' && offer.status === 'rejected');
    const categoryMatch = filters.mainCategory === 'all' || offer.mainCategory === filters.mainCategory;
    const search = filters.search.trim().toLowerCase();
    const searchMatch = !search || [offer.title, offer.description, offer.address, offer.subCategory].some((field) => field?.toLowerCase().includes(search));
    return statusMatch && categoryMatch && searchMatch;
  });

  return (
    <div className="promoter-dashboard">
      <div className="dashboard-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <h2>Espace Entreprise</h2>
            <p>Agence / Promoteur</p>
          </div>
          <nav className="sidebar-nav">
            <button className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
              Dashboard
            </button>
            <button className={`menu-item ${activeSection === 'create' ? 'active' : ''}`} onClick={() => { resetForm(); setActiveSection('create'); }}>
              Créer une offre
            </button>
            <button className={`menu-item ${activeSection === 'offers' ? 'active' : ''}`} onClick={() => setActiveSection('offers')}>
              Mes offres
            </button>
            <button className={`menu-item ${activeSection === 'messages' ? 'active' : ''}`} onClick={() => setActiveSection('messages')}>
              Messages
            </button>
            <button className={`menu-item ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => setActiveSection('profile')}>
              Profil
            </button>
          </nav>
        </aside>

        <main className="content-area">
          {status && <div className={`dashboard-alert ${status.includes('❌') ? 'error' : status.includes('✅') ? 'success' : 'info'}`}>{status}</div>}

          {activeSection === 'dashboard' && (
            <section className="dashboard-panel">
              <div className="dashboard-top">
                <div>
                  <h1>Bienvenue, {user?.companyName || user?.name}</h1>
                  <p>Suivez les performances de vos offres, consultez vos publications et gérez votre activité.</p>
                </div>
                <div className="dashboard-cta">
                  <button onClick={() => { resetForm(); setActiveSection('create'); }}>Créer une offre</button>
                </div>
              </div>

              <div className="overview-grid">
                <div className="overview-card"><span>Offres totales</span><strong>{stats.total}</strong></div>
                <div className="overview-card"><span>Validées</span><strong>{stats.approved}</strong></div>
                <div className="overview-card"><span>En attente</span><strong>{stats.pending}</strong></div>
                <div className="overview-card"><span>Rejetées</span><strong>{stats.rejected}</strong></div>
                <div className="overview-card"><span>Brouillons</span><strong>{stats.drafts}</strong></div>
                <div className="overview-card"><span>Vues totales</span><strong>{stats.views}</strong></div>
              </div>

              <div className="dashboard-widgets">
                <div className="widget-card">
                  <h3>Alertes récentes</h3>
                  {notifications.length ? (
                    <ul className="notification-list">
                      {notifications.map((note) => (
                        <li key={note.id} className={`notification-item ${note.type}`}>
                          <strong>{note.title}</strong>
                          <p>{note.message}</p>
                          <span>{note.date}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Aucune notification pour le moment.</p>
                  )}
                </div>
                <div className="widget-card">
                  <h3>Performance rapide</h3>
                  <div className="small-stat"><span>Vues</span><strong>{stats.views}</strong></div>
                  <div className="small-stat"><span>Interactions</span><strong>{stats.interactions}</strong></div>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'create' && (
            <section className="create-offer-section">
              <div className="section-header">
                <h2>{editingOffer ? 'Modifier une offre' : 'Créer une nouvelle offre'}</h2>
                <p>Processus en étapes : catégorie → sous-catégorie → détails du bien.</p>
              </div>
              <div className="wizard-steps">
                <div className={`step-card ${createStep === 1 ? 'active' : ''}`}><span>1</span><div><strong>Catégorie</strong><p>Sélectionnez la catégorie principale.</p></div></div>
                <div className={`step-card ${createStep === 2 ? 'active' : createStep > 2 ? 'completed' : ''}`}><span>2</span><div><strong>Sous-catégorie</strong><p>Choisissez le type correspondant.</p></div></div>
                <div className={`step-card ${createStep === 3 ? 'active' : ''}`}><span>3</span><div><strong>Détails</strong><p>Complétez le formulaire adapté.</p></div></div>
              </div>

              {createStep === 1 && (
                <div className="category-selection">
                  <button className={`category-box ${form.mainCategory === 'location' ? 'active' : ''}`} type="button" onClick={() => selectCategory('location')}><h3>Location</h3><p>Location longue durée ou courte durée.</p></button>
                  <button className={`category-box ${form.mainCategory === 'vente' ? 'active' : ''}`} type="button" onClick={() => selectCategory('vente')}><h3>Vente particulier</h3><p>Terrain, maison ou locaux commerciaux.</p></button>
                  <button className={`category-box ${form.mainCategory === 'promotion' ? 'active' : ''}`} type="button" onClick={() => selectCategory('promotion')}><h3>Promotion</h3><p>Projets immobiliers sans sous-catégorie.</p></button>
                </div>
              )}

              {createStep === 2 && form.mainCategory === 'vente' && (
                <div className="category-selection">
                  <button className={`category-box ${form.subCategory === 'terrain' ? 'active' : ''}`} type="button" onClick={() => selectSubcategory('terrain')}><h3>Terrain</h3><p>Annonce terrain avec accès et viabilisation.</p></button>
                  <button className={`category-box ${form.subCategory === 'maison' ? 'active' : ''}`} type="button" onClick={() => selectSubcategory('maison')}><h3>Maison</h3><p>Maison ou villa avec finition.</p></button>
                  <button className={`category-box ${form.subCategory === 'locaux_commerciaux' ? 'active' : ''}`} type="button" onClick={() => selectSubcategory('locaux_commerciaux')}><h3>Locaux commerciaux</h3><p>Espace commercial avec façade.</p></button>
                </div>
              )}

              {createStep === 2 && form.mainCategory === 'location' && (
                <div className="category-selection">
                  <button className={`category-box ${form.subCategory === 'longue_duree' ? 'active' : ''}`} type="button" onClick={() => selectSubcategory('longue_duree')}><h3>Longue durée</h3><p>Louer sur du long terme.</p></button>
                  <button className={`category-box ${form.subCategory === 'courte_duree' ? 'active' : ''}`} type="button" onClick={() => selectSubcategory('courte_duree')}><h3>Courte durée</h3><p>Location saisonnière ou touristique.</p></button>
                </div>
              )}

              {createStep === 3 && (
                <form className="offer-form" onSubmit={(e) => { e.preventDefault(); submitOffer(false); }}>
                  {form.mainCategory === 'promotion' ? (
                    // Formulaire simplifié pour les promotions
                    <>
                      <div className="form-section">
                        <h4>🏗️ Nouvelle promotion immobilière</h4>
                        <div className="form-intro">
                          <p>Renseignez les informations essentielles de votre projet promotionnel. Tous les champs sont obligatoires pour une meilleure visibilité.</p>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>📍 Localisation</h4>
                        <div className="form-group required">
                          <label>Adresse complète *</label>
                          <input
                            type="text"
                            value={form.address}
                            onChange={changeField('address')}
                            placeholder="Ex: Cité 200 logements, Iheddaden, Béjaia"
                            required
                          />
                          <small>Adresse précise du projet pour faciliter la localisation.</small>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>📝 Description du projet</h4>
                        <div className="form-group required">
                          <label>Description détaillée *</label>
                          <textarea
                            rows="5"
                            value={form.description}
                            onChange={changeField('description')}
                            placeholder="Décrivez votre projet promotionnel : nombre d'appartements, équipements, environnement, avantages..."
                            required
                          />
                          <small>Minimum 50 caractères. Présentez les atouts de votre promotion.</small>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>💰 Modalités financières</h4>
                        <div className="form-group required">
                          <label>Modalités de paiement *</label>
                          <input
                            type="text"
                            value={form.paymentTerms}
                            onChange={changeField('paymentTerms')}
                            placeholder="Ex: 30% acompte, mensualités sur 24 mois"
                            required
                          />
                          <small>Précisez les conditions de paiement (acomptes, échéanciers, etc.).</small>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>🏢 Caractéristiques du projet</h4>
                        <div className="form-grid">
                          <div className="form-group required">
                            <label>Nombre d'appartements *</label>
                            <input
                              type="number"
                              value={form.apartmentTypes}
                              onChange={changeField('apartmentTypes')}
                              placeholder="Ex: 50"
                              min="1"
                              required
                            />
                            <small>Nombre total d'appartements dans la promotion.</small>
                          </div>
                          <div className="form-group required">
                            <label>Statut du projet *</label>
                            <select
                              value={form.projectStatus}
                              onChange={changeField('projectStatus')}
                              required
                            >
                              <option value="">-- Sélectionnez --</option>
                              <option value="conception">En conception</option>
                              <option value="en_construction">En construction</option>
                              <option value="pret_livraison">Prêt à la livraison</option>
                            </select>
                            <small>État d'avancement actuel du projet.</small>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : form.mainCategory === 'vente' && form.subCategory === 'maison' ? (
                    // Formulaire simplifié pour Maison/Vente
                    <>
                      <div className="form-section">
                        <h4>🏠 Description de la maison</h4>
                        <div className="form-group required">
                          <label>Description complète *</label>
                          <textarea
                            rows="5"
                            value={form.description}
                            onChange={changeField('description')}
                            placeholder="Décrivez votre maison : nombre de pièces, superficie, équipements, environnement..."
                            required
                          />
                          <small>Minimum 50 caractères. Soyez descriptif et mettez en avant les atouts de votre maison.</small>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>📍 Localisation</h4>
                        <div className="form-group required">
                          <label>Adresse complète *</label>
                          <input
                            type="text"
                            value={form.address}
                            onChange={changeField('address')}
                            placeholder="Ex: Rue de l'Indépendance, Béjaia"
                            required
                          />
                          <small>Indiquez l'adresse exacte pour faciliter la localisation.</small>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>🏠 Caractéristiques de la maison</h4>
                        <div className="form-group required">
                          <label>Type de bien *</label>
                          <select
                            value={form.propertyType}
                            onChange={changeField('propertyType')}
                            required
                          >
                            <option value="">-- Sélectionnez le type --</option>
                            <option value="villa">Villa</option>
                            <option value="maison_individuelle">Maison individuelle</option>
                            <option value="duplex">Duplex</option>
                            <option value="triplex">Triplex</option>
                            <option value="appartement">Appartement</option>
                            <option value="studio">Studio</option>
                            <option value="autre">Autre</option>
                          </select>
                          <small>Choisissez le type de bien immobilier.</small>
                        </div>
                      </div>
                    </>
                  ) : form.mainCategory === 'vente' && form.subCategory === 'locaux_commerciaux' ? (
                    // Formulaire simplifié pour Locaux commerciaux/Vente
                    <>
                      <div className="form-section">
                        <h4>🏪 Description des locaux commerciaux</h4>
                        <div className="form-group required">
                          <label>Description complète *</label>
                          <textarea
                            rows="5"
                            value={form.description}
                            onChange={changeField('description')}
                            placeholder="Décrivez vos locaux commerciaux : superficie, configuration, équipements, accessibilité..."
                            required
                          />
                          <small>Minimum 50 caractères. Soyez descriptif et mettez en avant les atouts de vos locaux.</small>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>📍 Localisation et dimensions</h4>
                        <div className="form-grid">
                          <div className="form-group required">
                            <label>Adresse complète *</label>
                            <input
                              type="text"
                              value={form.address}
                              onChange={changeField('address')}
                              placeholder="Ex: Centre-ville, Béjaia"
                              required
                            />
                            <small>Indiquez l'adresse exacte pour faciliter la localisation.</small>
                          </div>
                          <div className="form-group required">
                            <label>Superficie (m²) *</label>
                            <input
                              type="number"
                              value={form.area}
                              onChange={changeField('area')}
                              placeholder="Ex: 150"
                              min="1"
                              required
                            />
                            <small>Superficie totale des locaux en mètres carrés.</small>
                          </div>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>🏢 Caractéristiques des locaux</h4>
                        <div className="form-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={form.viabilise}
                              onChange={(e) => setForm({ ...form, viabilise: e.target.checked })}
                            />
                            <span style={{ marginLeft: '8px' }}>Bonne visibilité</span>
                          </label>
                          <small>Cochez si les locaux ont une bonne visibilité et accessibilité.</small>
                        </div>
                      </div>
                    </>
                  ) : form.mainCategory === 'vente' && form.subCategory === 'terrain' ? (
                    // Formulaire simplifié pour Terrain/Vente
                    <>
                      <div className="form-section">
                        <h4>📝 Description du terrain</h4>
                        <div className="form-group required">
                          <label>Description complète *</label>
                          <textarea
                            rows="5"
                            value={form.description}
                            onChange={changeField('description')}
                            placeholder="Décrivez votre terrain : surface, situation, accès, voisinage, potentialités..."
                            required
                          />
                          <small>Minimum 50 caractères. Soyez descriptif et mettez en avant les atouts de votre terrain.</small>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>📍 Localisation et dimensions</h4>
                        <div className="form-grid">
                          <div className="form-group required">
                            <label>Adresse complète *</label>
                            <input
                              type="text"
                              value={form.address}
                              onChange={changeField('address')}
                              placeholder="Ex: Route nationale, Béjaia"
                              required
                            />
                            <small>Indiquez l'adresse exacte pour faciliter la localisation.</small>
                          </div>
                          <div className="form-group required">
                            <label>Superficie (m²) *</label>
                            <input
                              type="number"
                              value={form.area}
                              onChange={changeField('area')}
                              placeholder="Ex: 500"
                              min="1"
                              required
                            />
                            <small>Superficie totale du terrain en mètres carrés.</small>
                          </div>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>🏗️ Caractéristiques du terrain</h4>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={form.viabilise}
                                onChange={(e) => setForm({ ...form, viabilise: e.target.checked })}
                              />
                              <span style={{ marginLeft: '8px' }}>Terrain viabilisé</span>
                            </label>
                            <small>Cochez si le terrain est raccordé aux services (eau, électricité, routes).</small>
                          </div>
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={form.changeable}
                                onChange={(e) => setForm({ ...form, changeable: e.target.checked })}
                              />
                              <span style={{ marginLeft: '8px' }}>Possibilité de changement</span>
                            </label>
                            <small>Cochez si le terrain est ouvert à une échange ou co-vente.</small>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : form.mainCategory === 'location' && form.subCategory === 'longue_duree' ? (
                    // Formulaire simplifié pour Location Longue Durée
                    <>
                      <div className="form-section">
                        <h4>🏠 Description du bien en location</h4>
                        <div className="form-group required">
                          <label>Description complète *</label>
                          <textarea
                            rows="5"
                            value={form.description}
                            onChange={changeField('description')}
                            placeholder="Décrivez le bien à louer : superficie, équipements, environnement, avantages..."
                            required
                          />
                          <small>Minimum 50 caractères. Soyez descriptif et mettez en avant les atouts du bien.</small>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>📍 Localisation</h4>
                        <div className="form-group required">
                          <label>Adresse complète *</label>
                          <input
                            type="text"
                            value={form.address}
                            onChange={changeField('address')}
                            placeholder="Ex: Rue de l'Indépendance, Béjaia"
                            required
                          />
                          <small>Indiquez l'adresse exacte pour faciliter la localisation.</small>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>🏠 Caractéristiques du bien</h4>
                        <div className="form-grid">
                          <div className="form-group required">
                            <label>Type de bien *</label>
                            <select
                              value={form.propertyType}
                              onChange={changeField('propertyType')}
                              required
                            >
                              <option value="">-- Sélectionnez le type --</option>
                              <option value="appartement">Appartement</option>
                              <option value="maison">Maison</option>
                              <option value="villa">Villa</option>
                              <option value="bureau">Bureau</option>
                              <option value="local_commercial">Local commercial</option>
                              <option value="studio">Studio</option>
                              <option value="duplex">Duplex</option>
                              <option value="autre">Autre</option>
                            </select>
                            <small>Choisissez le type de bien immobilier.</small>
                          </div>
                          <div className="form-group required">
                            <label>Avances demandées *</label>
                            <input
                              type="text"
                              value={form.advance}
                              onChange={changeField('advance')}
                              placeholder="Ex: 3 mois d'avance"
                              required
                            />
                            <small>Précisez le montant des avances requises (ex: 3 mois, 6 mois).</small>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Formulaire complet pour les autres catégories
                    <>
                      <div className="form-section">
                        <h4>📝 Informations générales</h4>
                        <div className="form-help">
                          <div className="form-help-content">
                            <h5>💡 Conseils pour un titre accrocheur</h5>
                            <p>Choisissez un titre descriptif qui met en avant les points forts de votre bien. Évitez les abréviations et soyez précis sur la localisation.</p>
                          </div>
                        </div>
                        <div className="form-examples">
                          <h5>📝 Exemples de titres réussis</h5>
                          <ul>
                            <li>"Magnifique villa 4 chambres avec piscine à Dakar Plateau"</li>
                            <li>"Appartement T3 moderne avec terrasse à Yoff"</li>
                            <li>"Terrain viabilisé 500m² à Keur Massar - Prix négociable"</li>
                          </ul>
                        </div>
                        <div className="form-grid">
                          <div className="form-group required">
                            <label>Titre de l'offre *</label>
                            <input type="text" value={form.title} onChange={changeField('title')} placeholder="Ex: Villa moderne 3 chambres avec jardin" required />
                            <small>Maximum 100 caractères. Soyez descriptif et précis.</small>
                          </div>
                          <div className="form-group required">
                            <label>Adresse complète *</label>
                            <input type="text" value={form.address} onChange={changeField('address')} placeholder="Ex: Rue 12, Dakar Plateau" required />
                            <small>Indiquez l'adresse exacte pour faciliter la localisation.</small>
                          </div>
                          <div className="form-group">
                            <label>Ville</label>
                            <input type="text" value={form.city} onChange={changeField('city')} placeholder="Ex: Dakar" />
                          </div>
                          <div className="form-group">
                            <label>Superficie (m²)</label>
                            <input type="number" value={form.area} onChange={changeField('area')} placeholder="Ex: 120" />
                            <small>Superficie totale du bien en mètres carrés.</small>
                          </div>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>📋 Description détaillée</h4>
                        <div className="form-help">
                          <div className="form-help-content">
                            <h5>💡 Rédigez une description complète</h5>
                            <p>Décrivez votre bien de manière détaillée : équipements, environnement, avantages. Mentionnez les points forts et répondez aux questions que se posent les visiteurs.</p>
                          </div>
                        </div>
                        <div className="form-examples">
                          <h5>📝 Éléments à inclure dans la description</h5>
                          <ul>
                            <li>Nombre de pièces et disposition</li>
                            <li>Équipements et finitions</li>
                            <li>Environnement et commodités</li>
                            <li>Conditions d'accès et stationnement</li>
                            <li>Avantages uniques du bien</li>
                          </ul>
                        </div>
                        <div className="form-group required">
                          <label>Description complète *</label>
                          <textarea rows="6" value={form.description} onChange={changeField('description')} placeholder="Décrivez votre bien de manière détaillée : nombre de pièces, équipements, environnement, avantages..." required />
                          <small>Minimum 50 caractères. Soyez précis et mettez en avant les atouts de votre bien.</small>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4>💰 Informations financières</h4>
                        <div className="form-help">
                          <div className="form-help-content">
                            <h5>💡 Prix et modalités</h5>
                            <p>Le prix n'est visible que par l'administration pour validation. Précisez les modalités de paiement et conditions financières.</p>
                          </div>
                        </div>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Prix (FCFA)</label>
                            <input type="number" value={form.price} onChange={changeField('price')} placeholder="Ex: 15000000" />
                            <small>Le prix est conservé pour l'administration uniquement, il ne sera pas affiché aux clients.</small>
                          </div>
                          <div className="form-group">
                            <label>Modalités de paiement</label>
                            <input type="text" value={form.paymentTerms} onChange={changeField('paymentTerms')} placeholder="Ex: Paiement comptant, crédit possible" />
                            <small>Précisez les conditions de paiement acceptées.</small>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-section media-section premium-media">
                    <div className="media-section-header">
                      <div className="media-title-group">
                        <h4>📸 Galerie multimédia</h4>
                        <p className="media-subtitle">Mettez en valeur votre bien avec des photos et vidéos de qualité</p>
                      </div>
                      <div className="media-stats">
                        <div className="stat-badge photos">
                          <span className="stat-count">{form.images.length}</span>
                          <span className="stat-label">Photos</span>
                        </div>
                        <div className="stat-badge videos">
                          <span className="stat-count">{form.videos.length}</span>
                          <span className="stat-label">Vidéos</span>
                        </div>
                      </div>
                    </div>

                    <div className="media-upload-cards">
                      {/* Section Photos */}
                      <div className="upload-card photos-card">
                        <div className="upload-card-header">
                          <span className="upload-icon">📸</span>
                          <h5>Photos de votre bien</h5>
                          <span className="required-badge">*</span>
                        </div>
                        <p className="upload-description">Minimum 3 photos recommandées pour plus de visibilité</p>
                        <div className="upload-area">
                          <FileUploadWidget 
                            onFileUploaded={handleFileUploaded} 
                            accept="image/*" 
                            label="Cliquez ou glissez les photos ici" 
                          />
                          <div className="format-info">JPG, PNG • Max 5MB/photo</div>
                        </div>
                        {form.images.length > 0 && (
                          <div className="uploaded-files-section">
                            <div className="files-header">
                              <h6>Vos photos ({form.images.length})</h6>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{width: `${(form.images.length / 5) * 100}%`}}></div>
                              </div>
                            </div>
                            <div className="media-preview-grid">
                              {form.images.map((img, idx) => (
                                <div key={idx} className="media-card-item image-card">
                                  <div className="media-card-image">
                                    <img src={img} alt={`Photo ${idx + 1}`} />
                                    <div className="media-card-overlay">
                                      <span className="card-number">#{idx + 1}</span>
                                    </div>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="remove-media-btn" 
                                    onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })}
                                    title="Supprimer cette photo"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section Vidéos */}
                      <div className="upload-card videos-card">
                        <div className="upload-card-header">
                          <span className="upload-icon">🎬</span>
                          <h5>Vidéo de présentation</h5>
                          <span className="optional-badge">Optionnel</span>
                        </div>
                        <p className="upload-description">Une vidéo de 1-3 minutes augmente l'intérêt de 80%</p>
                        <div className="upload-area">
                          <FileUploadWidget 
                            onFileUploaded={handleVideoUploaded} 
                            accept="video/*" 
                            label="Cliquez ou glissez la vidéo ici" 
                          />
                          <div className="format-info">MP4, MOV • Max 50MB</div>
                        </div>
                        {form.videos.length > 0 && (
                          <div className="uploaded-files-section">
                            <div className="files-header">
                              <h6>Vos vidéos ({form.videos.length})</h6>
                            </div>
                            <div className="media-preview-grid videos-grid">
                              {form.videos.map((video, idx) => (
                                <div key={idx} className="media-card-item video-card-item">
                                  <div className="media-card-video">
                                    <video controls src={video}></video>
                                    <div className="video-overlay">
                                      <span className="video-icon">▶️</span>
                                    </div>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="remove-media-btn" 
                                    onClick={() => setForm({ ...form, videos: form.videos.filter((_, i) => i !== idx) })}
                                    title="Supprimer cette vidéo"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tips Section */}
                    <div className="media-tips">
                      <div className="tips-card">
                        <div className="tips-icon">💡</div>
                        <div className="tips-content">
                          <h6>Conseils pour des photos professionnelles</h6>
                          <ul className="tips-list">
                            <li>📐 Privilégiez la lumière naturelle</li>
                            <li>🎯 Capturez les détails importants</li>
                            <li>✨ Gardez un bon équilibre et une netteté</li>
                            <li>🏠 Montrez l'extérieur et l'intérieur</li>
                          </ul>
                        </div>
                      </div>
                      <div className="tips-card">
                        <div className="tips-icon">🎥</div>
                        <div className="tips-content">
                          <h6>Conseils pour une excellente vidéo</h6>
                          <ul className="tips-list">
                            <li>⏱️ Durée idéale : 1 à 3 minutes</li>
                            <li>📹 Utiliser une vidéo en haute qualité</li>
                            <li>🎵 Considérez l'ajout d'une musique douce</li>
                            <li>🗣️ Présentez les points forts du bien</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="draft-btn" onClick={() => submitOffer(true)}>
                      💾 Enregistrer en brouillon
                    </button>
                    <button type="submit" className="submit-btn">
                      {editingOffer ? '🔄 Mettre à jour et envoyer' : '🚀 Soumettre pour validation'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {activeSection === 'offers' && (
            <section className="my-offers-section">
              <div className="section-header"><h2>📋 Mes offres</h2><p>Consultez, filtrez, modifiez et supprimez vos annonces.</p></div>
              <div className="filter-bar"><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="all">Tous</option><option value="draft">Brouillons</option><option value="pending">En attente</option><option value="approved">Validées</option><option value="rejected">Rejetées</option></select><select value={filters.mainCategory} onChange={(e) => setFilters({ ...filters, mainCategory: e.target.value })}><option value="all">Toutes catégories</option><option value="promotion">Promotion</option><option value="vente">Vente</option><option value="location">Location</option></select><input type="search" placeholder="Rechercher" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
              </div>
              {filteredOffers.length > 0 ? (
                <div className="offers-grid">{filteredOffers.map((offer) => (
                  <div key={offer._id} className="offer-card"><div className="offer-image"><img src={offer.images?.[0] || 'https://via.placeholder.com/400x240?text=Photo'} alt={offer.title} /><span className={`status-badge ${offer.isDraft ? 'draft' : offer.status}`}>{offer.isDraft ? 'Brouillon' : offer.status === 'approved' ? 'Validée' : offer.status === 'pending' ? 'En attente' : 'Rejetée'}</span></div><div className="offer-card-body"><h3>{offer.title}</h3><p className="offer-location">📍 {offer.address}</p><p className="offer-category">🏷️ {offer.mainCategory} {offer.subCategory && `• ${offer.subCategory}`}</p>{offer.price && <p className="offer-price">💰 {offer.price.toLocaleString()} FCFA</p>}<p className="offer-date">📅 {new Date(offer.createdAt).toLocaleDateString('fr-FR')}</p><div className="offer-actions"><button onClick={() => openEditOffer(offer)}>Modifier</button><button className="danger" onClick={() => deleteOffer(offer._id)}>Supprimer</button></div></div></div>
                ))}</div>
              ) : (
                <div className="empty-state"><div className="empty-icon">🏠</div><h4>Aucune offre correspondant aux filtres</h4><p>Essayez un autre statut ou créez une nouvelle offre.</p></div>
              )}
            </section>
          )}

          {activeSection === 'messages' && (
            <section className="messages-section">
              <div className="section-header">
                <h2>💬 Messages</h2>
                <p>Communiquez avec l'administration et consultez vos messages.</p>
              </div>

              <div className="messages-stats">
                <div className="stat-card">
                  <span>Messages reçus</span>
                  <strong>{messageStats.received}</strong>
                </div>
                <div className="stat-card">
                  <span>Messages envoyés</span>
                  <strong>{messageStats.sent}</strong>
                </div>
                <div className="stat-card">
                  <span>Non lus</span>
                  <strong className={messageStats.unread > 0 ? 'unread' : ''}>{messageStats.unread}</strong>
                </div>
              </div>

              <div className="message-send-panel">
                <div className="message-send-card">
                  <h3>Envoyer un message à l'administration</h3>
                  <div className="form-group">
                    <label>Sujet</label>
                    <input
                      type="text"
                      value={companyMessage.subject}
                      onChange={handleCompanyMessageChange('subject')}
                      placeholder="Sujet du message"
                    />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      rows="4"
                      value={companyMessage.content}
                      onChange={handleCompanyMessageChange('content')}
                      placeholder="Votre message à l'administration"
                    />
                  </div>
                  <button type="button" className="btn-primary" onClick={sendMessageToAdmin}>
                    Envoyer au support
                  </button>
                  {companyMessageStatus && <div className="message-status">{companyMessageStatus}</div>}
                </div>
              </div>

              <div className="messages-list">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message._id} className={`message-card ${!message.isRead ? 'unread' : ''}`}>
                      <div className="message-header">
                        <strong>{message.subject}</strong>
                        <span className="message-date">
                          {new Date(message.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="message-preview">{message.content.substring(0, 100)}...</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachments">
                          📎 {message.attachments.length} pièce(s) jointe(s)
                        </div>
                      )}
                      <div className="message-actions">
                        {!message.isRead && (
                          <button
                            onClick={() => markMessageAsRead(message._id)}
                            className="btn-secondary"
                          >
                            Marquer comme lu
                          </button>
                        )}
                        <button className="btn-primary">Voir le détail</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <h4>📭 Aucun message</h4>
                    <p>Vous n'avez pas encore reçu de messages de l'administration.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeSection === 'profile' && (
            <section className="profile-section">
              <div className="section-header">
                <h2>🏢 Profil de l'entreprise</h2>
                <p>Gérez vos informations, paramètres et équipe.</p>
              </div>

              <div className="profile-content">
                <div className="profile-main-card">
                  <div className="company-header">
                    <div className="company-logo">
                      <span className="logo-placeholder">{user?.companyName?.charAt(0) || 'E'}</span>
                    </div>
                    <div className="company-info">
                      <h3>{user?.companyName || 'Entreprise'}</h3>
                      <p className="company-type">Agence Immobilière</p>
                      <div className="company-status">
                        <span className={`status-badge ${user?.status === 'approved' ? 'active' : 'pending'}`}>
                          {user?.status === 'approved' ? '✓ Approuvé' : '⏳ En attente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="company-details-grid">
                    <div className="detail-group">
                      <h4>Informations de contact</h4>
                      <div className="detail-item">
                        <span className="label">Email professionnel</span>
                        <span className="value">{user?.companyEmail}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Téléphone</span>
                        <span className="value">{user?.companyPhone || 'Non renseigné'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Adresse</span>
                        <span className="value">{user?.companyAddress || 'Non renseignée'}</span>
                      </div>
                    </div>

                    <div className="detail-group">
                      <h4>Informations légales</h4>
                      <div className="detail-item">
                        <span className="label">Numéro RC</span>
                        <span className="value">{user?.rcNumber || 'Non renseigné'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">ICE</span>
                        <span className="value">{user?.iceNumber || 'Non renseigné'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Date d'inscription</span>
                        <span className="value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="detail-group">
                      <h4>Statistiques</h4>
                      <div className="stats-grid">
                        <div className="stat-item">
                          <span className="stat-number">{stats.total}</span>
                          <span className="stat-label">Offres totales</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-number">{stats.approved}</span>
                          <span className="stat-label">Approuvées</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-number">{stats.pending}</span>
                          <span className="stat-label">En attente</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-number">{stats.views}</span>
                          <span className="stat-label">Vues</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">👥</div>
                    <h4>Équipe</h4>
                    <p>Gérez les membres de votre équipe et leurs accès.</p>
                    <div className="feature-status">
                      <span className="coming-soon">Bientôt disponible</span>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h4>Analytics</h4>
                    <p>Suivez les performances de vos offres en détail.</p>
                    <div className="feature-status">
                      <span className="coming-soon">Bientôt disponible</span>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">📝</div>
                    <h4>Modèles</h4>
                    <p>Créez des modèles d'annonces pour gagner du temps.</p>
                    <div className="feature-status">
                      <span className="coming-soon">Bientôt disponible</span>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">💬</div>
                    <h4>Messagerie</h4>
                    <p>Communiquez directement avec l'administration.</p>
                    <div className="feature-status">
                      <span className="available">Disponible</span>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">🔔</div>
                    <h4>Notifications</h4>
                    <p>Recevez des alertes sur vos offres et messages.</p>
                    <div className="feature-status">
                      <span className="available">Disponible</span>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">🔒</div>
                    <h4>Sécurité</h4>
                    <p>Gérez vos mots de passe et la sécurité du compte.</p>
                    <div className="feature-status">
                      <span className="coming-soon">Bientôt disponible</span>
                    </div>
                  </div>
                </div>

                <div className="profile-actions">
                  <button className="btn-primary">Modifier les informations</button>
                  <button className="btn-secondary">Télécharger mes données</button>
                  <button className="btn-danger">Supprimer le compte</button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default PromoterDashboard;
