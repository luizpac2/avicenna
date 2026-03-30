import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Calendar, AlertCircle, Download } from 'lucide-react';
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
    doc.setFontSize(18);
    doc.text("AVICENNA PIRASSUNUNGA", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("Recibo de Venda (2ª Via)", 105, 28, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nº: ${venda.id.substring(0, 8).toUpperCase()}`, 14, 40);
    doc.text(`Data: ${dataHora.toLocaleString('pt-BR')}`, 14, 46);
    doc.text(`Cliente: ${venda.cliente || 'Não informado'}`, 14, 52);
    doc.text(`Atendente: ${venda.responsavel || 'Não informado'}`, 14, 58);

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
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    // Total final
    const finalY = (doc as any).lastAutoTable.finalY || 68;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL GERAL: R$ ${venda.total.toFixed(2)}`, 196, finalY + 10, { align: "right" });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Obrigado pela preferência!", 105, finalY + 30, { align: "center" });

    // Baixar o PDF
    doc.save(`Recibo_2Via_${venda.id.substring(0, 8).toUpperCase()}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Carregando histórico de vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={fetchVendas}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 uppercase tracking-widest"
        >
          Atualizar Vendas
        </button>
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
            <ShoppingBag size={18} />
          </div>
          <span className="text-slate-700 font-bold text-sm">Registro de Vendas</span>
        </div>

        {vendas.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma venda registrada até o momento</p>
            <p className="text-sm mt-1">Vá em "Nova Venda" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="p-4 border-b border-slate-100">Venda / Id</th>
                  <th className="p-4 border-b border-slate-100">Data</th>
                  <th className="p-4 border-b border-slate-100">Cliente</th>
                  <th className="p-4 border-b border-slate-100">Itens</th>
                  <th className="p-4 border-b border-slate-100 text-right">Total</th>
                  <th className="p-4 border-b border-slate-100 text-center">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {vendas.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-xs font-mono font-bold text-slate-500">
                      #{v.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                        <Calendar size={14} />
                        {formatData(v.created_at)}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{v.cliente || '—'}</td>
                    <td className="p-4 text-slate-600">
                      <div className="text-xs">
                        {v.venda_itens.length} tipo(s) de item
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono font-black text-slate-700">
                        R$ {v.total.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => gerarReciboPDF(v)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors border border-blue-200"
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
