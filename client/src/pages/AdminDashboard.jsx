import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/admin-dashboard-clean.css';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Helper function to format document URLs
const formatDocumentUrl = (url) => {
  if (!url) {
    console.warn('⚠️ Document URL is empty');
    return '';
  }
  
  // If URL is already absolute (starts with http or https), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ Document URL is absolute:', url.substring(0, 50) + '...');
    return url;
  }
  
  // If it looks like a Cloudinary URL (contains res.cloudinary.com), it might be missing protocol
  if (url.includes('cloudinary') || url.includes('res.')) {
    const fixedUrl = url.startsWith('//') ? `https:${url}` : `https://${url}`;
    console.log('🔧 Fixed Cloudinary URL:', fixedUrl.substring(0, 50) + '...');
    return fixedUrl;
  }
  
  // Otherwise it's a relative path, prepend API_URL
  const finalUrl = `${API_URL}${url}`;
  console.log('📁 Local document URL:', finalUrl);
  return finalUrl;
};

function AdminDashboard() {
  const { user, token } = useContext(AuthContext);
  const [tab, setTab] = useState('requests'); // requests, offers, contacts, audit, stats
  const [status, setStatus] = useState('');
  
  // Requests & Offers & Contacts
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [editedOffer, setEditedOffer] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageFilter, setMessageFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [offerStatusFilter, setOfferStatusFilter] = useState('pending');

  // Audit logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({ pages: 1 });
  const [auditFilters, setAuditFilters] = useState({ action: '', entity: '', dateRange: '' });

  // Statistics
  const [stats, setStats] = useState({
    totalOffers: 0,
    approvedOffers: 0,
    pendingOffers: 0,
    rejectedOffers: 0,
    byCategory: {},
    totalActions: 0,
    actionCounts: {},
    entityCounts: {},
    recentActivityLast10Days: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (user && token) {
      if (tab === 'requests') loadRequests();
      else if (tab === 'offers') loadOffers();
      else if (tab === 'contacts') loadContacts();
      else if (tab === 'users') loadUsers();
      else if (tab === 'messages') loadMessages();
      else if (tab === 'audit') loadAuditLogs();
      else if (tab === 'stats') loadStats();
    }
  }, [user, token, tab, page, auditPage, auditFilters, offerStatusFilter]);

  const loadRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/requests`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setRequests(data);
      setSelectedRequest(null);
      setShowRequestDetails(false);
    } catch (err) {
      setStatus(`Erreur: ${err.message}`);
    }
  };

  const loadOffers = async () => {
    try {
      const statusQuery = offerStatusFilter && offerStatusFilter !== 'all' ? `&status=${offerStatusFilter}` : '';
      const res = await fetch(`${API_URL}/offers/admin/all?page=${page}${statusQuery}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setOffers(data.offers || []);
      setPagination(data.pagination || { pages: 1 });
      setSelectedOffer(null);
      setShowOfferDetails(false);
      setEditedOffer(null);
    } catch (err) {
      setStatus(`Erreur: ${err.message}`);
    }
  };

  useEffect(() => {
    if (selectedOffer) {
      setEditedOffer({ ...selectedOffer });
    } else {
      setEditedOffer(null);
    }
  }, [selectedOffer]);

  const loadContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/contacts`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement des messages clients');
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      setStatus(`Erreur: ${err.message}`);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setStatus(`Erreur chargement utilisateurs: ${err.message}`);
    }
  };

  const deleteUser = async (userId) => {
    if (!userId) {
      setStatus('Erreur suppression : identifiant utilisateur manquant.');
      return;
    }

    console.log('deleteUser appelée avec userId:', userId);
    console.log('Token disponible:', !!token);

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      console.log('Suppression annulée par l\'utilisateur');
      return;
    }

    try {
      console.log('Envoi de la requête DELETE...');
      const res = await fetch(`${API_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Réponse reçue:', res.status, res.statusText);

      const errorText = await res.text();
      if (!res.ok) {
        let errorMessage = errorText;
        try {
          errorMessage = JSON.parse(errorText)?.message || errorText;
        } catch {
          errorMessage = errorText || 'Erreur lors de la suppression';
        }
        console.log('Erreur réponse:', errorMessage);
        throw new Error(errorMessage);
      }

      let successData = {};
      try {
        successData = JSON.parse(errorText);
      } catch {
        successData = { message: 'Utilisateur supprimé avec succès' };
      }
      console.log('Suppression réussie:', successData);
      setStatus('Utilisateur supprimé avec succès');
      setSelectedUser(null);
      setShowUserDetails(false);
      loadUsers(); // Recharger la liste
    } catch (err) {
      console.log('Erreur dans deleteUser:', err);
      setStatus(`Erreur suppression: ${err.message}`);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/admin/all`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement des messages entreprises');
      const allMessages = await res.json();
      const companyMessages = allMessages.filter(msg => msg.type === 'company_to_admin');
      setMessages(companyMessages);
    } catch (err) {
      setStatus(`Erreur: ${err.message}`);
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) {
      setReplyStatus('Veuillez saisir un message.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient: selectedMessage.sender._id,
          subject: `Re: ${selectedMessage.subject}`,
          content: replyContent,
          type: selectedMessage.type === 'client_to_admin' ? 'admin_to_client' : 'admin_to_company',
          relatedOffer: selectedMessage.relatedOffer?._id || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de l\'envoi');
      }

      setReplyStatus('✅ Réponse envoyée.');
      setReplyContent('');
      setSelectedMessage(null);
      loadMessages();
    } catch (err) {
      console.error(err);
      setReplyStatus(`❌ ${err.message}`);
    }
  };

  const clientMessages = messages.filter((message) => message.type === 'client_to_admin');
  const companyMessages = messages.filter((message) => message.type === 'company_to_admin');
  const incomingMessages = messages.filter((message) => ['client_to_admin', 'company_to_admin'].includes(message.type));
  const filteredMessages = messageFilter === 'clients'
    ? clientMessages
    : messageFilter === 'companies'
      ? companyMessages
      : incomingMessages;

  const loadAuditLogs = async () => {
    try {
      let url = `${API_URL}/audit?page=${auditPage}&limit=20`;
      if (auditFilters.action) url += `&action=${auditFilters.action}`;
      if (auditFilters.entity) url += `&entity=${auditFilters.entity}`;
      if (auditFilters.dateRange) url += `&dateRange=${auditFilters.dateRange}`;
      
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setAuditLogs(data.logs || []);
      setAuditPagination(data.pagination || { pages: 1 });
    } catch (err) {
      setStatus(`Erreur: ${err.message}`);
    }
  };

  const normalizeCounts = (data) => {
    if (!data) return {};
    if (Array.isArray(data)) {
      return data.reduce((acc, item) => {
        if (item && typeof item === 'object' && item._id !== undefined) {
          acc[item._id || 'unknown'] = item.count ?? item.total ?? 0;
        }
        return acc;
      }, {});
    }
    if (typeof data === 'object') {
      return data;
    }
    return {};
  };

  const loadStats = async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const [offersRes, auditRes] = await Promise.all([
        fetch(`${API_URL}/offers/admin/stats/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/audit/stats/overview`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const parseJson = async (res) => {
        const text = await res.text();
        try {
          return text ? JSON.parse(text) : {};
        } catch {
          return { message: text };
        }
      };

      if (!offersRes.ok) {
        const errorData = await parseJson(offersRes);
        throw new Error(errorData.message || `Statistiques offres indisponibles (${offersRes.status})`);
      }

      if (!auditRes.ok) {
        const errorData = await parseJson(auditRes);
        throw new Error(errorData.message || `Statistiques audit indisponibles (${auditRes.status})`);
      }

      const offersStats = await offersRes.json();
      const auditStats = await auditRes.json();

      setStats({
        totalOffers: offersStats.totalOffers || 0,
        approvedOffers: offersStats.approvedOffers || 0,
        pendingOffers: offersStats.pendingOffers || 0,
        rejectedOffers: offersStats.rejectedOffers || 0,
        byCategory: normalizeCounts(offersStats.byCategory),
        totalActions: auditStats.totalActions || 0,
        actionCounts: normalizeCounts(auditStats.actionCounts),
        entityCounts: normalizeCounts(auditStats.entityCounts),
        recentActivityLast10Days: auditStats.recentActivityLast10Days || 0
      });
    } catch (err) {
      setStatsError(err.message || 'Erreur lors du chargement des statistiques');
      setStatus(`Erreur: ${err.message}`);
    } finally {
      setStatsLoading(false);
    }
  };

  const approveRequest = async (id, email) => {
    try {
      const res = await fetch(`${API_URL}/requests/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur lors de l\'approbation');
      setStatus('✅ Demande approuvée. Email envoyé.');
      loadRequests();
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message}`);
    }
  };

  const rejectRequest = async (id) => {
    try {
      const res = await fetch(`${API_URL}/requests/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur lors du rejet');
      setStatus('✅ Demande rejetée.');
      loadRequests();
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message}`);
    }
  };

  const approveOffer = async (id) => {
    try {
      const res = await fetch(`${API_URL}/offers/${id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminNote: 'Approuvée par l\'administration' })
      });
      if (!res.ok) throw new Error('Erreur lors de l\'approbation');
      setStatus('✅ Offre approuvée et publiée.');
      loadOffers();
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message}`);
    }
  };

  const rejectOffer = async (id) => {
    try {
      const res = await fetch(`${API_URL}/offers/${id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminNote: rejectionReason || 'Rejetée par l\'administration' })
      });
      if (!res.ok) throw new Error('Erreur lors du rejet');
      setStatus('✅ Offre rejetée.');
      setRejectionReason('');
      loadOffers();
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message}`);
    }
  };

  const deleteOffer = async (id) => {
    try {
      const res = await fetch(`${API_URL}/offers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Impossible de supprimer');
      }
      setStatus('✅ Offre supprimée.');
      if (selectedOffer && selectedOffer._id === id) {
        setSelectedOffer(null);
        setShowOfferDetails(false);
      }
      loadOffers();
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message}`);
    }
  };

  const handleOfferFieldChange = (field, value) => {
    setEditedOffer((prev) => ({ ...prev, [field]: value }));
  };

  const saveOfferChanges = async () => {
    if (!editedOffer || !selectedOffer) return;

    try {
      const payload = { ...editedOffer };
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.user;
      delete payload.isPublished;
      delete payload.isDraft;

      payload.price = payload.price ? Number(payload.price) : undefined;
      payload.area = payload.area ? Number(payload.area) : undefined;
      payload.floor = payload.floor ? Number(payload.floor) : undefined;
      payload.facadeCount = payload.facadeCount ? Number(payload.facadeCount) : undefined;
      payload.apartmentTypes = Array.isArray(payload.apartmentTypes)
        ? payload.apartmentTypes
        : (payload.apartmentTypes ? payload.apartmentTypes.split(',').map((item) => item.trim()).filter(Boolean) : []);
      payload.equipment = Array.isArray(payload.equipment)
        ? payload.equipment
        : (payload.equipment ? payload.equipment.split(',').map((item) => item.trim()).filter(Boolean) : []);
      payload.availabilityCalendar = Array.isArray(payload.availabilityCalendar) ? payload.availabilityCalendar : [];
      payload.viabilise = String(payload.viabilise) === 'true' || payload.viabilise === true;
      payload.changeable = String(payload.changeable) === 'true' || payload.changeable === true;

      const res = await fetch(`${API_URL}/offers/${selectedOffer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Impossible de sauvegarder');
      }
      setStatus('✅ Modifications enregistrées.');
      loadOffers();
      setShowOfferDetails(false);
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message}`);
    }
  };

  const formatOfferMediaUrl = (src) => {
    if (!src) return '';
    return src.startsWith('http') ? src : `${API_URL}${src}`;
  };

  const getOfferVideoType = (src) => {
    if (!src) return 'video/mp4';
    if (src.endsWith('.webm')) return 'video/webm';
    if (src.endsWith('.ogg') || src.endsWith('.ogv')) return 'video/ogg';
    return 'video/mp4';
  };

  const getBooleanLabel = (value) => {
    if (value === true || value === 'true' || value === 1 || value === '1') return 'Oui';
    if (value === false || value === 'false' || value === 0 || value === '0') return 'Non';
    return 'N/A';
  };

  const getOfferCompanyName = (offer) => {
    return offer?.companyName || offer?.company?.companyName || offer?.creator?.companyName || offer?.user?.companyName || 'Entreprise inconnue';
  };

  const getOfferPublishedLabel = (offer) => {
    if (offer?.status === 'approved' || offer?.isPublished) return 'Oui';
    if (offer?.status === 'rejected') return 'Non';
    return 'En attente';
  };

  const cancelOfferEdit = () => {
    setEditedOffer(selectedOffer ? { ...selectedOffer } : null);
    setShowOfferDetails(false);
  };

  return (
    <div className="admin-dashboard">
      <section className="section admin-hero">
        <div className="admin-hero-content">
          <div>
            <h2>Panneau d'administration</h2>
            <p>Gérez les demandes, les offres, les utilisateurs, la messagerie et les audits depuis un espace centralisé, moderne et clair.</p>
          </div>
        </div>
      </section>

      {status && <div className={`alert ${status.includes('✅') ? 'success' : ''}`}>{status}</div>}

      <section className="section admin-tabs-section">
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => { setTab('requests'); setPage(1); }}>Demandes</button>
          <button className={`admin-tab ${tab === 'offers' ? 'active' : ''}`} onClick={() => { setTab('offers'); setPage(1); }}>Offres</button>
          <button className={`admin-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => { setTab('users'); setPage(1); }}>Utilisateurs</button>
          <button className={`admin-tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => { setTab('messages'); setPage(1); }}>Messagerie</button>
          <button className={`admin-tab ${tab === 'contacts' ? 'active' : ''}`} onClick={() => { setTab('contacts'); setPage(1); }}>Clients</button>
          <button className={`admin-tab ${tab === 'audit' ? 'active' : ''}`} onClick={() => { setTab('audit'); setAuditPage(1); }}>Audit</button>
          <button className={`admin-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => { setTab('stats'); loadStats(); }}>Statistiques</button>
        </div>
      </section>

      {tab === 'requests' && (
        <section className="section admin-panel">
          <div className="panel-header">
            <h3>Demandes d'enregistrement en attente</h3>
            <p className="panel-description">Validez ou refusez les nouveaux comptes entreprise et consultez tous les documents associés.</p>
          </div>

          <div className="requests-layout">
            <div className="request-table-panel">
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Entreprise</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.filter(r => r.status === 'pending').map((req) => (
                      <tr
                        key={req._id}
                        className={selectedRequest?._id === req._id ? 'selected-row' : ''}
                        onClick={() => setSelectedRequest(req)}
                      >
                        <td>{req.name} {req.firstName}</td>
                        <td>{req.companyEmail}</td>
                        <td>{req.companyName}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="btn btn-sm btn-primary" type="button" onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); setShowRequestDetails(true); }}>Voir détails</button>
                            <button className="btn btn-success" type="button" onClick={(e) => { e.stopPropagation(); approveRequest(req._id, req.companyEmail); }}>Approuver</button>
                            <button className="btn btn-danger" type="button" onClick={(e) => { e.stopPropagation(); rejectRequest(req._id); }}>Rejeter</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="request-details-panel">
              {selectedRequest && showRequestDetails ? (
                <div>
                  <div className="panel-header panel-header-inline">
                    <div>
                      <h4>Détails de la demande</h4>
                      <p className="panel-description">Vérifiez toutes les données et documents envoyés par l'entreprise.</p>
                    </div>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowRequestDetails(false)}>Voir moins</button>
                  </div>

                  <div className="request-detail-section">
                    <h5>Informations personnelles</h5>
                    <div className="detail-row"><span className="detail-label">Nom complet</span><span className="detail-value">{selectedRequest.name} {selectedRequest.firstName}</span></div>
                    <div className="detail-row"><span className="detail-label">Date de naissance</span><span className="detail-value">{selectedRequest.birthDate ? new Date(selectedRequest.birthDate).toLocaleDateString('fr-FR') : 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">Lieu de naissance</span><span className="detail-value">{selectedRequest.birthPlace || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">NIN</span><span className="detail-value">{selectedRequest.nin || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">Téléphone</span><span className="detail-value">{selectedRequest.phone || 'N/A'}</span></div>
                  </div>

                  <div className="request-detail-section">
                    <h5>Informations entreprise</h5>
                    <div className="detail-row"><span className="detail-label">Nom société</span><span className="detail-value">{selectedRequest.companyName || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value">{selectedRequest.companyType || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">Adresse</span><span className="detail-value">{selectedRequest.companyAddress || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">Localisation</span><span className="detail-value">{selectedRequest.companyLocation || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">Téléphone société</span><span className="detail-value">{selectedRequest.companyPhone || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">Email société</span><span className="detail-value">{selectedRequest.companyEmail || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">RC</span><span className="detail-value">{selectedRequest.rcNumber || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">Accord signé</span><span className="detail-value">{selectedRequest.hasAgreement ? 'Oui' : 'Non'}</span></div>
                  </div>

                  <div className="request-detail-section">
                    <h5>📄 Documents</h5>
                    
                    {/* NIN Document */}
                    {selectedRequest.ninDocument ? (
                      <div className="request-detail-subsection">
                        <p className="detail-label">CIN / NIN document</p>
                        {selectedRequest.ninDocument.match(/\.(pdf|jpg|jpeg|png|gif|webp)$/i) ? (
                          selectedRequest.ninDocument.match(/\.pdf$/i) ? (
                            <a href={formatDocumentUrl(selectedRequest.ninDocument)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                              📥 Télécharger le PDF
                            </a>
                          ) : (
                            <img src={formatDocumentUrl(selectedRequest.ninDocument)} alt="CIN/NIN" style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '4px' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Document+indisponible'; }} />
                          )
                        ) : (
                          <a href={formatDocumentUrl(selectedRequest.ninDocument)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                            📎 Voir le document
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="request-detail-subsection">
                        <p className="detail-label">CIN / NIN document</p>
                        <span className="detail-value" style={{ color: '#999' }}>Aucun document</span>
                      </div>
                    )}

                    {/* RC Document */}
                    {selectedRequest.rcDocument ? (
                      <div className="request-detail-subsection">
                        <p className="detail-label">Registre de commerce (RC)</p>
                        {selectedRequest.rcDocument.match(/\.(pdf|jpg|jpeg|png|gif|webp)$/i) ? (
                          selectedRequest.rcDocument.match(/\.pdf$/i) ? (
                            <a href={formatDocumentUrl(selectedRequest.rcDocument)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                              📥 Télécharger le PDF
                            </a>
                          ) : (
                            <img src={formatDocumentUrl(selectedRequest.rcDocument)} alt="Registre de Commerce" style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '4px' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Document+indisponible'; }} />
                          )
                        ) : (
                          <a href={formatDocumentUrl(selectedRequest.rcDocument)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                            📎 Voir le document
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="request-detail-subsection">
                        <p className="detail-label">Registre de commerce (RC)</p>
                        <span className="detail-value" style={{ color: '#999' }}>Aucun document</span>
                      </div>
                    )}
                  </div>

                  <div className="request-detail-section">
                    <h5>Statut</h5>
                    <div className="detail-row"><span className="detail-label">Statut actuel</span><span className="detail-value">{selectedRequest.status}</span></div>
                    <div className="detail-row"><span className="detail-label">Note admin</span><span className="detail-value">{selectedRequest.adminNote || 'Aucune'}</span></div>
                    <div className="detail-row"><span className="detail-label">Reçue le</span><span className="detail-value">{new Date(selectedRequest.createdAt).toLocaleString('fr-FR')}</span></div>
                  </div>
                </div>
              ) : (
                <div className="details-placeholder">
                  <p>Les détails de la demande ne sont pas affichés.</p>
                  <p>Cliquez sur <strong>Voir détails</strong> pour afficher les informations complètes.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'offers' && (
        <section className="section admin-panel">
          <div className="panel-header">
            <h3>{offerStatusFilter === 'pending' ? 'Offres en attente de validation' : offerStatusFilter === 'approved' ? 'Offres publiées' : offerStatusFilter === 'rejected' ? 'Offres rejetées' : 'Toutes les offres'}</h3>
            <p className="panel-description">Vérifiez les annonces soumises par les entreprises et modifiez-les, approuvez-les ou supprimez-les selon le suivi.</p>
            <p className="panel-description">Chaque offre indique l’entreprise qui l’a publiée et son statut de publication.</p>
          </div>
          <div className="requests-layout">
            <div className="offer-filter-bar">
                <span>Voir :</span>
                <button
                  className={`btn btn-sm ${offerStatusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  onClick={() => { setOfferStatusFilter('pending'); setPage(1); }}
                >
                  Offres en attente
                </button>
                <button
                  className={`btn btn-sm ${offerStatusFilter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  onClick={() => { setOfferStatusFilter('approved'); setPage(1); }}
                >
                  Offres publiées
                </button>
                <button
                  className={`btn btn-sm ${offerStatusFilter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  onClick={() => { setOfferStatusFilter('rejected'); setPage(1); }}
                >
                  Offres rejetées
                </button>
                <button
                  className={`btn btn-sm ${offerStatusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  onClick={() => { setOfferStatusFilter('all'); setPage(1); }}
                >
                  Toutes
                </button>
              </div>
              <div className="offer-summary-bar">
                <p>{offers.length} offre(s) affichée(s) pour le filtre sélectionné.</p>
              </div>
              <div className="request-table-panel">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Titre</th>
                        <th>Entreprise</th>
                        <th>Catégorie</th>
                        <th>Status</th>
                        <th>Publié</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offers.map((offer) => (
                        <tr
                          key={offer._id}
                          className={selectedOffer?._id === offer._id ? 'selected-row' : ''}
                          onClick={() => { setSelectedOffer(offer); setEditedOffer({ ...offer }); setShowOfferDetails(true); }}
                        >
                          <td>{offer.title}</td>
                          <td>{getOfferCompanyName(offer)}</td>
                          <td>{offer.mainCategory}</td>
                          <td>{offer.status}</td>
                          <td>{getOfferPublishedLabel(offer)}</td>
                          <td>
                            <div className="admin-actions">
                              {offer.status === 'pending' ? (
                                <>
                                  <button
                                    className="btn btn-sm btn-primary"
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSelectedOffer(offer); setEditedOffer({ ...offer }); setShowOfferDetails(true); }}
                                  >
                                    Voir détails
                                  </button>
                                  <button className="btn btn-success" type="button" onClick={(e) => { e.stopPropagation(); approveOffer(offer._id); }}>Approuver</button>
                                  <button className="btn btn-warning" type="button" onClick={(e) => { e.stopPropagation(); rejectOffer(offer._id); }}>Rejeter</button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-sm btn-primary"
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSelectedOffer(offer); setEditedOffer({ ...offer }); setShowOfferDetails(true); }}
                                  >
                                    Modifier
                                  </button>
                                  <button className="btn btn-danger" type="button" onClick={(e) => { e.stopPropagation(); deleteOffer(offer._id); }}>Supprimer</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="request-details-panel">
                {selectedOffer && showOfferDetails ? (
                  <div>
                    <div className="panel-header panel-header-inline">
                      <div>
                        <h4>Détails de l'offre</h4>
                        <p className="panel-description">Modifiez les champs nécessaires puis enregistrez les modifications.</p>
                      </div>
                      <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowOfferDetails(false)}>Voir moins</button>
                    </div>

                    {selectedOffer?.images?.length > 0 && (
                      <div className="request-detail-section">
                        <h5>Photos</h5>
                        <div className="media-preview-grid">
                          {selectedOffer.images.map((src, idx) => (
                            <div key={idx} className="media-card-item">
                              <img src={formatOfferMediaUrl(src)} alt={`Photo ${idx + 1}`} onError={(e) => { e.target.src = 'https://via.placeholder.com/320x220?text=Photo+indisponible'; }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedOffer?.videos?.length > 0 && (
                      <div className="request-detail-section">
                        <h5>Vidéos</h5>
                        <div className="media-preview-grid videos-grid">
                          {selectedOffer.videos.map((src, idx) => (
                            <div key={idx} className="media-card-item video-card-item">
                              <video controls preload="metadata" className="media-card-video">
                                <source src={formatOfferMediaUrl(src)} type={getOfferVideoType(src)} />
                                Votre navigateur ne supporte pas la vidéo.
                              </video>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="request-detail-section">
                      <h5>Informations essentielles</h5>
                      <div className="detail-row"><span className="detail-label">Titre</span><input value={editedOffer?.title || ''} onChange={(e) => handleOfferFieldChange('title', e.target.value)} /></div>
                      <div className="detail-row"><span className="detail-label">Entreprise</span><span className="detail-value">{getOfferCompanyName(selectedOffer)}</span></div>
                      <div className="detail-row"><span className="detail-label">Description</span><textarea rows="4" value={editedOffer?.description || ''} onChange={(e) => handleOfferFieldChange('description', e.target.value)} /></div>
                      <div className="detail-row"><span className="detail-label">Prix</span><input type="number" value={editedOffer?.price ?? ''} onChange={(e) => handleOfferFieldChange('price', e.target.value)} /></div>
                      <div className="detail-row"><span className="detail-label">Adresse</span><input value={editedOffer?.address || ''} onChange={(e) => handleOfferFieldChange('address', e.target.value)} /></div>
                      <div className="detail-row"><span className="detail-label">Ville</span><input value={editedOffer?.city || ''} onChange={(e) => handleOfferFieldChange('city', e.target.value)} /></div>
                    </div>

                    <div className="request-detail-section">
                      <h5>Catégorie</h5>
                      <div className="detail-row"><span className="detail-label">Type</span>
                        <select value={editedOffer?.mainCategory || ''} onChange={(e) => handleOfferFieldChange('mainCategory', e.target.value)}>
                          <option value="promotion">Promotion</option>
                          <option value="vente">Vente</option>
                          <option value="location">Location</option>
                        </select>
                      </div>
                      <div className="detail-row"><span className="detail-label">Sous-catégorie</span>
                        <select value={editedOffer?.subCategory || ''} onChange={(e) => handleOfferFieldChange('subCategory', e.target.value)}>
                          <option value="">Aucune</option>
                          <option value="maison">Maison</option>
                          <option value="terrain">Terrain</option>
                          <option value="locaux_commerciaux">Locaux commerciaux</option>
                          <option value="courte_duree">Courte durée</option>
                          <option value="longue_duree">Longue durée</option>
                        </select>
                      </div>
                    </div>

                    <div className="request-detail-section">
                      <h5>Caractéristiques</h5>
                      <div className="detail-row"><span className="detail-label">Surface</span><span className="detail-value">{selectedOffer.area ?? 'N/A'} {selectedOffer.area ? 'm²' : ''}</span></div>
                      <div className="detail-row"><span className="detail-label">Type de bien</span><span className="detail-value">{selectedOffer.propertyType || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Paiement</span><span className="detail-value">{selectedOffer.paymentTerms || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Appartements</span><span className="detail-value">{Array.isArray(selectedOffer.apartmentTypes) ? selectedOffer.apartmentTypes.join(', ') : selectedOffer.apartmentTypes || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Étage</span><span className="detail-value">{selectedOffer.floor ?? 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Ascenseur</span><span className="detail-value">{getBooleanLabel(selectedOffer.elevator)}</span></div>
                      <div className="detail-row"><span className="detail-label">Parking</span><span className="detail-value">{getBooleanLabel(selectedOffer.parking)}</span></div>
                      <div className="detail-row"><span className="detail-label">Projet</span><span className="detail-value">{selectedOffer.projectStatus || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Finition</span><span className="detail-value">{selectedOffer.finishingState || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Disponibilité</span><span className="detail-value">{selectedOffer.availability || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Date de livraison</span><span className="detail-value">{selectedOffer.deliveryDate ? new Date(selectedOffer.deliveryDate).toLocaleDateString('fr-FR') : 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Accès</span><span className="detail-value">{selectedOffer.access || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Viabilisé</span><span className="detail-value">{getBooleanLabel(selectedOffer.viabilise)}</span></div>
                      <div className="detail-row"><span className="detail-label">Échange possible</span><span className="detail-value">{getBooleanLabel(selectedOffer.changeable)}</span></div>
                      <div className="detail-row"><span className="detail-label">Façades</span><span className="detail-value">{selectedOffer.facadeCount ?? 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Meublé</span><span className="detail-value">{getBooleanLabel(selectedOffer.furnished)}</span></div>
                      <div className="detail-row"><span className="detail-label">Avance</span><span className="detail-value">{selectedOffer.advance || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Équipements</span><span className="detail-value">{Array.isArray(selectedOffer.equipment) ? selectedOffer.equipment.join(', ') : selectedOffer.equipment || 'N/A'}</span></div>
                    </div>

                    <div className="request-detail-section">
                      <h5>Statut de l'offre</h5>
                      <div className="detail-row"><span className="detail-label">Statut actuel</span><span className="detail-value">{selectedOffer.status}</span></div>
                      <div className="detail-row"><span className="detail-label">Note admin</span><textarea rows="3" value={editedOffer?.adminNote || ''} onChange={(e) => handleOfferFieldChange('adminNote', e.target.value)} /></div>
                    </div>

                    <div className="admin-actions" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button className="btn btn-secondary btn-sm" type="button" onClick={cancelOfferEdit}>Annuler</button>
                      <button className="btn btn-primary btn-sm" type="button" onClick={saveOfferChanges}>Enregistrer</button>
                    </div>
                  </div>
                ) : (
                  <div className="details-placeholder">
                    <p>Les détails de l'offre ne sont pas affichés.</p>
                    <p>Cliquez sur la ligne de l'offre ou sur le bouton <strong>Modifier</strong> pour consulter et modifier l'annonce.</p>
                  </div>
                )}
              </div>
            </div>
          {offers.length === 0 && (
            <div className="no-offers-message">
              <p>Aucune offre trouvée pour le filtre sélectionné ({offerStatusFilter === 'pending' ? 'En attente' : offerStatusFilter === 'approved' ? 'Publiées' : offerStatusFilter === 'rejected' ? 'Rejetées' : 'Toutes'}).</p>
            </div>
          )}
          {pagination.pages > 1 && (
            <div className="pagination-row">
              {page > 1 && <button className="btn btn-secondary" onClick={() => setPage(page - 1)}>← Précédent</button>}
              <span className="pagination-label">Page {page} / {pagination.pages}</span>
              {page < pagination.pages && <button className="btn btn-secondary" onClick={() => setPage(page + 1)}>Suivant →</button>}
            </div>
          )}
        </section>
      )}

      {tab === 'contacts' && (
        <section className="section admin-panel">
          <div className="panel-header">
            <h3>Messages clients</h3>
            <p className="panel-description">Répondez rapidement aux messages envoyés par les clients et consultez l’historique.</p>
          </div>
          <div className="admin-grid">
            <div className="admin-card">
              <h4>Répondre à un message</h4>
              <p>Sélectionnez un message client pour répondre directement depuis l'administration.</p>
              <select
                value={selectedContact?._id || ''}
                onChange={(e) => {
                  const contact = contacts.find((msg) => msg._id === e.target.value);
                  setSelectedContact(contact || null);
                  setReplyStatus('');
                }}
              >
                <option value="">Sélectionner un message</option>
                {contacts.map((contact) => (
                  <option key={contact._id} value={contact._id}>
                    {contact.subject || `Contact de ${contact.name}`}
                  </option>
                ))}
              </select>
              {selectedContact && (
                <div className="message-preview">
                  <p><strong>De :</strong> {selectedContact.name || 'Client'}</p>
                  <p><strong>Email :</strong> {selectedContact.email || 'N/A'}</p>
                  <p><strong>Téléphone :</strong> {selectedContact.phone || 'N/A'}</p>
                  {selectedContact.subject && <p><strong>Sujet :</strong> {selectedContact.subject}</p>}
                  {selectedContact.offer?.title && <p><strong>Offre liée :</strong> {selectedContact.offer.title}</p>}
                  <p><strong>Message :</strong> {selectedContact.message}</p>
                </div>
              )}
            </div>

            <div className="admin-card">
              <h4>Statistiques messages clients</h4>
              <div className="message-stats-row">
                <div className="message-stat-card">
                  <span className="message-stat-value">{contacts.length}</span>
                  <span className="message-stat-label">Messages clients</span>
                </div>
              </div>

              <div className="message-category-section">
                <h4>Historique des messages clients</h4>
                {contacts.length ? (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Expéditeur</th>
                          <th>Email</th>
                          <th>Téléphone</th>
                          <th>Sujet</th>
                          <th>Message</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((message) => (
                          <tr key={message._id}>
                            <td>{message.name || 'Client'}</td>
                            <td>{message.email || 'N/A'}</td>
                            <td>{message.phone || 'N/A'}</td>
                            <td>{message.subject || 'Sans sujet'}</td>
                            <td>{message.message || 'N/A'}</td>
                            <td>{new Date(message.createdAt).toLocaleString('fr-FR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>Aucun message client pour le moment.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === 'users' && (
        <section className="section admin-panel">
          <div className="panel-header">
            <h3>Utilisateurs</h3>
            <p className="panel-description">Liste des comptes entreprise et leurs informations de contact.</p>
          </div>
          {users.length ? (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Entreprise</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr key={userItem._id}>
                      <td>{userItem.companyName}</td>
                      <td>{userItem.companyEmail}</td>
                      <td>{userItem.companyPhone}</td>
                      <td>{userItem.status || 'N/A'}</td>
                      <td>
                        <button 
                          className="btn btn-secondary btn-small"
                          type="button"
                          onClick={() => {
                            setSelectedUser(userItem);
                            setShowUserDetails(true);
                          }}
                        >
                          Voir détails
                        </button>
                        <button 
                          className="btn btn-danger btn-small"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUser(userItem._id);
                          }}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Aucun utilisateur trouvé.</p>
          )}

          {selectedUser && showUserDetails && (
            <div className="request-details-panel">
              <div>
                <div className="panel-header panel-header-inline">
                  <div>
                    <h4>Détails de l'utilisateur</h4>
                    <p className="panel-description">Toutes les informations remplies lors de l'inscription.</p>
                  </div>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowUserDetails(false)}>Voir moins</button>
                </div>

                {/* Information Gérant */}
                <div className="request-detail-section">
                  <h5>👤 Information du Gérant</h5>
                  <div className="detail-row"><span className="detail-label">Nom</span><span className="detail-value">{selectedUser.name || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Prénom</span><span className="detail-value">{selectedUser.firstName || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Date de naissance</span><span className="detail-value">{selectedUser.birthDate ? new Date(selectedUser.birthDate).toLocaleDateString('fr-FR') : 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Lieu de naissance</span><span className="detail-value">{selectedUser.birthPlace || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Téléphone</span><span className="detail-value">{selectedUser.phone || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">NIN</span><span className="detail-value">{selectedUser.nin || 'N/A'}</span></div>
                </div>

                {/* Carte d'Identité / NIN */}
                {selectedUser.ninDocument && (
                  <div className="request-detail-section">
                    <h5>📄 Carte d'Identité (NIN)</h5>
                    <div className="document-preview">
                      {selectedUser.ninDocument.match(/\.(pdf|jpg|jpeg|png|gif|webp)$/i) ? (
                        selectedUser.ninDocument.match(/\.pdf$/i) ? (
                          <div className="document-preview-item">
                            <a href={formatDocumentUrl(selectedUser.ninDocument)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                              📥 Télécharger le PDF
                            </a>
                          </div>
                        ) : (
                          <div className="document-preview-item">
                            <img src={formatDocumentUrl(selectedUser.ninDocument)} alt="Carte d'Identité" style={{ maxWidth: '300px', maxHeight: '300px' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Document+indisponible'; }} />
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Information Entreprise */}
                <div className="request-detail-section">
                  <h5>🏢 Information Entreprise</h5>
                  <div className="detail-row"><span className="detail-label">Nom de l'entreprise</span><span className="detail-value">{selectedUser.companyName || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Type d'entreprise</span><span className="detail-value">{selectedUser.companyType || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{selectedUser.companyEmail || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Téléphone</span><span className="detail-value">{selectedUser.companyPhone || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Adresse</span><span className="detail-value">{selectedUser.companyAddress || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Coordonnées GPS</span><span className="detail-value">{selectedUser.companyLocation || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Numéro Registre de Commerce</span><span className="detail-value">{selectedUser.rcNumber || 'N/A'}</span></div>
                </div>

                {/* Registre de Commerce */}
                {selectedUser.rcDocument && (
                  <div className="request-detail-section">
                    <h5>📋 Registre de Commerce (RC)</h5>
                    <div className="document-preview">
                      {selectedUser.rcDocument.match(/\.(pdf|jpg|jpeg|png|gif|webp)$/i) ? (
                        selectedUser.rcDocument.match(/\.pdf$/i) ? (
                          <div className="document-preview-item">
                            <a href={formatDocumentUrl(selectedUser.rcDocument)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                              📥 Télécharger le PDF
                            </a>
                          </div>
                        ) : (
                          <div className="document-preview-item">
                            <img src={formatDocumentUrl(selectedUser.rcDocument)} alt="Registre de Commerce" style={{ maxWidth: '300px', maxHeight: '300px' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Document+indisponible'; }} />
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Informations du Compte */}
                <div className="request-detail-section">
                  <h5>📊 Informations du Compte</h5>
                  <div className="detail-row"><span className="detail-label">Statut</span><span className="detail-value">{selectedUser.status || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Rôle</span><span className="detail-value">{selectedUser.role || 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Date d'inscription</span><span className="detail-value">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span></div>
                  <div className="detail-row"><span className="detail-label">Dernière mise à jour</span><span className="detail-value">{selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('fr-FR') : 'N/A'}</span></div>
                </div>

                <div className="admin-actions" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => deleteUser(selectedUser._id)}>Supprimer le compte</button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'messages' && (
        <section className="section admin-panel">
          <div className="panel-header">
            <h3>Messagerie</h3>
            <p className="panel-description">Répondez rapidement aux messages envoyés par les entreprises et consultez l’historique.</p>
          </div>
          <div className="admin-grid">
            <div className="admin-card">
              <h4>Répondre à un message</h4>
              <p>Sélectionnez un message pour répondre directement depuis l'administration.</p>
              <select
                value={selectedMessage?._id || ''}
                onChange={(e) => {
                  const selected = messages.find((msg) => msg._id === e.target.value);
                  setSelectedMessage(selected || null);
                  setReplyStatus('');
                }}
              >
                <option value="">Sélectionner un message</option>
                {messages.map((message) => (
                  <option key={message._id} value={message._id}>
                    {message.subject} — de {message.sender?.companyName || 'Entreprise'}
                  </option>
                ))}
              </select>
              {selectedMessage && (
                <div className="message-preview">
                  <p><strong>De :</strong> {selectedMessage.sender?.companyName || `${selectedMessage.sender?.firstName || ''} ${selectedMessage.sender?.name || ''}`.trim() || 'Client'}</p>
                  <p><strong>Email :</strong> {selectedMessage.sender?.companyEmail || selectedMessage.sender?.email || 'N/A'}</p>
                  <p><strong>Téléphone :</strong> {selectedMessage.sender?.companyPhone || selectedMessage.sender?.phone || 'N/A'}</p>
                  <p><strong>Type :</strong> {selectedMessage.type}</p>
                  <p><strong>Sujet :</strong> {selectedMessage.subject}</p>
                  <p><strong>Message :</strong> {selectedMessage.content}</p>
                  {selectedMessage.relatedOffer?.title && <p><strong>Offre liée :</strong> {selectedMessage.relatedOffer.title}</p>}
                  {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <div className="message-attachments">
                      <strong>📎 Pièces jointes :</strong>
                      <div className="attachments-list">
                        {selectedMessage.attachments.map((attachment, index) => (
                          <div key={index} className="attachment-item">
                            {attachment.match(/\.(pdf|jpg|jpeg|png|gif|webp)$/i) ? (
                              attachment.match(/\.pdf$/i) ? (
                                <a href={`${API_URL}${attachment}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                                  📄 Télécharger le PDF
                                </a>
                              ) : (
                                <img src={`${API_URL}${attachment}`} alt={`Pièce jointe ${index + 1}`} style={{ maxWidth: '200px', maxHeight: '200px' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Image+indisponible'; }} />
                              )
                            ) : (
                              <a href={`${API_URL}${attachment}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                                📎 Télécharger le fichier
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <textarea
                    rows="5"
                    placeholder="Votre réponse"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={sendReply}>Envoyer réponse</button>
                  {replyStatus && <div className="reply-status">{replyStatus}</div>}
                </div>
              )}
            </div>

            <div className="admin-card">
              <h4>Statistiques messagerie</h4>
              <div className="message-stats-row">
                <div className="message-stat-card">
                  <span className="message-stat-value">{messages.length}</span>
                  <span className="message-stat-label">Messages entreprises</span>
                </div>
              </div>

              <div className="message-category-section">
                <h4>Historique des messages entreprises</h4>
                {messages.length ? (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Entreprise</th>
                          <th>Email</th>
                          <th>Téléphone</th>
                          <th>Sujet</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {messages.map((message) => (
                          <tr key={message._id}>
                            <td>{message.sender?.companyName || 'Entreprise'}</td>
                            <td>{message.sender?.companyEmail || message.sender?.email || 'N/A'}</td>
                            <td>{message.sender?.companyPhone || message.sender?.phone || 'N/A'}</td>
                            <td>{message.subject}</td>
                            <td>{new Date(message.createdAt).toLocaleString('fr-FR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>Aucun message d'entreprise pour le moment.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === 'audit' && (
        <section className="section admin-panel">
          <div className="panel-header">
            <h3>Journaux d'audit</h3>
            <p className="panel-description">Filtrez et consultez l’historique des actions administratives.</p>
          </div>
          <div className="filter-row">
            <select value={auditFilters.action} onChange={(e) => { setAuditFilters({ ...auditFilters, action: e.target.value }); setAuditPage(1); }}>
              <option value="">Toutes les actions</option>
              <option value="create">Créer</option>
              <option value="approve">Approuver</option>
              <option value="reject">Rejeter</option>
              <option value="delete">Supprimer</option>
              <option value="update">Modifier</option>
            </select>
            <select value={auditFilters.entity} onChange={(e) => { setAuditFilters({ ...auditFilters, entity: e.target.value }); setAuditPage(1); }}>
              <option value="">Toutes les entités</option>
              <option value="offer">Offre</option>
              <option value="request">Demande</option>
              <option value="user">Utilisateur</option>
            </select>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entité</th>
                  <th>Détails</th>
                  <th>Utilisateur</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{log.action}</td>
                    <td>{log.entity}</td>
                    <td>{log.notes || log.status || JSON.stringify(log.changes || log.newValues || {})}</td>
                    <td>{log.userId?.companyName || 'Système'}</td>
                    <td>{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {auditPagination.pages > 1 && (
            <div className="pagination-row">
              {auditPage > 1 && <button className="btn btn-secondary" onClick={() => setAuditPage(auditPage - 1)}>← Précédent</button>}
              <span className="pagination-label">Page {auditPage} / {auditPagination.pages}</span>
              {auditPage < auditPagination.pages && <button className="btn btn-secondary" onClick={() => setAuditPage(auditPage + 1)}>Suivant →</button>}
            </div>
          )}
        </section>
      )}

      {tab === 'stats' && (
        <section className="section admin-panel">
          <div className="panel-header">
            <h3>Statistiques du système</h3>
            <p className="panel-description">Tableau de bord des performances et des actions du site.</p>
          </div>

          {statsLoading ? (
            <div className="stats-loading">
              <p>Chargement des statistiques...</p>
            </div>
          ) : statsError ? (
            <div className="stats-error">
              <p>Impossible de charger les statistiques :</p>
              <p><strong>{statsError}</strong></p>
            </div>
          ) : (
            <>
              <div className="admin-grid stats-grid stats-overview-grid">
                <div className="admin-card stat-card stat-overview">
                  <span>Total offres</span>
                  <strong>{stats.totalOffers}</strong>
                  <p>Nombre total d'annonces publiées dans le système.</p>
                </div>
                <div className="admin-card stat-card stat-approved">
                  <span>Approuvées</span>
                  <strong>{stats.approvedOffers}</strong>
                  <p>Offres validées par l'administration.</p>
                </div>
                <div className="admin-card stat-card stat-pending">
                  <span>En attente</span>
                  <strong>{stats.pendingOffers}</strong>
                  <p>Offres en attente de vérification.</p>
                </div>
                <div className="admin-card stat-card stat-rejected">
                  <span>Rejetées</span>
                  <strong>{stats.rejectedOffers}</strong>
                  <p>Offres rejetées par l'administration.</p>
                </div>
                <div className="admin-card stat-card stat-actions">
                  <span>Actions administratives</span>
                  <strong>{stats.totalActions}</strong>
                  <p>Nombre total d'actions enregistrées dans l'audit.</p>
                </div>
              </div>

              <div className="stats-panel-grid">
                <div className="stats-panel">
                  <div className="panel-header-inline">
                    <h4>Offres par catégorie</h4>
                    <span className="stats-badge">{Object.keys(stats.byCategory).length} catégories</span>
                  </div>
                  <div className="stats-list-grid">
                    {Object.entries(stats.byCategory).map(([cat, count]) => (
                      <div key={cat} className="stats-list-item">
                        <span>{cat || 'Sans catégorie'}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                    {!Object.keys(stats.byCategory).length && <p>Aucune donnée de catégorie disponible.</p>}
                  </div>
                </div>

                <div className="stats-panel">
                  <div className="panel-header-inline">
                    <h4>Actions enregistrées</h4>
                    <span className="stats-badge">{Object.keys(stats.actionCounts).length} types</span>
                  </div>
                  <div className="stats-list-grid">
                    {Object.entries(stats.actionCounts).map(([action, count]) => (
                      <div key={action} className="stats-list-item">
                        <span>{action}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                    {!Object.keys(stats.actionCounts).length && <p>Aucune donnée d'action disponible.</p>}
                  </div>
                </div>

                <div className="stats-panel">
                  <div className="panel-header-inline">
                    <h4>Entités auditées</h4>
                    <span className="stats-badge">{Object.keys(stats.entityCounts).length} entités</span>
                  </div>
                  <div className="stats-list-grid">
                    {Object.entries(stats.entityCounts).map(([entity, count]) => (
                      <div key={entity} className="stats-list-item">
                        <span>{entity}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                    {!Object.keys(stats.entityCounts).length && <p>Aucune donnée d'entité disponible.</p>}
                  </div>
                </div>
              </div>

              <div className="stats-summary-note">
                <div>
                  <strong>Activité récente :</strong> {stats.recentActivityLast10Days} actions enregistrées au cours des 10 derniers jours.
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default AdminDashboard;
