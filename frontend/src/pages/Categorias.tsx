import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { Plus, X, Pencil, Trash2, Tag } from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
  descricao: string | null;
  _count?: { produtos: number };
}

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '' });
  const [loading, setLoading] = useState(true);

  const fetchCategorias = () => {
    api.get('/categorias')
      .then((r) => setCategorias(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categorias', form);
      setForm({ nome: '', descricao: '' });
      setShowForm(false);
      fetchCategorias();
    } catch(err: any) {
      alert(err.response?.data?.error || 'Erro ao criar categoria');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await api.put(`/categorias/${editingId}`, form);
      setForm({ nome: '', descricao: '' });
      setEditingId(null);
      fetchCategorias();
    } catch(err: any) {
      alert(err.response?.data?.error || 'Erro ao atualizar categoria');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;
    await api.delete(`/categorias/${id}`);
    fetchCategorias();
  };

  const startEdit = (c: Categoria) => {
    setEditingId(c.id);
    setForm({ nome: c.nome, descricao: c.descricao ?? '' });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ nome: '', descricao: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie as categorias dos seus produtos</p>
        </div>
        <button
          onClick={showForm ? cancelForm : () => setShowForm(true)}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nova Categoria'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="card-section p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Tag className="w-4 h-4 text-brand-500" />
            </div>
            {editingId ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="form-label">Descrição</label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="input-field"
              />
            </div>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Descrição</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Produtos</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categorias.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Tag className="w-3.5 h-3.5 text-violet-500" />
                      </div>
                      <span className="text-sm text-gray-800 font-medium">{c.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{c.descricao ?? <span className="text-gray-200">—</span>}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gray-100 text-xs font-semibold">
                      {c._count?.produtos ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => startEdit(c)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-300">
                  <div className="flex flex-col items-center gap-2">
                    <Tag className="w-8 h-8" />
                    <span className="text-sm">Nenhuma categoria encontrada</span>
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
