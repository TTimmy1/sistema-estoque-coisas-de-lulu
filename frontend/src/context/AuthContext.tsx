import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('usuario');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUsuario(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, senha: string) => {
    const { data } = await api.post('/auth/login', { email, senha });
    setToken(data.token);
    setUsuario(data.usuario);
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
  };

  const register = async (nome: string, email: string, senha: string, role: string) => {
    await api.post('/auth/register', { nome, email, senha, role });
    // Registro cria conta como PENDENTE — sem login automático
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  return (
    <AuthContext.Provider
      value={{ usuario, token, login, register, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
