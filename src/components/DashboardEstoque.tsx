import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutGrid, AlertTriangle, TrendingDown } from 'lucide-react';

const TAMANHOS = ['14', '16', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XG1', 'XG2', 'XG3'];

type EstoqueItem = {
  tamanho: string;
  quantidade: number;
};

type Produto = {
  id: string;
  peca: string;
  categoria: string;
  preco_unit: number;
  preco_kit: number;
  estoque_detalhado: EstoqueItem[];
};

export function DashboardEstoque() {
  const [dados, setDados] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetchEstoque();
  }, []);

  async function fetchEstoque() {
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase
      .from('produtos')
      .select(`id, peca, categoria, preco_unit, preco_kit, estoque_detalhado (tamanho, quantidade)`)
      .order('categoria', { ascending: false })
      .order('peca');

    if (error) {
      setErro(error.message);
    } else {
      setDados(data as Produto[]);
    }
    setLoading(false);
  }

  const totalBaixo = dados.reduce((acc, prod) => {
    return acc + prod.estoque_detalhado.filter(e => e.quantidade > 0 && e.quantidade < 5).length;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-primary/40 text-sm font-black uppercase tracking-widest">Carregando...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4 max-w-md">
          <AlertTriangle className="text-red-500 shrink-0" size={28} />
          <div>
            <p className="font-bold text-red-700">Erro ao carregar estoque</p>
            <p className="text-red-500 text-sm mt-1">{erro}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas Funcionais */}
      {totalBaixo > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl shadow-sm animate-pulse">
          <TrendingDown size={20} className="text-red-500" />
          <div>
            <p className="text-red-800 font-black text-sm uppercase tracking-tight">Atenção ao Inventário</p>
            <p className="text-red-600/80 text-xs font-bold leading-none">{totalBaixo} itens abaixo do nível de segurança</p>
          </div>
          <button 
            onClick={fetchEstoque}
            className="ml-auto px-4 py-2 bg-white border border-red-100 rounded-xl text-xs font-black text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            ATUALIZAR DADOS
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-gelo">
          <div className="p-2 bg-primary rounded-lg text-white shadow-lg shadow-primary/20">
            <LayoutGrid size={18} />
          </div>
          <span className="text-primary font-black text-xs uppercase tracking-widest">Peça × Tamanho</span>
          <span className="ml-auto text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Inventário Disponível
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gelo text-primary/40 uppercase text-[10px] font-black tracking-wider">
                <th className="p-4 border-b border-slate-100 min-w-[180px]">Peça</th>
                {TAMANHOS.map(t => (
                  <th key={t} className="p-2 border-b border-slate-100 text-center min-w-[42px]">{t}</th>
                ))}
                <th className="p-4 border-b border-slate-100 text-center bg-white/50">Total</th>
                <th className="p-4 border-b border-slate-100 text-right">Preço Un.</th>
                <th className="p-4 border-b border-slate-100 text-right text-accent">Preço Kit</th>
                <th className="p-4 border-b border-slate-100 text-right bg-accent/5">Valor Total</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {['Parte Superior', 'Parte Inferior', 'Kits / Peças Especiais', 'Sem Categoria'].map(cat => {
                const pecasDaCategoria = dados.filter(p => {
                  if (cat === 'Sem Categoria') return !p.categoria || !['Parte Superior', 'Parte Inferior', 'Kits / Peças Especiais'].includes(p.categoria);
                  return p.categoria === cat;
                });
                
                if (pecasDaCategoria.length === 0) return null;

                const coresCategorias = {
                  'Parte Superior': 'bg-primary text-white border-primary/20',
                  'Parte Inferior': 'bg-secondary text-white border-secondary/20',
                  'Kits / Peças Especiais': 'bg-accent text-white border-accent/20',
                  'Sem Categoria': 'bg-highlight text-white border-highlight/20'
                };

                return (
                  <React.Fragment key={cat}>
                    {/* Cabeçalho da Categoria */}
                    <tr className={coresCategorias[cat as keyof typeof coresCategorias]}>
                      <td colSpan={TAMANHOS.length + 5} className="px-4 py-2 text-[10px] font-black uppercase tracking-[3px] border-y shadow-sm">
                        <div className="flex items-center justify-between">
                          {cat}
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                        </div>
                      </td>
                    </tr>
                    
                    {/* Linhas de Peças */}
                    {pecasDaCategoria.map((prod) => {
                      const qtdTotal = prod.estoque_detalhado.reduce((acc: number, i: any) => acc + (i.quantidade || 0), 0);
                      const valorTotal = qtdTotal * (prod.preco_unit || 0);

                      return (
                        <tr key={prod.id} className="hover:bg-gelo transition-colors group">
                          <td className="p-4 font-bold text-primary group-hover:text-accent transition-colors uppercase text-xs">{prod.peca}</td>
                          {TAMANHOS.map(t => {
                            const item = prod.estoque_detalhado.find(ed => ed.tamanho === t);
                            const qtd = item?.quantidade ?? 0;
                            return (
                              <td key={t} className="p-2 text-center">
                                <span className={`inline-flex items-center justify-center w-8 h-7 rounded-lg font-mono text-xs font-bold
                                  ${qtd === 0 ? 'text-slate-200' : qtd < 5 ? 'bg-red-50 text-red-500' : 'bg-gelo text-primary'}
                                `}>
                                  {qtd}
                                </span>
                              </td>
                            );
                          })}
                          <td className="p-4 text-center font-black text-primary bg-gelo border-x border-slate-100/50">
                            {qtdTotal}
                          </td>
                          <td className="p-4 text-right font-mono text-slate-400 text-xs">
                            {prod.preco_unit > 0 ? `R$ ${prod.preco_unit.toFixed(2)}` : '—'}
                          </td>
                          <td className="p-4 text-right font-mono text-accent font-black text-xs">
                            {prod.preco_kit > 0 ? `R$ ${prod.preco_kit.toFixed(2)}` : '—'}
                          </td>
                          <td className="p-4 text-right font-mono font-black text-primary bg-accent/5 border-l border-slate-100">
                            R$ {valorTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {dados.length === 0 && (
            <div className="py-16 text-center text-slate-300">
              <LayoutGrid size={32} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">Sem inventário registrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-6 text-[10px] text-slate-400 font-black uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-gelo border border-slate-200 flex items-center justify-center text-primary font-mono text-[10px]">8</span>
          Normal (≥ 5)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-red-50 border border-red-100 flex items-center justify-center text-red-500 font-mono text-[10px]">2</span>
          Baixo (&lt; 5)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded flex items-center justify-center text-slate-200 font-mono text-[10px]">0</span>
          Sem Estoque
        </div>
      </div>
    </div>
  );
}