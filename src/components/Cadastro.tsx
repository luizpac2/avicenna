import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PackagePlus, Save, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

type Produto = { id: string; peca: string };

export function Cadastro() {
  const [peca, setPeca] = useState('');
  const [precoUnit, setPrecoUnit] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pecasExistentes, setPecasExistentes] = useState<Produto[]>([]);

  const TAMANHOS = ['14', '16', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XG1', 'XG2', 'XG3'];

  useEffect(() => {
    supabase.from('produtos').select('id, peca').order('peca').then(({ data }) => {
      if (data) setPecasExistentes(data);
    });
  }, [sucesso]);

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

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nova Peça</h2>
        <p className="text-slate-500 text-sm mt-0.5">Cadastre um novo item na grade de estoque</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <PackagePlus size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Dados da Peça</h3>
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

      {/* Lista de peças existentes */}
      {pecasExistentes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChevronDown size={16} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-600">
              Peças já cadastradas ({pecasExistentes.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pecasExistentes.map(p => (
              <span key={p.id} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600">
                {p.peca}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}