import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Entrada from './pages/Entrada';
import Saida from './pages/Saida';
import Historico from './pages/Historico';
import Categorias from './pages/Categorias';
import Vendedores from './pages/Vendedores';
import Encomendas from './pages/Encomendas';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onSwitchToRegister={() => window.location.href = '/register'} />} />
        <Route path="/register" element={<Register onSwitchToLogin={() => window.location.href = '/login'} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="entrada" element={<Entrada />} />
        <Route path="saida" element={<Saida />} />
        <Route path="historico" element={<Historico />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="vendedores" element={<Vendedores />} />
        <Route path="encomendas" element={<Encomendas />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <AppRoutes />
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
