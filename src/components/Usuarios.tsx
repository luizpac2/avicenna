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
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Carregando lista de equipe...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Alertas */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-bold animate-head-shake">
          <AlertCircle size={18} /> {erro}
        </div>
      )}
      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-bold">
          <CheckCircle size={18} /> {sucesso}
        </div>
      )}

      {/* Header Compacto */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-xl text-white">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 leading-none">Membros da Equipe</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gerencie permissões de acesso</p>
          </div>
        </div>
        <button 
          onClick={fetchUsuarios}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
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
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4 border-b border-slate-100">Usuário / E-mail</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">Nível de Acesso</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">Cadastro</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black
                        ${u.role === 'admin' ? 'bg-blue-600 shadow-md shadow-blue-200' : 'bg-slate-200 text-slate-500'}
                      `}>
                        {u.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
                      </div>
                      <span className="font-bold text-slate-700">{u.email}</span>
                      {u.email === currentUserEmail && (
                        <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Você</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                      ${u.role === 'admin' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
                    `}>
                      {u.role === 'admin' ? 'Administrador' : 'Vendedor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">
                    {formatData(u.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => alternarCargo(u.id, u.role)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                        ${u.role === 'admin'
                          ? 'text-slate-400 hover:bg-slate-100 italic'
                          : 'bg-slate-900 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 shadow-sm'}
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
          <div className="py-20 text-center text-slate-300">
            <Users size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-black uppercase tracking-[4px] text-xs">Nenhum membro encontrado</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
        <Shield size={24} className="text-blue-500 shrink-0" />
        <div>
          <h4 className="text-blue-900 font-bold text-sm mb-1 uppercase tracking-tight">Dica do Administrador</h4>
          <p className="text-blue-800/70 text-xs leading-relaxed">
            Novos funcionários devem se cadastrar na tela de login. Após o cadastro, eles aparecerão aqui automaticamente como <strong>Vendedores</strong>. 
            Você pode promovê-los a <strong>Administradores</strong> a qualquer momento para conceder acesso às finanças e configurações.
          </p>
        </div>
      </div>
    </div>
  );
}
