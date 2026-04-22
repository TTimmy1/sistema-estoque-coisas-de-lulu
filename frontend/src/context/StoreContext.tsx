import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface Loja {
  id: string;
  nome: string;
}

interface StoreContextData {
  lojaAtiva: Loja | null;
  lojas: Loja[];
  setLojaAtiva: (loja: Loja) => void;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextData>({} as StoreContextData);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaAtiva, setLojaAtivaState] = useState<Loja | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLojas() {
      try {
        const response = await api.get('/lojas');
        setLojas(response.data);
        
        const savedLojaId = localStorage.getItem('@Estoque:lojaId');
        if (savedLojaId) {
          const found = response.data.find((l: Loja) => l.id === savedLojaId);
          if (found) {
            setLojaAtivaState(found);
            api.defaults.headers.common['x-loja-id'] = found.id;
          } else if (response.data.length > 0) {
            setLojaAtivaState(response.data[0]);
            api.defaults.headers.common['x-loja-id'] = response.data[0].id;
            localStorage.setItem('@Estoque:lojaId', response.data[0].id);
          }
        } else if (response.data.length > 0) {
          setLojaAtivaState(response.data[0]);
          api.defaults.headers.common['x-loja-id'] = response.data[0].id;
          localStorage.setItem('@Estoque:lojaId', response.data[0].id);
        }
      } catch (error) {
        console.error("Erro ao carregar lojas", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadLojas();
  }, []);

  const setLojaAtiva = (loja: Loja) => {
    setLojaAtivaState(loja);
    localStorage.setItem('@Estoque:lojaId', loja.id);
    api.defaults.headers.common['x-loja-id'] = loja.id;
    // Forçar recarregamento das páginas quando a loja muda (para resetar estados)
    window.location.reload();
  };

  return (
    <StoreContext.Provider value={{ lojaAtiva, lojas, setLojaAtiva, isLoading }}>
      {!isLoading ? children : (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
