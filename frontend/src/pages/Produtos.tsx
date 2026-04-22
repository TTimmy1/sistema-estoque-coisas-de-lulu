import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { Search, Plus, Package, X, Trash2 } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  sku: string;
  custo: string;
  preco_venda: string;
  qtd_estoque: number;
  criado_em: string;
  categoria: { nome: string } | null;
}

interface Categoria {
  id: string;
  nome: string;
}

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', custo: '', preco_venda: '', categoriaId: '' });
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProdutos = () => {
    api.get('/produtos', { params: { busca } })
      .then((r) => setProdutos(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProdutos();
    api.get('/categorias').then((r) => setCategorias(r.data));
  }, [busca]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/produtos', {
        ...form,
        categoriaId: form.categoriaId || null,
        custo: parseFloat(form.custo),
        preco_venda: parseFloat(form.preco_venda),
        qtd_estoque: 0,
      });
      setForm({ nome: '', descricao: '', custo: '', preco_venda: '', categoriaId: '' });
      setShowForm(false);
      fetchProdutos();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar produto. Verifique os dados informados.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await api.delete(`/produtos/${id}`);
      fetchProdutos();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Erro ao excluir produto.';
      alert(msg);
    }
  };

  const formatCurrency = (v: string | number) =>
    Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie seu catálogo de produtos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Novo Produto'}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          type="text"
          placeholder="Buscar por nome ou SKU..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card-section p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-brand-500" />
            </div>
            Novo Produto
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
            <div>
              <label className="form-label">Categoria</label>
              <select
                value={form.categoriaId}
                onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                className="input-field"
              >
                <option value="">Sem categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Custo (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.custo}
                onChange={(e) => setForm({ ...form, custo: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="form-label">Preço de Venda (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.preco_venda}
                onChange={(e) => setForm({ ...form, preco_venda: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Salvar Produto
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
            <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Produto</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoria</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Custo</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Venda</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Estoque</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Criado em</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {produtos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-sm text-gray-800 font-medium">{p.nome}</p>
                      {p.descricao && <p className="text-xs text-gray-300 mt-0.5">{p.descricao}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {p.categoria?.nome ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-600">
                        {p.categoria.nome}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 text-right">{formatCurrency(p.custo)}</td>
                  <td className="px-5 py-3.5 text-sm text-emerald-600 text-right font-semibold">{formatCurrency(p.preco_venda)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                      p.qtd_estoque <= 5
                        ? 'bg-red-50 text-red-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {p.qtd_estoque}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 text-center">{formatDate(p.criado_em)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {produtos.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-300">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-8 h-8" />
                    <span className="text-sm">Nenhum produto encontrado</span>
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
