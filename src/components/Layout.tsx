import { NavLink } from 'react-router-dom';
import { LayoutGrid, PackagePlus, ArrowLeftRight, ClipboardList, Shirt } from 'lucide-react';

const navItems = [
  { to: '/',               icon: LayoutGrid,      label: 'Grade de Estoque' },
  { to: '/cadastro',       icon: PackagePlus,     label: 'Nova Peça'        },
  { to: '/movimentacao',   icon: ArrowLeftRight,  label: 'Entrada / Saída'  },
  { to: '/historico',      icon: ClipboardList,   label: 'Histórico'        },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-slate-900 flex flex-col shadow-2xl">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Shirt size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-base leading-tight tracking-tight uppercase italic">
                Central<br /><span className="text-blue-400">Estoque</span>
              </h1>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-2 font-medium">AFA — Pirassununga</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <p className="text-slate-600 text-xs text-center">v1.0.0 — 2025</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-auto">
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
