import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardEstoque } from './components/DashboardEstoque'
import { Cadastro } from './components/Cadastro'
import { MovimentacaoEstoque } from './components/MovimentacaoEstoque'
import { Historico } from './components/Historico'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"             element={<DashboardEstoque />} />
          <Route path="/cadastro"     element={<Cadastro />} />
          <Route path="/movimentacao" element={<MovimentacaoEstoque />} />
          <Route path="/historico"    element={<Historico />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App