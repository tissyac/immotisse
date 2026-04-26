import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ClientMessageForm from '../components/ClientMessageForm';
import './OfferDetails.css';

const categoryLabels = {
  promotion: '🏗️ Promotion',
  vente: '🏠 Vente Particulier',
  location: '🏢 Location'
};

function OfferDetails() {
  const { id } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOffer();
  }, [id]);

  const loadOffer = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`http://localhost:3008/offers/${id}`);
      if (!response.ok) {
        throw new Error('Offre introuvable');
      }
      const data = await response.json();
      setOffer(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityLabel = (availability) => {
    const labels = {
      livraison_date: 'Livraison à date',
      immediatement: 'Immédiatement',
      sur_plan: 'Sur plan'
    };
    return labels[availability] || availability;
  };

  const getStatusLabel = (status) => {
    const labels = {
      conception: 'En conception',
      en_construction: 'En construction',
      pret_livraison: 'Prêt à la livraison'
    };
    return labels[status] || status;
  };

  const getFinishingLabel = (state) => {
    const labels = {
      brut: 'Brut',
      semi_fini: 'Semi-fini',
      fini: 'Fini'
    };
    return labels[state] || state;
  };

  const getBooleanLabel = (value) => {
    if (value === true || value === 'true' || value === 1 || value === '1') return '✓ Oui';
    if (value === false || value === 'false' || value === 0 || value === '0') return '✗ Non';
    return 'Non renseigné';
  };

  const [requestStart, setRequestStart] = useState('');
  const [requestEnd, setRequestEnd] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const imageItems = offer?.images || [];
  const videoItems = offer?.videos || [];

  const formatMediaUrl = (src) => {
    if (!src) return '';
    return src.startsWith('http') ? src : `http://localhost:3008${src}`;
  };

  const getVideoType = (src) => {
    if (!src) return 'video/mp4';
    if (src.endsWith('.webm')) return 'video/webm';
    if (src.endsWith('.ogg') || src.endsWith('.ogv')) return 'video/ogg';
    return 'video/mp4';
  };

  useEffect(() => {
    if (!offer) return;
    if (imageItems.length > 0) {
      setCurrentImageIndex(0);
    }
    if (videoItems.length > 0) {
      setCurrentVideoIndex(0);
    }
  }, [offer?.images, offer?.videos]);

  const isPeriodAvailable = (start, end) => {
    const requestStartDate = new Date(start);
    const requestEndDate = new Date(end);
    if (isNaN(requestStartDate) || isNaN(requestEndDate) || requestStartDate > requestEndDate) {
      return null;
    }

    return !offer.availabilityCalendar?.some((reserved) => {
      const reservedStart = new Date(reserved.startDate);
      const reservedEnd = new Date(reserved.endDate);
      return requestStartDate <= reservedEnd && requestEndDate >= reservedStart;
    });
  };

  const previousImage = () => {
    if (imageItems.length === 0) return;
    setCurrentImageIndex((prev) => (prev === 0 ? imageItems.length - 1 : prev - 1));
  };

  const nextImage = () => {
    if (imageItems.length === 0) return;
    setCurrentImageIndex((prev) => (prev === imageItems.length - 1 ? 0 : prev + 1));
  };

  const previousVideo = () => {
    if (videoItems.length === 0) return;
    setCurrentVideoIndex((prev) => (prev === 0 ? videoItems.length - 1 : prev - 1));
  };

  const nextVideo = () => {
    if (videoItems.length === 0) return;
    setCurrentVideoIndex((prev) => (prev === videoItems.length - 1 ? 0 : prev + 1));
  };

  const checkAvailability = () => {
    if (!requestStart || !requestEnd) {
      setAvailabilityMessage('Veuillez sélectionner une période pour vérifier la disponibilité.');
      return;
    }

    const available = isPeriodAvailable(requestStart, requestEnd);
    if (available === null) {
      setAvailabilityMessage('La plage choisie est invalide.');
      return;
    }

    setAvailabilityMessage(available ? '✅ Période disponible' : '❌ Période déjà réservée');
  };

  const renderAvailabilityCalendar = () => {
    return (
      <div className="availability-calendar">
        <h3>📅 Calendrier des réservations</h3>
        {offer.availabilityCalendar && offer.availabilityCalendar.length > 0 ? (
          <>
            <div className="availability-list">
              {offer.availabilityCalendar.map((period, idx) => (
                <div key={idx} className="availability-period reserved">
                  <span className="period-date">
                    {new Date(period.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="period-arrow">→</span>
                  <span className="period-date">
                    {new Date(period.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="period-status">Réservé</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>Aucune période réservée n'a encore été renseignée.</p>
        )}

        <div className="check-availability-panel">
          <h4>Vérifier une date</h4>
          <div className="date-input-group">
            <div>
              <label>Date de début</label>
              <input type="date" value={requestStart} onChange={(e) => setRequestStart(e.target.value)} />
            </div>
            <div>
              <label>Date de fin</label>
              <input type="date" value={requestEnd} onChange={(e) => setRequestEnd(e.target.value)} />
            </div>
            <button type="button" onClick={checkAvailability}>Vérifier</button>
          </div>
          {availabilityMessage && <div className="availability-message">{availabilityMessage}</div>}
        </div>
      </div>
    );
  };

  const renderCharacteristics = () => {
    if (offer.mainCategory === 'vente') {
      switch (offer.subCategory) {
        case 'terrain':
          return (
            <div className="details-stack">
              {offer.description && (
                <div className="detail-card">
                  <div className="detail-card-icon">📝</div>
                  <div>
                    <div className="detail-card-label">Description</div>
                    <div className="detail-card-value">{offer.description}</div>
                  </div>
                </div>
              )}

              {offer.address && (
                <div className="detail-card">
                  <div className="detail-card-icon">📍</div>
                  <div>
                    <div className="detail-card-label">Adresse</div>
                    <div className="detail-card-value">{offer.address}</div>
                  </div>
                </div>
              )}

              {offer.area && (
                <div className="detail-card">
                  <div className="detail-card-icon">📐</div>
                  <div>
                    <div className="detail-card-label">Superficie</div>
                    <div className="detail-card-value">{offer.area} m²</div>
                  </div>
                </div>
              )}

              {offer.access && (
                <div className="detail-card">
                  <div className="detail-card-icon">🛣️</div>
                  <div>
                    <div className="detail-card-label">Accès</div>
                    <div className="detail-card-value">{offer.access}</div>
                  </div>
                </div>
              )}

              <div className="detail-card">
                <div className="detail-card-icon">⚡</div>
                <div>
                  <div className="detail-card-label">Viabilisé</div>
                  <div className="detail-card-value">{getBooleanLabel(offer.viabilise)}</div>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-card-icon">🔄</div>
                <div>
                  <div className="detail-card-label">Possibilité de changement</div>
                  <div className="detail-card-value">{getBooleanLabel(offer.changeable)}</div>
                </div>
              </div>
            </div>
          );

        case 'maison':
          return (
            <div className="details-stack">
              {offer.description && (
                <div className="detail-card">
                  <div className="detail-card-icon">📝</div>
                  <div>
                    <div className="detail-card-label">Description</div>
                    <div className="detail-card-value">{offer.description}</div>
                  </div>
                </div>
              )}

              {offer.address && (
                <div className="detail-card">
                  <div className="detail-card-icon">📍</div>
                  <div>
                    <div className="detail-card-label">Adresse</div>
                    <div className="detail-card-value">{offer.address}</div>
                  </div>
                </div>
              )}

              {offer.propertyType && (
                <div className="detail-card">
                  <div className="detail-card-icon">🏠</div>
                  <div>
                    <div className="detail-card-label">Type de bien</div>
                    <div className="detail-card-value">{offer.propertyType}</div>
                  </div>
                </div>
              )}
            </div>
          );

        case 'locaux_commerciaux':
          return (
            <div className="details-stack">
              {offer.description && (
                <div className="detail-card">
                  <div className="detail-card-icon">📝</div>
                  <div>
                    <div className="detail-card-label">Description</div>
                    <div className="detail-card-value">{offer.description}</div>
                  </div>
                </div>
              )}

              {offer.address && (
                <div className="detail-card">
                  <div className="detail-card-icon">📍</div>
                  <div>
                    <div className="detail-card-label">Adresse</div>
                    <div className="detail-card-value">{offer.address}</div>
                  </div>
                </div>
              )}

              {offer.area && (
                <div className="detail-card">
                  <div className="detail-card-icon">📐</div>
                  <div>
                    <div className="detail-card-label">Superficie</div>
                    <div className="detail-card-value">{offer.area} m²</div>
                  </div>
                </div>
              )}

              {offer.viabilise !== undefined && (
                <div className="detail-card">
                  <div className="detail-card-icon">👁️</div>
                  <div>
                    <div className="detail-card-label">Visibilité</div>
                    <div className="detail-card-value">{getBooleanLabel(offer.viabilise)}</div>
                  </div>
                </div>
              )}
            </div>
          );

        default:
          return null;
      }
    }

    // Pour les autres catégories (promotion, location), utiliser les champs par défaut
    if (offer.mainCategory === 'location') {
      if (offer.subCategory === 'courte_duree') {
        return (
          <div className="char-grid">
            {offer.description && (
              <div className="char-box">
                <div className="char-icon">📝</div>
                <div className="char-content">
                  <span className="char-label">Description</span>
                  <span className="char-value">{offer.description}</span>
                </div>
              </div>
            )}

            {offer.address && (
              <div className="char-box">
                <div className="char-icon">📍</div>
                <div className="char-content">
                  <span className="char-label">Adresse</span>
                  <span className="char-value">{offer.address}</span>
                </div>
              </div>
            )}

            {offer.area && (
              <div className="char-box">
                <div className="char-icon">📐</div>
                <div className="char-content">
                  <span className="char-label">Superficie</span>
                  <span className="char-value">{offer.area} m²</span>
                </div>
              </div>
            )}

            {offer.propertyType && (
              <div className="char-box">
                <div className="char-icon">🏠</div>
                <div className="char-content">
                  <span className="char-label">Type de bien</span>
                  <span className="char-value">{offer.propertyType}</span>
                </div>
              </div>
            )}

            {offer.apartmentTypes && offer.apartmentTypes.length > 0 && (
              <div className="char-box">
                <div className="char-icon">🏘️</div>
                <div className="char-content">
                  <span className="char-label">Type d'appartement</span>
                  <span className="char-value">{offer.apartmentTypes.join(', ')}</span>
                </div>
              </div>
            )}

            {offer.equipment && offer.equipment.length > 0 && (
              <div className="char-box">
                <div className="char-icon">🛋️</div>
                <div className="char-content">
                  <span className="char-label">Équipements</span>
                  <span className="char-value">{offer.equipment.join(', ')}</span>
                </div>
              </div>
            )}

          </div>
        );
      } else if (offer.subCategory === 'longue_duree') {
        return (
          <div className="details-stack">
            {offer.description && (
              <div className="detail-card">
                <div className="detail-card-icon">📝</div>
                <div>
                  <div className="detail-card-label">Description</div>
                  <div className="detail-card-value">{offer.description}</div>
                </div>
              </div>
            )}

            {offer.address && (
              <div className="detail-card">
                <div className="detail-card-icon">📍</div>
                <div>
                  <div className="detail-card-label">Adresse</div>
                  <div className="detail-card-value">{offer.address}</div>
                </div>
              </div>
            )}

            {offer.propertyType && (
              <div className="detail-card">
                <div className="detail-card-icon">🏠</div>
                <div>
                  <div className="detail-card-label">Type de bien</div>
                  <div className="detail-card-value">{offer.propertyType}</div>
                </div>
              </div>
            )}

            {offer.advance && (
              <div className="detail-card">
                <div className="detail-card-icon">💰</div>
                <div>
                  <div className="detail-card-label">Avances demandées</div>
                  <div className="detail-card-value">{offer.advance}</div>
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    // Section pour les promotions - même champs que le formulaire de création
    if (offer.mainCategory === 'promotion') {
      return (
        <div className="promo-char-grid">
          <div className="promo-char-section">
            <h4>📍 Localisation</h4>
            <div className="promo-char-items">
              {offer.address && (
                <div className="promo-char-item">
                  <div className="promo-char-icon">🏠</div>
                  <div className="promo-char-content">
                    <span className="promo-char-label">Adresse du projet</span>
                    <span className="promo-char-value">{offer.address}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="promo-char-section">
            <h4>💰 Informations financières</h4>
            <div className="promo-char-items">
              {offer.paymentTerms && (
                <div className="promo-char-item">
                  <div className="promo-char-icon">💳</div>
                  <div className="promo-char-content">
                    <span className="promo-char-label">Modalités de paiement</span>
                    <span className="promo-char-value">{offer.paymentTerms}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="promo-char-section">
            <h4>🏗️ Détails du projet</h4>
            <div className="promo-char-items">
              {offer.apartmentTypes !== undefined && offer.apartmentTypes !== '' && (
                <div className="promo-char-item">
                  <div className="promo-char-icon">🏢</div>
                  <div className="promo-char-content">
                    <span className="promo-char-label">Nombre d'appartements</span>
                    <span className="promo-char-value">{offer.apartmentTypes}</span>
                  </div>
                </div>
              )}

              {offer.projectStatus && (
                <div className="promo-char-item">
                  <div className="promo-char-icon">🔨</div>
                  <div className="promo-char-content">
                    <span className="promo-char-label">Statut du projet</span>
                    <span className="promo-char-value">{getStatusLabel(offer.projectStatus)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Section pour les locations et autres structures non couvertes
    return (
      <div className="char-grid">
        {offer.address && (
          <div className="char-box">
            <div className="char-icon">📍</div>
            <div className="char-content">
              <span className="char-label">Adresse</span>
              <span className="char-value">{offer.address}</span>
            </div>
          </div>
        )}

        {offer.floor !== undefined && offer.floor !== null && (
          <div className="char-box">
            <div className="char-icon">📊</div>
            <div className="char-content">
              <span className="char-label">Niveau</span>
              <span className="char-value">{offer.floor}e étage</span>
            </div>
          </div>
        )}

        {offer.apartmentTypes && offer.apartmentTypes.length > 0 && (
          <div className="char-box">
            <div className="char-icon">🏠</div>
            <div className="char-content">
              <span className="char-label">Type d'appartement</span>
              <span className="char-value">{offer.apartmentTypes.join(', ')}</span>
            </div>
          </div>
        )}

        {offer.paymentTerms && (
          <div className="char-box">
            <div className="char-icon">💳</div>
            <div className="char-content">
              <span className="char-label">Type de paiement</span>
              <span className="char-value">{offer.paymentTerms}</span>
            </div>
          </div>
        )}

        {offer.elevator !== undefined && (
          <div className="char-box">
            <div className="char-icon">🛗</div>
            <div className="char-content">
              <span className="char-label">Ascenseur</span>
              <span className="char-value">{offer.elevator ? '✓ Oui' : '✗ Non'}</span>
            </div>
          </div>
        )}

        {offer.parking !== undefined && (
          <div className="char-box">
            <div className="char-icon">🅿️</div>
            <div className="char-content">
              <span className="char-label">Parking</span>
              <span className="char-value">{offer.parking ? '✓ Oui' : '✗ Non'}</span>
            </div>
          </div>
        )}

        {offer.projectStatus && (
          <div className="char-box">
            <div className="char-icon">🔨</div>
            <div className="char-content">
              <span className="char-label">Statut du projet</span>
              <span className="char-value">{getStatusLabel(offer.projectStatus)}</span>
            </div>
          </div>
        )}

        {offer.finishingState && (
          <div className="char-box">
            <div className="char-icon">✨</div>
            <div className="char-content">
              <span className="char-label">État de finition</span>
              <span className="char-value">{getFinishingLabel(offer.finishingState)}</span>
            </div>
          </div>
        )}

        {offer.availability && (
          <div className="char-box">
            <div className="char-icon">📅</div>
            <div className="char-content">
              <span className="char-label">Disponibilité</span>
              <span className="char-value">{getAvailabilityLabel(offer.availability)}</span>
              {offer.availability === 'livraison_date' && offer.deliveryDate && (
                <span className="char-subtext">
                  {new Date(offer.deliveryDate).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="offer-details-container">
      {/* Navigation */}
      <section className="section breadcrumb-section">
        <Link className="back-link" to={`/category/${offer?.mainCategory || 'promotion'}`}>
          ← Retour à {categoryLabels[offer?.mainCategory] || 'Promotion'}
        </Link>
      </section>

      {loading ? (
        <div className="section">
          <div className="loading">Chargement de l'offre...</div>
        </div>
      ) : error ? (
        <div className="section">
          <div className="alert error">{error}</div>
        </div>
      ) : offer ? (
        <>
          {/* Galerie photo */}
          {imageItems.length > 0 && (
            <section className="section gallery-section">
              <div className="section-head">
                <div>
                  <div className="section-label">Média</div>
                  <h2 className="section-title">Photos du projet</h2>
                </div>
                <div className="media-summary">
                  {imageItems.length} photo{imageItems.length > 1 ? 's' : ''}
                </div>
              </div>

              <div className="photo-gallery">
                <div className="photo-main">
                  <img
                    src={formatMediaUrl(imageItems[currentImageIndex])}
                    alt={`Photo ${currentImageIndex + 1}`}
                    className="main-photo"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/1200x800/334155/ffffff?text=Photo+non+disponible';
                    }}
                  />

                  {imageItems.length > 1 && (
                    <>
                      <button className="gallery-nav prev" onClick={previousImage}>❮</button>
                      <button className="gallery-nav next" onClick={nextImage}>❯</button>
                      <div className="gallery-counter">
                        {currentImageIndex + 1} / {imageItems.length}
                      </div>
                    </>
                  )}
                </div>

                {imageItems.length > 1 && (
                  <div className="thumbnail-strip">
                    {imageItems.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`thumbnail-item ${idx === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(idx)}
                        title={`Photo ${idx + 1}`}
                      >
                        <img
                          src={formatMediaUrl(src)}
                          alt={`Miniature ${idx + 1}`}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x110/334155/ffffff?text=Photo';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Galerie vidéo */}
          {videoItems.length > 0 && (
            <section className="section gallery-section">
              <div className="section-head">
                <div>
                  <div className="section-label">Média</div>
                  <h2 className="section-title">Vidéos du projet</h2>
                </div>
                <div className="media-summary">
                  {videoItems.length} vidéo{videoItems.length > 1 ? 's' : ''}
                </div>
              </div>

              <div className="video-gallery">
                <div className="video-player-wrapper">
                  <video
                    controls
                    className="video-player"
                    preload="metadata"
                    controlsList="nodownload"
                    poster="https://via.placeholder.com/1200x675/334155/ffffff?text=Vid%C3%A9o"
                  >
                    <source src={formatMediaUrl(videoItems[currentVideoIndex])} type={getVideoType(videoItems[currentVideoIndex])} />
                    Votre navigateur ne supporte pas la vidéo.
                  </video>

                  {videoItems.length > 1 && (
                    <div className="video-controls-row">
                      <button className="gallery-nav prev" onClick={previousVideo}>❮</button>
                      <div className="gallery-counter">
                        {currentVideoIndex + 1} / {videoItems.length}
                      </div>
                      <button className="gallery-nav next" onClick={nextVideo}>❯</button>
                    </div>
                  )}
                </div>

                <div className="video-thumbnails">
                  {videoItems.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`video-card ${idx === currentVideoIndex ? 'active' : ''}`}
                      onClick={() => setCurrentVideoIndex(idx)}
                      title={`Vidéo ${idx + 1}`}
                    >
                      <div className="video-card-icon">▶</div>
                      <div>
                        <div className="video-card-title">Vidéo {idx + 1}</div>
                        <div className="video-card-subtitle">Cliquez pour la lire</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Titre et catégorie */}
          <section className="section title-section">
            <div className="title-header">
              <h1>{offer.title}</h1>
              <span className="category-badge">{categoryLabels[offer.mainCategory]}</span>
            </div>
            {offer.mainCategory === 'promotion' || (offer.mainCategory === 'vente' && (offer.subCategory === 'terrain' || offer.subCategory === 'maison' || offer.subCategory === 'locaux_commerciaux')) ? null : (
              (offer.price || offer.address || offer.city || offer.area) && (
                <div className="offer-info-row">
                  {offer.price && (
                    <div className="info-badge">
                      <div className="icon">💰</div>
                      <div className="label">
                        <div className="label-title">Prix</div>
                        <div className="label-value">{offer.price.toLocaleString()} FCFA</div>
                      </div>
                    </div>
                  )}
                  {offer.address && (
                    <div className="info-badge">
                      <div className="icon">📍</div>
                      <div className="label">
                        <div className="label-title">Adresse</div>
                        <div className="label-value">{offer.address}</div>
                      </div>
                    </div>
                  )}
                  {offer.city && (
                    <div className="info-badge">
                      <div className="icon">🏙️</div>
                      <div className="label">
                        <div className="label-title">Ville</div>
                        <div className="label-value">{offer.city}</div>
                      </div>
                    </div>
                  )}
                  {offer.area && (
                    <div className="info-badge">
                      <div className="icon">📐</div>
                      <div className="label">
                        <div className="label-title">Superficie</div>
                        <div className="label-value">{offer.area} m²</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </section>

          {offer.mainCategory === 'promotion' ? (
            <section className="section details-section">
              <h2>📋 Détails du projet</h2>
              <div className="details-stack">
                {offer.address && (
                  <div className="detail-card">
                    <div className="detail-card-icon">📍</div>
                    <div>
                      <div className="detail-card-label">Adresse</div>
                      <div className="detail-card-value">{offer.address}</div>
                    </div>
                  </div>
                )}

                {offer.description && (
                  <div className="detail-card">
                    <div className="detail-card-icon">📝</div>
                    <div>
                      <div className="detail-card-label">Description</div>
                      <div className="detail-card-value">{offer.description}</div>
                    </div>
                  </div>
                )}

                {offer.paymentTerms && (
                  <div className="detail-card">
                    <div className="detail-card-icon">💳</div>
                    <div>
                      <div className="detail-card-label">Modalités de paiement</div>
                      <div className="detail-card-value">{offer.paymentTerms}</div>
                    </div>
                  </div>
                )}

                {offer.apartmentTypes !== undefined && offer.apartmentTypes !== '' && (
                  <div className="detail-card">
                    <div className="detail-card-icon">🏢</div>
                    <div>
                      <div className="detail-card-label">Nombre d'appartements</div>
                      <div className="detail-card-value">{offer.apartmentTypes}</div>
                    </div>
                  </div>
                )}

                {offer.projectStatus && (
                  <div className="detail-card">
                    <div className="detail-card-icon">🔨</div>
                    <div>
                      <div className="detail-card-label">Statut du projet</div>
                      <div className="detail-card-value">{getStatusLabel(offer.projectStatus)}</div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : offer.mainCategory === 'vente' && offer.subCategory === 'maison' ? (
            <section className="section details-section">
              <h2>🏠 Détails de la maison</h2>
              {renderCharacteristics()}
            </section>
          ) : offer.mainCategory === 'vente' && offer.subCategory === 'locaux_commerciaux' ? (
            <section className="section details-section">
              <h2>🏪 Détails des locaux commerciaux</h2>
              {renderCharacteristics()}
            </section>
          ) : offer.mainCategory === 'vente' && offer.subCategory === 'terrain' ? (
            <section className="section details-section">
              <h2>📋 Détails du terrain</h2>
              <div className="details-stack">
                <div className="detail-card">
                  <div className="detail-card-icon">📍</div>
                  <div>
                    <div className="detail-card-label">Adresse</div>
                    <div className="detail-card-value">{offer.address || 'Non renseignée'}</div>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-card-icon">📝</div>
                  <div>
                    <div className="detail-card-label">Description</div>
                    <div className="detail-card-value">{offer.description || 'Non renseignée'}</div>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-card-icon">📐</div>
                  <div>
                    <div className="detail-card-label">Superficie</div>
                    <div className="detail-card-value">{offer.area ? `${offer.area} m²` : 'Non renseignée'}</div>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-card-icon">⚡</div>
                  <div>
                    <div className="detail-card-label">Viabilisé</div>
                    <div className="detail-card-value">
                      {offer.viabilise === true ? '✓ Oui' : offer.viabilise === false ? '✗ Non' : 'Non renseigné'}
                    </div>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-card-icon">🔄</div>
                  <div>
                    <div className="detail-card-label">Possibilité de changement</div>
                    <div className="detail-card-value">
                      {offer.changeable === true ? '✓ Oui' : offer.changeable === false ? '✗ Non' : 'Non renseigné'}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <>
              {offer.description && (
                <section className="section description-section">
                  <h2>📝 Description</h2>
                  <p className="description-text">{offer.description}</p>
                </section>
              )}

              <section className="section characteristics-section">
                <h2>🏢 Caractéristiques du bien</h2>
                {renderCharacteristics()}
              </section>

              {offer.mainCategory === 'location' && offer.subCategory === 'courte_duree' && renderAvailabilityCalendar()}
            </>
          )}

          {/* CTA */}
          <section className="section cta-section">
            <button className="contact-cta" onClick={() => setShowContactForm(true)}>
              📞 Contacter IMMOTISSE
            </button>
          </section>

          {showContactForm && (
            <section className="section contact-form-section">
              <ClientMessageForm offerId={offer._id} onMessageSent={() => setShowContactForm(false)} />
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

export default OfferDetails;
