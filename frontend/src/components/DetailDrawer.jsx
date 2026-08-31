import { useEffect } from 'react';
import { X, ShieldCheck, Terminal } from 'lucide-react';

export default function DetailDrawer({ isOpen, onClose, title, subtitle, data, type = 'generic', actions = null }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg cyber-panel-glow h-full border-l border-cyan-500/30 p-6 shadow-2xl flex flex-col drawer-enter z-10 overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] tracking-widest uppercase font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                {type} DOSSIER
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data).map(([key, value]) => {
              if (typeof value === 'object' && value !== null) return null;
              if (key === 'id' || key === 'created_at' || key === 'updated_at') return null;
              return (
                <div key={key} className="cyber-card p-3 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-medium text-slate-200 mt-1 truncate">
                    {String(value ?? '—')}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="cyber-card p-4 rounded-xl border border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-2 mb-2 text-xs font-mono text-cyan-400">
              <Terminal className="w-4 h-4" />
              <span>SYSTEM METRICS & RAW TELEMETRY</span>
            </div>
            <pre className="text-xs font-mono text-slate-400 overflow-x-auto p-2 bg-slate-900/80 rounded border border-slate-800 max-h-48">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>

        {actions && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
