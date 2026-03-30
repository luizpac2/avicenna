import { DashboardEstoque } from './components/DashboardEstoque'

function App() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-4 md:p-12">
      <header className="w-full max-w-7xl mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
            Central <span className="text-blue-600">Estoque</span>
          </h1>
          <p className="text-slate-400 font-medium">Gestão de Uniformes e Materiais</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 shadow-sm">
          AFA - Pirassununga
        </div>
      </header>

      <DashboardEstoque />
    </div>
  )
}

export default App