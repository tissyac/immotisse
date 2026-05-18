import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = 'token';

  const getSavedToken = () => {
    const sessionToken = sessionStorage.getItem(STORAGE_KEY);
    if (sessionToken) return sessionToken;

    const localToken = localStorage.getItem(STORAGE_KEY);
    if (localToken) {
      // Migration de l'ancien stockage local vers session pour éviter qu'une session reste ouverte entre deux visites.
      sessionStorage.setItem(STORAGE_KEY, localToken);
      localStorage.removeItem(STORAGE_KEY);
      return localToken;
    }

    return null;
  };

  // Charger le token depuis sessionStorage au démarrage
  useEffect(() => {
    const savedToken = getSavedToken();
    if (savedToken) {
      setToken(savedToken);
      // Vérifier que le token est encore valide
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tok) => {
    try {
      const res = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
      }
    } catch (err) {
      console.log('Erreur lors de la vérification:', err);
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur de login');
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      sessionStorage.setItem(STORAGE_KEY, data.token);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
