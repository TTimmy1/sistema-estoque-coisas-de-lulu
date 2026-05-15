import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { Plus, X, Pencil, Trash2, Users, TrendingUp, DollarSign, Award, Target } from 'lucide-react';

interface Vendedor {
  id: string;
  nome: string;
  _count?: { movimentacoes: number };
  totalVendas: number;
}

export default function Vendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '' });
  const [loading, setLoading] = useState(true);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const fetchVendedores = () => {
    api.get('/vendedores')
      .then((r) => setVendedores(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vendedores', form);
      setForm({ nome: '' });
      setShowForm(false);
      fetchVendedores();
    } catch(err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar vendedor');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await api.put(`/vendedores/${editingId}`, form);
      setForm({ nome: '' });
      setEditingId(null);
      fetchVendedores();
    } catch(err: any) {
      alert(err.response?.data?.error || 'Erro ao atualizar vendedor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este vendedor?')) return;
    try {
      await api.delete(`/vendedores/${id}`);
      fetchVendedores();
    } catch (err: unknown) {
      alert('Erro ao excluir. Verifique se ele já tem movimentações no sistema.');
    }
  };

  const startEdit = (v: Vendedor) => {
    setEditingId(v.id);
    setForm({ nome: v.nome });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ nome: '' });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            Gestão de Vendedores
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie sua equipe e acompanhe o desempenho individual.</p>
        </div>
        <button
          onClick={showForm ? cancelForm : () => setShowForm(true)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${
            showForm 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
              : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
          }`}
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancelar' : 'Novo Vendedor'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="card-section animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Pencil className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold">{editingId ? 'Editar Vendedor' : 'Cadastrar Vendedor'}</h2>
          </div>
          
          <div className="max-w-xl space-y-6">
            <div>
              <label className="form-label">Nome Completo *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="input-field"
                required
                placeholder="Ex: Ana Souza"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={cancelForm} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary min-w-[150px] bg-blue-600 hover:bg-blue-700 shadow-blue-500/20">
                {editingId ? 'Atualizar Dados' : 'Salvar Vendedor'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Grid of Sellers (Alternative to simple table for better contrast) */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendedores.map((v) => (
            <div key={v.id} className="card-section group hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 text-2xl font-black group-hover:scale-110 transition-transform">
                    {v.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{v.nome}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Target className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {v._count?.movimentacoes ?? 0} Vendas Realizadas
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl mb-8">
                <div className="flex items-center gap-2 mb-1 text-emerald-600">
                  <Award className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Acumulado</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {formatCurrency(v.totalVendas)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => startEdit(v)}
                  className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                  title="Editar"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {vendedores.length === 0 && (
            <div className="col-span-full card-section py-20 flex flex-col items-center justify-center text-center">
              <Users className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
              <p className="text-slate-500 font-bold">Nenhum vendedor cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
