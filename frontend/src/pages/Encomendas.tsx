import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { Plus, X, Truck, Package, CheckCircle, XCircle, Clock, Pencil, Trash2, Phone, User } from 'lucide-react';

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
  PRONTO: 'Pronto (Esperando Retirada)',
  ENTREGUE: 'Entregue',
  PENDENTE: 'Pendente',
  'EM PRODUCAO': 'Em Produção',
  CANCELADA: 'Cancelada',
};

const statusBadge: Record<string, string> = {
  EM_ANDAMENTO: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  PRONTO: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  ENTREGUE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  PENDENTE: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'EM PRODUCAO': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  CANCELADA: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const statusIcon: Record<string, React.ReactNode> = {
  EM_ANDAMENTO: <Package className="w-3 h-3" />,
  PRONTO: <CheckCircle className="w-3 h-3" />,
  ENTREGUE: <CheckCircle className="w-3 h-3" />,
  PENDENTE: <Clock className="w-3 h-3" />,
  'EM PRODUCAO': <Package className="w-3 h-3" />,
  CANCELADA: <XCircle className="w-3 h-3" />,
};

export default function Encomendas() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este pedido?')) return;
    await api.delete(`/encomendas/${id}`);
    fetchEncomendas();
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

  // Cálculo automático do total se preenchido unitário
  const autoTotal = (parseFloat(form.valor_unit) || 0) * (parseInt(form.quantidade, 10) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-500" />
            </div>
            Pedidos Personalizados
          </h1>
          <p className="text-sm text-gray-400 mt-1">Anote as encomendas sob demanda dos seus clientes</p>
        </div>
        <button
          onClick={showForm ? cancelForm : () => setShowForm(true)}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Novo Pedido'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-section p-6 space-y-5 max-w-2xl">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-amber-500" />
            </div>
            {editingId ? 'Editar Pedido' : 'Registrar Novo Pedido'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label font-bold text-amber-600">Nome do Cliente</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.nome_cliente}
                  onChange={(e) => setForm({ ...form, nome_cliente: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Nome do cliente"
                />
              </div>
            </div>
            <div>
              <label className="form-label font-bold text-amber-600">Número de Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.telefone_cliente}
                  onChange={(e) => setForm({ ...form, telefone_cliente: e.target.value })}
                  className="input-field pl-10"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Descrição do Pedido *</label>
            <textarea
              value={form.pedido}
              onChange={(e) => setForm({ ...form, pedido: e.target.value })}
              className="input-field min-h-[100px]"
              required
              placeholder="Ex: Caneca personalizada com foto do Stitch e nome Timy"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="form-label">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="form-label">Preço Unit.</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor_unit}
                  onChange={(e) => setForm({ ...form, valor_unit: e.target.value })}
                  className="input-field"
                  placeholder="R$"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Previsão de Entrega</label>
              <input
                type="date"
                value={form.previsao_entrega}
                onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })}
                className="input-field font-bold text-amber-700"
              />
            </div>
          </div>

          {editingId && (
            <div>
              <label className="form-label">Status do Pedido</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field"
              >
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="PRONTO">Pronto (Esperando Retirada)</option>
                <option value="ENTREGUE">Entregue</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          )}

          <div>
            <label className="form-label font-bold text-amber-600">Vendedor(a) *</label>
            <select
              value={form.vendedorId}
              onChange={(e) => setForm({ ...form, vendedorId: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Selecione quem anotou o pedido</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          </div>

          <div>
             <label className="form-label font-bold text-gray-800">Preço Total do Pedido (R$)</label>
             <input
               type="number"
               step="0.01"
               min="0"
               value={form.valor_total || (autoTotal > 0 ? autoTotal : '')}
               onChange={(e) => setForm({ ...form, valor_total: e.target.value })}
               className="input-field text-xl font-bold text-emerald-600 bg-emerald-50/30"
               placeholder="0,00"
             />
             <p className="text-[10px] text-gray-400 mt-1">Se não preencher, o sistema calculará Qtd x Preço Unitário.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
               <label className="form-label font-bold text-amber-600">Valor do Sinal (R$)</label>
               <input
                 type="number"
                 step="0.01"
                 min="0"
                 value={form.valor_sinal}
                 onChange={(e) => setForm({ ...form, valor_sinal: e.target.value })}
                 className="input-field border-amber-200"
                 placeholder="Já pago pelo cliente"
               />
             </div>
             <div className="flex items-end pb-2">
               <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-gray-50 transition-colors w-full">
                 <input
                   type="checkbox"
                   checked={form.pago_total}
                   onChange={(e) => setForm({ ...form, pago_total: e.target.checked })}
                   className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                 />
                 <span className="text-sm font-semibold text-gray-700">Pagamento Total Concluído</span>
               </label>
             </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="submit" disabled={!form.vendedorId} className="btn-primary bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/20 w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {editingId ? 'Atualizar Pedido' : 'Salvar Pedido'}
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
            <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Pedido</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Qtd</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Falta</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Entrega</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {encomendas.map((en) => (
                <tr key={en.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col">
                       <span className="text-sm text-gray-800 font-bold">{en.nome_cliente || 'Final Final'}</span>
                       <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" /> {en.telefone_cliente || 'Sem telefone'}
                       </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-600 max-w-[250px] truncate" title={en.pedido}>{en.pedido}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-800 text-right font-bold">{en.quantidade}</td>
                  <td className="px-5 py-3.5 text-sm text-emerald-600 text-right font-extrabold">
                    <div className="flex flex-col">
                      <span className="font-bold">{formatCurrency(en.valor_total)}</span>
                      {en.valor_sinal > 0 && (
                        <span className="text-[9px] text-gray-400">Sinal: {formatCurrency(en.valor_sinal)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {en.pago_total ? (
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">PAGO OK</span>
                    ) : (
                      <span className="text-sm font-extrabold text-red-500">
                        {formatCurrency((en.valor_total || 0) - (en.valor_sinal || 0))}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg ${statusBadge[en.status] || statusBadge['PENDENTE']}`}>
                      {statusIcon[en.status] || statusIcon['PENDENTE']}
                      {statusLabel[en.status] || 'Pendente'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-amber-700 text-center font-medium">{formatDate(en.previsao_entrega)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                       <button
                         onClick={() => startEdit(en)}
                         className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                         title="Editar"
                       >
                         <Pencil className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => handleDelete(en.id)}
                         className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                         title="Excluir"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {encomendas.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-300">
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="w-8 h-8" />
                    <span className="text-sm">Nenhum pedido personalizado anotado</span>
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
