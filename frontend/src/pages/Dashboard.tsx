import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  DollarSign,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Clock,
  Truck,
} from 'lucide-react';

interface DashboardData {
  totalProdutos: number;
  vendasDia: number;
  vendasSemana: number;
  entradasMes: number;
  saidasMes: number;
  receitaMes: number;
  valorTotalEstoque: number;
  valorTotalVendaEstoque: number;
  movimentacoesHoje: number;
  estoqueBaixo: Array<{ id: string; nome: string; sku: string; qtd_estoque: number }>;
  encomendasAtivasCount: number;
  encomendasRecentes: Array<{
    id: string;
    pedido: string;
    nome_cliente: string | null;
    status: string;
    previsao_entrega: string | null;
    valor_total: number | null;
    valor_sinal: number | null;
    pago_total: boolean;
  }>;
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === 'ADMIN';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendedores, setVendedores] = useState<{id: string; nome: string}[]>([]);
  const [selectedVendedor, setSelectedVendedor] = useState('');

  const fetchDashboard = () => {
    api.get(`/movimentacoes/dashboard${selectedVendedor ? `?vendedorId=${selectedVendedor}` : ''}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) {
      api.get('/vendedores').then((r) => setVendedores(r.data));
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchDashboard();
  }, [selectedVendedor]);

  const handleStatusChange = async (encomendaId: string, newStatus: string) => {
    try {
      await api.put(`/encomendas/${encomendaId}`, { status: newStatus });
      fetchDashboard();
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const handlePagoToggle = async (encomendaId: string, currentPago: boolean) => {
    try {
      await api.put(`/encomendas/${encomendaId}`, { pago_total: !currentPago });
      fetchDashboard();
    } catch (err) {
      alert('Erro ao atualizar pagamento');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
    </div>
  );

  if (!data) return <p className="text-red-500 dark:text-red-400 font-bold p-8 text-center bg-red-500/10 rounded-2xl">Erro ao carregar dashboard</p>;

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const stats = [
    ...(isAdmin ? [
      {
        label: 'Total de Produtos',
        value: data.totalProdutos.toString(),
        icon: Package,
        bg: 'bg-brand-500/10',
        iconColor: 'text-brand-500',
      },
        {
          label: 'Valor de Custo em Estoque',
          value: formatCurrency(Number(data.valorTotalEstoque)),
          icon: DollarSign,
          bg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-500',
        },
        {
          label: 'Valor de Venda em Estoque',
          value: formatCurrency(Number(data.valorTotalVendaEstoque)),
          icon: TrendingUp,
          bg: 'bg-brand-500/10',
          iconColor: 'text-brand-500',
        }
      ] : []),
    {
      label: 'Movimentações Hoje',
      value: data.movimentacoesHoje.toString(),
      icon: TrendingUp,
      bg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    ...(isAdmin ? [
      {
        label: 'Vendas Hoje',
        value: formatCurrency(Number(data.vendasDia)),
        icon: DollarSign,
        bg: 'bg-green-500/10',
        iconColor: 'text-green-500',
      },
      {
        label: 'Vendas Semana',
        value: formatCurrency(Number(data.vendasSemana)),
        icon: TrendingUp,
        bg: 'bg-indigo-500/10',
        iconColor: 'text-indigo-500',
      },
    ] : []),
    {
      label: 'Encomendas Ativas',
      value: data.encomendasAtivasCount.toString(),
      icon: Clock,
      bg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Bem-vindo(a) de volta! Aqui está o resumo do seu estoque.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-3">Filtro:</span>
            <select
              value={selectedVendedor}
              onChange={(e) => setSelectedVendedor(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-xl border-none px-4 py-2 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all min-w-[200px]"
            >
              <option value="">Todos os vendedores</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="stat-card group">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <s.icon className={`w-6 h-6 ${s.iconColor}`} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{s.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Summary Table */}
        <div className="card-section">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-brand-500" />
            </div>
            <h2 className="text-lg font-bold">Resumo de Vendas</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Hoje', value: data.vendasDia },
              { label: 'Esta Semana', value: data.vendasSemana },
              { label: 'Este Mês', value: data.receitaMes }
            ].map((item, idx) => (
              <div key={item.label} className={`flex items-center justify-between p-4 rounded-2xl ${idx === 2 ? 'bg-brand-500/5 border border-brand-500/10' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
                <span className={`text-lg font-black ${idx === 2 ? 'text-brand-500' : 'text-slate-900 dark:text-white'}`}>
                  {formatCurrency(Number(item.value))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <>
            {/* Monthly Summary */}
            <div className="card-section">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-bold">Movimentação Mensal</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <ArrowDownCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Entradas</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{data.entradasMes}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                      <ArrowUpCircle className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-rose-600/60 uppercase tracking-widest">Saídas</p>
                      <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{data.saidasMes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock */}
            <div className="card-section">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold">Estoque Crítico</h2>
              </div>
              {data.estoqueBaixo.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Package className="w-10 h-10 mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-slate-400">Nenhum item em falta</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                  {data.estoqueBaixo.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.nome}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{item.sku}</p>
                      </div>
                      <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black rounded-lg">
                        {item.qtd_estoque} UN
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Active Orders List */}
      <div className="table-container">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-indigo-500" />
            </div>
            <h2 className="text-lg font-bold">Encomendas em Andamento</h2>
          </div>
          <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-500 text-xs font-bold rounded-full">
            {data.encomendasRecentes.length} Ativas
          </span>
        </div>
        {data.encomendasRecentes.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-slate-200 dark:text-slate-800" />
            <p className="text-slate-400 font-medium">Nenhuma encomenda ativa no momento</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Cliente</th>
                  <th className="table-th">Pedido</th>
                  <th className="table-th text-center">Status</th>
                  <th className="table-th text-center">Pagamento</th>
                  <th className="table-th text-center">Previsão</th>
                </tr>
              </thead>
              <tbody className="table-tbody">
                {data.encomendasRecentes.map((en) => (
                  <tr key={en.id} className="table-tr">
                    <td className="table-td font-bold text-slate-900 dark:text-white">
                      {en.nome_cliente || 'Final Final'}
                    </td>
                    <td className="table-td text-slate-500 dark:text-slate-400 max-w-[300px]">
                      <p className="truncate" title={en.pedido}>{en.pedido}</p>
                    </td>
                    <td className="table-td text-center">
                      <select
                        value={en.status}
                        onChange={(e) => handleStatusChange(en.id, e.target.value)}
                        className={`text-[10px] font-black py-1.5 px-3 rounded-xl border-none outline-none focus:ring-2 transition-all cursor-pointer shadow-sm
                          ${en.status === 'PRONTO' ? 'bg-purple-500/10 text-purple-600' : 
                            en.status === 'EM_ANDAMENTO' ? 'bg-blue-500/10 text-blue-600' :
                            en.status === 'PENDENTE' ? 'bg-amber-500/10 text-amber-600' :
                            en.status === 'ENTREGUE' ? 'bg-emerald-500/10 text-emerald-600' :
                            'bg-slate-500/10 text-slate-600'}`}
                      >
                        <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                        <option value="PENDENTE">PENDENTE</option>
                        <option value="PRONTO">PRONTO PARA RETIRADA</option>
                        <option value="ENTREGUE">ENTREGUE</option>
                        <option value="CANCELADA">CANCELADA</option>
                      </select>
                    </td>
                    <td className="table-td text-center">
                      <button
                        onClick={() => handlePagoToggle(en.id, en.pago_total)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-none shadow-sm
                        ${en.pago_total
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'}`}
                      >
                        {en.pago_total ? 'PAGO OK' : `FALTA ${formatCurrency((en.valor_total || 0) - (en.valor_sinal || 0))}`}
                      </button>
                    </td>
                    <td className="table-td text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {en.previsao_entrega ? new Date(en.previsao_entrega).toLocaleDateString('pt-BR') : '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Entrega</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
