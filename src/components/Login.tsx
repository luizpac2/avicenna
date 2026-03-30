import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Shirt, AlertCircle, Loader2, UserPlus, CheckCircle } from 'lucide-react';

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
      } else {
        setSuccess('Cadastro realizado! Agora você pode entrar.');
        setIsSignUp(false);
        setLoading(false);
        setPassword('');
        setConfirmPassword('');
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : authError.message);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 animate-bounce-slow">
            <Shirt size={40} className="text-white" />
          </div>
          <h1 className="text-white font-black text-3xl leading-tight tracking-tight uppercase italic">
            Central<span className="text-blue-500">Estoque</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800/50">
            Avicenna Pirassununga
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-blue-600/20 transition-all duration-700" />
          
          <div className="relative">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-1">
                {isSignUp ? 'Criar Nova Conta' : 'Acesso Restrito'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isSignUp ? 'Preencha os dados abaixo para se cadastrar' : 'Entre com suas credenciais de acesso'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">E-mail Profissional</label>
                <input
                  type="email"
                  required
                  placeholder="ex: nome@avicenna.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:border-blue-600 outline-none transition-all duration-300 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Senha</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:border-blue-600 outline-none transition-all duration-300 font-bold"
                />
              </div>

              {isSignUp && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Confirmar Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:border-blue-600 outline-none transition-all duration-300 font-bold"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 animate-head-shake">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-red-400 text-xs font-bold leading-tight">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle className="text-emerald-500 shrink-0" size={18} />
                  <p className="text-emerald-400 text-xs font-bold leading-tight">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-3 group/btn relative overflow-hidden"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>
                    <span className="relative z-10 uppercase tracking-widest text-sm">
                      {isSignUp ? 'Finalizar Cadastro' : 'Entrar no Sistema'}
                    </span>
                    {isSignUp ? <UserPlus size={18} className="relative z-10" /> : <LogIn size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
                className="w-full text-center text-slate-500 text-xs font-bold hover:text-white transition-colors"
              >
                {isSignUp ? 'Já tem uma conta? Faça Login' : 'Novo funcionário? Crie sua conta aqui'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8 font-medium italic opacity-50 uppercase tracking-widest">
          Avicenna ERP • v2.2.0 • Pirassununga
        </p>
      </div>
    </div>
  );
}
