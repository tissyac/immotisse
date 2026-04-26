import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const categories = [
  { label: 'Vente', value: 'vente', icon: '🏠', color: '#f48500', description: 'Biens immobiliers à vendre' },
  { label: 'Location', value: 'location', icon: '🏢', color: '#f48500', description: 'Locations immobilières' },
  { label: 'Promotion', value: 'promotion', icon: '🏗️', color: '#f48500', description: 'Promotions immobilières' }
];

function Home() {
  const [counts, setCounts] = useState({ promotion: 0, vente: 0, location: 0 });
  const [recentOffers, setRecentOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    type: '',
    address: '',
    keyword: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Charger les comptes par catégorie
      const response = await fetch('http://localhost:3008/offers?status=approved&limit=50');
      const data = await response.json();
      if (!data.offers) {
        setError('Impossible de charger les données.');
        return;
      }

      const grouped = {
        promotion: data.offers.filter((offer) => offer.mainCategory === 'promotion').length,
        vente: data.offers.filter((offer) => offer.mainCategory === 'vente').length,
        location: data.offers.filter((offer) => offer.mainCategory === 'location').length
      };
      setCounts(grouped);

      // Charger les 6 offres les plus récentes
      const recent = data.offers
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6);
      setRecentOffers(recent);

    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implémenter la recherche
    const params = new URLSearchParams();
    if (searchFilters.type) params.append('mainCategory', searchFilters.type);
    if (searchFilters.address) params.append('city', searchFilters.address);
    if (searchFilters.keyword) params.append('search', searchFilters.keyword);

    window.location.href = `/category/search?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="section">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Header avec logo et titre */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <img src="/immotisse.png" alt="IMMOTISSE Logo" className="logo-img" />
            <div className="title-section">
              <h1 className="main-title">Centre Immobilier IMMOTISSE</h1>
              <p className="subtitle">Toutes vos opportunités immobilières au même endroit</p>
            </div>
          </div>
        </div>
      </header>

      {/* Barre de recherche */}
      <section className="search-section">
        <div className="search-container">
          <h2 className="search-title">Trouvez votre bien idéal</h2>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-row">
              <div className="search-group">
                <label>Type :</label>
                <select
                  value={searchFilters.type}
                  onChange={(e) => setSearchFilters({...searchFilters, type: e.target.value})}
                >
                  <option value="">Tous les types</option>
                  <option value="location">Location</option>
                  <option value="vente">Vente particulier</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>

              <div className="search-group">
                <label>📍 Adresse (ville, commune…)</label>
                <input
                  type="text"
                  placeholder="Ex: Béjaia, Alger..."
                  value={searchFilters.address}
                  onChange={(e) => setSearchFilters({...searchFilters, address: e.target.value})}
                />
              </div>

              <div className="search-group">
                <label>🔤 Mot-clé (ex : villa, F3…)</label>
                <input
                  type="text"
                  placeholder="Ex: villa, F3, appartement..."
                  value={searchFilters.keyword}
                  onChange={(e) => setSearchFilters({...searchFilters, keyword: e.target.value})}
                />
              </div>

              <div className="search-group">
                <button type="submit" className="search-btn">🔘 Rechercher</button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Catégories principales */}
      <section className="categories-section">
        <div className="section-container">
          <h2>Catégories principales</h2>
          <div className="categories-grid">
            {categories.map((cat) => (
              <Link key={cat.value} to={`/category/${cat.value}`} className="category-card-large" style={{borderColor: cat.color}}>
                <div className="category-image" style={{backgroundColor: cat.color}}>
                  <span className="category-icon-large">{cat.icon}</span>
                </div>
                <div className="category-content">
                  <h3 style={{color: cat.color}}>{cat.label}</h3>
                  <p>{cat.description}</p>
                  <div className="category-stats">
                    <span className="offer-count">{counts[cat.value] || 0} offres disponibles</span>
                    <span className="category-btn" style={{backgroundColor: cat.color}}>Voir les offres</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Offres récentes */}
      <section className="recent-offers-section">
        <div className="section-container">
          <h2>Offres récentes</h2>
          <div className="recent-offers-grid">
            {recentOffers.map((offer) => (
              <div key={offer._id} className="recent-offer-card">
                <div className="offer-image">
                  {offer.images && offer.images.length > 0 ? (
                    <img src={`http://localhost:3008${offer.images[0]}`} alt={offer.title} />
                  ) : (
                    <div className="no-image">📸</div>
                  )}
                </div>
                <div className="offer-details">
                  <div className="offer-price">💰 {offer.price ? `${offer.price.toLocaleString()} DA` : 'Prix sur demande'}</div>
                  
                  {/* Affichage simplifié pour les maisons, locaux commerciaux et location longue durée */}
                  {(offer.mainCategory === 'vente' && (offer.subCategory === 'maison' || offer.subCategory === 'locaux_commerciaux')) ||
                   (offer.mainCategory === 'location' && offer.subCategory === 'longue_duree') ? (
                    <>
                      <div className="offer-address">📍 {offer.address || 'Adresse non spécifiée'}</div>
                      <div className="offer-description">📝 {offer.description ? offer.description.slice(0, 50) + '...' : 'Description non disponible'}</div>
                      {offer.subCategory === 'maison' ? (
                        <div className="offer-type">🏠 {offer.propertyType || 'Type non spécifié'}</div>
                      ) : offer.subCategory === 'locaux_commerciaux' ? (
                        <div className="offer-type">🏪 {offer.area ? `${offer.area} m²` : 'Superficie non spécifiée'}</div>
                      ) : offer.mainCategory === 'location' && offer.subCategory === 'longue_duree' ? (
                        <div className="offer-type">🏠 {offer.propertyType || 'Type non spécifié'}</div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="offer-address">📍 {offer.city || 'Adresse non spécifiée'}</div>
                      <div className="offer-type">🏠 {offer.propertyType || 'Type non spécifié'}</div>
                    </>
                  )}
                  
                  <Link to={`/offer/${offer._id}`} className="view-more-btn">Voir plus</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi choisir IMMOTISSE */}
      <section className="why-choose-section">
        <div className="section-container">
          <h2>Pourquoi choisir IMMOTISSE</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">✅</div>
              <h3>Large choix de biens immobiliers</h3>
              <p>Appartements, villas, terrains et locaux adaptés à tous les besoins</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✅</div>
              <h3>Gain de temps et simplicité</h3>
              <p>Recherche rapide et mise en relation directe avec les professionnels</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✅</div>
              <h3>Centralisation des agences et promotions immobilières</h3>
              <p>Toutes vos recherches immobilières au même endroit</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✅</div>
              <h3>Plateforme fiable et sécurisée</h3>
              <p>Transactions sécurisées et données protégées</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✅</div>
              <h3>Confiance et transparence</h3>
              <p>Informations claires et vérifiées</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✅</div>
              <h3>Accompagnement dans les démarches administratives</h3>
              <p>Aide complète pour vos formalités</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer avec infos de contact et réseaux sociaux */}
      <footer className="main-footer">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/immotisse.png" alt="IMMOTISSE" className="footer-logo-img" />
              <div className="footer-logo-text">IMMOTISSE</div>
            </div>
            <p className="footer-description">
              La plateforme de référence pour tous vos besoins immobiliers en Algérie.
              Nous vous offrons un espace simple, moderne et sécurisé pour explorer, comparer et trouver les meilleures opportunités immobilières partout en Algérie. Grâce à Immotisse, connectez-vous facilement avec les agences, promoteurs et professionnels de l’immobilier les plus fiables, et profitez d’un accompagnement complet pour concrétiser vos projets en toute confiance.
            </p>
          </div>

          {/* Contact Info */}
          <div className="contact-info footer-box">
            <h3>📞 Nous contacter</h3>
            <p className="footer-box-text">Notre équipe est disponible pour répondre à vos questions et vous accompagner dans votre recherche immobilière.</p>
            <div className="contact-item">
              <span className="contact-icon">📱</span>
              <div>
                <div className="contact-item-label">Mobile</div>
                <div>0770 38 37 43</div>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">☎️</span>
              <div>
                <div className="contact-item-label">Standard</div>
                <div>030 19 94 39</div>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <div>
                <div className="contact-item-label">Adresse</div>
                <div>Cité 200 logements, Iheddaden, Béjaia</div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="footer-box">
            <h3 className="footer-section-title">🌐 Restez connectés</h3>
            <p className="footer-box-text">Suivez nos annonces exclusives, conseils et nouveautés en temps réel.</p>
            <div className="social-links">
              <a href="https://www.facebook.com/profile.php?id=61574319334469&locale=fr_FR" target="_blank" rel="noopener noreferrer" className="social-link">
                <span>f</span>
              </a>
              <a href="https://www.instagram.com/immotisse/" target="_blank" rel="noopener noreferrer" className="social-link">
                <span>📷</span>
              </a>
              <a href="https://www.tiktok.com/@immotiss.fr?lang=fr" target="_blank" rel="noopener noreferrer" className="social-link">
                <span>♪</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            © 2026 IMMOTISSE. Tous droits réservés. | Plateforme immobilière algérienne
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
