import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PackagePlus, Save, AlertCircle } from 'lucide-react';

export function Cadastro() {
    const [nome, setNome] = useState('');
    const [preco, setPreco] = useState('');
    const [loading, setLoading] = useState(false);

    const salvarNoSQL = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 1. Inserir o produto na tabela SQL
        // O SKU estamos gerando automático com o timestamp para facilitar agora
        const { error } = await supabase
            .from('produtos')
            .insert([
                {
                    nome,
                    preco_venda: parseFloat(preco),
                    sku: `SKU-${Date.now()}`
                }
            ]);

        if (error) {
            alert("Erro ao gravar: " + error.message);
        } else {
            alert("Sucesso! Produto registrado no banco de dados.");
            setNome('');
            setPreco('');
        }
        setLoading(false);
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-blue-600">
            <div className="flex items-center gap-3 mb-8 text-blue-800">
                <PackagePlus size={32} />
                <h2 className="text-2xl font-black uppercase tracking-tight">Novo Item</h2>
            </div>

            <form onSubmit={salvarNoSQL} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Descrição do Produto</label>
                    <input
                        type="text"
                        placeholder="Ex: Uniforme de Educação Física"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Preço de Venda (R$)</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={preco}
                        onChange={(e) => setPreco(e.target.value)}
                        required
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
                    />
                </div>

                <button
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black rounded-2xl shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 uppercase tracking-widest"
                >
                    {loading ? 'Processando...' : <><Save size={20} /> Gravar no SQL</>}
                </button>
            </form>

            <div className="mt-6 flex items-center gap-2 text-slate-400 text-xs justify-center">
                <AlertCircle size={14} />
                <span>O estoque será inicializado como zero automaticamente.</span>
            </div>
        </div>
    );
}