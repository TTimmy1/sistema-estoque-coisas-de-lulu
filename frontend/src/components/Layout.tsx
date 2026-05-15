import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  History,
  LogOut,
  Tags,
  Users,
  Truck,
  Menu,
  X,
  UserCog,
  Moon,
  Sun,
} from 'lucide-react';

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { lojaAtiva, lojas, setLojaAtiva, isLoading } = useStore();
  const { theme, toggleTheme } = useTheme();
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

  const allNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/produtos', icon: Package, label: 'Produtos' },
    { to: '/entrada', icon: ArrowDownCircle, label: 'Entrada' },
    { to: '/saida', icon: ArrowUpCircle, label: 'Saída' },
    { to: '/transferencia', icon: ArrowLeftRight, label: 'Transferência' },
    { to: '/historico', icon: History, label: 'Histórico' },
    { to: '/categorias', icon: Tags, label: 'Categorias' },
    { to: '/vendedores', icon: Users, label: 'Vendedores', adminOnly: true },
    { to: '/encomendas', icon: Truck, label: 'Encomendas' },
    { to: '/aprovacoes', icon: UserCog, label: 'Aprovações', adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => usuario?.role === 'ADMIN' || !item.adminOnly);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative transition-colors duration-300">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex-shrink-0 flex items-center justify-between bg-slate-900 px-4 py-3 shadow-md z-20 w-full">
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 bg-slate-900 flex flex-col shrink-0 shadow-2xl border-r border-white/5
      `}>
        {/* Logo */}
        <div className="hidden lg:flex px-6 py-8 border-b border-white/5 items-center gap-4">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-white rounded-xl shadow-lg shadow-black/20 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm tracking-tight leading-tight">Coisas de Luluzinha</h1>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Inventory System</p>
            </div>
        </div>

        {/* Store Selector */}
        <div className="px-4 py-6 border-b border-white/5">
          {isLoading ? (
            <div className="animate-pulse h-10 bg-white/5 rounded-xl"></div>
          ) : (
            <div className="relative group">
              <select
                value={lojaAtiva?.id || ''}
                onChange={(e) => {
                  const loja = lojas.find((l) => l.id === e.target.value);
                  if (loja) setLojaAtiva(loja);
                }}
                className="w-full bg-slate-800 text-white text-xs rounded-xl border border-white/10 px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none font-semibold transition-all cursor-pointer hover:bg-slate-750"
              >
                {lojas.map((loja) => (
                  <option key={loja.id} value={loja.id} className="bg-slate-900">
                    {loja.nome}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <Menu className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
            Navigation
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

        {/* Theme Toggle & User */}
        <div className="mt-auto border-t border-white/5 bg-slate-950/20 backdrop-blur-xl">
          <div className="p-3">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-[18px] h-[18px]" />
                  <span>Modo Escuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-[18px] h-[18px]" />
                  <span>Modo Claro</span>
                </>
              )}
            </button>
          </div>

          <div className="px-3 pb-6">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-500/20">
                {usuario?.nome?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate tracking-tight">{usuario?.nome}</p>
                <p className="text-slate-500 text-[11px] truncate uppercase font-bold tracking-wider">{usuario?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-transparent">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
