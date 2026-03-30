import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { DashboardEstoque } from './components/DashboardEstoque';
import { Cadastro } from './components/Cadastro';
import { MovimentacaoEstoque } from './components/MovimentacaoEstoque';
import { Historico } from './components/Historico';
import { NovaVenda } from './components/NovaVenda';
import { HistoricoVendas } from './components/HistoricoVendas';
import { DashboardGerencial } from './components/DashboardGerencial';
import { Usuarios } from './components/Usuarios';

import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'vendedor' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else setLoading(false);
    });

    // 2. Escutar mudanças na sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserRole(data.role as 'admin' | 'vendedor');
    } catch (e) {
      console.error('Erro ao buscar cargo:', e);
      setUserRole('vendedor'); // Fallback seguro
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-200/50 font-black text-[10px] uppercase tracking-[4px]">Autenticando Avicenna...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <Router>
      <Layout userRole={userRole}>
        <Routes>
          {/* Rotas Públicas (para Logados) */}
          <Route path="/estoque" element={<DashboardEstoque />} />
          <Route path="/venda" element={<NovaVenda userRole={userRole} />} />
          <Route path="/historico-vendas" element={<HistoricoVendas />} />
          
          {/* Rotas Protegidas (Apenas Admin) */}
          {userRole === 'admin' ? (
            <>
              <Route path="/" element={<DashboardGerencial />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/movimentacao" element={<MovimentacaoEstoque />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/usuarios" element={<Usuarios />} />
            </>
          ) : (
            <Route path="/" element={<Navigate to="/estoque" replace />} />
          )}

          <Route path="*" element={<Navigate to={userRole === 'admin' ? "/" : "/estoque"} replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;