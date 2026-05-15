import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { Plus, X, Truck, Package, CheckCircle, XCircle, Clock, Pencil, Trash2, Phone, User, Tag, DollarSign, Calendar, Eye, ClipboardList } from 'lucide-react';

interface Encomenda {
  id: string;
  pedido: string;
  quantidade: number;
  valor_unit: number | null;
  valor_total: number | null;
  status: string;
  nome_cliente: string | null;
  telefone_cliente: string | null;
  previsao_entrega: string | null;
  criado_em: string;
  vendedorId?: string;
  valor_sinal: number;
  pago_total: boolean;
}

interface Vendedor {
  id: string;
  nome: string;
}

const statusLabel: Record<string, string> = {
  EM_ANDAMENTO: 'Em andamento',
  PRONTO: 'Pronto (Retirada)',
  ENTREGUE: 'Entregue',
  PENDENTE: 'Pendente',
  'EM PRODUCAO': 'Em Produção',
  CANCELADA: 'Cancelada',
};

export default function Encomendas() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Encomenda | null>(null);
  
  const [form, setForm] = useState({
    pedido: '',
    nome_cliente: '',
    telefone_cliente: '',
    quantidade: '1',
    valor_unit: '',
    valor_total: '',
    status: 'EM_ANDAMENTO',
    previsao_entrega: '',
    vendedorId: '',
    valor_sinal: '',
    pago_total: false,
  });
  const [loading, setLoading] = useState(true);

  const formatCurrency = (v: number | string | null) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const fetchEncomendas = () => {
    api.get('/encomendas')
      .then((r) => setEncomendas(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEncomendas();
    api.get('/vendedores').then((r) => setVendedores(r.data));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        pedido: form.pedido,
        nome_cliente: form.nome_cliente || undefined,
        telefone_cliente: form.telefone_cliente || undefined,
        quantidade: parseInt(form.quantidade, 10),
        valor_unit: parseFloat(form.valor_unit) || undefined,
        valor_total: parseFloat(form.valor_total) || undefined,
        status: form.status,
        previsao_entrega: form.previsao_entrega || undefined,
        vendedorId: form.vendedorId,
        valor_sinal: parseFloat(form.valor_sinal) || 0,
        pago_total: form.pago_total,
      };

      if (editingId) {
        await api.put(`/encomendas/${editingId}`, payload);
      } else {
        await api.post('/encomendas', payload);
      }
      
      cancelForm();
      fetchEncomendas();
    } catch (err: unknown) {
      alert('Erro ao salvar pedido personalizado');
    }
  };

  const startEdit = (en: Encomenda) => {
    setEditingId(en.id);
    setForm({
      pedido: en.pedido,
      nome_cliente: en.nome_cliente ?? '',
      telefone_cliente: en.telefone_cliente ?? '',
      quantidade: String(en.quantidade),
      valor_unit: String(en.valor_unit || ''),
      valor_total: String(en.valor_total || ''),
      status: en.status,
      previsao_entrega: en.previsao_entrega ? new Date(en.previsao_entrega).toISOString().split('T')[0] : '',
      vendedorId: en.vendedorId ?? '',
      valor_sinal: String(en.valor_sinal || ''),
      pago_total: en.pago_total || false,
    });
    setShowForm(true);
    setViewingOrder(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este pedido?')) return;
    await api.delete(`/encomendas/${id}`);
    fetchEncomendas();
    setViewingOrder(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      pedido: '',
      nome_cliente: '',
      telefone_cliente: '',
      quantidade: '1',
      valor_unit: '',
      valor_total: '',
      status: 'EM_ANDAMENTO',
      previsao_entrega: '',
      vendedorId: '',
      valor_sinal: '',
      pago_total: false,
    });
  };

  const autoTotal = (parseFloat(form.valor_unit) || 0) * (parseInt(form.quantidade, 10) || 0);

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-amber-500" />
            </div>
            Pedidos Personalizados
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerenciamento de encomendas sob demanda.</p>
        </div>
        <button
          onClick={showForm ? cancelForm : () => setShowForm(true)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${
            showForm 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
              : 'bg-amber-600 text-white shadow-amber-500/20 hover:bg-amber-700'
          }`}
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancelar' : 'Novo Pedido'}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-section animate-in fade-in slide-in-from-top-4 duration-500 border-2 border-amber-500/20 shadow-xl shadow-amber-500/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Pencil className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold">{editingId ? 'Editar Pedido' : 'Registrar Novo Pedido'}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="form-label">Nome do Cliente</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.nome_cliente}
                  onChange={(e) => setForm({ ...form, nome_cliente: e.target.value })}
                  className="input-field pl-11"
                  placeholder="Nome do cliente"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.telefone_cliente}
                  onChange={(e) => setForm({ ...form, telefone_cliente: e.target.value })}
                  className="input-field pl-11"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Vendedor Responsável *</label>
              <select
                value={form.vendedorId}
                onChange={(e) => setForm({ ...form, vendedorId: e.target.value })}
                className="input-field"
                required
              >
                <option value="" className="dark:bg-slate-900">Selecione...</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id} className="dark:bg-slate-900">{v.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label">Descrição Detalhada do Pedido *</label>
              <textarea
                value={form.pedido}
                onChange={(e) => setForm({ ...form, pedido: e.target.value })}
                className="input-field min-h-[120px] resize-none"
                required
                placeholder="Ex: Caneca de porcelana com estampa do Stitch, nome 'Luiza' em dourado."
              />
            </div>

            <div className="space-y-6">
              <div>
                <label className="form-label">Previsão de Entrega</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input
                    type="date"
                    value={form.previsao_entrega}
                    onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })}
                    className="input-field pl-11 font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Qtd</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_unit}
                    onChange={(e) => setForm({ ...form, valor_unit: e.target.value })}
                    className="input-field"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="form-label">Valor Total do Pedido (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_total || (autoTotal > 0 ? autoTotal : '')}
                  onChange={(e) => setForm({ ...form, valor_total: e.target.value })}
                  className="input-field pl-11 text-lg font-black text-emerald-600 bg-emerald-500/5 border-emerald-500/20"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Valor do Sinal (Entrada R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.valor_sinal}
                onChange={(e) => setForm({ ...form, valor_sinal: e.target.value })}
                className="input-field"
                placeholder="0,00"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all w-full border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={form.pago_total}
                  onChange={(e) => setForm({ ...form, pago_total: e.target.checked })}
                  className="w-5 h-5 rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Pedido Totalmente Pago</span>
              </label>
            </div>
          </div>

          {editingId && (
            <div className="pt-6">
              <label className="form-label">Status da Encomenda</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusLabel).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, status: key })}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border
                      ${form.status === key 
                        ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/20' 
                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-brand-500'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-8">
            <button type="button" onClick={cancelForm} className="btn-secondary min-w-[120px]">Cancelar</button>
            <button type="submit" disabled={!form.vendedorId} className="btn-primary min-w-[200px] bg-amber-600 hover:bg-amber-700 shadow-amber-500/20">
              {editingId ? 'Salvar Alterações' : 'Registrar Encomenda'}
            </button>
          </div>
        </form>
      )}

      {/* Table List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Cliente</th>
                  <th className="table-th">Pedido / Descrição</th>
                  <th className="table-th text-right">Financeiro</th>
                  <th className="table-th text-center">Status</th>
                  <th className="table-th text-center">Entrega</th>
                  <th className="table-th text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="table-tbody">
                {encomendas.map((en) => (
                  <tr 
                    key={en.id} 
                    className="table-tr cursor-pointer group"
                    onClick={() => setViewingOrder(en)}
                  >
                    <td className="table-td">
                      <div className="flex flex-col">
                        <span className="table-td-text group-hover:text-amber-500 transition-colors">{en.nome_cliente || 'Final Final'}</span>
                        {en.telefone_cliente && (
                          <span className="table-td-subtext flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {en.telefone_cliente}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-td max-w-[300px]">
                      <p className="table-td-text font-medium truncate" title={en.pedido}>{en.pedido}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Qtd: {en.quantidade}</span>
                    </td>
                    <td className="table-td text-right">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(en.valor_total)}</span>
                        {en.pago_total ? (
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Total Pago</span>
                        ) : (
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">
                            Falta {formatCurrency((en.valor_total || 0) - (en.valor_sinal || 0))}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-td text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider
                        ${en.status === 'ENTREGUE' ? 'bg-emerald-500/10 text-emerald-600' :
                          en.status === 'PRONTO' ? 'bg-purple-500/10 text-purple-600' :
                          en.status === 'EM_ANDAMENTO' ? 'bg-blue-500/10 text-blue-600' :
                          en.status === 'CANCELADA' ? 'bg-rose-500/10 text-rose-600' :
                          'bg-amber-500/10 text-amber-600'}`}>
                        {statusLabel[en.status] || en.status}
                      </span>
                    </td>
                    <td className="table-td text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-black ${en.previsao_entrega ? 'text-amber-600 dark:text-amber-400' : 'text-slate-300'}`}>
                          {formatDate(en.previsao_entrega)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Previsão</span>
                      </div>
                    </td>
                    <td className="table-td text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(en)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(en.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {encomendas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-td py-24 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-300 dark:text-slate-800">
                        <Truck className="w-16 h-16 opacity-20" />
                        <span className="text-lg font-bold">Nenhum pedido personalizado encontrado</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-amber-600 px-8 py-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Detalhes do Pedido</h2>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-0.5">#{viewingOrder.id.slice(-6)}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingOrder(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-500" />
                    {viewingOrder.nome_cliente || 'Final Final'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500" />
                    {viewingOrder.telefone_cliente || '—'}
                  </p>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Pedido</p>
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 italic text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  "{viewingOrder.pedido}"
                </div>
              </div>

              {/* Status and Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Atual</p>
                  <div className="flex">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider
                      ${viewingOrder.status === 'ENTREGUE' ? 'bg-emerald-500/10 text-emerald-600' :
                        viewingOrder.status === 'PRONTO' ? 'bg-purple-500/10 text-purple-600' :
                        'bg-blue-500/10 text-blue-600'}`}>
                      {statusLabel[viewingOrder.status] || viewingOrder.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Entrega</p>
                  <p className="text-lg font-black text-amber-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(viewingOrder.previsao_entrega)}
                  </p>
                </div>
              </div>

              {/* Financial Section */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                  <h3 className="font-black uppercase text-sm tracking-widest">Resumo Financeiro</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(viewingOrder.valor_total)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Sinal Pago</p>
                    <p className="text-xl font-black text-emerald-500">{formatCurrency(viewingOrder.valor_sinal)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Restante</p>
                    <p className={`text-xl font-black ${viewingOrder.pago_total ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {viewingOrder.pago_total ? 'R$ 0,00' : formatCurrency((viewingOrder.valor_total || 0) - (viewingOrder.valor_sinal || 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setViewingOrder(null)}
                className="btn-secondary px-8"
              >
                Fechar
              </button>
              <button 
                onClick={() => startEdit(viewingOrder)}
                className="btn-primary bg-amber-600 hover:bg-amber-700 px-8"
              >
                <Pencil className="w-4 h-4" />
                Editar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
