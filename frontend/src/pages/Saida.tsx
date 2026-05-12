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
            observacao: form.observacao || undefined,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-red-500" />
            </div>
            Registrar Saída
          </h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie vendas e baixas de estoque</p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit self-start sm:self-center">
          <button
            onClick={() => setForm({ ...form, tipo: 'SAIDA_VENDA' })}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              form.tipo === 'SAIDA_VENDA'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🛒 Venda
          </button>
          <button
            onClick={() => {
              setCart([]);
              setForm({ ...form, tipo: 'SAIDA_DESCARTE', descontoTotal: '', vendedorId: '', telefone_cliente: '' });
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              form.tipo === 'SAIDA_DESCARTE'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ♻️ Descarte
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm border animate-in fade-in slide-in-from-top-2 duration-300 ${
          msg.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Adicionar Produto */}
        <div className="card-section p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-500" />
            Adicionar Item
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="form-label text-xs">Produto</label>
              <select
                value={form.produtoId}
                onChange={(e) => setForm({ ...form, produtoId: e.target.value })}
                className="input-field text-sm"
              >
                <option value="">Selecione um produto</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo_barras ? `[${p.codigo_barras}] ` : ''}{p.nome} ({p.qtd_estoque} un.)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label text-xs">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  max={produtoSelecionado?.qtd_estoque}
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                  className="input-field text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="form-label text-xs">Preço Unit.</label>
                <div className="input-field bg-gray-50 text-gray-400 text-sm flex items-center gap-1">
                  {precoExibido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={addToCart}
              disabled={!form.produtoId || !form.quantidade}
              className="w-full py-3 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
              <Plus className="w-4 h-4" />
              Adicionar ao Carrinho
            </button>
          </div>
        </div>

        {/* Carrinho */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card-section p-0 overflow-hidden min-h-[300px]">
             <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
               <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                 <ShoppingBag className="w-4 h-4 text-emerald-500" />
                 Itens no Carrinho ({cart.length})
               </h2>
               <span className="text-sm font-black text-emerald-600">
                 {totalCarrinho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
               </span>
             </div>

             {cart.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                 <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                 <p className="text-sm font-medium">O carrinho está vazio</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50/50 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                     <tr>
                       <th className="px-6 py-3">Produto</th>
                       <th className="px-6 py-3 text-right">Qtd</th>
                       <th className="px-6 py-3 text-right">Unitário</th>
                       <th className="px-6 py-3 text-right">Total</th>
                       <th className="px-6 py-3"></th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {cart.map((item) => (
                       <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                         <td className="px-6 py-4">
                           <p className="text-sm font-semibold text-gray-800">{item.nome}</p>
                         </td>
                         <td className="px-6 py-4 text-right text-sm font-bold text-gray-600">
                           {item.quantidade}
                         </td>
                         <td className="px-6 py-4 text-right text-sm text-gray-500">
                           {item.precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                         </td>
                         <td className="px-6 py-4 text-right text-sm font-extrabold text-emerald-600">
                           {(item.precoUnitario * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button
                             onClick={() => removeFromCart(item.id)}
                             className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                           >
                             <Trash2 className="w-4 h-4" />
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
            <div className="card-section p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {form.tipo === 'SAIDA_VENDA' && (
                  <>
                    <div>
                      <label className="form-label text-xs">Vendedor(a) *</label>
                      <select
                        value={form.vendedorId}
                        onChange={(e) => setForm({ ...form, vendedorId: e.target.value })}
                        className="input-field text-sm"
                        required
                      >
                        <option value="">Selecione um vendedor</option>
                        {vendedores.map((v) => (
                          <option key={v.id} value={v.id}>{v.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label text-xs">Telefone do Cliente</label>
                      <input
                        type="text"
                        value={form.telefone_cliente}
                        onChange={(e) => setForm({ ...form, telefone_cliente: e.target.value })}
                        className="input-field text-sm"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </>
                )}
                
                <div className="md:col-span-2">
                   <label className="form-label text-xs">Observação</label>
                   <textarea
                    rows={1}
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    className="input-field text-sm resize-none"
                    placeholder="Notas extras..."
                  />
                </div>

                {form.tipo === 'SAIDA_VENDA' && (
                  <div className="md:col-span-2 pt-4 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="w-full md:w-48">
                      <label className="form-label text-xs text-brand-600 font-bold">Desconto Total (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={form.descontoTotal}
                          onChange={(e) => setForm({ ...form, descontoTotal: e.target.value })}
                          className="input-field pr-9 border-brand-100 focus:border-brand-500 text-sm font-bold"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                      </div>
                    </div>
 
                    <div className="text-center md:text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total a Pagar</p>
                      <div className="text-4xl font-black text-gray-900 flex items-baseline gap-2 justify-center md:justify-end">
                        {totalComDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      {valorDesconto > 0 && (
                        <p className="text-xs font-bold text-emerald-500">
                          - {valorDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de desconto
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className={`btn-primary w-full py-4 text-lg font-black tracking-tight shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]
                  ${form.tipo === 'SAIDA_DESCARTE' ? 'from-red-600 to-red-700 shadow-red-200' : 'from-brand-600 to-brand-700 shadow-brand-200'}`}
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Finalizar {form.tipo === 'SAIDA_VENDA' ? 'Venda' : 'Baixa'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
