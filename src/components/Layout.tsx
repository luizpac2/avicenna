import { supabase } from '../lib/supabase';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  PackagePlus, 
  ArrowLeftRight, 
  ClipboardList, 
  Shirt, 
  ShoppingCart, 
  ShoppingBag, 
  BarChart3, 
  LogOut,
  ChevronRight,
  Home,
  UserCircle,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { to: '/',                    icon: BarChart3,      label: 'Visão Gerencial'  },
  { to: '/estoque',             icon: LayoutGrid,     label: 'Grade de Estoque' },
  { to: '/venda',               icon: ShoppingCart,   label: 'Nova Venda'       },
  { to: '/historico-vendas',    icon: ShoppingBag,    label: 'Hist. de Vendas'  },
  { to: '/cadastro',            icon: PackagePlus,    label: 'Gerenciar Peças'  },
  { to: '/movimentacao',        icon: ArrowLeftRight, label: 'Entrada / Saída'  },
  { to: '/historico',           icon: ClipboardList,  label: 'Hist. Moviment.'  },
  { to: '/usuarios',            icon: Users,          label: 'Gestão de Equipe' },
];

const routeNames: Record<string, { title: string, subtitle: string }> = {
  '/': { title: 'Visão Gerencial', subtitle: 'Desempenho em tempo real' },
  '/estoque': { title: 'Grade de Estoque', subtitle: 'Inventário completo por tamanho' },
  '/venda': { title: 'Nova Venda', subtitle: 'Registrar pedido e emitir recibo' },
  '/historico-vendas': { title: 'Histórico de Vendas', subtitle: 'Relatório geral de pedidos' },
  '/cadastro': { title: 'Gerenciar Peças', subtitle: 'Configuração de itens e preços' },
  '/movimentacao': { title: 'Entrada / Saída', subtitle: 'Ajuste manual de quantidades' },
  '/historico': { title: 'Histórico de Movimentações', subtitle: 'Log de entradas e saídas' },
  '/usuarios': { title: 'Gestão de Equipe', subtitle: 'Controle de acessos e cargos' },
};

interface LayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'vendedor' | null;
}

export function Layout({ children, userRole }: LayoutProps) {
  const location = useLocation();
  const [userName, setUserName] = useState<string | null>(null);
  const currentPath = location.pathname;
  const pageInfo = routeNames[currentPath] || { title: 'Avicenna', subtitle: 'Central de Estoque' };

  // Filtrar itens do menu baseado no cargo
  const filteredNavItems = navItems.filter(item => {
    if (userRole === 'vendedor') {
      // Vendedor só vê Grade, Nova Venda e Histórico de Vendas
      return ['/estoque', '/venda', '/historico-vendas'].includes(item.to);
    }
    // Admin vê tudo, menos o redirecionamento se houver
    return true;
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.email?.split('@')[0] || 'Usuário');
    });
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair do sistema?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Fixa */}
      <aside className="w-64 shrink-0 bg-slate-900 flex flex-col shadow-2xl h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Shirt size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-base leading-tight tracking-tight uppercase italic">
                Central<br /><span className="text-blue-400">Estoque</span>
              </h1>
            </div>
          </div>
          <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-widest opacity-60">Avicenna Pirassununga</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/90 text-white shadow-xl shadow-blue-900/30 ring-1 ring-white/10'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <p className="text-slate-600 text-[9px] text-center font-mono opacity-40 uppercase tracking-widest italic">Avicenna ERP v2.2.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Sticky Header com Breadcrumb */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-sm px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Esquerda: Breadcrumb + Título */}
            <div className="flex flex-col">
              <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                <Home size={10} />
                <ChevronRight size={10} className="mt-0.5" />
                <span className={currentPath === '/' || (userRole === 'vendedor' && currentPath === '/estoque') ? 'text-blue-600' : ''}>Portal</span>
                {!(userRole === 'vendedor' && currentPath === '/estoque') && currentPath !== '/' && (
                  <>
                    <ChevronRight size={10} className="mt-0.5" />
                    <span className="text-blue-600">{pageInfo.title}</span>
                  </>
                )}
              </nav>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none group flex items-center gap-2">
                {pageInfo.title}
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
            </div>

            {/* Direita: User + Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-50 pl-2 pr-4 py-1.5 rounded-full border border-slate-200/60 group cursor-default">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg transition-transform group-hover:scale-105 ${userRole === 'admin' ? 'bg-blue-600 shadow-blue-500/30' : 'bg-emerald-600 shadow-emerald-500/30'}`}>
                  <UserCircle size={18} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[9px] font-black uppercase leading-none mb-0.5 ${userRole === 'admin' ? 'text-blue-500' : 'text-emerald-500'}`}>
                    {userRole === 'admin' ? 'Administrador(a)' : 'Vendedor(a)'}
                  </span>
                  <span className="text-xs font-bold text-slate-700 leading-none capitalize">{userName}</span>
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 mx-1" />

              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-red-100"
                title="Sair do sistema"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Pagina Interna */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
