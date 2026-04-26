import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/admin-requests.css';

function AdminRequests() {
  const { token } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [status, setStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [token]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:3008/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const approveRequest = async (id) => {
    if (!window.confirm('Confirmer l\'approbation de cette demande?')) return;

    try {
      const res = await fetch(`http://localhost:3008/requests/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminNote: 'Approuvée par l\'administration' })
      });
      const data = await res.json();
      const emailError = data.emailStatus?.error || data.emailError || (data.emailStatus ? JSON.stringify(data.emailStatus) : null);
      if (!res.ok) {
        setStatus(`❌ Erreur serveur: ${data.error || data.message || res.statusText}`);
      } else if (!data.emailStatus?.success) {
        setStatus(`⚠️ Demande approuvée mais erreur email: ${emailError || 'Inconnue'}`);
      } else {
        setStatus('✅ Demande approuvée avec succès. Email envoyé.');
      }
      setSelectedRequest(null);
      setActiveTab('approved');
      await loadRequests();
      setTimeout(() => setStatus(''), 5000);
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message}`);
    }
  };

  const rejectRequest = async (id) => {
    if (!rejectionReason.trim()) {
      setStatus('❌ Veuillez indiquer une raison de rejet.');
      return;
    }
    if (!window.confirm('Confirmer le rejet de cette demande?')) return;

    try {
      const res = await fetch(`http://localhost:3008/requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminNote: rejectionReason })
      });
      const data = await res.json();
      const emailError = data.emailStatus?.error || data.emailError || (data.emailStatus ? JSON.stringify(data.emailStatus) : null);
      if (!res.ok) {
        setStatus(`❌ Erreur serveur: ${data.error || data.message || res.statusText}`);
      } else if (!data.emailStatus?.success) {
        setStatus(`⚠️ Demande rejetée mais erreur email: ${emailError || 'Inconnue'}`);
      } else {
        setStatus('✅ Demande rejetée. Email envoyé.');
      }
      setRejectionReason('');
      setSelectedRequest(null);
      setActiveTab('rejected');
      await loadRequests();
      setTimeout(() => setStatus(''), 5000);
    } catch (err) {
      setStatus(`❌ Erreur: ${err.message}`);
    }
  };

  const sortedRequests = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filteredRequests = sortedRequests.filter(req => req.status === activeTab);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-requests-container">
      {/* Header */}
      <div className="admin-header">
        <h1>📋 Gestion des Demandes d'Inscription</h1>
        <p>Validez et gérez les demandes d'enregistrement des entreprises</p>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`status-alert ${status.includes('✅') ? 'success' : status.includes('⚠️') ? 'warning' : 'error'}`}>
          {status}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ En attente ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          ✅ Approuvées ({requests.filter(r => r.status === 'approved').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          ❌ Rejetées ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      {/* Content */}
      <div className="requests-layout">
        {/* List */}
        <div className="requests-list">
          {isLoading ? (
            <div className="loading">Chargement des demandes...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">
              <p>Aucune demande {activeTab === 'pending' ? 'en attente' : activeTab === 'approved' ? 'approuvée' : 'rejetée'}</p>
            </div>
          ) : (
            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Demandeur</th>
                    <th>Entreprise</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>RC</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr
                      key={req._id}
                      className={selectedRequest?._id === req._id ? 'selected-row' : ''}
                      onClick={() => setSelectedRequest(req)}
                    >
                      <td>{formatDate(req.createdAt)}</td>
                      <td>{req.name} {req.firstName}</td>
                      <td>{req.companyName || '-'}</td>
                      <td>{req.companyEmail || '-'}</td>
                      <td>{req.companyPhone || '-'}</td>
                      <td>{req.rcNumber || '-'}</td>
                      <td><span className={`status-badge status-${req.status}`}>{req.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details */}
        {selectedRequest && (
          <div className="request-details">
            <div className="details-header">
              <div>
                <h2>{selectedRequest.name} {selectedRequest.firstName}</h2>
                <p className="request-meta">ID: {selectedRequest._id}</p>
                <p className="request-meta">Date de dépôt: {formatDate(selectedRequest.createdAt)}</p>
              </div>
              <button 
                className="close-btn"
                onClick={() => setSelectedRequest(null)}
              >
                ✕
              </button>
            </div>

            <div className="details-content">
              <section className="detail-section detail-summary">
                <h3>Détails de la demande</h3>
                <div className="summary-grid">
                  <div>
                    <strong>Statut :</strong> <span className={`status-badge status-${selectedRequest.status}`}>{selectedRequest.status}</span>
                  </div>
                  <div>
                    <strong>Email :</strong> {selectedRequest.companyEmail || '-'}
                  </div>
                  <div>
                    <strong>Téléphone :</strong> {selectedRequest.companyPhone || '-'}
                  </div>
                  <div>
                    <strong>Entreprise :</strong> {selectedRequest.companyName || '-'}
                  </div>
                </div>
              </section>

              {/* Manager Information */}
              <section className="detail-section">
                <h3>👤 Informations du Gérant</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nom</label>
                    <span>{selectedRequest.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Prénom</label>
                    <span>{selectedRequest.firstName}</span>
                  </div>
                  <div className="info-item">
                    <label>Date de naissance</label>
                    <span>{new Date(selectedRequest.birthDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="info-item">
                    <label>Lieu de naissance</label>
                    <span>{selectedRequest.birthPlace}</span>
                  </div>
                  <div className="info-item">
                    <label>Téléphone</label>
                    <span>{selectedRequest.phone}</span>
                  </div>
                  <div className="info-item">
                    <label>NIN</label>
                    <span>{selectedRequest.nin}</span>
                  </div>
                </div>
              </section>

              {/* NIN Document */}
              {selectedRequest.ninDocument && (
                <section className="detail-section">
                  <h3>📄 Document NIN/Passeport</h3>
                  {selectedRequest.ninDocument.includes('.pdf') ? (
                    <div className="document-preview">
                      <iframe
                        src={selectedRequest.ninDocument}
                        style={{ width: '100%', height: '400px', borderRadius: '8px' }}
                        title="NIN Document"
                      />
                      <a href={selectedRequest.ninDocument} target="_blank" rel="noopener noreferrer" className="doc-link">
                        📥 Télécharger le PDF
                      </a>
                    </div>
                  ) : (
                    <div className="document-preview">
                      <img
                        src={selectedRequest.ninDocument}
                        alt="NIN Document"
                        style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                      />
                      <a href={selectedRequest.ninDocument} target="_blank" rel="noopener noreferrer" className="doc-link">
                        📥 Voir l'image en grand
                      </a>
                    </div>
                  )}
                </section>
              )}

              {/* Company Information */}
              <section className="detail-section">
                <h3>🏢 Informations de l'Entreprise</h3>
                <div className="info-grid">
                  <div className="info-item full">
                    <label>Nom de l'entreprise</label>
                    <span>{selectedRequest.companyName}</span>
                  </div>
                  <div className="info-item">
                    <label>Téléphone</label>
                    <span>{selectedRequest.companyPhone}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{selectedRequest.companyEmail}</span>
                  </div>
                  <div className="info-item full">
                    <label>Adresse</label>
                    <span>{selectedRequest.companyAddress}</span>
                  </div>
                  {selectedRequest.companyLocation && (
                    <div className="info-item full">
                      <label>Coordonnées GPS</label>
                      <span>{selectedRequest.companyLocation}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <label>Numéro RC</label>
                    <span>{selectedRequest.rcNumber}</span>
                  </div>
                </div>
              </section>

              {/* RC Document */}
              {selectedRequest.rcDocument && (
                <section className="detail-section">
                  <h3>📋 Document Registre de Commerce (RC)</h3>
                  {selectedRequest.rcDocument.includes('.pdf') ? (
                    <div className="document-preview">
                      <iframe
                        src={selectedRequest.rcDocument}
                        style={{ width: '100%', height: '400px', borderRadius: '8px' }}
                        title="RC Document"
                      />
                      <a href={selectedRequest.rcDocument} target="_blank" rel="noopener noreferrer" className="doc-link">
                        📥 Télécharger le PDF
                      </a>
                    </div>
                  ) : (
                    <div className="document-preview">
                      <img
                        src={selectedRequest.rcDocument}
                        alt="RC Document"
                        style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                      />
                      <a href={selectedRequest.rcDocument} target="_blank" rel="noopener noreferrer" className="doc-link">
                        📥 Voir l'image en grand
                      </a>
                    </div>
                  )}
                </section>
              )}

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <section className="detail-section action-section">
                  <div className="action-buttons">
                    <button
                      className="btn btn-approve"
                      onClick={() => approveRequest(selectedRequest._id)}
                    >
                      ✅ Approuver cette Demande
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => document.querySelector('.rejection-form')?.focus()}
                    >
                      ❌ Rejeter cette Demande
                    </button>
                  </div>

                  <div className="rejection-form" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                    <label style={{ fontWeight: '600' }}>Raison du rejet:</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Indiquez la raison du rejet..."
                      style={{
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                        minHeight: '100px',
                        resize: 'vertical'
                      }}
                    />
                    <button
                      className="btn btn-confirm-reject"
                      onClick={() => rejectRequest(selectedRequest._id)}
                      disabled={!rejectionReason.trim()}
                    >
                      ✓ Confirmer le Rejet
                    </button>
                  </div>
                </section>
              )}

              {selectedRequest.status !== 'pending' && (
                <section className="detail-section">
                  <div className="status-info">
                    <p>
                      <strong>Statut:</strong>{' '}
                      <span className={`status-badge status-${selectedRequest.status}`}>
                        {selectedRequest.status === 'approved' ? '✅ Approuvée' : '❌ Rejetée'}
                      </span>
                    </p>
                    {selectedRequest.adminNote && (
                      <p>
                        <strong>Remarque Admin:</strong> {selectedRequest.adminNote}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRequests;
