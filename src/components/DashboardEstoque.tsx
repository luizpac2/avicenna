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
      .order('categoria', { ascending: false }) // Parte Superior vem antes de Parte Inferior no alfabeto inverso? Não, melhor manual.
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
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Carregando estoque...</p>
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
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <LayoutGrid size={18} />
          </div>
          <span className="text-slate-700 font-bold text-sm">Peça × Tamanho</span>
          <span className="ml-auto text-xs text-slate-400 font-semibold uppercase tracking-widest">
            Quantidade disponível
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                <th className="p-4 border-b border-slate-100 min-w-[180px]">Peça</th>
                {TAMANHOS.map(t => (
                  <th key={t} className="p-2 border-b border-slate-100 text-center min-w-[42px]">{t}</th>
                ))}
                <th className="p-4 border-b border-slate-100 text-center bg-slate-100/50">Total Itens</th>
                <th className="p-4 border-b border-slate-100 text-right">Preço Un.</th>
                <th className="p-4 border-b border-slate-100 text-right text-blue-600">Preço Kit</th>
                <th className="p-4 border-b border-slate-100 text-right bg-blue-50/30">Valor Total</th>
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
                  'Parte Superior': 'bg-blue-600 text-white border-blue-700',
                  'Parte Inferior': 'bg-green-600 text-white border-green-700',
                  'Kits / Peças Especiais': 'bg-purple-600 text-white border-purple-700',
                  'Sem Categoria': 'bg-red-500 text-white border-red-600'
                };

                return (
                  <React.Fragment key={cat}>
                    {/* Cabeçalho da Categoria */}
                    <tr className={coresCategorias[cat as keyof typeof coresCategorias]}>
                      <td colSpan={TAMANHOS.length + 5} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[2px] border-y shadow-sm">
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
                        <tr key={prod.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="p-4 font-semibold text-slate-800">{prod.peca}</td>
                          {TAMANHOS.map(t => {
                            const item = prod.estoque_detalhado.find(ed => ed.tamanho === t);
                            const qtd = item?.quantidade ?? 0;
                            return (
                              <td key={t} className="p-2 text-center">
                                <span className={`inline-flex items-center justify-center w-8 h-7 rounded-lg font-mono text-xs font-bold
                                  ${qtd === 0 ? 'text-slate-300' : qtd < 5 ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-700'}
                                `}>
                                  {qtd}
                                </span>
                              </td>
                            );
                          })}
                          <td className="p-4 text-center font-black text-slate-700 bg-slate-50/30 border-x border-slate-100/50">
                            {qtdTotal}
                          </td>
                          <td className="p-4 text-right font-mono text-slate-500 text-xs">
                            {prod.preco_unit > 0 ? `R$ ${prod.preco_unit.toFixed(2)}` : '—'}
                          </td>
                          <td className="p-4 text-right font-mono text-blue-600 font-bold text-xs">
                            {prod.preco_kit > 0 ? `R$ ${prod.preco_kit.toFixed(2)}` : '—'}
                          </td>
                          <td className="p-4 text-right font-mono font-black text-slate-800 bg-blue-50/10 border-l border-slate-100">
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
            <div className="py-16 text-center text-slate-400">
              <LayoutGrid size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma peça cadastrada</p>
              <p className="text-sm mt-1">Acesse "Nova Peça" para começar</p>
            </div>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-green-50 border border-green-200 flex items-center justify-center text-green-700 font-mono text-[10px]">8</span>
          Normal (≥ 5)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-red-100 border border-red-200 flex items-center justify-center text-red-600 font-mono text-[10px]">2</span>
          Estoque baixo (&lt; 5)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded flex items-center justify-center text-slate-300 font-mono text-[10px]">0</span>
          Zerado / sem estoque
        </div>
      </div>
    </div>
  );
}