import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardEstoque } from './components/DashboardEstoque'
import { Cadastro } from './components/Cadastro'
import { MovimentacaoEstoque } from './components/MovimentacaoEstoque'
import { Historico } from './components/Historico'
import { NovaVenda } from './components/NovaVenda'
import { HistoricoVendas } from './components/HistoricoVendas'
import { DashboardGerencial } from './components/DashboardGerencial'

function App() {
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