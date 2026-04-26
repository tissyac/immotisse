import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function AdminDashboard() {
  const { user, token } = useContext(AuthContext);
  const [tab, setTab] = useState('requests'); // requests, offers, contacts, audit, stats
  const [status, setStatus] = useState('');
  
  // Requests & Offers & Contacts
  const [requests, setRequests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });

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
    entityCounts: {}
  });

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
  }, [user, token, tab, page, auditPage, auditFilters]);

  const loadRequests = async () => {
    try {
      const res = await fetch('http://localhost:3008/requests', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      setRequests(await res.json());
    } catch (err) {
      setStatus(`Erreur: ${err.message}`);
    }
  };

  const loadOffers = async () => {
    try {
      const res = await fetch(`http://localhost:3008/offers/admin/all?page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setOffers(data.offers || []);
      setPagination(data.pagination || { pages: 1 });
    } catch (err) {
      setStatus(`Erreur: ${err.message}`);
    }
  };

  const loadContacts = async () => {
    try {
      const res = await fetch('http://localhost:3008/contacts', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      setContacts(await res.json());
    } catch (err) {
      setStatus(`Erreur: ${err.message}`);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('http://localhost:3008/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setStatus(`Erreur chargement utilisateurs: ${err.message}`);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch('http://localhost:3008/messages/admin/all', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur lors du chargement des messages');
      setMessages(await res.json());
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
      const res = await fetch('http://localhost:3008/messages', {
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

  const loadAuditLogs = async () => {
    try {
      let url = `http://localhost:3008/audit?page=${auditPage}&limit=20`;
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

  const loadStats = async () => {
    try {
      const [offersRes, auditRes] = await Promise.all([
        fetch('http://localhost:3008/offers/admin/stats/overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3008/audit/stats/overview', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!offersRes.ok || !auditRes.ok) throw new Error('Erreur lors du chargement');

      const offersStats = await offersRes.json();
      const auditStats = await auditRes.json();

      setStats({
        totalOffers: offersStats.totalOffers || 0,
        approvedOffers: offersStats.approvedOffers || 0,
        pendingOffers: offersStats.pendingOffers || 0,
        rejectedOffers: offersStats.rejectedOffers || 0,
        byCategory: offersStats.byCategory || {},
        totalActions: auditStats.totalActions || 0,
        actionCounts: auditStats.actionCounts || {},
        entityCounts: auditStats.entityCounts || {}
      });
    } catch (err) {
      setStatus(`Erreur: ${err.message}`);
    }
  };

  const approveRequest = async (id, email) => {
    try {
      const res = await fetch(`http://localhost:3008/requests/${id}/approve`, {
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
      const res = await fetch(`http://localhost:3008/requests/${id}/reject`, {
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
      const res = await fetch(`http://localhost:3008/offers/${id}/approve`, {
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
      const res = await fetch(`http://localhost:3008/offers/${id}/reject`, {
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

  return (
    <div>
      <section className="section">
        <h2>Panneau d'Administration</h2>
        <p>Gérez les demandes, les offres, et consultez les statistiques.</p>
      </section>

      {status && <div className={`alert ${status.includes('❌') ? 'error' : ''}`}>{status}</div>}

      <section className="section">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => { setTab('requests'); setPage(1); }} style={{ backgroundColor: tab === 'requests' ? '#0066cc' : '#ccc' }}>Demandes</button>
          <button onClick={() => { setTab('offers'); setPage(1); }} style={{ backgroundColor: tab === 'offers' ? '#0066cc' : '#ccc' }}>Offres</button>
          <button onClick={() => { setTab('users'); setPage(1); }} style={{ backgroundColor: tab === 'users' ? '#0066cc' : '#ccc' }}>Utilisateurs</button>
          <button onClick={() => { setTab('messages'); setPage(1); }} style={{ backgroundColor: tab === 'messages' ? '#0066cc' : '#ccc' }}>Messagerie</button>
          <button onClick={() => { setTab('contacts'); setPage(1); }} style={{ backgroundColor: tab === 'contacts' ? '#0066cc' : '#ccc' }}>Contacts</button>
          <button onClick={() => { setTab('audit'); setAuditPage(1); }} style={{ backgroundColor: tab === 'audit' ? '#0066cc' : '#ccc' }}>Audit</button>
          <button onClick={() => setTab('stats')} style={{ backgroundColor: tab === 'stats' ? '#0066cc' : '#ccc' }}>Statistiques</button>
        </div>
      </section>

      {tab === 'requests' && (
        <section className="section">
          <h3>Demandes d'enregistrement en attente</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nom</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Entreprise</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.filter(r => r.status === 'pending').map((req) => (
                <tr key={req._id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{req.name} {req.firstName}</td>
                  <td style={{ padding: '10px' }}>{req.companyEmail}</td>
                  <td style={{ padding: '10px' }}>{req.companyName}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => approveRequest(req._id, req.companyEmail)} style={{ backgroundColor: '#28a745', color: 'white', marginRight: '5px' }}>Approuver</button>
                    <button onClick={() => rejectRequest(req._id)} style={{ backgroundColor: '#dc3545', color: 'white' }}>Rejeter</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'offers' && (
        <section className="section">
          <h3>Offres en attente de validation</h3>
          {offers.filter(o => o.status === 'pending').length ? (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Titre</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Catégorie</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.filter(o => o.status === 'pending').map((offer) => (
                    <tr key={offer._id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '10px' }}>{offer.title}</td>
                      <td style={{ padding: '10px' }}>{offer.mainCategory}</td>
                      <td style={{ padding: '10px' }}>
                        <button onClick={() => approveOffer(offer._id)} style={{ backgroundColor: '#28a745', color: 'white', marginRight: '5px' }}>Approuver</button>
                        <button onClick={() => rejectOffer(offer._id)} style={{ backgroundColor: '#dc3545', color: 'white' }}>Rejeter</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination.pages > 1 && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  {page > 1 && <button onClick={() => setPage(page - 1)}>← Précédent</button>}
                  <span style={{ margin: '0 20px' }}>Page {page} / {pagination.pages}</span>
                  {page < pagination.pages && <button onClick={() => setPage(page + 1)}>Suivant →</button>}
                </div>
              )}
            </div>
          ) : (
            <p>Aucune offre en attente.</p>
          )}
        </section>
      )}

      {tab === 'contacts' && (
        <section className="section">
          <h3>Messages clients</h3>
          {contacts.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nom</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Message</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact._id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{contact.name}</td>
                    <td style={{ padding: '10px' }}>{contact.email}</td>
                    <td style={{ padding: '10px' }}>{contact.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucun message.</p>
          )}
        </section>
      )}

      {tab === 'users' && (
        <section className="section">
          <h3>Utilisateurs</h3>
          {users.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Entreprise</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Téléphone</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr key={userItem._id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{userItem.companyName}</td>
                    <td style={{ padding: '10px' }}>{userItem.companyEmail}</td>
                    <td style={{ padding: '10px' }}>{userItem.companyPhone}</td>
                    <td style={{ padding: '10px' }}>{userItem.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucun utilisateur trouvé.</p>
          )}
        </section>
      )}

      {tab === 'messages' && (
        <section className="section">
          <h3>Messagerie</h3>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '20px' }}>
              <h4>Répondre à un message</h4>
              <p>Sélectionnez un message pour répondre directement depuis l'administration.</p>
              <div>
                <select
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
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
                      {message.subject} — de {message.sender?.companyName || message.sender?.firstName || 'Client'}
                    </option>
                  ))}
                </select>
              </div>
              {selectedMessage && (
                <div style={{ marginTop: '20px' }}>
                  <p><strong>De :</strong> {selectedMessage.sender?.companyName || selectedMessage.sender?.firstName || 'Client'}</p>
                  <p><strong>Sujet :</strong> {selectedMessage.subject}</p>
                  <p><strong>Message :</strong> {selectedMessage.content}</p>
                  <div style={{ marginTop: '15px' }}>
                    <textarea
                      rows="5"
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                      placeholder="Votre réponse"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <button
                      onClick={sendReply}
                      style={{ marginTop: '10px', padding: '12px 20px', borderRadius: '8px', backgroundColor: '#0066cc', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                      Envoyer réponse
                    </button>
                    {replyStatus && <div style={{ marginTop: '10px' }}>{replyStatus}</div>}
                  </div>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
              <h4>Inbox complète</h4>
              {messages.length ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f4f8' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Expéditeur</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Sujet</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((message) => (
                      <tr key={message._id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px' }}>{message.sender?.companyName || message.sender?.firstName || 'Client'}</td>
                        <td style={{ padding: '10px' }}>{message.subject}</td>
                        <td style={{ padding: '10px' }}>{message.type}</td>
                        <td style={{ padding: '10px' }}>{new Date(message.createdAt).toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Aucun message reçu pour le moment.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'audit' && (
        <section className="section">
          <h3>Journaux d'audit</h3>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select value={auditFilters.action} onChange={(e) => { setAuditFilters({ ...auditFilters, action: e.target.value }); setAuditPage(1); }}>
              <option value="">Toutes les actions</option>
              <option value="create">Créer</option>
              <option value="approve">Approuver</option>
              <option value="reject">Rejeter</option>
              <option value="update">Modifier</option>
            </select>
            <select value={auditFilters.entity} onChange={(e) => { setAuditFilters({ ...auditFilters, entity: e.target.value }); setAuditPage(1); }}>
              <option value="">Toutes les entités</option>
              <option value="offer">Offre</option>
              <option value="request">Demande</option>
              <option value="user">Utilisateur</option>
            </select>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Entité</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Utilisateur</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log._id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{log.action}</td>
                  <td style={{ padding: '10px' }}>{log.entity}</td>
                  <td style={{ padding: '10px' }}>{log.userId?.companyName || 'Système'}</td>
                  <td style={{ padding: '10px' }}>{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {auditPagination.pages > 1 && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              {auditPage > 1 && <button onClick={() => setAuditPage(auditPage - 1)}>← Précédent</button>}
              <span style={{ margin: '0 20px' }}>Page {auditPage} / {auditPagination.pages}</span>
              {auditPage < auditPagination.pages && <button onClick={() => setAuditPage(auditPage + 1)}>Suivant →</button>}
            </div>
          )}
        </section>
      )}

      {tab === 'stats' && (
        <section className="section">
          <h3>Statistiques du système</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>Total offres</h4>
              <p style={{ fontSize: '32px', margin: '0', fontWeight: 'bold' }}>{stats.totalOffers}</p>
            </div>
            <div style={{ backgroundColor: '#e8f5e9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Approuvées</h4>
              <p style={{ fontSize: '32px', margin: '0', fontWeight: 'bold' }}>{stats.approvedOffers}</p>
            </div>
            <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#ff9800' }}>En attente</h4>
              <p style={{ fontSize: '32px', margin: '0', fontWeight: 'bold' }}>{stats.pendingOffers}</p>
            </div>
            <div style={{ backgroundColor: '#ffebee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Rejetées</h4>
              <p style={{ fontSize: '32px', margin: '0', fontWeight: 'bold' }}>{stats.rejectedOffers}</p>
            </div>
          </div>

          <h4>Offres par catégorie</h4>
          <ul style={{ listStyle: 'none', padding: '0' }}>
            {Object.entries(stats.byCategory || {}).map(([cat, count]) => (
              <li key={cat} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <strong>{cat}:</strong> {count}
              </li>
            ))}
          </ul>

          <h4 style={{ marginTop: '30px' }}>Actions enregistrées</h4>
          <p>Total: <strong>{stats.totalActions}</strong></p>
          <ul style={{ listStyle: 'none', padding: '0' }}>
            {Object.entries(stats.actionCounts || {}).map(([action, count]) => (
              <li key={action} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <strong>{action}:</strong> {count}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default AdminDashboard;
