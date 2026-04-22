import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  LogOut,
  Tags,
  Users,
  Truck,
  Menu,
  X,
} from 'lucide-react';

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { lojaAtiva, lojas, setLojaAtiva, isLoading } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/produtos', icon: Package, label: 'Produtos' },
    { to: '/entrada', icon: ArrowDownCircle, label: 'Entrada' },
    { to: '/saida', icon: ArrowUpCircle, label: 'Saída' },
    { to: '/historico', icon: History, label: 'Histórico' },
    { to: '/categorias', icon: Tags, label: 'Categorias' },
    { to: '/vendedores', icon: Users, label: 'Vendedores' },
    { to: '/encomendas', icon: Truck, label: 'Encomendas' },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden relative">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex-shrink-0 flex items-center justify-between bg-sidebar-950 px-4 py-3 shadow-md z-20 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-white rounded-full overflow-hidden border-2 border-white/20">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-white font-bold text-sm tracking-wide">Coisas de Luluzinha</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-1.5 focus:outline-none hover:bg-white/10 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 bg-gradient-to-b from-sidebar-950 via-sidebar-900 to-sidebar-950 flex flex-col shrink-0 shadow-xl
      `}>
        {/* Logo */}
        <div className="hidden lg:flex px-6 py-6 border-b border-white/10 items-center gap-3">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-white rounded-full overflow-hidden border-2 border-white/20">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm tracking-wide leading-tight">Coisas de Luluzinha</h1>
              <p className="text-white text-[11px] mt-0.5">Sistema de Estoque</p>
            </div>
        </div>

        {/* Store Selector */}
        <div className="px-4 py-3 border-b border-white/10">
          {isLoading ? (
            <div className="animate-pulse h-8 bg-white/10 rounded"></div>
          ) : (
            <select
              value={lojaAtiva?.id || ''}
              onChange={(e) => {
                const loja = lojas.find((l) => l.id === e.target.value);
                if (loja) setLojaAtiva(loja);
              }}
              className="w-full bg-sidebar-900 text-white text-sm rounded border border-white/20 px-3 py-2 outline-none focus:border-white/40 appearance-none font-medium"
            >
              {lojas.map((loja) => (
                <option key={loja.id} value={loja.id}>
                  {loja.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-[11px] font-semibold text-white uppercase tracking-wider mb-2">
            Menu
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                isActive
                  ? 'sidebar-link-active'
                  : 'sidebar-link'
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10 mt-auto">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white text-xs font-bold">
              {usuario?.nome?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{usuario?.nome}</p>
              <p className="text-white/60 text-xs truncate">{usuario?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-white transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col pt-0 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
