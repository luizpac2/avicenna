import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Calendar, AlertCircle, Download, RefreshCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type VendaItem = {
  id: string;
  peca: string;
  tamanho: string;
  quantidade: number;
  preco_unit: number;
  subtotal: number;
};

type Venda = {
  id: string;
  cliente: string | null;
  responsavel: string | null;
  total: number;
  created_at: string;
  venda_itens: VendaItem[];
};

export function HistoricoVendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetchVendas();
  }, []);

  async function fetchVendas() {
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase
      .from('vendas')
      .select(`
        id, cliente, responsavel, total, created_at,
        venda_itens (id, peca, tamanho, quantidade, preco_unit, subtotal)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) setErro(error.message);
    else setVendas((data as unknown) as Venda[]);
    setLoading(false);
  }

  const formatData = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const gerarReciboPDF = (venda: Venda) => {
    const doc = new jsPDF();
    const dataHora = new Date(venda.created_at);
    
    // Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(8, 28, 89); // Navy Primary
    doc.text("UNIFORMES AVICENNA", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(217, 139, 43); // Gold Accent
    doc.text("Recibo de Venda (2ª Via)", 105, 28, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Nº: ${venda.id.substring(0, 8).toUpperCase()}`, 14, 40);
    doc.text(`Data: ${dataHora.toLocaleString('pt-BR')}`, 14, 46);
    doc.text(`Cliente: ${venda.cliente || 'Não informado'}`, 14, 52);
    doc.text(`Responsável: ${venda.responsavel || 'Não informado'}`, 14, 58);

    doc.setDrawColor(242, 242, 242);
    doc.line(14, 62, 196, 62);

    // Tabela de itens
    const tableData = venda.venda_itens.map((item) => [
      item.peca,
      item.tamanho,
      item.quantidade.toString(),
      `R$ ${item.preco_unit.toFixed(2)}`,
      `R$ ${item.subtotal.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 68,
      head: [['Peça', 'Tamanho', 'Qtd', 'Preço Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [8, 28, 89], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [242, 242, 242] },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    // Total final
    const finalY = (doc as any).lastAutoTable.finalY || 68;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(8, 28, 89);
    doc.text(`TOTAL GERAL: R$ ${venda.total.toFixed(2)}`, 196, finalY + 15, { align: "right" });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Obrigado pela preferência e confiança!", 105, finalY + 35, { align: "center" });

    // Baixar o PDF
    doc.save(`Recibo_2Via_${venda.id.substring(0, 8).toUpperCase()}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-primary/40 text-[10px] font-black uppercase tracking-[4px]">Recuperando Transações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-end">
        <button
          onClick={fetchVendas}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black hover:bg-secondary transition-all shadow-xl shadow-primary/10 uppercase tracking-[2px]"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar Registro
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-5">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">{erro}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-gelo">
          <div className="p-2.5 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
            <ShoppingBag size={18} />
          </div>
          <div>
            <h3 className="text-primary font-black text-xs uppercase tracking-widest">Logs de Vendas</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Últimas 100 transações processadas</p>
          </div>
        </div>

        {vendas.length === 0 ? (
          <div className="py-24 text-center text-slate-200">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-black uppercase tracking-[5px] text-xs">Vazio</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-primary/40 uppercase text-[9px] font-black tracking-[2px] border-b border-slate-100">
                  <th className="px-6 py-5">Venda / Id</th>
                  <th className="px-6 py-5">Data e Hora</th>
                  <th className="px-6 py-5">Cliente</th>
                  <th className="px-6 py-5">Itens</th>
                  <th className="px-6 py-5 text-right">Total</th>
                  <th className="px-6 py-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {vendas.map(v => (
                  <tr key={v.id} className="hover:bg-gelo/30 transition-colors group">
                    <td className="px-6 py-5 text-[10px] font-mono font-black text-primary/40">
                      #{v.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Calendar size={14} className="text-accent" />
                        {formatData(v.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-primary uppercase tracking-tight">{v.cliente || 'Consumidor Final'}</td>
                    <td className="px-6 py-5 text-slate-400">
                      <div className="text-[10px] font-bold uppercase tracking-widest">
                        {v.venda_itens.length} {v.venda_itens.length === 1 ? 'item' : 'itens'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-mono font-black text-primary text-sm">
                        R$ {v.total.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button 
                        onClick={() => gerarReciboPDF(v)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent/5 text-accent hover:bg-accent hover:text-white font-black text-[10px] rounded-xl transition-all border border-accent/20 uppercase tracking-[2px]"
                      >
                        <Download size={14} /> 2ª Via
                      </button>
                    </td>
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
