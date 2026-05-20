import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import './CategoryPage.css';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const categoryLabels = {
  promotion: 'Promotion',
  vente: 'Vente Particulier',
  location: 'Location'
};

const venteSubcategories = [
  { value: 'terrain', label: 'Terrain' },
  { value: 'maison', label: 'Maison' },
  { value: 'locaux_commerciaux', label: 'Locaux commerciaux' }
];

const locationSubcategories = [
  { value: 'courte_duree', label: 'Courte durée' },
  { value: 'longue_duree', label: 'Longue durée' }
];

const subcategoryLabels = {
  terrain: 'Terrain',
  maison: 'Maison',
  locaux_commerciaux: 'Locaux commerciaux',
  courte_duree: 'Courte durée',
  longue_duree: 'Longue durée'
};

const formatOfferImageUrl = (src) => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  return `https://immotisse.onrender.com${src.startsWith('/') ? src : `/${src}`}`;
};

function CategoryPage() {
  const { category, subcategory } = useParams();
  const location = useLocation();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearch, setIsSearch] = useState(false);
  const [searchParams, setSearchParams] = useState({});

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isSearchRoute = location.pathname === '/category/search';

    if (isSearchRoute) {
      setIsSearch(true);
      const params = {};
      for (let [key, value] of urlParams) {
        params[key] = value;
      }
      setSearchParams(params);
      loadSearchResults(params);
    } else {
      setIsSearch(false);
      if ((category === 'vente' || category === 'location') && !subcategory) {
        setOffers([]);
        setLoading(false);
        setError('');
        return;
      }
      loadOffers();
    }
  }, [category, subcategory, location]);

  const loadSearchResults = async (params) => {
    try {
      setLoading(true);
      setError('');
      
      let queryString = 'status=approved';
      if (params.mainCategory) queryString += `&mainCategory=${params.mainCategory}`;
      if (params.city) queryString += `&city=${params.city}`;
      if (params.search) queryString += `&search=${params.search}`;
      
      const response = await fetch(`${API_URL}/offers?${queryString}&limit=20`, { cache: 'no-store' });
      const data = await response.json();
      
      if (!data.offers) {
        setError('Aucune offre trouvée pour ces critères.');
        setOffers([]);
        return;
      }
      
      setOffers(data.offers);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError('');
      const subCategoryQuery = (category === 'vente' || category === 'location') && subcategory ? `&subCategory=${subcategory}` : '';
      const response = await fetch(
        `${API_URL}/offers?status=approved&mainCategory=${category}${subCategoryQuery}&limit=20`,
        { cache: 'no-store' }
      );
      const data = await response.json();
      if (!data.offers) {
        setError('Impossible de charger les offres pour cette catégorie.');
        return;
      }
      setOffers(data.offers);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des offres.');
    } finally {
      setLoading(false);
    }
  };

  const renderVenteSubcategories = () => (
    <div>
      <section className="section hero-section">
        <h2>Vente Particulier</h2>
        <p>Choisis une sous-catégorie pour voir toutes les offres disponibles.</p>
        <Link className="back-link" to="/">
          ← Retour aux catégories
        </Link>
      </section>

      <section className="section categories-grid">
        {venteSubcategories.map((sub) => (
          <Link key={sub.value} to={`/category/vente/${sub.value}`} className="category-card">
            <div className="category-icon">🏠</div>
            <h3>{sub.label}</h3>
            <p>Voir toutes les offres {sub.label.toLowerCase()} à vendre.</p>
            <div className="category-footer">
              <span>Découvrir</span>
              <span className="category-cta">Voir</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );

  const renderLocationSubcategories = () => (
    <div>
      <section className="section hero-section">
        <h2>Location</h2>
        <p>Choisis une durée de location pour voir toutes les offres disponibles.</p>
        <Link className="back-link" to="/">
          ← Retour aux catégories
        </Link>
      </section>

      <section className="section categories-grid">
        {locationSubcategories.map((sub) => (
          <Link key={sub.value} to={`/category/location/${sub.value}`} className="category-card">
            <div className="category-icon">🏢</div>
            <h3>{sub.label}</h3>
            <p>Voir toutes les offres en location {sub.label.toLowerCase()}.</p>
            <div className="category-footer">
              <span>Découvrir</span>
              <span className="category-cta">Voir</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );

  return (
    <div className="category-page-container">
      {isSearch ? (
        <>
          <section className="section hero-section">
            <h2>Résultats de recherche</h2>
            <p>
              {searchParams.mainCategory && `Catégorie: ${categoryLabels[searchParams.mainCategory] || searchParams.mainCategory}`}
              {searchParams.city && ` - Ville: ${searchParams.city}`}
              {searchParams.search && ` - Recherche: ${searchParams.search}`}
            </p>
            <Link className="back-link" to="/">
              ← Retour à l'accueil
            </Link>
          </section>

          <section className="section">
            {loading ? (
              <div className="loading">Recherche en cours...</div>
            ) : error ? (
              <div className="alert error">{error}</div>
            ) : offers.length === 0 ? (
              <div className="no-offers">
                <p>Aucune offre trouvée pour ces critères de recherche.</p>
              </div>
            ) : (
              <>
                <div className="offers-header">
                  <div className="offers-count">
                    <strong>{offers.length}</strong> offre{offers.length > 1 ? 's' : ''} trouvée{offers.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="offers-grid">
                  {offers.map((offer) => (
                    <Link key={offer._id} to={`/offer/${offer._id}`} className="offer-card">
                      <div className="offer-image">
                        {offer.images && offer.images.length > 0 ? (
                          <img src={formatOfferImageUrl(offer.images[0])} alt={offer.title} loading="lazy" />
                        ) : (
                          <div className="no-image">📷</div>
                        )}
                      </div>
                      <div className="offer-content">
                        <p className="offer-price">
                          {offer.price ? `${offer.price.toLocaleString()} DA` : 'Prix sur demande'}
                        </p>
                        <div className="offer-address">📍 {offer.address || offer.city || 'Adresse non spécifiée'}</div>
                        <div className="offer-actions">
                          <span className="view-offer-btn">Voir plus</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      ) : category === 'vente' && !subcategory ? (
        renderVenteSubcategories()
      ) : category === 'location' && !subcategory ? (
        renderLocationSubcategories()
      ) : (
        <>
          <section className="section hero-section">
            <h2>
              {subcategory ? subcategoryLabels[subcategory] : categoryLabels[category] || 'Catégorie'}
            </h2>
            <p>
              {subcategory
                ? `Toutes les offres ${subcategoryLabels[subcategory]?.toLowerCase() || ''} en ${categoryLabels[category]?.toLowerCase() || ''}.`
                : categoryLabels[category]
                ? `Toutes les offres ${categoryLabels[category].toLowerCase()} disponibles.`
                : 'Catégorie introuvable.'}
            </p>
            <Link className="back-link" to={category === 'vente' ? '/category/vente' : category === 'location' ? '/category/location' : '/'}>
              ← Retour {category === 'vente' ? 'aux sous-catégories de vente' : category === 'location' ? 'aux durées de location' : 'aux catégories'}
            </Link>
          </section>

          <section className="section">
            {loading ? (
              <div className="loading">Chargement des offres...</div>
            ) : error ? (
              <div className="alert error">{error}</div>
            ) : offers.length === 0 ? (
              <div className="no-offers">
                <p>Aucune offre trouvée dans cette catégorie.</p>
              </div>
            ) : (
              <>
                <div className="offers-header">
                  <div className="offers-count">
                    <span className="count-number">{offers.length}</span>
                    <span className="count-label">offre{offers.length > 1 ? 's' : ''} trouvée{offers.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="offers-sort">
                    <select className="sort-select">
                      <option value="recent">Plus récentes</option>
                      <option value="price-asc">Prix croissant</option>
                      <option value="price-desc">Prix décroissant</option>
                    </select>
                  </div>
                </div>

                <div className="offer-grid">
                {offers.map((offer) => (
                  <Link key={offer._id} to={`/offer/${offer._id}`} className="offer-card">
                    <div className="offer-image-container">
                      {offer.images && offer.images.length > 0 ? (
                        <img
                          src={formatOfferImageUrl(offer.images[0])}
                          alt={offer.title}
                          className="offer-image"
                        />
                      ) : (
                        <div className="no-image">📸</div>
                      )}
                    </div>

                    <div className="offer-content">
                      <div className="offer-price">
                        💰 {offer.price ? `${offer.price.toLocaleString()} FCFA` : 'Prix sur demande'}
                      </div>
                      <div className="offer-details">
                        {offer.mainCategory === 'promotion' && (
                          <>
                            {offer.apartmentTypes && (
                              <div className="detail-item">
                                <span className="detail-icon">🏢</span>
                                <span className="detail-text">{offer.apartmentTypes} appartements</span>
                              </div>
                            )}
                            {offer.projectStatus && (
                              <div className="detail-item">
                                <span className="detail-icon">🔨</span>
                                <span className="detail-text">
                                  {offer.projectStatus === 'conception' ? 'En conception' :
                                   offer.projectStatus === 'en_construction' ? 'En construction' :
                                   offer.projectStatus === 'pret_livraison' ? 'Prêt à la livraison' : offer.projectStatus}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {(offer.mainCategory === 'vente' && (offer.subCategory === 'maison' || offer.subCategory === 'locaux_commerciaux')) ||
                         (offer.mainCategory === 'location' && offer.subCategory === 'longue_duree') ? (
                          <>
                            {offer.description && (
                              <div className="detail-item">
                                <span className="detail-icon">📝</span>
                                <span className="detail-text">{offer.description.slice(0, 40)}...</span>
                              </div>
                            )}
                            {offer.subCategory === 'maison' && offer.propertyType && (
                              <div className="detail-item">
                                <span className="detail-icon">🏠</span>
                                <span className="detail-text">{offer.propertyType}</span>
                              </div>
                            )}
                            {offer.subCategory === 'locaux_commerciaux' && offer.area && (
                              <div className="detail-item">
                                <span className="detail-icon">📐</span>
                                <span className="detail-text">{offer.area} m²</span>
                              </div>
                            )}
                            {offer.mainCategory === 'location' && offer.subCategory === 'longue_duree' && offer.advance && (
                              <div className="detail-item">
                                <span className="detail-icon">💰</span>
                                <span className="detail-text">{offer.advance}</span>
                              </div>
                            )}
                          </>
                        ) : offer.mainCategory === 'vente' && offer.area ? (
                          <div className="detail-item">
                            <span className="detail-icon">📐</span>
                            <span className="detail-text">{offer.area} m²</span>
                          </div>
                        ) : null}

                        {offer.mainCategory === 'location' && offer.area && (
                          <div className="detail-item">
                            <span className="detail-icon">📐</span>
                            <span className="detail-text">{offer.area} m²</span>
                          </div>
                        )}
                      </div>
                      <div className="offer-address">
                        <span className="location-icon">📍</span>
                        <span className="location-text">{offer.address || offer.city || 'Adresse non précisée'}</span>
                      </div>
                      <div className="offer-actions">
                        <span className="view-offer-btn">Voir plus</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </> )}
          </section>
        </> )}
    </div>
  );
}

export default CategoryPage;
