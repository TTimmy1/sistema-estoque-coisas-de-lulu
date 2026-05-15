import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, User, Mail, Lock } from 'lucide-react';

export default function Register({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(nome, email, senha, role);
      setSucesso(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4 dark:from-dark-50 dark:via-dark-100 dark:to-dark-50">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30 mb-4">
          <Package className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Criar Conta</h1>
        <p className="text-gray-400 text-sm mt-1 dark:text-gray-500">Registre-se para acessar o sistema</p>
      </div>

      {sucesso ? (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/60 border border-gray-100 p-8 text-center space-y-4 dark:bg-dark-100 dark:shadow-none dark:border-dark-200">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 mx-auto">
            <Lock className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Solicitação Enviada!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sua conta está <span className="font-semibold text-amber-600 dark:text-amber-400">aguardando aprovação</span> de um administrador. Assim que for aprovada, você poderá fazer login normalmente.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="w-full btn-primary justify-center py-2.5 text-base"
          >
            Ir para o Login
          </button>
        </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Seu nome completo"
                  required
                  minLength={2}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Tipo de Conta</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field"
              >
                <option value="USER">Funcionário (Acesso Limitado)</option>
                <option value="ADMIN">Administrador (Acesso Total)</option>
              </select>
            </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary justify-center py-2.5 text-base"
        >
          {loading ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
      )}

      {!sucesso && (
        <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          Já tem conta?{' '}
          <button onClick={onSwitchToLogin} className="text-brand-500 hover:text-brand-600 font-medium dark:hover:text-brand-400">
            Entrar
          </button>
        </p>
      )}
    </div>
  </div>
);
}
