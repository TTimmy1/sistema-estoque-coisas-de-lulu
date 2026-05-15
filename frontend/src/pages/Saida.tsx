import { useEffect, useState, FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../services/api';
import { 
  ArrowUpCircle, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  ShoppingBag,
  Trash2,
  Plus,
  Send,
} from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  sku: string;
  codigo_barras: string | null;
  preco_venda: string;
  custo: string;
  qtd_estoque: number;
}

interface Vendedor {
  id: string;
  nome: string;
}

interface CartItem {
  id: string; // Unique ID for the cart row
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export default function Saida() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ 
    produtoId: '', 
    quantidade: '', 
    tipo: 'SAIDA_VENDA' as 'SAIDA_VENDA' | 'SAIDA_DESCARTE', 
    observacao: '', 
    telefone_cliente: '', 
    vendedorId: '', 
    descontoTotal: '' 
  });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/produtos').then((r) => setProdutos(r.data));
    api.get('/vendedores').then((r) => setVendedores(r.data));
  }, []);

  const addToCart = () => {
    if (!form.produtoId || !form.quantidade) return;
    
    const produto = produtos.find(p => p.id === form.produtoId);
    if (!produto) return;

    const qtd = parseInt(form.quantidade, 10);
    
    // Validar se já existe no carrinho, se sim, somar
    const existingIndex = cart.findIndex(item => item.produtoId === form.produtoId);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantidade += qtd;
      if (newCart[existingIndex].quantidade > produto.qtd_estoque) {
        alert('Quantidade total no carrinho excede o estoque!');
        return;
      }
      setCart(newCart);
    } else {
      const newItem: CartItem = {
        id: uuidv4(),
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: qtd,
        precoUnitario: form.tipo === 'SAIDA_VENDA' ? Number(produto.preco_venda) : Number(produto.custo),
      };
      setCart([...cart, newItem]);
    }

    // Resetar campos de seleção de produto
    setForm({ ...form, produtoId: '', quantidade: '' });
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setMsg({ text: 'Adicione pelo menos um produto ao carrinho', type: 'error' });
      return;
    }

    setMsg({ text: '', type: '' });
    setLoading(true);

    try {
      if (form.tipo === 'SAIDA_VENDA') {
        // Venda em lote
        await api.post('/movimentacoes/venda-lote', {
          vendedorId: form.vendedorId || undefined,
          telefone_cliente: form.telefone_cliente || undefined,
          observacao: form.observacao || undefined,
          descontoTotal: ((totalCarrinho * (parseFloat(form.descontoTotal) || 0)) / 100),
          itens: cart.map(item => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade
          }))
        });
      } else {
        // Para descarte, processamos um por um
        for (const item of cart) {
          await api.post('/movimentacoes/saida', {
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            tipo: 'SAIDA_DESCARTE',
            observacao: item.observacao || form.observacao || undefined,
          });
        }
      }

      setMsg({ text: 'Saída registrada com sucesso!', type: 'success' });
      setCart([]);
      setForm({ 
        produtoId: '', 
        quantidade: '', 
        tipo: 'SAIDA_VENDA', 
        observacao: '', 
        telefone_cliente: '', 
        vendedorId: '', 
        descontoTotal: '' 
      });
      // Recarregar estoque
      api.get('/produtos').then((r) => setProdutos(r.data));
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao registrar saída';
      setMsg({ text: message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const produtoSelecionado = produtos.find((p) => p.id === form.produtoId);

  const precoExibido = produtoSelecionado
    ? form.tipo === 'SAIDA_VENDA'
      ? Number(produtoSelecionado.preco_venda)
      : Number(produtoSelecionado.custo)
    : 0;

  const totalCarrinho = cart.reduce((acc, item) => acc + (item.precoUnitario * item.quantidade), 0);
  const percentualDesconto = parseFloat(form.descontoTotal) || 0;
  const valorDesconto = (totalCarrinho * percentualDesconto) / 100;
  const totalComDesconto = Math.max(0, totalCarrinho - valorDesconto);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-rose-500" />
            </div>
            Registrar Saída
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie vendas e baixas de estoque com facilidade.</p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setForm({ ...form, tipo: 'SAIDA_VENDA' })}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
              form.tipo === 'SAIDA_VENDA'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            🛒 Venda
          </button>
          <button
            onClick={() => {
              setCart([]);
              setForm({ ...form, tipo: 'SAIDA_DESCARTE', descontoTotal: '', vendedorId: '', telefone_cliente: '' });
            }}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
              form.tipo === 'SAIDA_DESCARTE'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            ♻️ Descarte
          </button>
        </div>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Adicionar Produto */}
        <div className="card-section space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-brand-500" />
            </div>
            Adicionar Item
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="form-label">Produto</label>
              <select
                value={form.produtoId}
                onChange={(e) => setForm({ ...form, produtoId: e.target.value })}
                className="input-field"
              >
                <option value="" className="dark:bg-slate-900">Selecione um produto</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-900">
                    {p.codigo_barras ? `[${p.codigo_barras}] ` : ''}{p.nome} ({p.qtd_estoque} un.)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  max={produtoSelecionado?.qtd_estoque}
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="form-label">Preço Unit.</label>
                <div className="input-field bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold flex items-center">
                  {formatCurrency(precoExibido)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={addToCart}
              disabled={!form.produtoId || !form.quantidade}
              className="w-full py-4 bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale"
            >
              <Plus className="w-5 h-5" />
              Adicionar ao Carrinho
            </button>
          </div>
        </div>

        {/* Carrinho */}
        <div className="xl:col-span-2 space-y-8">
          <div className="table-container min-h-[400px] flex flex-col">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
               <h2 className="text-lg font-bold flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                   <ShoppingBag className="w-5 h-5 text-emerald-500" />
                 </div>
                 Carrinho ({cart.length})
               </h2>
               <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Subtotal</p>
                 <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                   {formatCurrency(totalCarrinho)}
                 </span>
               </div>
             </div>

             {cart.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-800">
                 <ShoppingBag className="w-20 h-20 mb-4 opacity-20" />
                 <p className="text-lg font-bold">O carrinho está vazio</p>
                 <p className="text-sm font-medium opacity-60">Adicione produtos para começar a venda</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="table-header">
                     <tr>
                       <th className="table-th">Produto</th>
                       <th className="table-th text-right">Qtd</th>
                       <th className="table-th text-right">Unitário</th>
                       <th className="table-th text-right">Total</th>
                       <th className="table-th"></th>
                     </tr>
                   </thead>
                   <tbody className="table-tbody">
                     {cart.map((item) => (
                       <tr key={item.id} className="table-tr group">
                         <td className="table-td">
                           <p className="table-td-text">{item.nome}</p>
                         </td>
                         <td className="table-td text-right font-black text-slate-600 dark:text-slate-300">
                           {item.quantidade}
                         </td>
                         <td className="table-td text-right table-td-subtext font-medium">
                           {formatCurrency(item.precoUnitario)}
                         </td>
                         <td className="table-td text-right">
                           <span className="font-black text-emerald-600 dark:text-emerald-400">
                             {formatCurrency(item.precoUnitario * item.quantidade)}
                           </span>
                         </td>
                         <td className="table-td text-right">
                           <button
                             onClick={() => removeFromCart(item.id)}
                             className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                           >
                             <Trash2 className="w-5 h-5" />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>

          {/* Dados da Venda */}
          {cart.length > 0 && (
            <div className="card-section animate-in slide-in-from-bottom-8 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {form.tipo === 'SAIDA_VENDA' && (
                  <>
                    <div>
                      <label className="form-label">Vendedor(a) *</label>
                      <select
                        value={form.vendedorId}
                        onChange={(e) => setForm({ ...form, vendedorId: e.target.value })}
                        className="input-field font-bold"
                        required
                      >
                        <option value="" className="dark:bg-slate-900">Selecione um vendedor</option>
                        {vendedores.map((v) => (
                          <option key={v.id} value={v.id} className="dark:bg-slate-900">{v.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Telefone do Cliente</label>
                      <input
                        type="text"
                        value={form.telefone_cliente}
                        onChange={(e) => setForm({ ...form, telefone_cliente: e.target.value })}
                        className="input-field font-bold"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </>
                )}
                
                <div className="md:col-span-2">
                   <label className="form-label">Observação</label>
                   <textarea
                    rows={2}
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    className="input-field resize-none font-medium"
                    placeholder="Notas extras sobre esta saída..."
                  />
                </div>

                {form.tipo === 'SAIDA_VENDA' && (
                  <div className="md:col-span-2 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="w-full md:w-64">
                      <label className="form-label text-brand-600 dark:text-brand-400">Aplicar Desconto (%)</label>
                      <div className="relative group">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={form.descontoTotal}
                          onChange={(e) => setForm({ ...form, descontoTotal: e.target.value })}
                          className="input-field pr-12 border-brand-500/20 focus:border-brand-500 font-black text-lg"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">%</span>
                      </div>
                    </div>
 
                    <div className="text-center md:text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Total Final</p>
                      <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {formatCurrency(totalComDesconto)}
                      </div>
                      {valorDesconto > 0 && (
                        <p className="text-sm font-bold text-emerald-500 mt-2 flex items-center justify-center md:justify-end gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Economia de {formatCurrency(valorDesconto)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full py-5 text-xl font-black tracking-tight shadow-2xl flex items-center justify-center gap-4 transition-all transform active:scale-[0.98] rounded-2xl
                    ${form.tipo === 'SAIDA_DESCARTE' 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20' 
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'}`}
                >
                  {loading ? (
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Finalizar {form.tipo === 'SAIDA_VENDA' ? 'Venda' : 'Baixa de Descarte'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
