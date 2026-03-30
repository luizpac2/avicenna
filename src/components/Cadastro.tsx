import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PackagePlus, Save, CheckCircle, AlertCircle, ChevronDown, Edit2 } from 'lucide-react';

type Produto = { id: string; peca: string; categoria: string; preco_unit: number; preco_kit: number };

export function Cadastro() {
  const [peca, setPeca] = useState('');
  const [categoria, setCategoria] = useState('Parte Superior');
  const [precoUnit, setPrecoUnit] = useState('');
  const [precoKit, setPrecoKit] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pecasExistentes, setPecasExistentes] = useState<Produto[]>([]);

  const TAMANHOS = ['14', '16', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XG1', 'XG2', 'XG3'];

  useEffect(() => {
    fetchPecas();
  }, [sucesso]);

  const fetchPecas = () => {
    supabase.from('produtos').select('id, peca, categoria, preco_unit, preco_kit').order('peca').then(({ data }) => {
      if (data) setPecasExistentes(data as Produto[]);
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
      .insert([{ 
        peca: peca.trim(), 
        categoria: categoria,
        preco_unit: parseFloat(precoUnit) || 0,
        preco_kit: parseFloat(precoKit) || 0 
      }])
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

  const atualizarPreco = async (id: string, novoPreco: number, tipo: 'unit' | 'kit') => {
    const { error } = await supabase
      .from('produtos')
      .update({ [tipo === 'unit' ? 'preco_unit' : 'preco_kit']: novoPreco })
      .eq('id', id);
    
    if (!error) {
      fetchPecas();
    } else {
      alert('Erro ao atualizar: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gerenciar Peças</h2>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full border border-blue-200">V2.0 - ORGANIZADO</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Cadastre itens ou atualize os preços</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <PackagePlus size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Nova Peça</h3>
        </div>

        <form onSubmit={salvar} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Categoria
              </label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
              >
                <option value="Parte Superior">Parte Superior</option>
                <option value="Parte Inferior">Parte Inferior</option>
                <option value="Kits / Peças Especiais">Kits / Peças Especiais</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-blue-600">
                Preço Kit (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={precoKit}
                onChange={e => setPrecoKit(e.target.value)}
                className="w-full p-4 bg-blue-50/30 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
              />
            </div>
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
          
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {['Parte Superior', 'Parte Inferior', 'Kits / Peças Especiais', 'Sem Categoria'].map(cat => {
            const pecasDaCategoria = pecasExistentes.filter(p => {
              if (cat === 'Sem Categoria') return !p.categoria || !['Parte Superior', 'Parte Inferior', 'Kits / Peças Especiais'].includes(p.categoria);
              return p.categoria === cat;
            });

            if (pecasDaCategoria.length === 0) return null;

            const cores = {
              'Parte Superior': 'bg-blue-600 border-blue-700 text-white',
              'Parte Inferior': 'bg-green-600 border-green-700 text-white',
              'Kits / Peças Especiais': 'bg-purple-600 border-purple-700 text-white',
              'Sem Categoria': 'bg-red-500 border-red-600 text-white'
            };

            return (
              <div key={cat} className="bg-white">
                <div className={`px-4 py-1.5 border-y shadow-sm flex items-center justify-between ${cores[cat as keyof typeof cores]}`}>
                  <span className="text-[10px] font-black uppercase tracking-[2px]">{cat}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                </div>
                <div className="divide-y divide-slate-50">
                  {pecasDaCategoria.map(p => (
                    <LinhaProduto key={p.id} produto={p} onSalvar={atualizarPreco} />
                  ))}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente para gerenciar o estado da edição em cada linha
function LinhaProduto({ produto, onSalvar }: { produto: Produto, onSalvar: (id: string, preco: number, tipo: 'unit' | 'kit') => Promise<void> }) {
  const [editando, setEditando] = useState<'unit' | 'kit' | null>(null);
  const [valor, setValor] = useState('');
  const [salvando, setSalvando] = useState(false);

  const iniciarEdicao = (tipo: 'unit' | 'kit') => {
    setValor(tipo === 'unit' ? produto.preco_unit.toString() : (produto.preco_kit || 0).toString());
    setEditando(tipo);
  };

  const handleSalvar = async () => {
    const valFloat = parseFloat(valor);
    if (isNaN(valFloat) || valFloat < 0 || !editando) return;
    
    setSalvando(true);
    await onSalvar(produto.id, valFloat, editando);
    setEditando(null);
    setSalvando(false);
  };



  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
      <div className="font-semibold text-slate-800 text-sm">{produto.peca}</div>
      
      <div className="flex items-center gap-6">
        {/* Preço Unitário */}
        <div className="flex items-center gap-2">
          {editando === 'unit' ? (
            <div className="flex items-center gap-2">
              <input 
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={e => setValor(e.target.value)}
                disabled={salvando}
                className="w-24 px-2 py-1 bg-white border-2 border-blue-500 rounded-lg outline-none text-xs font-bold"
                autoFocus
                onBlur={handleSalvar}
                onKeyDown={e => e.key === 'Enter' && handleSalvar()}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 group/btn">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Unit.</span>
              <span className="font-mono font-bold text-slate-600 text-sm">R$ {produto.preco_unit.toFixed(2)}</span>
              <button onClick={() => iniciarEdicao('unit')} className="opacity-0 group-hover/btn:opacity-100 p-1 text-slate-400 hover:text-blue-600"><Edit2 size={12} /></button>
            </div>
          )}
        </div>

        {/* Preço Kit */}
        <div className="flex items-center gap-2 border-l border-slate-100 pl-6">
          {editando === 'kit' ? (
            <div className="flex items-center gap-2">
              <input 
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={e => setValor(e.target.value)}
                disabled={salvando}
                className="w-24 px-2 py-1 bg-white border-2 border-blue-600 rounded-lg outline-none text-xs font-bold"
                autoFocus
                onBlur={handleSalvar}
                onKeyDown={e => e.key === 'Enter' && handleSalvar()}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 group/btn">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Kit</span>
              <span className="font-mono font-bold text-blue-600 text-sm">R$ {(produto.preco_kit || 0).toFixed(2)}</span>
              <button onClick={() => iniciarEdicao('kit')} className="opacity-0 group-hover/btn:opacity-100 p-1 text-slate-400 hover:text-blue-600"><Edit2 size={12} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}