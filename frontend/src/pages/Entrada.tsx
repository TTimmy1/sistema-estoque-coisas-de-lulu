import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { ArrowDownCircle, CheckCircle, AlertCircle, Package } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  sku: string;
  custo: string;
  qtd_estoque: number;
}

export default function Entrada() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [form, setForm] = useState({ produtoId: '', quantidade: '', custo: '', observacao: '' });
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
    if (form.custo) {
      payload.custo = parseFloat(form.custo);
    }

    try {
      await api.post('/movimentacoes/entrada', payload);
      setMsg({ text: 'Entrada registrada com sucesso!', type: 'success' });
      setForm({ produtoId: '', quantidade: '', custo: '', observacao: '' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar entrada';
      setMsg({ text: message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const produtoSelecionado = produtos.find((p) => p.id === form.produtoId);
  const total = produtoSelecionado && form.quantidade
    ? (form.custo ? parseFloat(form.custo) : Number(produtoSelecionado.custo)) * parseInt(form.quantidade, 10)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
          </div>
          Registrar Entrada
        </h1>
        <p className="text-sm text-gray-400 mt-1">Adicione itens ao estoque</p>
      </div>

      {msg.text && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm border ${
          msg.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-section p-6 space-y-5 max-w-2xl">
        <div>
          <label className="form-label">Produto *</label>
          <select
            value={form.produtoId}
            onChange={(e) => setForm({ ...form, produtoId: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Selecione um produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} — Estoque: {p.qtd_estoque}</option>
            ))}
          </select>
        </div>

        {produtoSelecionado && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Quantidade *</label>
              <input
                type="number"
                min="1"
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="form-label">Custo Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={Number(produtoSelecionado.custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                value={form.custo}
                onChange={(e) => setForm({ ...form, custo: e.target.value })}
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Deixe vazio para usar o custo atual</p>
            </div>
          </div>
        )}

        {produtoSelecionado && form.quantidade && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-emerald-700">
                <strong>Total:</strong> {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-emerald-500">Custo unitário: {(form.custo ? parseFloat(form.custo) : Number(produtoSelecionado.custo)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
          </div>
        )}

        <div>
          <label className="form-label">Observação</label>
          <input
            type="text"
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            className="input-field"
            placeholder="Ex: Fornecedor XYZ, Nota fiscal #123"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !form.produtoId}
            className="btn-primary bg-gradient-to-r from-emerald-500 to-emerald-600"
          >
            {loading ? 'Registrando...' : 'Registrar Entrada'}
          </button>
        </div>
      </form>
    </div>
  );
}
