import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Package,
  DollarSign,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Clock,
  Truck,
  CreditCard,
} from 'lucide-react';

interface DashboardData {
  totalProdutos: number;
  valorTotalEstoque: number;
  movimentacoesHoje: number;
  entradasMes: number;
  saidasMes: number;
  receitaMes: number;
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    api.get('/movimentacoes/dashboard')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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

  if (!data) return <p className="text-red-500">Erro ao carregar dashboard</p>;

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const stats = [
    {
      label: 'Total de Produtos',
      value: data.totalProdutos.toString(),
      icon: Package,
      bg: 'bg-brand-500/10',
      iconColor: 'text-brand-500',
    },
    {
      label: 'Valor em Estoque',
      value: formatCurrency(Number(data.valorTotalEstoque)),
      icon: DollarSign,
      bg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Movimentações Hoje',
      value: data.movimentacoesHoje.toString(),
      icon: TrendingUp,
      bg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Receita do Mês',
      value: formatCurrency(Number(data.receitaMes)),
      icon: TrendingUp,
      bg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
    {
      label: 'Encomendas Ativas',
      value: data.encomendasAtivasCount.toString(),
      icon: Clock,
      bg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Visão geral do seu estoque</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-6 h-6 ${s.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Summary */}
        <div className="card-section p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Resumo do Mês</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-emerald-50/80 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-gray-600">Entradas</span>
              </div>
              <span className="text-xl font-bold text-emerald-600">{data.entradasMes}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50/80 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <ArrowUpCircle className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-sm font-medium text-gray-600">Saídas</span>
              </div>
              <span className="text-xl font-bold text-red-600">{data.saidasMes}</span>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="card-section p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            Estoque Baixo
          </h2>
          {data.estoqueBaixo.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 text-gray-300">
              <Package className="w-8 h-8 mb-2" />
              <p className="text-sm">Tudo em ordem</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.estoqueBaixo.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{item.nome}</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">{item.qtd_estoque} un.</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Active Orders List */}
      <div className="card-section p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          Encomendas em Andamento
        </h2>
        {data.encomendasRecentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-gray-300">
            <Package className="w-8 h-8 mb-2" />
            <p className="text-sm">Nenhuma encomenda ativa</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left text-[10px] text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4">Pedido</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Pagamento</th>
                  <th className="pb-3 text-center">Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.encomendasRecentes.map((en) => (
                  <tr key={en.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pr-4 text-sm font-medium text-gray-800">
                      {en.nome_cliente || 'Final Final'}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600 truncate max-w-[200px]" title={en.pedido}>
                      {en.pedido}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <select
                        value={en.status}
                        onChange={(e) => handleStatusChange(en.id, e.target.value)}
                        className={`text-[10px] font-bold py-1 px-2 rounded-lg border-none ring-1 ring-inset focus:ring-2 transition-all cursor-pointer bg-white
                          ${en.status === 'PRONTO' ? 'ring-purple-200 text-purple-700 bg-purple-50' : 
                            en.status === 'EM_ANDAMENTO' ? 'ring-blue-200 text-blue-700 bg-blue-50' :
                            en.status === 'PENDENTE' ? 'ring-amber-200 text-amber-700 bg-amber-50' :
                            en.status === 'ENTREGUE' ? 'ring-emerald-200 text-emerald-700 bg-emerald-50' :
                            'ring-gray-200 text-gray-600 bg-gray-50'}`}
                      >
                        <option value="EM_ANDAMENTO">Em andamento</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="PRONTO">Pronto (Esperando Retirada)</option>
                        <option value="ENTREGUE">Entregue</option>
                        <option value="CANCELADA">Cancelada</option>
                      </select>
                    </td>
                    <td className="py-3 px-2 text-center text-[10px]">
                      <button
                        onClick={() => handlePagoToggle(en.id, en.pago_total)}
                        className={`font-extrabold px-3 py-1 rounded-full transition-all border
                          ${en.pago_total 
                            ? 'bg-emerald-500 text-white border-emerald-600' 
                            : 'bg-white text-red-500 border-red-200 hover:bg-red-50'}`}
                      >
                        {en.pago_total ? 'PAGO OK' : `FALTA ${formatCurrency((en.valor_total || 0) - (en.valor_sinal || 0))}`}
                      </button>
                    </td>
                    <td className="py-3 text-xs text-amber-700 text-center font-semibold">
                      {en.previsao_entrega ? new Date(en.previsao_entrega).toLocaleDateString('pt-BR') : '—'}
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
