import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import PromoterDashboard from './pages/PromoterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CategoryPage from './pages/CategoryPage';
import OfferDetails from './pages/OfferDetails';

function AppContent() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  if (loading) {
    return <div className="section">Chargement...</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <img src="/immotisse.png" alt="IMMOTISSE Logo" className="header-logo-img" />
          <span>IMMOTISSE</span>
        </div>
        <nav>
          <Link to="/">Accueil</Link>
          {!user ? (
            <>
              <Link to="/signup">Inscription</Link>
              <Link to="/login">Connexion</Link>
            </>
          ) : (
            <>
              <span style={{ color: 'white', marginLeft: 16 }}>Bonjour {user.companyName || user.name}</span>
              {user.role === 'admin' ? (
                <>
                  <Link to="/admin">Dashboard</Link>
                </>
              ) : (
                <Link to="/promoter">Espace Promoteur</Link>
              )}
              <button style={{ marginLeft: 10, padding: '8px 12px' }} onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/category/:category/:subcategory" element={<CategoryPage />} />
          <Route path="/offer/:id" element={<OfferDetails />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/promoter" element={user && user.role !== 'admin' ? <PromoterDashboard /> : <Home />} />
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : <Home />} />
          <Route path="/admin/requests" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
