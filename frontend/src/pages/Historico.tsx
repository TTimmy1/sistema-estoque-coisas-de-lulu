import { useEffect, useState } from 'react';
import api from '../services/api';
import { History, ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react';

interface Movimentacao {
  id: string;
  tipo: string;
  quantidade: number;
  valor_unit: string;
  valor_total: string;
  desconto: string | null;
  observacao: string | null;
  criado_em: string;
  produto: { nome: string; sku: string };
  usuario: { nome: string; email: string };
  vendedor: { nome: string } | null;
}

const tipoLabel: Record<string, string> = {
  ENTRADA: 'Entrada',
  SAIDA_VENDA: 'Venda',
  SAIDA_DESCARTE: 'Descarte',
};

export default function Historico() {
  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => {
    api.get('/movimentacoes', { params: { tipo: filtroTipo || undefined, pagina, limite: 20 } })
      .then((r) => {
        setMovs(r.data.movimentacoes);
        setTotalPaginas(r.data.paginacao.totalPaginas);
      })
      .finally(() => setLoading(false));
  }, [pagina, filtroTipo]);

  const formatCurrency = (v: string) =>
    Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <History className="w-6 h-6 text-brand-500" />
            </div>
            Histórico de Movimentações
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Auditoria completa de entradas e saídas.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filtroTipo}
              onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="">Todos os tipos</option>
              <option value="ENTRADA">Apenas Entradas</option>
              <option value="SAIDA_VENDA">Apenas Vendas</option>
              <option value="SAIDA_DESCARTE">Apenas Descartes</option>
            </select>
          </div>
          <button className="btn-secondary px-4 py-2.5">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="table-container">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="table-header">
                  <tr>
                    <th className="table-th text-left">Data e Hora</th>
                    <th className="table-th text-left">Tipo</th>
                    <th className="table-th text-left">Produto</th>
                    <th className="table-th text-right">Qtd</th>
                    <th className="table-th text-right">Valor Unit.</th>
                    <th className="table-th text-right">Desconto</th>
                    <th className="table-th text-right">Total</th>
                    <th className="table-th text-left">Responsável</th>
                  </tr>
                </thead>
                <tbody className="table-tbody">
                  {movs.map((m) => (
                    <tr key={m.id} className="table-tr">
                      <td className="table-td">
                        <span className="table-td-subtext font-medium">{formatDateTime(m.criado_em)}</span>
                      </td>
                      <td className="table-td">
                        <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg
                          ${m.tipo === 'ENTRADA' ? 'bg-emerald-500/10 text-emerald-600' : 
                            m.tipo === 'SAIDA_VENDA' ? 'bg-blue-500/10 text-blue-600' : 
                            'bg-rose-500/10 text-rose-600'}`}>
                          {tipoLabel[m.tipo]}
                        </span>
                      </td>
                      <td className="table-td">
                        <div className="flex flex-col">
                          <span className="table-td-text">{m.produto.nome}</span>
                          <span className="table-td-subtext font-mono uppercase">{m.produto.sku}</span>
                        </div>
                      </td>
                      <td className="table-td text-right font-black">
                        <span className={m.tipo === 'ENTRADA' ? 'text-emerald-500' : 'text-rose-500'}>
                          {m.tipo === 'ENTRADA' ? '+' : '-'}{m.quantidade}
                        </span>
                      </td>
                      <td className="table-td text-right table-td-subtext font-bold">{formatCurrency(m.valor_unit)}</td>
                      <td className="table-td text-right font-bold text-rose-400">
                        {m.desconto && Number(m.desconto) > 0 ? `-${formatCurrency(m.desconto)}` : <span className="opacity-20">—</span>}
                      </td>
                      <td className="table-td text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(m.valor_total)}
                      </td>
                      <td className="table-td">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.vendedor ? m.vendedor.nome : m.usuario.nome}</span>
                          {m.vendedor && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Vendedor</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {movs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="table-td py-24 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-300 dark:text-slate-800">
                          <History className="w-16 h-16 opacity-20" />
                          <span className="text-lg font-bold">Nenhuma movimentação registrada</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-4 py-4">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-20 hover:bg-slate-50 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-2.5 rounded-xl text-sm font-black text-slate-900 dark:text-white shadow-sm">
                Página {pagina} de {totalPaginas}
              </div>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-20 hover:bg-slate-50 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
