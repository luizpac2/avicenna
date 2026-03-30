import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardList, ArrowUpCircle, ArrowDownCircle, Filter, AlertCircle, RefreshCcw } from 'lucide-react';

type Movimentacao = {
  id: string;
  tipo: 'entrada' | 'saida';
  tamanho: string;
  quantidade: number;
  responsavel: string | null;
  observacao: string | null;
  created_at: string;
  produtos: { peca: string } | null;
};

export function Historico() {
  const [dados, setDados] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');

  useEffect(() => {
    fetchHistorico();
  }, []);

  async function fetchHistorico() {
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase
      .from('movimentacoes')
      .select(`id, tipo, tamanho, quantidade, responsavel, observacao, created_at, produtos(peca)`)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) setErro(error.message);
    else setDados((data as unknown) as Movimentacao[]);
    setLoading(false);
  }

  const dadosFiltrados = dados.filter(d => filtroTipo === 'todos' || d.tipo === filtroTipo);

  const formatData = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-primary/40 text-[10px] font-black uppercase tracking-[4px]">Recuperando Logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Controles de Atualização e Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <div className="p-2 bg-gelo rounded-lg text-primary mr-2">
            <Filter size={16} />
          </div>
          {(['todos', 'entrada', 'saida'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroTipo(f)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap ${
                filtroTipo === f
                  ? f === 'entrada' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                    : f === 'saida' ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                    : 'bg-secondary border-secondary text-white shadow-lg shadow-secondary/20'
                  : 'border-gelo bg-gelo text-primary/40 hover:border-slate-200'
              }`}
            >
              {f === 'todos' ? 'Ver Tudo' : f === 'entrada' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>
        <button
          onClick={fetchHistorico}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black hover:bg-secondary transition-all shadow-xl shadow-primary/10 uppercase tracking-[2px]"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar Registro
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-3xl p-5">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-[10px] font-black uppercase tracking-widest leading-none">{erro}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-gelo">
          <div className="p-2.5 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
            <ClipboardList size={18} />
          </div>
          <div>
            <h3 className="text-primary font-black text-xs uppercase tracking-widest">Logs de Estoque</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Histórico manual de movimentações</p>
          </div>
        </div>

        {dadosFiltrados.length === 0 ? (
          <div className="py-24 text-center text-slate-200">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-5" />
            <p className="font-black uppercase tracking-[5px] text-xs">Sem Histórico</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-primary/40 uppercase text-[9px] font-black tracking-[2px] border-b border-slate-100">
                  <th className="px-6 py-5">Movimento</th>
                  <th className="px-6 py-5">Peça</th>
                  <th className="px-6 py-5 text-center">Tam.</th>
                  <th className="px-6 py-5 text-center">Qtd.</th>
                  <th className="px-6 py-5">Responsável</th>
                  <th className="px-6 py-5">Observação</th>
                  <th className="px-6 py-5 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {dadosFiltrados.map(mov => (
                  <tr key={mov.id} className="hover:bg-gelo/30 transition-colors group">
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest
                        ${mov.tipo === 'entrada' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}
                      `}>
                        {mov.tipo === 'entrada'
                          ? <><ArrowUpCircle size={12} /> Entrada</>
                          : <><ArrowDownCircle size={12} /> Saída</>}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-black text-primary uppercase tracking-tight">{mov.produtos?.peca ?? '—'}</td>
                    <td className="px-6 py-5 text-center font-mono font-black text-primary/40">{mov.tamanho}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`font-mono font-black text-base ${mov.tipo === 'entrada' ? 'text-primary' : 'text-accent'}`}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-400 font-bold uppercase tracking-tighter text-[10px]">{mov.responsavel || '—'}</td>
                    <td className="px-6 py-5 text-slate-400 text-[10px] font-medium max-w-[200px] truncate">{mov.observacao || '—'}</td>
                    <td className="px-6 py-5 text-right text-[10px] text-slate-300 font-mono font-bold uppercase">{formatData(mov.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
