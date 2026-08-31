export default function GlassCard({ className = '', children, glow = false }) {
  return (
    <div className={`${glow ? 'cyber-panel-glow' : 'cyber-panel'} rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

GlassCard.Header = function GlassCardHeader({ title, subtitle, badge = null, action = null, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800/80 ${className}`}>
      <div>
        <div className="flex items-center gap-2">
          {badge && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
          <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};