import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Lock, Mail, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@securityerp.com');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e) {
    e?.preventDefault();
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  }

  async function handleQuickFill(demoEmail, demoPass) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    const result = await login(demoEmail, demoPass);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#060913] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md cyber-panel-glow rounded-3xl p-8 border border-cyan-500/30 shadow-2xl relative z-10 modal-enter space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(0,242,254,0.25)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider flex items-center gap-2">
            APEX <span className="text-cyan-400 font-mono text-lg font-bold">OPS // 2026</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Security & Facility Management Operations Portal
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Credentials</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/80" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@securityerp.com"
                className="w-full cyber-input pl-10 h-11"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password Key</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/80" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full cyber-input pl-10 h-11"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Access Command Hub</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono text-center font-bold">
            1-Click Demo Personas
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@securityerp.com', 'Admin@12345')}
              className="p-2 rounded-xl cyber-card border border-slate-800 hover:border-cyan-500/40 text-center transition-all group"
            >
              <p className="font-bold text-white text-[11px] group-hover:text-cyan-400">Admin</p>
              <span className="text-[9px] font-mono text-slate-500">Full Control</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('client.manager@acmecorp.com', 'Client@12345')}
              className="p-2 rounded-xl cyber-card border border-slate-800 hover:border-purple-500/40 text-center transition-all group"
            >
              <p className="font-bold text-white text-[11px] group-hover:text-purple-400">Client</p>
              <span className="text-[9px] font-mono text-slate-500">Acme Corp</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('guard.ramesh@securityerp.com', 'Guard@12345')}
              className="p-2 rounded-xl cyber-card border border-slate-800 hover:border-amber-500/40 text-center transition-all group"
            >
              <p className="font-bold text-white text-[11px] group-hover:text-amber-400">Guard</p>
              <span className="text-[9px] font-mono text-slate-500">Staff Gate</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 font-mono">
          Security ERP System // Production Architecture
        </p>
      </div>
    </div>
  );
}