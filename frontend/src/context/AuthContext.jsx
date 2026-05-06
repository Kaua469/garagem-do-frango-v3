import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gf_usuario')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (telefone, senha) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { telefone, senha });
      localStorage.setItem('gf_token', data.token);
      localStorage.setItem('gf_usuario', JSON.stringify(data.usuario));
      setUsuario(data.usuario);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gf_token');
    localStorage.removeItem('gf_usuario');
    setUsuario(null);
  };

  const atualizarUsuario = (dados) => {
    const updated = { ...usuario, ...dados };
    localStorage.setItem('gf_usuario', JSON.stringify(updated));
    setUsuario(updated);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
