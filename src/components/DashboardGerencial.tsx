import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

type DadosVenda = {
  data: string;
  valor: number;
};

type TopProduto = {
  name: string;
  value: number;
};

type VendaPorTamanho = {
  name: string;
  value: number;
};

const COLORS = ['#081C59', '#D98B2B', '#4F5E8C', '#D99F59', '#2d334a', '#848fb1'];

export function DashboardGerencial() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    faturamentoTotal: 0,
    vendasHoje: 0,
    ticketMedio: 0,
    pecasVendidas: 0,
    totalPecasEstoque: 0,
    valorEstoqueUnit: 0,
    valorEstoqueKit: 0
  });
  
  const [estoquePorCategoria, setEstoquePorCategoria] = useState<any[]>([]);
  
  const [vendasDia, setVendasDia] = useState<DadosVenda[]>([]);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [vendasTamanho, setVendasTamanho] = useState<VendaPorTamanho[]>([]);

  useEffect(() => {
    fetchDadosDashboard();
  }, []);

  async function fetchDadosDashboard() {
    setLoading(true);
    try {
      const { data: vendas, error: errVendas } = await supabase
        .from('vendas')
        .select('total, created_at, id');
      
      const { data: itens, error: errItens } = await supabase
        .from('venda_itens')
        .select('peca, quantidade, tamanho');

      const { data: produtos, error: errProd } = await supabase
        .from('produtos')
        .select('id, categoria, preco_unit, preco_kit');

      const { data: estoque, error: errEst } = await supabase
        .from('estoque_detalhado')
        .select('produto_id, quantidade');

      if (errVendas || errItens || errProd || errEst) throw new Error('Erro ao buscar dados');

      if (vendas && itens && produtos && estoque) {
        processarDados(vendas, itens, produtos, estoque);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function processarDados(vendas: any[], itens: any[], produtos: any[], estoque: any[]) {
    // 1. KPIs de Vendas
    const totalVendas = vendas.reduce((acc, v) => acc + v.total, 0);
    const hoje = new Date().toISOString().split('T')[0];
    const vendasHoje = vendas.filter(v => v.created_at.startsWith(hoje)).length;
    const pecasVendidas = itens.reduce((acc, i) => acc + i.quantidade, 0);
    const ticket = vendas.length > 0 ? totalVendas / vendas.length : 0;

    // 2. KPIs de Estoque
    let totalPecas = 0;
    let valorUnit = 0;
    let valorKit = 0;
    const catMap: Record<string, number> = {};

    estoque.forEach(item => {
      const prod = produtos.find(p => p.id === item.produto_id);
      if (prod) {
        totalPecas += item.quantidade;
        valorUnit += (item.quantidade * prod.preco_unit);
        valorKit += (item.quantidade * (prod.preco_kit || 0));
        catMap[prod.categoria] = (catMap[prod.categoria] || 0) + item.quantidade;
      }
    });

    setKpis({
      faturamentoTotal: totalVendas,
      vendasHoje: vendasHoje,
      ticketMedio: ticket,
      pecasVendidas: pecasVendidas,
      totalPecasEstoque: totalPecas,
      valorEstoqueUnit: valorUnit,
      valorEstoqueKit: valorKit
    });

    setEstoquePorCategoria(
      Object.entries(catMap).map(([name, value]) => ({ name, value }))
    );

    // 2. Vendas por Dia (Últimos 15 dias)
    const vendasMap: Record<string, number> = {};
    vendas.forEach(v => {
      const data = new Date(v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      vendasMap[data] = (vendasMap[data] || 0) + v.total;
    });
    
    const dadosDia = Object.entries(vendasMap)
      .map(([data, valor]) => ({ data, valor }))
      .slice(-15);
    setVendasDia(dadosDia);

    // 3. Top Produtos
    const prodMap: Record<string, number> = {};
    itens.forEach(i => {
      prodMap[i.peca] = (prodMap[i.peca] || 0) + i.quantidade;
    });

    const top = Object.entries(prodMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    setTopProdutos(top);

    // 4. Vendas por Tamanho
    const tamMap: Record<string, number> = {};
    itens.forEach(i => {
      tamMap[i.tamanho] = (tamMap[i.tamanho] || 0) + i.quantidade;
    });

    const tamData = Object.entries(tamMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    setVendasTamanho(tamData);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatMoeda = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8 pb-8">
      {/* KPIs de Vendas */}
      <div>
        <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-[4px] mb-4">Métricas de Vendas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            label="Faturamento Total" 
            value={formatMoeda(kpis.faturamentoTotal)} 
            icon={<DollarSign size={24} />} 
            color="primary"
            trend="+12%" 
          />
          <KPICard 
            label="Vendas Hoje" 
            value={kpis.vendasHoje.toString()} 
            icon={<TrendingUp size={24} />} 
            color="accent"
            trend="Ativo"
          />
          <KPICard 
            label="Ticket Médio" 
            value={formatMoeda(kpis.ticketMedio)} 
            icon={<Users size={24} />} 
            color="secondary"
            trend="-2%"
          />
          <KPICard 
            label="Peças Vendidas" 
            value={kpis.pecasVendidas.toString()} 
            icon={<Package size={24} />} 
            color="highlight"
            trend="+54"
          />
        </div>
      </div>

      {/* Patrimônio em Estoque */}
      <div className="pt-2">
        <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-[4px] mb-4">Inventário & Patrimônio</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard 
            label="Peças no Estoque" 
            value={kpis.totalPecasEstoque.toString()} 
            icon={<Package size={24} />} 
            color="primary-light"
            trend="Real"
          />
          <KPICard 
            label="Faturamento Potencial (Unit)" 
            value={formatMoeda(kpis.valorEstoqueUnit)} 
            icon={<DollarSign size={24} />} 
            color="accent"
            trend="Est."
          />
          <KPICard 
            label="Faturamento Potencial (Kit)" 
            value={formatMoeda(kpis.valorEstoqueKit)} 
            icon={<TrendingUp size={24} />} 
            color="secondary"
            trend="Combo"
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <BarChart3 size={18} className="text-accent" />
              Evolução de Faturamento
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Últimos Lançamentos</span>
          </div>
          
          <div className="h-[300px] w-full">
            {vendasDia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vendasDia} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D98B2B" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#D98B2B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="data" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                    formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#D98B2B" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValor)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Nenhuma venda registrada para gerar o gráfico" />
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-primary mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" />
            Top 5 Produtos (Qtd)
          </h3>
          <div className="space-y-4">
            {topProdutos.length > 0 ? (
              topProdutos.map((prod) => (
                <div key={prod.name} className="group cursor-default">
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="font-bold text-slate-700">{prod.name}</span>
                    <span className="font-mono font-black text-accent">{prod.value} <span className="text-[10px] text-slate-400">un.</span></span>
                  </div>
                  <div className="w-full bg-gelo h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all duration-1000 shadow-sm" 
                      style={{ width: `${(prod.value / topProdutos[0].value) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyChart message="Sem dados de produtos" height="h-full" />
            )}
          </div>
          {topProdutos.length > 0 && (
            <button className="w-full mt-8 py-3 text-xs font-bold text-secondary hover:text-accent uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
              Relatório Geral <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Sales by Size */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-primary mb-1 flex items-center gap-2">
            <Package size={18} className="text-accent" />
            Mix de Tamanhos
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Demanda por grade</p>
          
          <div className="h-[250px] w-full">
            {vendasTamanho.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendasTamanho}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {vendasTamanho.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(val) => <span className="text-[10px] font-bold text-slate-500 uppercase">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Sem vendas" />
            )}
          </div>
        </div>

        {/* Distributed by Category */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-primary mb-1 flex items-center gap-2">
            <LayoutGrid size={18} className="text-accent" />
            Estoque por Categoria
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Volume por setor</p>
          
          <div className="h-[250px] w-full">
            {estoquePorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estoquePorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {estoquePorCategoria.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(val) => <span className="text-[10px] font-bold text-slate-500 uppercase">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Sem estoque" />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function KPICard({ label, value, icon, color, trend }: any) {
  const colors: any = {
    primary: 'bg-primary shadow-primary/20 text-white',
    accent: 'bg-accent shadow-accent/20 text-white',
    secondary: 'bg-secondary shadow-secondary/20 text-white',
    highlight: 'bg-highlight shadow-highlight/20 text-white',
    'primary-light': 'bg-primary/80 shadow-primary/10 text-white'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-all group relative overflow-hidden">
      <div className={`p-3 rounded-xl ${colors[color]} shrink-0 transition-transform group-hover:scale-110 duration-300 relative z-10`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1 relative z-10">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-xl font-black text-primary tracking-tight whitespace-nowrap">{value}</h4>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg whitespace-nowrap ${trend.includes('+') ? 'bg-accent/10 text-accent' : 'bg-gelo text-slate-500'}`}>
            {trend}
          </span>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50/50 rounded-full -mr-12 -mt-12 group-hover:bg-slate-100 transition-colors" />
    </div>
  );
}

function EmptyChart({ message, height = 'h-[200px]' }: any) {
  return (
    <div className={`${height} flex flex-col items-center justify-center text-slate-300 gap-3 border-2 border-dashed border-slate-50 rounded-2xl bg-slate-50/30`}>
      <BarChart3 size={24} className="opacity-20" />
      <span className="text-xs font-bold uppercase tracking-wider">{message}</span>
    </div>
  );
}
