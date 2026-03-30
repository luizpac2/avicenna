import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Shield, User, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';

type Perfil = {
  id: string;
  email: string;
  role: 'admin' | 'vendedor';
  created_at: string;
};

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuarios();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserEmail(data.user.email || null);
    });
  }, []);

  async function fetchUsuarios() {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) setErro('Erro ao carregar usuários: ' + error.message);
    else setUsuarios(data as Perfil[]);
    setLoading(false);
  }

  async function alternarCargo(id: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'vendedor' : 'admin';
    
    // Proteção: não deixar o admin logado se rebaixar por aqui
    const userToChange = usuarios.find(u => u.id === id);
    if (userToChange?.email === currentUserEmail && currentRole === 'admin') {
      alert("Para sua segurança, você não pode alterar seu próprio cargo de Administrador.");
      return;
    }

    setErro(null);
    const { error } = await supabase
      .from('perfis')
      .update({ role: newRole })
      .eq('id', id);

    if (error) setErro(error.message);
    else {
      setSucesso(`Cargo de ${userToChange?.email} alterado para ${newRole.toUpperCase()}`);
      fetchUsuarios();
      setTimeout(() => setSucesso(null), 3000);
    }
  }

  const formatData = (iso: string) => {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-primary/40 font-black text-[10px] uppercase tracking-[4px]">Sincronizando Equipe...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Alertas */}
      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-500 px-4 py-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
          <AlertCircle size={18} /> {erro}
        </div>
      )}
      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
          <CheckCircle size={18} /> {sucesso}
        </div>
      )}

      {/* Header Compacto */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-black text-primary uppercase text-sm tracking-tight leading-none">Membros da Equipe</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Controle de acessos e permissões</p>
          </div>
        </div>
        <button 
          onClick={fetchUsuarios}
          className="p-2.5 text-slate-300 hover:text-accent hover:bg-gelo rounded-xl transition-all"
          title="Recarregar lista"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gelo text-[10px] font-black text-primary/40 uppercase tracking-[2px]">
                <th className="px-8 py-5">Usuário / E-mail</th>
                <th className="px-6 py-5 text-center">Nível de Acesso</th>
                <th className="px-6 py-5 text-center">Cadastro</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gelo/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-105
                        ${u.role === 'admin' ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-gelo text-primary/30'}
                      `}>
                        {u.role === 'admin' ? <Shield size={18} /> : <User size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{u.email}</span>
                        {u.email === currentUserEmail && (
                          <span className="text-[8px] font-black text-accent uppercase tracking-tighter mt-0.5">Sessão Atual (Você)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors
                      ${u.role === 'admin' 
                        ? 'bg-primary/5 text-primary border-primary/10' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
                    `}>
                      {u.role === 'admin' ? 'Administrador' : 'Vendedor'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center font-mono text-[10px] font-bold text-slate-300">
                    {formatData(u.created_at)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => alternarCargo(u.id, u.role)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all
                        ${u.role === 'admin'
                          ? 'text-slate-300 hover:text-red-400 hover:bg-red-50 underline decoration-slate-200 underline-offset-4'
                          : 'bg-accent text-white hover:bg-accent/80 hover:shadow-xl hover:shadow-accent/20 shadow-sm'}
                      `}
                    >
                      {u.role === 'admin' ? 'Rebaixar' : 'Promover'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {usuarios.length === 0 && (
          <div className="py-24 text-center text-slate-200">
            <Users size={64} className="mx-auto mb-4 opacity-5" />
            <p className="font-black uppercase tracking-[5px] text-xs">Vazio</p>
          </div>
        )}
      </div>

      <div className="bg-primary/5 border border-primary/10 p-8 rounded-3xl flex items-start gap-5">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-primary">
          <Shield size={24} />
        </div>
        <div>
          <h4 className="text-primary font-black text-xs mb-1.5 uppercase tracking-[2px]">Gestão de Segurança</h4>
          <p className="text-primary/60 text-[11px] font-bold leading-relaxed max-w-2xl">
            Novos membros da equipe devem se cadastrar via tela de login. Ao ingressar, o sistema os define automaticamente como <strong className="text-primary">Vendedores</strong> (acesso limitado). 
            Como administrador, você pode <strong className="text-accent">Promover</strong> contas para liberar acesso total às métricas financeiras e gestão de inventário.
          </p>
        </div>
      </div>
    </div>
  );
}
