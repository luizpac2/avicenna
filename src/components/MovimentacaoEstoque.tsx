import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeftRight, ArrowUpCircle, ArrowDownCircle, CheckCircle, AlertCircle } from 'lucide-react';

const TAMANHOS = ['14', '16', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XG1', 'XG2', 'XG3'];

type Produto = { id: string; peca: string };

export function MovimentacaoEstoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoId, setProdutoId] = useState('');
  const [tamanho, setTamanho] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('produtos').select('id, peca').order('peca').then(({ data }) => {
      if (data) setProdutos(data);
    });
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSucesso(false);
    setErro(null);

    const qtd = parseInt(quantidade);

    // 1. Registrar a movimentação no histórico
    // O Gatilho (Trigger) no banco agora atualizará o estoque detalhado automaticamente
    const { error: errMov } = await supabase.from('movimentacoes').insert([{
      produto_id: produtoId,
      tamanho,
      tipo,
      quantidade: qtd,
      responsavel: responsavel.trim() || null,
      observacao: observacao.trim() || null,
    }]);

    if (errMov) {
      setErro(errMov.message);
    } else {
      setSucesso(true);
      setQuantidade('');
      setObservacao('');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Toggle entrada/saida */}
      <div className="flex rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setTipo('entrada')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-all ${
            tipo === 'entrada'
              ? 'bg-green-600 text-white shadow-inner'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <ArrowUpCircle size={18} /> Entrada
        </button>
        <button
          type="button"
          onClick={() => setTipo('saida')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-all ${
            tipo === 'saida'
              ? 'bg-red-600 text-white shadow-inner'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <ArrowDownCircle size={18} /> Saída
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className={`p-2.5 rounded-xl text-white ${tipo === 'entrada' ? 'bg-green-600' : 'bg-red-600'}`}>
            <ArrowLeftRight size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
          </h3>
        </div>

        <form onSubmit={salvar} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Peça</label>
            <select
              value={produtoId}
              onChange={e => setProdutoId(e.target.value)}
              required
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
            >
              <option value="">Selecione a peça...</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>{p.peca}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tamanho</label>
            <div className="flex flex-wrap gap-2">
              {TAMANHOS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTamanho(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                    tamanho === t
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {!tamanho && <p className="text-xs text-slate-400 mt-2">Selecione um tamanho</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quantidade</label>
            <input
              type="number"
              min="1"
              placeholder="0"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
              required
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium text-2xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Responsável</label>
            <input
              type="text"
              placeholder="Nome do responsável (opcional)"
              value={responsavel}
              onChange={e => setResponsavel(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Observação</label>
            <textarea
              placeholder="Ex: Chegou nova remessa, Venda para Esc. 1..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              rows={2}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium resize-none"
            />
          </div>

          {sucesso && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <CheckCircle size={20} className="text-green-600 shrink-0" />
              <p className="text-green-700 font-semibold text-sm">Movimentação registrada com sucesso!</p>
            </div>
          )}

          {erro && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-sm font-medium">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !produtoId || !tamanho || !quantidade}
            className={`w-full py-4 text-white font-black rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-sm disabled:bg-slate-300 disabled:cursor-not-allowed
              ${tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}
            `}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>{tipo === 'entrada' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />} Confirmar {tipo === 'entrada' ? 'Entrada' : 'Saída'}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
