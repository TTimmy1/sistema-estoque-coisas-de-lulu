import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { ArrowDownCircle, CheckCircle, AlertCircle, Tag, Package, PlusCircle } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  sku: string;
  custo: string;
  preco_venda: string;
  qtd_estoque: number;
}

export default function Entrada() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [form, setForm] = useState({ produtoId: '', quantidade: '', observacao: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/produtos').then((r) => setProdutos(r.data));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setLoading(true);

    const payload: Record<string, unknown> = {
      produtoId: form.produtoId,
      quantidade: parseInt(form.quantidade, 10),
      observacao: form.observacao || undefined,
    };

    try {
      await api.post('/movimentacoes/entrada', payload);
      setMsg({ text: 'Entrada registrada com sucesso!', type: 'success' });
      setForm({ produtoId: '', quantidade: '', observacao: '' });
      // Refresh products list to update quantities
      api.get('/produtos').then((r) => setProdutos(r.data));
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao registrar entrada';
      setMsg({ text: message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const produtoSelecionado = produtos.find((p) => p.id === form.produtoId);
  const totalVenda = produtoSelecionado && form.quantidade
    ? Number(produtoSelecionado.preco_venda) * parseInt(form.quantidade, 10)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <ArrowDownCircle className="w-6 h-6 text-emerald-500" />
          </div>
          Registrar Entrada
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Reposição de estoque e novos itens.</p>
      </div>

      {msg.text && (
        <div className={`flex items-center gap-3 p-5 rounded-2xl text-sm font-bold border animate-in fade-in slide-in-from-top-4 duration-500 ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <form onSubmit={handleSubmit} className="card-section space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <PlusCircle className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold">Dados da Entrada</h2>
          </div>

          <div>
            <label className="form-label">Produto *</label>
            <select
              value={form.produtoId}
              onChange={(e) => setForm({ ...form, produtoId: e.target.value })}
              className="input-field"
              required
            >
              <option value="" className="dark:bg-slate-900">Selecione um produto</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-slate-900">
                  {p.nome} (Atual: {p.qtd_estoque} un.)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Quantidade a Adicionar *</label>
              <input
                type="number"
                min="1"
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                className="input-field"
                required
                placeholder="0"
              />
            </div>
            <div>
              <label className="form-label">Observação</label>
              <input
                type="text"
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                className="input-field"
                placeholder="Ex: Fornecedor XYZ"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !form.produtoId || !form.quantidade}
            className="btn-primary w-full py-4 text-lg font-black tracking-tight mt-4 disabled:opacity-30"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Confirmar Entrada de Estoque'
            )}
          </button>
        </form>

        {/* Info Card */}
        {produtoSelecionado && (
          <div className="card-section bg-brand-500/5 border-brand-500/10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Produto Selecionado</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{produtoSelecionado.nome}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Estoque Atual</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{produtoSelecionado.qtd_estoque} UN</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Estoque Pós-Entrada</p>
                <p className="text-2xl font-black text-emerald-500">
                  {produtoSelecionado.qtd_estoque + (parseInt(form.quantidade) || 0)} UN
                </p>
              </div>
            </div>

            {form.quantidade && (
              <div className="p-5 bg-brand-500/10 rounded-2xl border border-brand-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Tag className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Potencial de Venda</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {totalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Calculado com base no preço de venda atual</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
