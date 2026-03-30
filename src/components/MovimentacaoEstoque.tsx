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
    <div className="space-y-6 max-w-xl mx-auto pb-12">
      {/* Toggle entrada/saida */}
      <div className="flex rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setTipo('entrada')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[2px] transition-all duration-300 ${
            tipo === 'entrada'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:bg-gelo'
          }`}
        >
          <ArrowUpCircle size={16} /> Entrada
        </button>
        <button
          type="button"
          onClick={() => setTipo('saida')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[2px] transition-all duration-300 ${
            tipo === 'saida'
              ? 'bg-accent text-white shadow-lg shadow-accent/20'
              : 'text-slate-400 hover:bg-gelo'
          }`}
        >
          <ArrowDownCircle size={16} /> Saída
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-10">
          <div className={`p-3 rounded-2xl text-white transition-colors duration-500 ${tipo === 'entrada' ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-accent shadow-lg shadow-accent/20'}`}>
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-primary uppercase tracking-[2px]">
              {tipo === 'entrada' ? 'Ajuste Positivo' : 'Ajuste Negativo'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manual Inventory Update</p>
          </div>
        </div>

        <form onSubmit={salvar} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Produto</label>
            <select
              value={produtoId}
              onChange={e => setProdutoId(e.target.value)}
              required
              className="w-full p-4 bg-gelo border-2 border-transparent rounded-2xl focus:border-accent focus:bg-white outline-none transition-all text-primary font-bold"
            >
              <option value="">Selecione a peça...</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>{p.peca}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Escolha o Tamanho</label>
            <div className="flex flex-wrap gap-2">
              {TAMANHOS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTamanho(t)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black border-2 transition-all duration-200 ${
                    tamanho === t
                      ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20 scale-105'
                      : 'border-gelo bg-gelo text-primary hover:border-accent/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Quantidade</label>
              <input
                type="number"
                min="1"
                placeholder="0"
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                required
                className="w-full p-4 bg-gelo border-2 border-transparent rounded-2xl focus:border-accent focus:bg-white outline-none transition-all text-primary font-black text-3xl font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Responsável</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={responsavel}
                onChange={e => setResponsavel(e.target.value)}
                className="w-full h-[68px] px-4 bg-gelo border-2 border-transparent rounded-2xl focus:border-accent focus:bg-white outline-none transition-all text-primary font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Observações do Ajuste</label>
            <textarea
              placeholder="Ex: Correção de inventário anual..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              rows={2}
              className="w-full p-4 bg-gelo border-2 border-transparent rounded-2xl focus:border-accent focus:bg-white outline-none transition-all text-primary font-bold resize-none"
            />
          </div>

          {sucesso && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              <p className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest leading-none">Log registrado com sucesso!</p>
            </div>
          )}

          {erro && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-red-600 font-black text-[10px] uppercase tracking-widest leading-none">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !produtoId || !tamanho || !quantidade}
            className={`w-full py-5 text-white font-black rounded-2xl shadow-2xl transition-all duration-300 flex justify-center items-center gap-3 uppercase tracking-[4px] text-[10px] disabled:opacity-30 disabled:shadow-none
              ${tipo === 'entrada' ? 'bg-primary hover:bg-secondary shadow-primary/20' : 'bg-accent hover:bg-accent/80 shadow-accent/20'}
            `}
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>{tipo === 'entrada' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />} Confirmar {tipo === 'entrada' ? 'Entrada' : 'Saída'}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
