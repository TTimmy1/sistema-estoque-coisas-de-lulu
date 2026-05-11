import { useEffect, useState } from 'react';
import api from '../services/api';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';

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

const tipoBadge: Record<string, string> = {
  ENTRADA: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  SAIDA_VENDA: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  SAIDA_DESCARTE: 'bg-red-50 text-red-700 ring-1 ring-red-200',
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <History className="w-5 h-5 text-brand-500" />
          </div>
          Histórico de Movimentações
        </h1>
        <p className="text-sm text-gray-400 mt-1">Acompanhe todas as entradas e saídas</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
          className="input-field w-auto"
        >
          <option value="">Todos os tipos</option>
          <option value="ENTRADA">Entrada</option>
          <option value="SAIDA_VENDA">Venda</option>
          <option value="SAIDA_DESCARTE">Descarte</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          <div className="card-section overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Data/Hora</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Produto</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Qtd</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor Unit.</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Desconto</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendedor</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuário</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Obs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movs.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-400 whitespace-nowrap">{formatDateTime(m.criado_em)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${tipoBadge[m.tipo]}`}>
                        {tipoLabel[m.tipo]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm text-gray-800 font-medium">{m.produto.nome}</p>
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 text-sm text-right font-bold ${m.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {m.tipo === 'ENTRADA' ? '+' : '-'}{m.quantidade}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 text-right">{formatCurrency(m.valor_unit)}</td>
                    <td className="px-5 py-3.5 text-sm text-red-400 text-right font-medium">
                      {m.desconto && Number(m.desconto) > 0 ? `-${formatCurrency(m.desconto)}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-800 text-right font-semibold">{formatCurrency(m.valor_total)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{m.vendedor ? m.vendedor.nome : '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{m.usuario.nome}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-300 max-w-[150px] truncate">{m.observacao ?? '—'}</td>
                  </tr>
                ))}
                {movs.length === 0 && (
                  <tr><td colSpan={10} className="px-5 py-12 text-center text-gray-300">
                    <div className="flex flex-col items-center gap-2">
                      <History className="w-8 h-8" />
                      <span className="text-sm">Nenhuma movimentação encontrada</span>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="btn-secondary px-3 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-3">Página {pagina} de {totalPaginas}</span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="btn-secondary px-3 py-2"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
