import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Plus, Trash2, CheckCircle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type EstoqueItem = {
  id: string; // id do registro em estoque_detalhado
  tamanho: string;
  quantidade: number;
};

type Produto = {
  id: string;
  peca: string;
  preco_unit: number;
  preco_kit: number;
  estoque_detalhado: EstoqueItem[];
};

type ItemCarrinho = {
  produto_id: string;
  estoque_detalhado_id: string;
  peca: string;
  tamanho: string;
  preco_unit: number;
  quantidade: number;
  subtotal: number;
};

export function NovaVenda() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  // Estados do formulário de venda
  const [cliente, setCliente] = useState('');
  const [responsavel, setResponsavel] = useState('');

  // Estados do item atual sendo adicionado
  const [produtoSelId, setProdutoSelId] = useState('');
  const [tamanhoSel, setTamanhoSel] = useState('');
  const [qtdInput, setQtdInput] = useState('');
  const [isKit, setIsKit] = useState(false);

  // Estado do Carrinho
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  // Estados de UI/Envio
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    fetchProdutos();
  }, []);

  async function fetchProdutos() {
    setLoadingProdutos(true);
    const { data, error } = await supabase
      .from('produtos')
      .select(`id, peca, preco_unit, preco_kit, estoque_detalhado (id, tamanho, quantidade)`)
      .order('peca');

    if (data && !error) {
      setProdutos(data as Produto[]);
    }
    setLoadingProdutos(false);
  }

  const produtoSelecionado = produtos.find((p) => p.id === produtoSelId);
  const estoqueDisponivelObj = produtoSelecionado?.estoque_detalhado.find(
    (e) => e.tamanho === tamanhoSel
  );
  const qtdMaxDisponivel = estoqueDisponivelObj?.quantidade || 0;

  const handleAdicionarAoCarrinho = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoSelecionado || !tamanhoSel || !estoqueDisponivelObj) return;

    const qtd = parseInt(qtdInput);
    if (isNaN(qtd) || qtd <= 0) return;

    if (qtd > qtdMaxDisponivel) {
      setErro(`Quantidade maior que o estoque disponível (${qtdMaxDisponivel}).`);
      return;
    }

    const precoAplicado = isKit && produtoSelecionado.preco_kit > 0 
      ? produtoSelecionado.preco_kit 
      : produtoSelecionado.preco_unit;

    // Verifica se já existe o mesmo produto, tamanho E preço (kit/não kit) no carrinho
    const itemExistenteIndex = carrinho.findIndex(
      (i) => i.produto_id === produtoSelecionado.id && i.tamanho === tamanhoSel && i.preco_unit === precoAplicado
    );

    if (itemExistenteIndex >= 0) {
      const novaQtd = carrinho[itemExistenteIndex].quantidade + qtd;
      if (novaQtd > qtdMaxDisponivel) {
        setErro(`Quantidade total no carrinho excede o estoque (${qtdMaxDisponivel}).`);
        return;
      }
      
      const novoCarrinho = [...carrinho];
      novoCarrinho[itemExistenteIndex].quantidade = novaQtd;
      novoCarrinho[itemExistenteIndex].subtotal = novaQtd * precoAplicado;
      setCarrinho(novoCarrinho);
    } else {
      setCarrinho([
        ...carrinho,
        {
          produto_id: produtoSelecionado.id,
          estoque_detalhado_id: estoqueDisponivelObj.id,
          peca: produtoSelecionado.peca + (isKit ? ' (Kit)' : ''),
          tamanho: tamanhoSel,
          preco_unit: precoAplicado,
          quantidade: qtd,
          subtotal: qtd * precoAplicado,
        },
      ]);
    }

    // Reset fields for next item
    setProdutoSelId('');
    setTamanhoSel('');
    setQtdInput('');
    setIsKit(false);
    setErro(null);
  };

  const handleRemoverItem = (index: number) => {
    setCarrinho(carrinho.filter((_, i) => i !== index));
  };

  const totalVenda = carrinho.reduce((acc, item) => acc + item.subtotal, 0);

  const gerarReciboPDF = (vendaId: string, dataHora: Date) => {
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("AVICENNA PIRASSUNUNGA", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("Recibo de Venda", 105, 28, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nº: ${vendaId.substring(0, 8).toUpperCase()}`, 14, 40);
    doc.text(`Data: ${dataHora.toLocaleString('pt-BR')}`, 14, 46);
    doc.text(`Cliente: ${cliente || 'Não informado'}`, 14, 52);
    doc.text(`Atendente: ${responsavel || 'Não informado'}`, 14, 58);

    doc.line(14, 62, 196, 62);

    // Tabela de itens
    const tableData = carrinho.map((item) => [
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
      headStyles: { fillColor: [37, 99, 235] }, // blue-600
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
    doc.text(`TOTAL GERAL: R$ ${totalVenda.toFixed(2)}`, 196, finalY + 10, { align: "right" });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Obrigado pela preferência!", 105, finalY + 30, { align: "center" });

    // Baixar o PDF
    doc.save(`Recibo_Venda_${vendaId.substring(0, 8).toUpperCase()}.pdf`);
  };

  const confirmarVenda = async () => {
    if (carrinho.length === 0) return;
    setSalvando(true);
    setErro(null);
    setSucesso(false);

    try {
      // 1. Criar Venda
      const { data: novaVenda, error: errVenda } = await supabase
        .from('vendas')
        .insert([{
          cliente: cliente.trim() || null,
          responsavel: responsavel.trim() || null,
          total: totalVenda
        }])
        .select()
        .single();

      if (errVenda || !novaVenda) throw new Error(errVenda?.message || 'Erro ao registrar venda.');

      const vendaId = novaVenda.id;

      // 2. Inserir Itens da Venda
      const itensPreenchidos = carrinho.map((item) => ({
        venda_id: vendaId,
        produto_id: item.produto_id,
        peca: item.peca,
        tamanho: item.tamanho,
        quantidade: item.quantidade,
        preco_unit: item.preco_unit,
        subtotal: item.subtotal
      }));

      const { error: errItens } = await supabase.from('venda_itens').insert(itensPreenchidos);
      if (errItens) throw new Error(errItens.message);

      // 3. Atualizar o estoque e registrar movimentação de saída
      for (const item of carrinho) {
        // Obter qtde atual real para prevenir concorrência
        const { data: atualEstoque, error: errQtde } = await supabase
          .from('estoque_detalhado')
          .select('quantidade')
          .eq('id', item.estoque_detalhado_id)
          .single();
          
        if (errQtde || !atualEstoque) continue;

        const novaQtde = atualEstoque.quantidade - item.quantidade;
        
        await supabase
          .from('estoque_detalhado')
          .update({ quantidade: novaQtde })
          .eq('id', item.estoque_detalhado_id);

        // Registrar em movimentacoes
        await supabase.from('movimentacoes').insert([{
          produto_id: item.produto_id,
          tamanho: item.tamanho,
          tipo: 'saida',
          quantidade: item.quantidade,
          responsavel: responsavel.trim() || null,
          observacao: `Venda #${vendaId.substring(0, 8).toUpperCase()}`
        }]);
      }

      // Tudo certo! Gera PDF e reseta Tela
      gerarReciboPDF(vendaId, new Date(novaVenda.created_at));
      
      setSucesso(true);
      setCarrinho([]);
      setCliente('');
      // Mantém o responsável para facilitar próximas vendas seguidas
      fetchProdutos(); // Atualiza saldo disponível na UI

    } catch (e: any) {
      setErro(e.message || 'Erro inesperado.');
    } finally {
      setSalvando(false);
    }
  };

  if (loadingProdutos) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nova Venda</h2>
        <p className="text-slate-500 text-sm mt-0.5">Registre vendas e emita o recibo em PDF</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Painel Esquerdo: Controle da venda e adição de itens */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-slate-400" />
              1. Dados do Recibo
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Cliente (Opcional)</label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Responsável (Atendente)</label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-500" />
              2. Selecionar Peça
            </h3>
            
            <form onSubmit={handleAdicionarAoCarrinho} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Peça</label>
                <select
                  value={produtoSelId}
                  onChange={(e) => {
                    setProdutoSelId(e.target.value);
                    setTamanhoSel('');
                    setQtdInput('');
                  }}
                  required
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-medium"
                >
                  <option value="">Selecione a peça...</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.peca} — R$ {p.preco_unit.toFixed(2)} (Kit: R$ {p.preco_kit.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {produtoSelecionado && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tamanho Disponível</label>
                  <div className="flex flex-wrap gap-2">
                    {produtoSelecionado.estoque_detalhado.map((t) => {
                      const esgotado = t.quantidade === 0;
                      return (
                        <button
                          type="button"
                          key={t.id}
                          disabled={esgotado}
                          onClick={() => setTamanhoSel(t.tamanho)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all ${
                            esgotado 
                            ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed opacity-50' 
                            : tamanhoSel === t.tamanho
                              ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                              : 'border-slate-200 text-slate-600 hover:border-blue-300'
                          }`}
                        >
                          {t.tamanho}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {tamanhoSel && estoqueDisponivelObj && produtoSelecionado && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      max={qtdMaxDisponivel}
                      value={qtdInput}
                      onChange={(e) => setQtdInput(e.target.value)}
                      required
                      className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-bold font-mono"
                    />
                  </div>
                  <div className="flex-2 flex flex-col">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Preço Unitário Aplicado</label>
                    <div 
                      onClick={() => setIsKit(!isKit)}
                      className={`flex-1 flex items-center justify-between px-3 rounded-xl border-2 cursor-pointer transition-all ${isKit ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-700'}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase opacity-70 leading-tight">{isKit ? 'Preço de Kit' : 'Preço Normal'}</span>
                        <span className="font-mono font-bold leading-tight text-sm">R$ {(isKit ? (produtoSelecionado.preco_kit || 0) : produtoSelecionado.preco_unit).toFixed(2)}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isKit ? 'bg-white border-white' : 'border-slate-200'}`}>
                        {isKit && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {erro && (
                <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={!produtoSelId || !tamanhoSel || !qtdInput}
                className="w-full py-3.5 bg-slate-900 border border-slate-800 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                Colocar no Carrinho
              </button>
            </form>
          </div>
        </div>

        {/* Painel Direito: Carrinho */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <ShoppingCart size={18} />
                </div>
                <span className="text-slate-800 font-bold">3. Carrinho ({carrinho.length} itens)</span>
              </div>
            </div>

            <div className="flex-1 p-0 overflow-x-auto min-h-[300px]">
              {carrinho.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="font-semibold">O carrinho está vazio</p>
                  <p className="text-sm">Adicione itens no painel ao lado</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Peça</th>
                      <th className="p-4 text-center">Tamanho</th>
                      <th className="p-4 text-center">Qtde</th>
                      <th className="p-4 text-right">Unitário</th>
                      <th className="p-4 text-right">Subtotal</th>
                      <th className="p-4 text-center w-12">Remover</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-50">
                    {carrinho.map((item, idx) => (
                      <tr key={`${item.produto_id}-${item.tamanho}`} className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold text-slate-800">{item.peca}</td>
                        <td className="p-4 text-center font-mono font-bold text-slate-600">{item.tamanho}</td>
                        <td className="p-4 text-center font-mono font-bold">{item.quantidade}</td>
                        <td className="p-4 text-right font-mono text-slate-500">R$ {item.preco_unit.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-bold text-blue-600">R$ {item.subtotal.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleRemoverItem(idx)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-6">
              <div className="flex justify-between items-end mb-6">
                <span className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Total Final</span>
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  <sup className="text-lg font-bold text-slate-400 mr-1">R$</sup>
                  {totalVenda.toFixed(2)}
                </span>
              </div>

              {sucesso && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-4 font-medium">
                  <CheckCircle size={20} /> Venda concluída e recibo gerado!
                </div>
              )}

              <button
                onClick={confirmarVenda}
                disabled={carrinho.length === 0 || salvando}
                className="w-full py-4 text-white uppercase tracking-widest text-sm font-black rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {salvando ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Finalizar Venda e Gerar PDF</>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
