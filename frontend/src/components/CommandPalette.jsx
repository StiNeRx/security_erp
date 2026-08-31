import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Shield, 
  Users, 
  MapPin, 
  Calendar, 
  ClipboardList, 
  ReceiptText, 
  Plus, 
  Sparkles
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onAction = null }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else if (onAction) onAction('toggle_palette');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onAction]);

  if (!isOpen) return null;

  const quickNav = [
    { label: 'Operational Command Dashboard', path: '/dashboard', icon: Sparkles, category: 'Navigation' },
    { label: 'Security Personnel & Guard Dossiers', path: '/personnel', icon: Shield, category: 'Navigation' },
    { label: 'Client Accounts & Contracts', path: '/clients', icon: Users, category: 'Navigation' },
    { label: 'Deployment Sites & Facilities', path: '/sites', icon: MapPin, category: 'Navigation' },
    { label: 'Duty Rosters & Shift Matrix', path: '/rosters', icon: Calendar, category: 'Navigation' },
    { label: 'Attendance & Overtime Radar', path: '/attendance', icon: ClipboardList, category: 'Navigation' },
    { label: 'Automated Billing & Invoices Studio', path: '/billing', icon: ReceiptText, category: 'Navigation' },
  ];

  const quickActions = [
    { label: 'Add New Guard Profile', action: 'add_guard', icon: Plus, category: 'Quick Action' },
    { label: 'Register New Client Company', action: 'add_client', icon: Plus, category: 'Quick Action' },
    { label: 'Create Deployment Site', action: 'add_site', icon: Plus, category: 'Quick Action' },
    { label: 'Schedule Shift / Batch Roster', action: 'add_roster', icon: Plus, category: 'Quick Action' },
    { label: 'Log Bulk Daily Attendance', action: 'log_attendance', icon: Plus, category: 'Quick Action' },
    { label: 'Generate Monthly Client Invoice', action: 'generate_invoice', icon: Plus, category: 'Quick Action' },
  ];

  const allItems = [...quickNav, ...quickActions];
  const filtered = allItems.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(item) {
    if (item.path) {
      navigate(item.path);
    } else if (item.action && onAction) {
      onAction(item.action);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl cyber-panel-glow rounded-2xl border border-cyan-500/40 p-4 shadow-2xl modal-enter z-10">
        <div className="relative flex items-center border-b border-slate-800 pb-3 mb-3">
          <Search className="w-5 h-5 text-cyan-400 mr-3 ml-1" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, or action (e.g. 'Add Guard', 'Billing')..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
          />
          <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
            ESC
          </span>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No matching operations found.</p>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-cyan-500/10 hover:border hover:border-cyan-500/20 text-slate-200 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900/80 text-slate-400">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
