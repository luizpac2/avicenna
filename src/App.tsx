import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { Layout } from './components/Layout'
import { Login } from './components/Login'
import { DashboardEstoque } from './components/DashboardEstoque'
import { Cadastro } from './components/Cadastro'
import { MovimentacaoEstoque } from './components/MovimentacaoEstoque'
import { Historico } from './components/Historico'
import { NovaVenda } from './components/NovaVenda'
import { HistoricoVendas } from './components/HistoricoVendas'
import { DashboardGerencial } from './components/DashboardGerencial'

import type { Session } from '@supabase/supabase-js'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Verificar sessão atual no carregamento
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Ouvir mudanças na autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"                   element={<DashboardGerencial />} />
          <Route path="/estoque"             element={<DashboardEstoque />} />
          <Route path="/venda"              element={<NovaVenda />} />
          <Route path="/historico-vendas"   element={<HistoricoVendas />} />
          <Route path="/cadastro"           element={<Cadastro />} />
          <Route path="/movimentacao"       element={<MovimentacaoEstoque />} />
          <Route path="/historico"          element={<Historico />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App