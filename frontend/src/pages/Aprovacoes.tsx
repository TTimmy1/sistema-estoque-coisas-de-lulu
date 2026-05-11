import { useEffect, useState } from 'react';
import api from '../services/api';
import { ShieldCheck, Clock, CheckCircle, XCircle, UserCog } from 'lucide-react';

interface ContaPendente {
  id: string;
  nome: string;
  email: string;
  role: string;
  criado_em: string;
}

export default function Aprovacoes() {
  const [pendentes, setPendentes] = useState<ContaPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);

  const fetchPendentes = () => {
    setLoading(true);
    api.get('/auth/pendentes')
      .then((r) => setPendentes(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPendentes();
  }, []);

  const handleAcao = async (id: string, acao: 'APROVAR' | 'REJEITAR') => {
    setProcessando(id);
    try {
      await api.patch(`/auth/gerenciar/${id}`, { acao });
      fetchPendentes();
    } catch {
      alert('Erro ao processar solicitação');
    } finally {
      setProcessando(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-violet-500" />
          </div>
          Aprovação de Contas
        </h1>
        <p className="text-sm text-gray-400 mt-1">Gerencie as solicitações de acesso ao sistema</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      ) : pendentes.length === 0 ? (
        <div className="card-section p-12 flex flex-col items-center justify-center text-gray-300 gap-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400" />
          <p className="text-base font-medium text-emerald-500">Nenhuma solicitação pendente</p>
          <p className="text-sm text-gray-400">Todas as contas foram avaliadas.</p>
        </div>
      ) : (
        <div className="card-section overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo de Conta</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Solicitado em</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendentes.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-sm font-bold">
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        u.role === 'ADMIN'
                          ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
                          : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      }`}>
                        {u.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(u.criado_em)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAcao(u.id, 'APROVAR')}
                          disabled={processando === u.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleAcao(u.id, 'REJEITAR')}
                          disabled={processando === u.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
