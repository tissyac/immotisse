import { useState } from 'react';

function OfferCard({ offer }) {
  const [showDetails, setShowDetails] = useState(false);

  const getMainImage = () => {
    if (offer.images && offer.images.length > 0) {
      return offer.images[0];
    }
    return 'https://via.placeholder.com/400x240/334155/ffffff?text=Image+non+disponible';
  };

  return (
    <article className="offer-card">
      <div className="offer-image-container">
        <img
          src={getMainImage()}
          alt={offer.title}
          className="offer-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x240/334155/ffffff?text=Image+non+disponible';
          }}
        />
        <div className="offer-category-badge">
          {offer.mainCategory === 'promotion' && '🏗️ Promotion'}
          {offer.mainCategory === 'vente' && '🏠 Vente'}
          {offer.mainCategory === 'location' && '🏢 Location'}
        </div>
      </div>

      <div className="offer-card-body">
        <h3 className="offer-title">{offer.title}</h3>

        <div className="offer-price">
          Prix sur demande
        </div>

        <div className="offer-location">
          📍 {offer.city || offer.address || 'Adresse non précisée'}
        </div>

        {!showDetails ? (
          <div className="offer-preview">
            <p className="offer-description">
              {offer.description?.slice(0, 80) || 'Description non disponible'}...
            </p>
            <button
              className="show-more-btn"
              onClick={() => setShowDetails(true)}
            >
              Afficher plus →
            </button>
          </div>
        ) : (
          <div className="offer-details">
            <div className="offer-info">
              {/* Affichage simplifié pour les maisons, locaux commerciaux et location longue durée */}
              {((offer.mainCategory === 'vente' && (offer.subCategory === 'maison' || offer.subCategory === 'locaux_commerciaux')) ||
                (offer.mainCategory === 'location' && offer.subCategory === 'longue_duree')) ? (
                <>
                  {offer.description && (
                    <div className="info-item">
                      <span className="info-label">Description:</span>
                      <span className="info-value">{offer.description.length > 100 ? `${offer.description.substring(0, 100)}...` : offer.description}</span>
                    </div>
                  )}

                  {offer.address && (
                    <div className="info-item">
                      <span className="info-label">Adresse:</span>
                      <span className="info-value">{offer.address}</span>
                    </div>
                  )}

                  {offer.subCategory === 'maison' && offer.propertyType && (
                    <div className="info-item">
                      <span className="info-label">Type de bien:</span>
                      <span className="info-value">{offer.propertyType}</span>
                    </div>
                  )}

                  {offer.subCategory === 'locaux_commerciaux' && offer.area && (
                    <div className="info-item">
                      <span className="info-label">Superficie:</span>
                      <span className="info-value">{offer.area} m²</span>
                    </div>
                  )}

                  {offer.mainCategory === 'location' && offer.subCategory === 'longue_duree' && offer.advance && (
                    <div className="info-item">
                      <span className="info-label">Avances:</span>
                      <span className="info-value">{offer.advance}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {offer.area && (
                    <div className="info-item">
                      <span className="info-label">Surface:</span>
                      <span className="info-value">{offer.area} m²</span>
                    </div>
                  )}

                  {offer.rooms && (
                    <div className="info-item">
                      <span className="info-label">Pièces:</span>
                      <span className="info-value">{offer.rooms}</span>
                    </div>
                  )}

                  {offer.bedrooms && (
                    <div className="info-item">
                      <span className="info-label">Chambres:</span>
                      <span className="info-value">{offer.bedrooms}</span>
                    </div>
                  )}

                  {offer.floor && (
                    <div className="info-item">
                      <span className="info-label">Étage:</span>
                      <span className="info-value">{offer.floor}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {offer.description && (
              <div className="offer-full-description">
                <h4>Description complète:</h4>
                <p>{offer.description}</p>
              </div>
            )}

            {offer.equipment && offer.equipment.length > 0 && (
              <div className="offer-equipment">
                <h4>Équipements:</h4>
                <div className="equipment-list">
                  {offer.equipment.map((item, index) => (
                    <span key={index} className="equipment-item">{item}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="offer-actions">
              <button
                className="contact-btn"
                onClick={() => alert('Fonctionnalité de contact à implémenter')}
              >
                📞 Contacter l'agence
              </button>
              <button
                className="show-less-btn"
                onClick={() => setShowDetails(false)}
              >
                ← Réduire
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default OfferCard;
