import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import DetailDrawer from '../components/DetailDrawer';
import GuardModal from '../modals/GuardModal';
import RosterModal from '../modals/RosterModal';
import BulkAttendanceModal from '../modals/BulkAttendanceModal';
import GenerateInvoiceModal from '../modals/GenerateInvoiceModal';
import { useAuth } from '../context/useAuth';
import { formatCurrency } from '../utils/helpers';
import api from '../api/axios';
import {
  INITIAL_GUARDS,
  INITIAL_CLIENTS,
  INITIAL_SITES,
  INITIAL_ROSTERS,
  INITIAL_ATTENDANCE,
  INITIAL_INVOICES,
} from '../api/mockData';
import {
  Shield,
  MapPin,
  ClipboardList,
  ReceiptText,
  Plus,
  ArrowRight,
  Radio,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const [guards, setGuards] = useState(INITIAL_GUARDS);
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [sites, setSites] = useState(INITIAL_SITES);
  const [rosters, setRosters] = useState(INITIAL_ROSTERS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);

  // Active drawer & modals
  const [selectedDrawerItem, setSelectedDrawerItem] = useState(null);
  const [drawerType, setDrawerType] = useState('generic');
  const [isGuardModalOpen, setGuardModalOpen] = useState(false);
  const [isRosterModalOpen, setRosterModalOpen] = useState(false);
  const [isAttendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [isInvoiceModalOpen, setInvoiceModalOpen] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get('/guards/'),
      api.get('/clients/'),
      api.get('/sites/'),
      api.get('/rosters/'),
      api.get('/attendances/'),
      api.get('/invoices/'),
    ]).then(([gRes, cRes, sRes, rRes, aRes, iRes]) => {
      if (gRes.status === 'fulfilled' && gRes.value?.data?.length) setGuards(gRes.value.data);
      if (cRes.status === 'fulfilled' && cRes.value?.data?.length) setClients(cRes.value.data);
      if (sRes.status === 'fulfilled' && sRes.value?.data?.length) setSites(sRes.value.data);
      if (rRes.status === 'fulfilled' && rRes.value?.data?.length) setRosters(rRes.value.data);
      if (aRes.status === 'fulfilled' && aRes.value?.data?.length) setAttendance(aRes.value.data);
      if (iRes.status === 'fulfilled' && iRes.value?.data?.length) setInvoices(iRes.value.data);
    });
  }, []);

  const activeGuardsCount = guards.filter((g) => g.status === 'ACTIVE').length;
  const totalSitesCount = sites.length;
  const todayAttendanceRate =
    attendance.length > 0
      ? Math.round(
          (attendance.filter((a) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length / attendance.length) * 100
        )
      : 98;
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  function handleSaveGuard(newGuard) {
    setGuards([newGuard, ...guards]);
  }
  function handleSaveRosters(newRosters) {
    setRosters([...newRosters, ...rosters]);
  }
  function handleSaveAttendance(newLogs) {
    setAttendance([...newLogs, ...attendance]);
  }
  function handleSaveInvoice(newInv) {
    setInvoices([newInv, ...invoices]);
  }

  return (
    <MainLayout
      onQuickAction={(act) => {
        if (act === 'add_guard') setGuardModalOpen(true);
        if (act === 'add_site') setRosterModalOpen(true);
        if (act === 'add_roster') setRosterModalOpen(true);
        if (act === 'log_attendance') setAttendanceModalOpen(true);
        if (act === 'generate_invoice') setInvoiceModalOpen(true);
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE OPERATIONAL COMMAND HUB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Security Control Room
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Surveillance telemetry, guard force allocations, and billing status for {user?.full_name || 'Administrator'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRosterModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Dispatch Guard</span>
          </button>
          <button
            onClick={() => setAttendanceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all"
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bulk Attendance</span>
          </button>
          <button
            onClick={() => setInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all"
          >
            <ReceiptText className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate Bill</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Guard Force"
          value={activeGuardsCount}
          icon={Shield}
          trend="+12%"
          description={`${guards.length} Total Enrolled`}
          glow="border-cyan-500/30"
          sparkline={[50, 60, 55, 70, 85, 80, 95]}
        />
        <StatCard
          label="Deployment Sites"
          value={totalSitesCount}
          icon={MapPin}
          trend="+2"
          description="Across 3 Client Accounts"
          glow="border-purple-500/30"
          sparkline={[40, 45, 60, 65, 70, 75, 80]}
        />
        <StatCard
          label="Today's Attendance"
          value={`${todayAttendanceRate}%`}
          icon={ClipboardList}
          trend="+3%"
          description="Verified Guard Check-ins"
          glow="border-emerald-500/30"
          sparkline={[85, 90, 88, 92, 95, 94, 98]}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(totalBilled)}
          icon={ReceiptText}
          trend="+18%"
          description="August 2026 Billing"
          glow="border-amber-500/30"
          sparkline={[30, 45, 60, 55, 75, 85, 92]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard glow>
            <GlassCard.Header
              title="Real-Time Guard Deployments"
              subtitle="Active security rosters and shift assignments per facility"
              badge
              action={
                <button
                  onClick={() => setRosterModalOpen(true)}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  <span>New Shift Slot</span>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="space-y-3">
              {rosters.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedDrawerItem(r);
                    setDrawerType('Shift Roster');
                  }}
                  className="p-3.5 rounded-xl cyber-card border border-slate-800/80 hover:border-cyan-500/30 flex items-center justify-between gap-4 cursor-pointer group bg-slate-950/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {r.guard_name || `Guard #${r.guard_id}`}
                        </h4>
                        <span className="font-mono text-[10px] text-slate-400">
                          {r.guard_badge || 'SEC-G'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {r.site_name || `Site #${r.site_id}`} • {r.notes || 'Station Duty'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.shift_type} />
                    <StatusBadge status={r.status} />
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sites.slice(0, 2).map((site) => (
              <div
                key={site.id}
                onClick={() => {
                  setSelectedDrawerItem(site);
                  setDrawerType('Facility Site');
                }}
                className="cyber-card p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer space-y-3 bg-slate-950/40"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
                    {site.site_code}
                  </span>
                  <StatusBadge status={site.is_active ? 'ACTIVE' : 'INACTIVE'} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{site.site_name}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{site.address}, {site.city}</p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Day: {site.shift_requirements?.day_shift_guards || 1} Guards</span>
                  <span>Night: {site.shift_requirements?.night_shift_guards || 1} Guards</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <GlassCard.Header
              title="Revenue Health"
              subtitle="Monthly billing pipeline & GST summary"
              action={
                <button
                  onClick={() => setInvoiceModalOpen(true)}
                  className="text-xs font-bold text-cyan-400 hover:underline"
                >
                  Generate
                </button>
              }
            />

            <div className="space-y-4">
              <div className="p-4 rounded-xl cyber-card border border-cyan-500/20 bg-cyan-950/20">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Active Invoiced</p>
                <h3 className="text-2xl font-black text-white mt-1 tabular-nums">
                  {formatCurrency(totalBilled)}
                </h3>
                <div className="w-full h-1.5 bg-slate-900 rounded-full mt-3 overflow-hidden">
                  <div className="w-4/5 h-full bg-gradient-to-r from-cyan-500 to-emerald-400" />
                </div>
                <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  18% Tax Compliant & Ready for Export
                </p>
              </div>

              <div className="space-y-2">
                {invoices.slice(0, 3).map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setSelectedDrawerItem(inv);
                      setDrawerType('Client Invoice');
                    }}
                    className="p-2.5 rounded-xl cyber-card border border-slate-800/80 flex items-center justify-between text-xs cursor-pointer hover:border-cyan-500/30"
                  >
                    <div>
                      <p className="font-bold text-white truncate max-w-[140px]">{inv.client_name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{inv.billing_month}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-white">{formatCurrency(inv.total_amount)}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <GlassCard.Header
              title="Activity Event Stream"
              subtitle="Latest verified operations log"
              badge
            />

            <div className="space-y-3 text-xs">
              {attendance.slice(0, 4).map((att) => (
                <div key={att.id} className="flex items-start gap-3 pb-3 border-b border-slate-800/60 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 animate-ping" />
                  <div className="flex-1">
                    <p className="text-slate-200">
                      <span className="font-bold text-white">{att.guard_name}</span> logged{' '}
                      <span className="font-semibold text-cyan-400">{att.status}</span> at {att.site_name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {att.overtime_hours > 0 ? `+${att.overtime_hours} hrs Overtime • ` : ''}
                      {att.remarks || 'Standard Duty'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      <DetailDrawer
        isOpen={!!selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        title={selectedDrawerItem?.site_name || selectedDrawerItem?.guard_name || selectedDrawerItem?.client_name || 'Dossier'}
        subtitle={selectedDrawerItem?.badge_number || selectedDrawerItem?.invoice_number || selectedDrawerItem?.site_code}
        data={selectedDrawerItem}
        type={drawerType}
      />

      <GuardModal
        isOpen={isGuardModalOpen}
        onClose={() => setGuardModalOpen(false)}
        onSave={handleSaveGuard}
      />
      <RosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        onSave={handleSaveRosters}
        guards={guards}
        sites={sites}
      />
      <BulkAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        onSave={handleSaveAttendance}
        sites={sites}
        rosters={rosters}
      />
      <GenerateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        onSave={handleSaveInvoice}
        clients={clients}
        sites={sites}
      />
    </MainLayout>
  );
}