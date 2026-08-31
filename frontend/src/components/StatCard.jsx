import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend = null,
  glow = 'border-cyan-500/20',
  description = null,
  sparkline = [40, 55, 35, 60, 75, 65, 85],
}) {
  const isPositive = trend && trend.startsWith('+');
  const isNegative = trend && trend.startsWith('-');

  return (
    <div className={`cyber-card p-5 rounded-2xl border ${glow} relative overflow-hidden group`}>
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40 group-hover:scale-105 transition-all">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </span>
        </div>

        {trend && (
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold border ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
            isNegative ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
            'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {isPositive && <ArrowUpRight className="w-3 h-3" />}
            {isNegative && <ArrowDownRight className="w-3 h-3" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
            {value}
          </h3>
          {description && (
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          )}
        </div>

        {sparkline && (
          <div className="flex items-end gap-1 h-8 opacity-40 group-hover:opacity-80 transition-opacity">
            {sparkline.map((val, idx) => (
              <div 
                key={idx} 
                className="w-1 bg-cyan-400 rounded-t"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}