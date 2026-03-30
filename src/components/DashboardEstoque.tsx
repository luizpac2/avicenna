import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutGrid, AlertTriangle } from 'lucide-react';

const TAMANHOS = ['14', '16', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XG1', 'XG2', 'XG3'];

export function DashboardEstoque() {
    const [dados, setDados] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEstoque();
    }, []);

    async function fetchEstoque() {
        const { data, error } = await supabase
            .from('produtos')
            .select(`
        id, peca, preco_unit, 
        estoque_detalhado (tamanho, quantidade)
      `);

        if (!error) setDados(data);
        setLoading(false);
    }

    return (
        <div className="w-full max-w-7xl bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <LayoutGrid size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Grade de Estoque</h2>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atualizado em tempo real</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                            <th className="p-4 border-b border-slate-100 min-w-[180px]">Peça</th>
                            {TAMANHOS.map(t => (
                                <th key={t} className="p-4 border-b border-slate-100 text-center">{t}</th>
                            ))}
                            <th className="p-4 border-b border-slate-100 text-right">Preço Un.</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {dados.map((prod) => (
                            <tr key={prod.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="p-4 border-b border-slate-50 font-semibold text-slate-700">{prod.peca}</td>
                                {TAMANHOS.map(t => {
                                    const item = prod.estoque_detalhado.find((ed: any) => ed.tamanho === t);
                                    const qtd = item?.quantidade || 0;
                                    return (
                                        <td key={t} className="p-4 border-b border-slate-50 text-center">
                                            <span className={`inline-block min-w-[28px] py-1 rounded-md font-mono text-xs ${qtd < 5 ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-500'
                                                }`}>
                                                {qtd}
                                            </span>
                                        </td>
                                    );
                                })}
                                <td className="p-4 border-b border-slate-50 text-right font-mono text-slate-400 group-hover:text-blue-600 transition-colors">
                                    R$ {prod.preco_unit.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}