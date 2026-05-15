import { useEffect, useState } from 'react';
import api from '../services/api';
import { ShieldCheck, Clock, CheckCircle, XCircle, UserCog, Mail, ShieldAlert } from 'lucide-react';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <UserCog className="w-6 h-6 text-violet-500" />
          </div>
          Aprovação de Contas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Controle de acesso para novos usuários e funcionários.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      ) : pendentes.length === 0 ? (
        <div className="card-section py-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Tudo em ordem!</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">
            Não existem solicitações de acesso pendentes no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendentes.map((u) => (
            <div key={u.id} className="card-section group hover:border-violet-500/30 transition-all duration-300 animate-in slide-in-from-bottom-4">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600 text-xl font-black group-hover:scale-110 transition-transform">
                    {u.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{u.nome}</h3>
                    <span className={`inline-flex px-2 py-0.5 mt-1 text-[9px] font-black uppercase tracking-wider rounded-lg
                      ${u.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-600' : 'bg-blue-500/10 text-blue-600'}`}>
                      {u.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium truncate">{u.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">{formatDate(u.criado_em)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAcao(u.id, 'APROVAR')}
                  disabled={processando === u.id}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar
                </button>
                <button
                  onClick={() => handleAcao(u.id, 'REJEITAR')}
                  disabled={processando === u.id}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 border border-transparent hover:border-rose-500"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
