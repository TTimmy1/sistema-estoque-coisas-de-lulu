import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { Plus, X, Pencil, Trash2, Users, TrendingUp } from 'lucide-react';

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
      alert('Errou ao excluir. Verifique se ele já tem movimentações no sistema.');
    }
  };

  const startEdit = (v: Vendedor) => {
    setEditingId(v.id);
    setForm({ nome: v.nome });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ nome: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendedores</h1>
          <p className="text-sm text-gray-400 mt-1">Cadastre a sua equipe de vendas</p>
        </div>
        <button
          onClick={showForm ? cancelForm : () => setShowForm(true)}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Novo Vendedor'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="card-section p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-500" />
            </div>
            {editingId ? 'Editar Vendedor' : 'Novo Vendedor'}
          </h2>
          <div className="max-w-md">
            <label className="form-label">Nome *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="submit" className="btn-primary">
              {editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="card-section overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendas / Baixas</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Vendido</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendedores.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-sm">
                        {v.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-800 font-medium">{v.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-xs font-semibold text-blue-600">
                      <TrendingUp className="w-3 h-3" />
                      {v._count?.movimentacoes ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-emerald-600 text-right font-bold">{formatCurrency(v.totalVendas)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => startEdit(v)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vendedores.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-300">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-8 h-8" />
                    <span className="text-sm">Nenhum vendedor encontrado</span>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
