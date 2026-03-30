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
      setPrecoKit('');
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
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lado Esquerdo: Formulário */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 h-fit sticky top-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
              <PackagePlus size={20} />
            </div>
            <h3 className="text-sm font-black text-primary uppercase tracking-[2px]">Nova Peça</h3>
          </div>

          <form onSubmit={salvar} className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Nome da Peça
                </label>
                <input
                  type="text"
                  placeholder="Ex: Camiseta Polo"
                  value={peca}
                  onChange={e => setPeca(e.target.value)}
                  required
                  className="w-full p-4 bg-gelo border-2 border-transparent rounded-xl focus:border-accent focus:bg-white outline-none transition-all text-primary font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Categoria
                </label>
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="w-full p-4 bg-gelo border-2 border-transparent rounded-xl focus:border-accent focus:bg-white outline-none transition-all text-primary font-bold"
                >
                  <option value="Parte Superior">Parte Superior</option>
                  <option value="Parte Inferior">Parte Inferior</option>
                  <option value="Kits / Peças Especiais">Kits / Peças Especiais</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Preço Unitário
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={precoUnit}
                  onChange={e => setPrecoUnit(e.target.value)}
                  className="w-full p-4 bg-gelo border-2 border-transparent rounded-xl focus:border-accent focus:bg-white outline-none transition-all text-primary font-bold font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-accent uppercase tracking-widest mb-1.5 ml-1">
                  Preço Kit
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={precoKit}
                  onChange={e => setPrecoKit(e.target.value)}
                  className="w-full p-4 bg-accent/5 border-2 border-transparent rounded-xl focus:border-accent focus:bg-white outline-none transition-all text-primary font-bold font-mono"
                />
              </div>
            </div>

            <div className="bg-gelo rounded-xl p-4 border border-slate-100">
              <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest mb-3">
                Grade Automática (Zerada)
              </p>
              <div className="flex flex-wrap gap-2">
                {TAMANHOS.map(t => (
                  <span key={t} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono font-black text-primary/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {sucesso && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                <p className="text-emerald-700 font-bold text-xs uppercase tracking-tight">Peça cadastrada com sucesso!</p>
              </div>
            )}

            {erro && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <p className="text-red-600 text-[10px] font-black uppercase">{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !peca.trim()}
              className="w-full py-4 bg-primary hover:bg-secondary disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-xl shadow-primary/10 transition-all flex justify-center items-center gap-2 uppercase tracking-[3px] text-xs"
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={18} /> Salvar Produto</>
              )}
            </button>
          </form>
        </div>

        {/* Lado Direito: Listagem/Edição */}
        <div className="lg:col-span-7 space-y-6">
          {pecasExistentes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-gelo">
                <ChevronDown size={18} className="text-primary/30" />
                <span className="text-primary font-black text-xs uppercase tracking-widest">Catálogo de Produtos ({pecasExistentes.length})</span>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[850px] overflow-y-auto custom-scrollbar">
              {['Parte Superior', 'Parte Inferior', 'Kits / Peças Especiais', 'Sem Categoria'].map(cat => {
                const pecasDaCategoria = pecasExistentes.filter(p => {
                  if (cat === 'Sem Categoria') return !p.categoria || !['Parte Superior', 'Parte Inferior', 'Kits / Peças Especiais'].includes(p.categoria);
                  return p.categoria === cat;
                });

                if (pecasDaCategoria.length === 0) return null;

                const cores = {
                  'Parte Superior': 'bg-primary text-white border-primary/20',
                  'Parte Inferior': 'bg-secondary text-white border-secondary/20',
                  'Kits / Peças Especiais': 'bg-accent text-white border-accent/20',
                  'Sem Categoria': 'bg-highlight text-white border-highlight/20'
                };

                return (
                  <div key={cat} className="bg-white">
                    <div className={`px-4 py-2 border-y shadow-sm flex items-center justify-between ${cores[cat as keyof typeof cores]}`}>
                      <span className="text-[10px] font-black uppercase tracking-[3px]">{cat}</span>
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
      </div>
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
    <div className="flex items-center justify-between p-4 hover:bg-gelo transition-colors group/row">
      <div className="font-bold text-primary text-xs uppercase tracking-tight">{produto.peca}</div>
      
      <div className="flex items-center gap-6">
        {/* Preço Unitário */}
        <div className="flex items-center gap-3">
          {editando === 'unit' ? (
            <div className="flex items-center gap-2">
              <input 
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={e => setValor(e.target.value)}
                disabled={salvando}
                className="w-24 px-2 py-1 bg-white border-2 border-accent rounded-lg outline-none text-xs font-black font-mono text-primary"
                autoFocus
                onBlur={handleSalvar}
                onKeyDown={e => e.key === 'Enter' && handleSalvar()}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 group/btn cursor-pointer" onClick={() => iniciarEdicao('unit')}>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover/row:text-primary/20 transition-colors">Unit.</span>
              <span className="font-mono font-bold text-slate-400 text-xs">R$ {produto.preco_unit.toFixed(2)}</span>
              <Edit2 size={12} className="text-slate-200 group-hover/btn:text-accent transition-colors" />
            </div>
          )}
        </div>

        {/* Preço Kit */}
        <div className="flex items-center gap-3 border-l border-slate-100 pl-6">
          {editando === 'kit' ? (
            <div className="flex items-center gap-2">
              <input 
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={e => setValor(e.target.value)}
                disabled={salvando}
                className="w-24 px-2 py-1 bg-white border-2 border-accent rounded-lg outline-none text-xs font-black font-mono text-primary"
                autoFocus
                onBlur={handleSalvar}
                onKeyDown={e => e.key === 'Enter' && handleSalvar()}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 group/btn cursor-pointer" onClick={() => iniciarEdicao('kit')}>
              <span className="text-[9px] font-black text-accent/40 uppercase tracking-widest">Kit</span>
              <span className="font-mono font-black text-accent text-xs">R$ {(produto.preco_kit || 0).toFixed(2)}</span>
              <Edit2 size={12} className="text-accent/20 group-hover/btn:text-accent transition-colors" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}