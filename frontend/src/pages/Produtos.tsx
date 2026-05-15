import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Pencil, 
  Trash2, 
  Package, 
  AlertCircle,
  CheckCircle2,
  Barcode,
  X,
  Zap,
  Tags
} from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  sku: string;
  codigo_barras: string | null;
  custo: string;
  preco_venda: string;
  qtd_estoque: number;
  estoque_minimo: number;
  categoriaId: string;
  categoria?: { nome: string };
}

export default function Produtos() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === 'ADMIN';

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [quickEditTerm, setQuickEditTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: '',
    sku: '',
    codigo_barras: '',
    custo: '',
    preco_venda: '',
    qtd_estoque: '0',
    estoque_minimo: '5',
    categoriaId: '',
  });

  const fetchProdutos = async () => {
    try {
      const res = await api.get('/produtos');
      setProdutos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    const res = await api.get('/categorias');
    setCategorias(res.data);
  };

  useEffect(() => {
    fetchProdutos();
    fetchCategorias();
  }, []);

  const handleEdit = (p: Produto) => {
    setForm({
      nome: p.nome,
      sku: p.sku,
      codigo_barras: p.codigo_barras || '',
      custo: p.custo.toString(),
      preco_venda: p.preco_venda.toString(),
      qtd_estoque: p.qtd_estoque.toString(),
      estoque_minimo: p.estoque_minimo.toString(),
      categoriaId: p.categoriaId,
    });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickEdit = (term: string) => {
    setQuickEditTerm(term);
    if (!term) return;

    const found = produtos.find(p => 
      p.sku.toLowerCase() === term.toLowerCase() || 
      (p.codigo_barras && p.codigo_barras === term)
    );

    if (found) {
      handleEdit(found);
      setQuickEditTerm('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        custo: form.custo.replace(',', '.'),
        preco_venda: form.preco_venda.replace(',', '.'),
        qtd_estoque: Number(form.qtd_estoque),
        estoque_minimo: Number(form.estoque_minimo),
        codigo_barras: form.codigo_barras || null,
      };

      if (editingId) {
        await api.put(`/produtos/${editingId}`, payload);
      } else {
        await api.post('/produtos', payload);
      }
      resetForm();
      fetchProdutos();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar produto');
    }
  };

  const resetForm = () => {
    setForm({
      nome: '',
      sku: '',
      codigo_barras: '',
      custo: '',
      preco_venda: '',
      qtd_estoque: '0',
      estoque_minimo: '5',
      categoriaId: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    try {
      await api.delete(`/produtos/${id}`);
      fetchProdutos();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir');
    }
  };

  const filteredProdutos = produtos.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigo_barras && p.codigo_barras.includes(searchTerm));
    
    const matchesCategoria = !selectedCategoria || p.categoriaId === selectedCategoria;
    
    return matchesSearch && matchesCategoria;
  });

  const formatCurrency = (v: any) => 
    Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Catálogo de Produtos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie seu estoque de forma eficiente.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {/* Quick Edit Field */}
           <div className="relative group">
            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500 w-4 h-4 animate-pulse" />
            <input
              type="text"
              placeholder="Edição Rápida (SKU/Barcode)"
              className="bg-brand-500/5 border border-brand-500/20 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all w-full sm:w-64"
              value={quickEditTerm}
              onChange={e => handleQuickEdit(e.target.value)}
            />
          </div>

          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${
              showForm 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                : 'bg-brand-600 text-white shadow-brand-500/20 hover:bg-brand-700'
            }`}
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Fechar Formulário' : 'Novo Produto'}
          </button>
        </div>
      </div>

      {/* Form Section */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-section animate-in fade-in slide-in-from-top-4 duration-500 border-2 border-brand-500/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-brand-500" />
            </div>
            <h2 className="text-xl font-bold">{editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="form-label">Nome do Produto *</label>
              <input
                type="text"
                required
                className="input-field"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Camiseta Premium Algodão"
              />
            </div>
            <div>
              <label className="form-label">SKU (Referência)</label>
              <input
                type="text"
                className="input-field"
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                placeholder="Ex: CAM-001 (Gerado se vazio)"
              />
            </div>
            <div>
              <label className="form-label">Código de Barras</label>
              <div className="relative">
                <input
                  type="text"
                  className="input-field pl-10"
                  value={form.codigo_barras}
                  onChange={e => setForm({ ...form, codigo_barras: e.target.value })}
                  placeholder="EAN-13"
                />
                <Barcode className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="form-label">Categoria *</label>
              <select
                required
                className="input-field"
                value={form.categoriaId}
                onChange={e => setForm({ ...form, categoriaId: e.target.value })}
              >
                <option value="" className="dark:bg-slate-900">Selecione...</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id} className="dark:bg-slate-900">{cat.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Preço de Custo (R$)</label>
              <input
                type="text"
                className="input-field"
                value={form.custo}
                onChange={e => setForm({ ...form, custo: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="form-label">Preço de Venda (R$)</label>
              <input
                type="text"
                className="input-field"
                value={form.preco_venda}
                onChange={e => setForm({ ...form, preco_venda: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="form-label">Estoque Atual</label>
              <input
                type="number"
                className="input-field bg-slate-100 dark:bg-slate-800 opacity-60 cursor-not-allowed"
                value={form.qtd_estoque}
                readOnly
              />
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Use Entrada/Saída para alterar quantidades</p>
            </div>
            <div>
              <label className="form-label">Estoque Mínimo</label>
              <input
                type="number"
                className="input-field"
                value={form.estoque_minimo}
                onChange={e => setForm({ ...form, estoque_minimo: e.target.value })}
              />
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary min-w-[150px]">
              {editingId ? 'Atualizar Produto' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      )}

      {/* List and Search Section */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Pesquisar por nome, SKU ou código de barras..."
              className="input-field pl-12 h-14 text-lg"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative min-w-[240px]">
            <Tags className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              className="input-field pl-12 h-14 font-bold text-slate-700 dark:text-slate-200 appearance-none"
              value={selectedCategoria}
              onChange={e => setSelectedCategoria(e.target.value)}
            >
              <option value="">Todas as Categorias</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id} className="dark:bg-slate-900">{cat.nome}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => {setSearchTerm(''); setSelectedCategoria('');}}
            className="flex items-center justify-center gap-2 px-6 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <Filter className="w-5 h-5" />
            Limpar
          </button>
        </div>

        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Produto</th>
                  <th className="table-th">SKU</th>
                  <th className="table-th">Categoria</th>
                  <th className="table-th text-center">Preço</th>
                  <th className="table-th text-center">Estoque</th>
                  <th className="table-th text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="table-tbody">
                {filteredProdutos.map(p => (
                  <tr key={p.id} className="table-tr">
                    <td className="table-td">
                      <div className="flex flex-col">
                        <span className="table-td-text">{p.nome}</span>
                        {p.codigo_barras && (
                          <span className="table-td-subtext flex items-center gap-1">
                            <Barcode className="w-3 h-3" /> {p.codigo_barras}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="table-td-subtext font-mono font-bold">{p.sku}</span>
                    </td>
                    <td className="table-td">
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {p.categoria?.nome || 'Sem Categoria'}
                      </span>
                    </td>
                    <td className="table-td text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(p.preco_venda)}</span>
                        {isAdmin && <span className="text-[10px] font-bold text-slate-400">Custo: {formatCurrency(p.custo)}</span>}
                      </div>
                    </td>
                    <td className="table-td text-center">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl font-black text-xs
                        ${p.qtd_estoque <= p.estoque_minimo 
                          ? 'bg-rose-500/10 text-rose-600' 
                          : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {p.qtd_estoque <= p.estoque_minimo ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {p.qtd_estoque} UN
                      </div>
                    </td>
                    <td className="table-td text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProdutos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-td py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-300 dark:text-slate-700">
                        <Package className="w-16 h-16 opacity-20" />
                        <span className="text-lg font-bold">Nenhum produto encontrado</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
