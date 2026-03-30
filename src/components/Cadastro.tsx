import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PackagePlus, Save, CheckCircle, AlertCircle, ChevronDown, Edit2, X, Check } from 'lucide-react';

type Produto = { id: string; peca: string; preco_unit: number };

export function Cadastro() {
  const [peca, setPeca] = useState('');
  const [precoUnit, setPrecoUnit] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pecasExistentes, setPecasExistentes] = useState<Produto[]>([]);

  const TAMANHOS = ['14', '16', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XG1', 'XG2', 'XG3'];

  useEffect(() => {
    fetchPecas();
  }, [sucesso]);

  const fetchPecas = () => {
    supabase.from('produtos').select('id, peca, preco_unit').order('peca').then(({ data }) => {
      if (data) setPecasExistentes(data);
    });
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setSucesso(false);

    // 1. Inserir produto
    const { data: prod, error: errProd } = await supabase
      .from('produtos')
      .insert([{ peca: peca.trim(), preco_unit: parseFloat(precoUnit) || 0 }])
      .select()
      .single();

    if (errProd || !prod) {
      setErro(errProd?.message ?? 'Erro desconhecido');
      setLoading(false);
      return;
    }

    // 2. Criar linhas de estoque_detalhado zeradas para todos os tamanhos
    const linhas = TAMANHOS.map(t => ({
      produto_id: prod.id,
      tamanho: t,
      quantidade: 0,
    }));

    const { error: errEstoque } = await supabase.from('estoque_detalhado').insert(linhas);

    if (errEstoque) {
      setErro(errEstoque.message);
    } else {
      setSucesso(true);
      setPeca('');
      setPrecoUnit('');
    }
    setLoading(false);
  };

  const atualizarPreco = async (id: string, novoPreco: number) => {
    const { error } = await supabase
      .from('produtos')
      .update({ preco_unit: novoPreco })
      .eq('id', id);
    
    if (!error) {
      fetchPecas(); // recarrega a lista
    } else {
      alert('Erro ao atualizar preço: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gerenciar Peças</h2>
        <p className="text-slate-500 text-sm mt-0.5">Cadastre itens ou atualize os preços</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <PackagePlus size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Nova Peça</h3>
        </div>

        <form onSubmit={salvar} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nome da Peça
            </label>
            <input
              type="text"
              placeholder="Ex: Camiseta Polo"
              value={peca}
              onChange={e => setPeca(e.target.value)}
              required
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Preço Unitário (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={precoUnit}
              onChange={e => setPrecoUnit(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Tamanhos que serão criados (zerados)
            </p>
            <div className="flex flex-wrap gap-2">
              {TAMANHOS.map(t => (
                <span key={t} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-600">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {sucesso && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <CheckCircle size={20} className="text-green-600 shrink-0" />
              <p className="text-green-700 font-semibold text-sm">Peça cadastrada com sucesso!</p>
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
            disabled={loading || !peca.trim()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-sm"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save size={18} /> Cadastrar Peça</>
            )}
          </button>
        </form>
      </div>

      {/* Tabela de edição de preços */}
      {pecasExistentes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <ChevronDown size={18} className="text-slate-400" />
            <span className="text-slate-700 font-bold text-sm">Atualizar Preços ({pecasExistentes.length})</span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {pecasExistentes.map(p => (
              <LinhaProduto key={p.id} produto={p} onSalvar={atualizarPreco} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente para gerenciar o estado da edição em cada linha
function LinhaProduto({ produto, onSalvar }: { produto: Produto, onSalvar: (id: string, preco: number) => Promise<void> }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(produto.preco_unit.toString());
  const [salvando, setSalvando] = useState(false);

  // Sincroniza o valor local se mudar no banco
  useEffect(() => {
    setValor(produto.preco_unit.toString());
  }, [produto.preco_unit]);

  const handleSalvar = async () => {
    const valFloat = parseFloat(valor);
    if (isNaN(valFloat) || valFloat < 0) return;
    
    setSalvando(true);
    await onSalvar(produto.id, valFloat);
    setEditando(false);
    setSalvando(false);
  };

  const handleCancelar = () => {
    setValor(produto.preco_unit.toString());
    setEditando(false);
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
      <div className="font-semibold text-slate-800 text-sm">{produto.peca}</div>
      
      <div className="flex items-center gap-3">
        {editando ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
              <input 
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={e => setValor(e.target.value)}
                disabled={salvando}
                className="w-28 pl-9 pr-3 py-1.5 bg-white border-2 border-blue-500 rounded-lg outline-none text-sm font-bold font-mono text-slate-700"
                autoFocus
              />
            </div>
            <button 
              onClick={handleSalvar} 
              disabled={salvando}
              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
              title="Salvar"
            >
              <Check size={18} />
            </button>
            <button 
              onClick={handleCancelar}
              disabled={salvando}
              className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
              title="Cancelar"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <span className="font-mono font-black text-slate-600">R$ {produto.preco_unit.toFixed(2)}</span>
            <button 
              onClick={() => setEditando(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Editar Preço"
            >
              <Edit2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}