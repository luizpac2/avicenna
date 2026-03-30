import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardList, ArrowUpCircle, ArrowDownCircle, Filter, AlertCircle } from 'lucide-react';

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
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Histórico</h2>
          <p className="text-slate-500 text-sm mt-0.5">{dadosFiltrados.length} movimentações</p>
        </div>
        <button
          onClick={fetchHistorico}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-slate-400" />
        {(['todos', 'entrada', 'saida'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltroTipo(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all border-2 ${
              filtroTipo === f
                ? f === 'entrada' ? 'bg-green-600 border-green-600 text-white'
                  : f === 'saida' ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-slate-900 border-slate-900 text-white'
                : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'entrada' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      {erro && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-sm font-medium">{erro}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <ClipboardList size={18} />
          </div>
          <span className="text-slate-700 font-bold text-sm">Registro de Movimentações</span>
        </div>

        {dadosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma movimentação registrada</p>
            <p className="text-sm mt-1">Acesse "Entrada / Saída" para registrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="p-4 border-b border-slate-100">Tipo</th>
                  <th className="p-4 border-b border-slate-100">Peça</th>
                  <th className="p-4 border-b border-slate-100 text-center">Tam.</th>
                  <th className="p-4 border-b border-slate-100 text-center">Qtd.</th>
                  <th className="p-4 border-b border-slate-100">Responsável</th>
                  <th className="p-4 border-b border-slate-100">Observação</th>
                  <th className="p-4 border-b border-slate-100 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {dadosFiltrados.map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold
                        ${mov.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {mov.tipo === 'entrada'
                          ? <><ArrowUpCircle size={12} /> Entrada</>
                          : <><ArrowDownCircle size={12} /> Saída</>}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{mov.produtos?.peca ?? '—'}</td>
                    <td className="p-4 text-center font-mono font-bold text-slate-600">{mov.tamanho}</td>
                    <td className="p-4 text-center">
                      <span className={`font-mono font-black text-base ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{mov.responsavel || '—'}</td>
                    <td className="p-4 text-slate-400 text-xs max-w-[200px] truncate">{mov.observacao || '—'}</td>
                    <td className="p-4 text-right text-xs text-slate-400 font-mono">{formatData(mov.created_at)}</td>
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
