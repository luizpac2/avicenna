import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Plus, Trash2, CheckCircle, FileText, AlertCircle } from 'lucide-react';
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
  categoria: string;
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

export function NovaVenda({ userRole }: { userRole: 'admin' | 'vendedor' | null }) {
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
      .select(`id, peca, categoria, preco_unit, preco_kit, estoque_detalhado (id, tamanho, quantidade)`)
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
    doc.setTextColor(8, 28, 89); // primary
    doc.text("UNIFORMES AVICENNA", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("Recibo de Venda", 105, 28, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`Nº: ${vendaId.substring(0, 8).toUpperCase()}`, 14, 40);
    doc.text(`Data: ${dataHora.toLocaleString('pt-BR')}`, 14, 46);
    doc.text(`Cliente: ${cliente || 'Não informado'}`, 14, 52);
    doc.text(`Responsável: ${responsavel || 'Não informado'}`, 14, 58);

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
      headStyles: { fillColor: [8, 28, 89] }, // primary (#081C59)
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
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Painel Esquerdo: Controle da venda e adição de itens */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-black text-primary uppercase tracking-[2px] mb-4 flex items-center gap-2">
              <FileText size={16} className="text-secondary" />
              1. Identificação
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cliente (Opcional)</label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full p-3.5 bg-gelo border-2 border-transparent rounded-xl focus:border-accent focus:bg-white outline-none transition-all text-sm font-bold text-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</label>
                  {userRole && (
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${userRole === 'admin' ? 'bg-primary/10 text-primary' : 'bg-highlight/10 text-highlight'}`}>
                      {userRole === 'admin' ? 'Adm' : 'Vend'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="w-full p-3.5 bg-gelo border-2 border-transparent rounded-xl focus:border-accent focus:bg-white outline-none transition-all text-sm font-bold text-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1">
            <h3 className="text-sm font-black text-primary uppercase tracking-[2px] mb-4 flex items-center gap-2">
              <Plus size={16} className="text-accent" />
              2. Seleção de Peça
            </h3>
            
            <form onSubmit={handleAdicionarAoCarrinho} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Produto</label>
                <select
                  value={produtoSelId}
                  onChange={(e) => {
                    setProdutoSelId(e.target.value);
                    setTamanhoSel('');
                    setQtdInput('');
                  }}
                  required
                  className="w-full p-3.5 bg-gelo border-2 border-transparent rounded-xl focus:border-accent focus:bg-white outline-none transition-all text-sm font-bold text-primary"
                >
                  <option value="">Selecione a peça...</option>
                  {['Parte Superior', 'Parte Inferior', 'Kits / Peças Especiais'].map(cat => {
                    const pecasDaCategoria = produtos.filter(p => p.categoria === cat);
                    if (pecasDaCategoria.length === 0) return null;
                    return (
                      <optgroup key={cat} label={cat} className="font-sans font-bold text-xs uppercase">
                        {pecasDaCategoria.map(p => (
                          <option key={p.id} value={p.id} className="font-sans font-medium text-slate-700 capitalize">
                            {p.peca} — R$ {p.preco_unit.toFixed(2)}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {produtoSelecionado && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Grade de Tamanhos</label>
                  <div className="flex flex-wrap gap-2">
                    {produtoSelecionado.estoque_detalhado.map((t) => {
                      const esgotado = t.quantidade === 0;
                      return (
                        <button
                          type="button"
                          key={t.id}
                          disabled={esgotado}
                          onClick={() => setTamanhoSel(t.tamanho)}
                          className={`px-3 py-2 rounded-xl text-xs font-black border-2 transition-all duration-200 ${
                            esgotado 
                            ? 'bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed' 
                            : tamanhoSel === t.tamanho
                              ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20 scale-105'
                              : 'border-gelo bg-gelo text-primary hover:border-accent/40'
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
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Qtd</label>
                    <input
                      type="number"
                      min="1"
                      max={qtdMaxDisponivel}
                      value={qtdInput}
                      onChange={(e) => setQtdInput(e.target.value)}
                      required
                      className="w-full p-3.5 bg-gelo border-2 border-transparent rounded-xl focus:border-accent focus:bg-white outline-none transition-all text-sm font-black font-mono text-primary"
                    />
                  </div>
                  <div className="flex-[2] flex flex-col">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Preço Aplicado</label>
                    <div 
                      onClick={() => setIsKit(!isKit)}
                      className={`flex-1 flex items-center justify-between px-3.5 rounded-xl border-2 transition-all duration-300 cursor-pointer ${isKit ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-gelo border-transparent text-primary'}`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-black uppercase leading-tight ${isKit ? 'text-white/60' : 'text-primary/40'}`}>{isKit ? 'Kit' : 'Unitário'}</span>
                        <span className="font-mono font-black text-sm">R$ {(isKit ? (produtoSelecionado.preco_kit || 0) : produtoSelecionado.preco_unit).toFixed(2)}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isKit ? 'bg-white border-white' : 'border-slate-300'}`}>
                        {isKit && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {erro && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-500" />
                  <p className="text-red-600 text-[10px] font-bold uppercase">{erro}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!produtoSelId || !tamanhoSel || !qtdInput}
                className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[3px] rounded-xl hover:bg-secondary transition-all disabled:opacity-30 disabled:grayscale shadow-xl shadow-primary/10 flex justify-center items-center gap-2 mt-2"
              >
                Incluir no Carrinho
              </button>
            </form>
          </div>
        </div>

        {/* Painel Direito: Carrinho */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gelo">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent rounded-lg text-white shadow-lg shadow-accent/20">
                  <ShoppingCart size={18} />
                </div>
                <span className="text-primary font-black text-xs uppercase tracking-widest">3. Resumo do Pedido ({carrinho.length} itens)</span>
              </div>
            </div>

            <div className="flex-1 p-0 overflow-x-auto min-h-[350px]">
              {carrinho.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="font-black uppercase tracking-[4px] text-xs">Carrinho Vazio</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-[10px] text-primary/40 font-black uppercase tracking-widest">
                      <th className="p-4">Peça Selecionada</th>
                      <th className="p-4 text-center">Tamanho</th>
                      <th className="p-4 text-center">Qtd</th>
                      <th className="p-4 text-right">Unitário</th>
                      <th className="p-4 text-right">Subtotal</th>
                      <th className="p-4 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-50">
                    {carrinho.map((item, idx) => (
                      <tr key={`${item.produto_id}-${item.tamanho}-${idx}`} className="hover:bg-gelo/30 transition-colors group">
                        <td className="p-4 font-bold text-primary group-hover:text-accent transition-colors">{item.peca}</td>
                        <td className="p-4 text-center font-mono font-black text-secondary">{item.tamanho}</td>
                        <td className="p-4 text-center font-mono font-bold text-primary bg-gelo/30">{item.quantidade}</td>
                        <td className="p-4 text-right font-mono text-slate-400 text-xs">R$ {item.preco_unit.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-black text-primary">R$ {item.subtotal.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleRemoverItem(idx)}
                            className="bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 transition-all p-2 rounded-lg"
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

            <div className="bg-gelo border-t border-slate-100 p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col">
                  <span className="text-primary/40 font-black uppercase text-[10px] tracking-[4px]">Montante Global</span>
                  <div className="w-12 h-1 bg-accent mt-1" />
                </div>
                <span className="text-5xl font-black text-primary tracking-tight">
                  <sup className="text-lg font-bold text-accent mr-1">R$</sup>
                  {totalVenda.toFixed(2)}
                </span>
              </div>

              {sucesso && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl mb-6">
                  <CheckCircle size={20} /> 
                  <span className="text-xs font-black uppercase tracking-widest">Sucesso! O recibo foi enviado para download.</span>
                </div>
              )}

              <button
                onClick={confirmarVenda}
                disabled={carrinho.length === 0 || salvando}
                className="w-full py-5 text-white uppercase tracking-[5px] text-xs font-black rounded-2xl bg-accent hover:bg-accent/80 shadow-2xl shadow-accent/20 transition-all duration-300 disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-3 relative overflow-hidden"
              >
                {salvando ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Finalizar Venda & Gerar PDF</>
                )}
                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
