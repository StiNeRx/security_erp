import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import CommandPalette from '../components/CommandPalette';
import {
  LayoutDashboard,
  Users,
  MapPin,
  ClipboardList,
  ReceiptText,
  Shield,
  Calendar,
  Search,
  LogOut,
  Zap,
  ChevronDown,
  Menu,
  X,
  Radio
} from 'lucide-react';

export default function MainLayout({ children, onQuickAction = null }) {
  const { user, logout, switchPersona, apiConnected } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const role = user?.role || 'ADMIN';

  // Full admin suite (OWNER, SUPER_ADMIN, ADMIN)
  const fullNavItems = [
    { icon: LayoutDashboard, label: 'Command Center', path: '/dashboard' },
    { icon: Shield, label: 'Staff Personnel', path: '/personnel' },
    { icon: Users, label: 'Client Accounts', path: '/clients' },
    { icon: MapPin, label: 'Deployment Sites', path: '/sites' },
    { icon: Calendar, label: 'Duty Rosters', path: '/rosters' },
    { icon: ClipboardList, label: 'Attendance & OT', path: '/attendance' },
    { icon: ReceiptText, label: 'Billing / Invoices', path: '/billing' },
  ];

  let navItems = fullNavItems;

  if (role === 'OWNER') {
    navItems = [
      { icon: LayoutDashboard, label: 'Executive Dashboard', path: '/owner-executive' },
      { icon: LayoutDashboard, label: 'Command Center', path: '/dashboard' },
      { icon: Shield, label: 'Staff Personnel', path: '/personnel' },
      { icon: Users, label: 'Client Accounts', path: '/clients' },
      { icon: MapPin, label: 'Deployment Sites', path: '/sites' },
      { icon: Calendar, label: 'Duty Rosters', path: '/rosters' },
      { icon: ClipboardList, label: 'Attendance & OT', path: '/attendance' },
      { icon: ReceiptText, label: 'Billing / Invoices', path: '/billing' },
    ];
  } else if (role === 'HR') {
    navItems = [
      { icon: LayoutDashboard, label: 'HR Dashboard', path: '/dashboard' },
      { icon: Shield, label: 'Staff Personnel', path: '/personnel' },
      { icon: ClipboardList, label: 'Attendance Records', path: '/attendance' },
    ];
  } else if (role === 'OPERATIONS' || role === 'SUPERVISOR') {
    navItems = [
      { icon: LayoutDashboard, label: 'Ops Dashboard', path: '/dashboard' },
      { icon: MapPin, label: 'Deployment Sites', path: '/sites' },
      { icon: Calendar, label: 'Duty Rosters', path: '/rosters' },
      { icon: ClipboardList, label: 'Attendance & OT', path: '/attendance' },
    ];
  } else if (role === 'ACCOUNTS') {
    navItems = [
      { icon: LayoutDashboard, label: 'Accounts Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Client Accounts', path: '/clients' },
      { icon: ReceiptText, label: 'Billing / Invoices', path: '/billing' },
    ];
  } else if (role === 'CLIENT') {
    navItems = [
      { icon: LayoutDashboard, label: 'Facility Overview', path: '/dashboard' },
      { icon: MapPin, label: 'My Facilities', path: '/sites' },
      { icon: Calendar, label: 'Shift Rosters', path: '/rosters' },
      { icon: ClipboardList, label: 'Guard Attendance', path: '/attendance' },
      { icon: ReceiptText, label: 'Invoices & Statements', path: '/billing' },
    ];
  } else if (role === 'STAFF') {
    navItems = [
      { icon: LayoutDashboard, label: 'Guard Terminal', path: '/dashboard' },
      { icon: Calendar, label: 'My Duty Schedule', path: '/rosters' },
      { icon: ClipboardList, label: 'My Attendance & OT', path: '/attendance' },
    ];
  }


  return (
    <div className="min-h-screen bg-[#060913] text-slate-200 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAction={(action) => {
          if (action === 'toggle_palette') setPaletteOpen((prev) => !prev);
          else if (onQuickAction) onQuickAction(action);
        }}
      />

      <header className="h-16 cyber-panel border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-wider flex items-center gap-1.5">
                FORTELLUS <span className="text-cyan-400 font-mono text-sm font-semibold">ERP // 2026</span>
              </span>
              <p className="text-[10px] text-slate-500 font-mono hidden sm:block">SECURITY & FACILITY MANAGEMENT</p>
            </div>

          </div>
        </div>

        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl cyber-panel border border-slate-800 hover:border-cyan-500/40 text-slate-400 text-xs transition-all group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400/80 group-hover:text-cyan-400" />
              <span>Search telemetry, guards, sites, invoices...</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                Ctrl K
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-mono text-xs text-cyan-400 font-semibold tracking-wider">
              {currentTime || '06:30:00'} UTC+5:30
            </span>
          </div>

          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              apiConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            }`}
            title={apiConnected ? 'Connected to live FastAPI backend' : 'Running in resilient offline demo mode'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${apiConnected ? 'bg-emerald-400' : 'bg-cyan-400'} animate-pulse`} />
            <span>{apiConnected ? 'LIVE API' : 'DEMO MODE'}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl cyber-panel border border-slate-800 hover:border-cyan-500/40 text-left transition-all"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                role === 'OWNER'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : role === 'CLIENT'
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                  : role === 'STAFF'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : role === 'HR'
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                  : role === 'ACCOUNTS'
                  ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300'
                  : 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
              }`}>
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-white leading-none">{user?.full_name?.split(' ')[0] || 'Admin'}</p>
                <span className={`text-[9px] font-mono uppercase tracking-wider font-semibold ${
                  role === 'OWNER' ? 'text-amber-400'
                  : role === 'CLIENT' ? 'text-purple-400'
                  : role === 'STAFF' ? 'text-emerald-400'
                  : role === 'HR' ? 'text-rose-400'
                  : role === 'ACCOUNTS' ? 'text-violet-400'
                  : 'text-cyan-400'
                }`}>
                  {role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {personaMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 cyber-panel-glow rounded-2xl border border-cyan-500/30 p-2 shadow-2xl z-40">
                <p className="text-[10px] text-slate-400 uppercase font-mono px-3 py-1">Quick Role Switcher</p>

                {[
                  { role: 'OWNER', label: 'Owner / CEO', color: 'text-amber-400' },
                  { role: 'SUPER_ADMIN', label: 'Super Admin', color: 'text-cyan-400' },
                  { role: 'HR', label: 'HR Manager', color: 'text-rose-400' },
                  { role: 'OPERATIONS', label: 'Operations Mgr', color: 'text-sky-400' },
                  { role: 'ACCOUNTS', label: 'Accounts Mgr', color: 'text-violet-400' },
                  { role: 'CLIENT', label: 'Client Portal', color: 'text-purple-400' },
                  { role: 'STAFF', label: 'Field Guard', color: 'text-emerald-400' },
                ].map(({ role: r, label, color }) => (
                  <button
                    key={r}
                    onClick={() => { switchPersona(r); setPersonaMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-center justify-between ${
                      user?.role === r ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded ${color}`}>{r}</span>
                  </button>
                ))}

                <div className="h-px bg-slate-800 my-1.5" />

                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>


      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 cyber-panel border-r border-slate-800/80 hidden md:flex flex-col p-4 space-y-1.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold px-3 mb-2">
            Operations Matrix
          </p>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,254,0.1)]'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'} transition-colors`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              </button>
            );
          })}

          <div className="mt-auto pt-4 border-t border-slate-800/80 space-y-3">
            <div className="p-3.5 rounded-xl cyber-card border border-slate-800 bg-slate-950/40">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ops Telemetry</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400">99.9%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 cyber-panel-glow border-b border-cyan-500/30 p-4 z-40 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                  location.pathname === item.path ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#060913]/60">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
