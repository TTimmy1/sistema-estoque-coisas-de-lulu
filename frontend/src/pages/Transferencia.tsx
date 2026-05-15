import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { useStore } from '../context/StoreContext';
import { 
  ArrowLeftRight, 
  Store, 
  ArrowRight, 
  Package, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  History
} from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  sku: string;
  qtd_estoque: number;
}

interface Loja {
  id: string;
  nome: string;
}

export default function Transferencia() {
  const { lojaAtiva, lojas } = useStore();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [form, setForm] = useState({
    produtoId: '',
    lojaDestinoId: '',
    quantidade: '',
  });

  useEffect(() => {
    if (lojaAtiva) {
      api.get('/produtos').then((r) => setProdutos(r.data));
    }
  }, [lojaAtiva]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.produtoId || !form.lojaDestinoId || !form.quantidade) return;

    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      await api.post('/transferencia', {
        produtoId: form.produtoId,
        lojaDestinoId: form.lojaDestinoId,
        quantidade: parseInt(form.quantidade, 10),
      });

      setMsg({ text: 'Transferência realizada com sucesso!', type: 'success' });
      setForm({ produtoId: '', lojaDestinoId: '', quantidade: '' });
      // Refresh products
      api.get('/produtos').then((r) => setProdutos(r.data));
    } catch (err: any) {
      setMsg({ 
        text: err.response?.data?.error || 'Erro ao realizar transferência', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const produtoSelecionado = produtos.find(p => p.id === form.produtoId);
  const lojaDestino = lojas.find(l => l.id === form.lojaDestinoId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6 text-blue-500" />
          </div>
          Transferência entre Unidades
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Mova estoque entre suas lojas de forma segura.</p>
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold">Configurar Envio</h2>
            </div>
            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500">
              Origem: {lojaAtiva?.nome}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">Produto para Transferir *</label>
              <select
                value={form.produtoId}
                onChange={(e) => setForm({ ...form, produtoId: e.target.value })}
                className="input-field"
                required
              >
                <option value="" className="dark:bg-slate-900">Selecione o produto...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-900">
                    {p.nome} (Disponível: {p.qtd_estoque})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Unidade de Destino *</label>
              <select
                value={form.lojaDestinoId}
                onChange={(e) => setForm({ ...form, lojaDestinoId: e.target.value })}
                className="input-field border-blue-200 dark:border-blue-900/30"
                required
              >
                <option value="" className="dark:bg-slate-900">Selecione o destino...</option>
                {lojas.filter(l => l.id !== lojaAtiva?.id).map((l) => (
                  <option key={l.id} value={l.id} className="dark:bg-slate-900">{l.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Quantidade *</label>
              <input
                type="number"
                min="1"
                max={produtoSelecionado?.qtd_estoque}
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                className="input-field"
                required
                placeholder="0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !form.produtoId || !form.lojaDestinoId || !form.quantidade}
            className="btn-primary w-full py-4 text-lg font-black tracking-tight mt-4 bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 disabled:opacity-30"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              'Realizar Transferência'
            )}
          </button>
        </form>

        {/* Preview Card */}
        <div className="space-y-6">
          <div className="card-section bg-blue-500/5 border-blue-500/10 p-8">
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-700">
                  <Store className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Origem</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate w-24">{lojaAtiva?.nome}</p>
              </div>

              <div className="flex flex-col items-center">
                <ArrowRight className="w-8 h-8 text-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-blue-500 mt-2">{form.quantidade || '0'} UN</span>
              </div>

              <div className="text-center space-y-2">
                <div className={`w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mx-auto border ${lojaDestino ? 'border-blue-500 shadow-blue-500/10' : 'border-slate-100 dark:border-slate-700'}`}>
                  <Store className={`w-8 h-8 ${lojaDestino ? 'text-blue-500' : 'text-slate-200 dark:text-slate-800'}`} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destino</p>
                <p className={`text-sm font-bold truncate w-24 ${lojaDestino ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-800'}`}>
                  {lojaDestino?.nome || 'Selecione...'}
                </p>
              </div>
            </div>

            {produtoSelecionado && (
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{produtoSelecionado.nome}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-tight">Estoque na {lojaAtiva?.nome}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {produtoSelecionado.qtd_estoque - (parseInt(form.quantidade) || 0)}
                      </span>
                      <span className="text-[10px] font-bold text-rose-500">(-{form.quantidade || 0})</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-tight">Vindo da {lojaAtiva?.nome}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-emerald-500">
                        +{form.quantidade || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card-section p-6 flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-amber-500" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dica de Logística</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Transferências não alteram o valor total do seu patrimônio, apenas redistribuem o estoque entre unidades.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
