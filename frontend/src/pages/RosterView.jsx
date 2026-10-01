import { useState, useEffect, useMemo } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import DetailDrawer from '../components/DetailDrawer';
import RosterModal from '../modals/RosterModal';
import { useAuth } from '../context/useAuth';
import { formatDate } from '../utils/helpers';
import api from '../api/axios';
import { INITIAL_ROSTERS, INITIAL_GUARDS, INITIAL_SITES } from '../api/mockData';
import {
  Calendar,
  Plus,
  Sun,
  Moon,
  MapPin,
  Edit3,
  CheckCircle2,
  Shield,
  AlertTriangle,
  Zap,
  Users,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function RosterView() {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const [rosters, setRosters] = useState(INITIAL_ROSTERS);
  const [guards, setGuards] = useState(INITIAL_GUARDS);
  const [sites, setSites] = useState(INITIAL_SITES);
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table');
  const [shortfallExpanded, setShortfallExpanded] = useState(true);

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingRoster, setEditingRoster] = useState(null);
  const [selectedRoster, setSelectedRoster] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [rRes, gRes, sRes] = await Promise.allSettled([
          api.get('/rosters/'),
          api.get('/guards/'),
          api.get('/sites/'),
        ]);
        if (!ignore) {
          if (rRes.status === 'fulfilled' && rRes.value?.data?.length) setRosters(rRes.value.data);
          if (gRes.status === 'fulfilled' && gRes.value?.data?.length) setGuards(gRes.value.data);
          if (sRes.status === 'fulfilled' && sRes.value?.data?.length) setSites(sRes.value.data);
        }
      } catch {
        // fallback
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  function handleSaveRosters(newEntries) {
    if (editingRoster) {
      setRosters(rosters.map((r) => (r.id === newEntries[0].id ? newEntries[0] : r)));
    } else {
      setRosters([...newEntries, ...rosters]);
    }
    setEditingRoster(null);
  }

  const enrichedRosters = useMemo(() => {
    return rosters.map((r) => {
      const guard = guards.find((g) => g.id === r.guard_id);
      const site = sites.find((s) => s.id === r.site_id);
      return {
        ...r,
        guard_name: r.guard_name || guard?.user?.full_name || `Guard #${r.guard_id}`,
        guard_badge: r.guard_badge || guard?.badge_number || 'SEC-G',
        guard_vertical: guard?.vertical || 'SECURITY',
        guard_is_bench_locked: Boolean(guard?.is_bench_locked),
        guard_bench_lock_reason: guard?.bench_lock_reason || null,
        site_name: r.site_name || site?.site_name || `Site #${r.site_id}`,
      };
    });
  }, [rosters, guards, sites]);

  const scopedRosters = role === 'STAFF'
    ? enrichedRosters.filter((r) => r.guard_name?.toLowerCase().includes('ramesh') || r.guard_badge === 'SG-001' || r.guard_id === 1 || r.id === 1)
    : role === 'CLIENT'
    ? enrichedRosters.filter((r) => r.site_id === 1 || r.site_name?.toLowerCase().includes('apex') || r.site_name?.toLowerCase().includes('acme') || r.id <= 3)
    : enrichedRosters;

  const filteredRosters = scopedRosters.filter((roster) => {
    const gName = roster.guard_name || '';
    const gBadge = roster.guard_badge || '';
    const sName = roster.site_name || '';
    const notes = roster.notes || '';

    const matchesSearch =
      gName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gBadge.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesShift = shiftFilter === 'ALL' || roster.shift_type === shiftFilter;
    const matchesSite = siteFilter === 'ALL' || roster.site_id === Number(siteFilter);

    return matchesSearch && matchesShift && matchesSite;
  });

  const scheduledCount = scopedRosters.filter((r) => r.status === 'SCHEDULED').length;
  const dayShiftCount = rosters.filter((r) => r.shift_type === 'DAY').length;
  const nightShiftCount = rosters.filter((r) => r.shift_type === 'NIGHT').length;

  // Shortfall Index calculations per site
  const siteShortfallAnalytics = useMemo(() => {
    return sites.map((site) => {
      const siteRosters = rosters.filter((r) => r.site_id === site.id && r.status !== 'CANCELLED');
      const deployedGuards = siteRosters.map((r) => guards.find((g) => g.id === r.guard_id)).filter(Boolean);

      const secDeployed = deployedGuards.filter((g) => (g.vertical || 'SECURITY') === 'SECURITY').length;
      const hkDeployed = deployedGuards.filter((g) => g.vertical === 'HOUSEKEEPING').length;
      const nurseDeployed = deployedGuards.filter((g) => g.vertical === 'NURSING').length;

      const secReq = site.required_security || 2;
      const hkReq = site.required_housekeeping || 0;
      const nurseReq = site.required_nursing || 0;

      const totalReq = secReq + hkReq + nurseReq;
      const totalDeployed = secDeployed + hkDeployed + nurseDeployed;

      const shortfallVal = Math.max(0, totalReq - totalDeployed);
      const gs = totalReq > 0 ? Number((1.0 - Math.min(totalDeployed, totalReq) / totalReq).toFixed(2)) : 0.0;

      return {
        site,
        totalReq,
        totalDeployed,
        shortfallVal,
        gs,
        breakdown: {
          security: { deployed: secDeployed, required: secReq },
          housekeeping: { deployed: hkDeployed, required: hkReq },
          nursing: { deployed: nurseDeployed, required: nurseReq },
        },
      };
    });
  }, [sites, rosters, guards]);

  // Find next available un-locked guard in BENCH
  const availableBenchGuards = useMemo(() => {
    return guards.filter((g) => (g.status === 'BENCH' || g.status === 'ACTIVE') && !g.is_bench_locked);
  }, [guards]);

  function handleAutoFillShortfall(targetSiteId) {
    const candidate = availableBenchGuards[0];
    setEditingRoster({
      site_id: targetSiteId,
      guard_id: candidate?.id || guards[0]?.id || 1,
      date: new Date().toISOString().split('T')[0],
      shift_type: 'DAY',
      status: 'SCHEDULED',
      notes: '⚡ Auto-Suggested from Available Personnel Pool',
    });
    setModalOpen(true);
  }

  const columns = [
    {
      id: 'guard',
      header: 'Assigned Personnel',
      accessorKey: 'guard_name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-white text-xs">{row.guard_name}</p>
              {row.guard_is_bench_locked && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-400 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> BENCH-LOCKED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <span>{row.guard_badge}</span>
              <span>•</span>
              <span className="text-cyan-400">{row.guard_vertical}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'site',
      header: 'Deployment Facility',
      accessorKey: 'site_name',
      render: (row) => (
        <div>
          <p className="font-bold text-white text-xs">{row.site_name}</p>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span>Site #{row.site_id}</span>
          </span>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Shift Date',
      accessorKey: 'date',
      render: (row) => <span className="font-mono text-xs text-slate-300">{formatDate(row.date)}</span>,
    },
    {
      id: 'shift',
      header: 'Shift Type',
      accessorKey: 'shift_type',
      render: (row) => <StatusBadge status={row.shift_type} />,
    },
    {
      id: 'status',
      header: 'Roster Status',
      accessorKey: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {role === 'ADMIN' && (
            <button
              onClick={() => {
                setEditingRoster(row);
                setModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
              title="Edit Shift"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
            {row.notes || 'Station Duty'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {role === 'STAFF'
              ? 'My Duty Schedule & Post Orders'
              : role === 'CLIENT'
              ? 'Facility Security Roster // Acme Corp'
              : 'Deployment Rosters & Shortfall Engine'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'STAFF'
              ? 'Your personal upcoming shift allocations, facility gate posts, and duty timings.'
              : role === 'CLIENT'
              ? 'Daily scheduled security officers deployed across your contracted corporate facilities.'
              : 'Multi-vertical shift scheduling with real-time Shortfall Index (Gs) and collision prevention.'}
          </p>
        </div>
        {role === 'ADMIN' && (
          <button
            onClick={() => {
              setEditingRoster(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Shift Slots</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label={role === 'STAFF' ? 'My Scheduled Shifts' : 'Scheduled Upcoming'}
          value={scheduledCount}
          icon={Calendar}
          trend={`${scheduledCount} Active Slots`}
          glow="border-cyan-500/30"
          sparkline={[30, 40, 35, 50, 45, 60, scheduledCount]}
        />
        <StatCard
          label="Day Window (08:00-20:00)"
          value={dayShiftCount}
          icon={Sun}
          trend="Day Coverage"
          glow="border-amber-500/30"
          sparkline={[15, 20, 18, 25, 22, 28, dayShiftCount]}
        />
        <StatCard
          label="Night Window (20:00-08:00)"
          value={nightShiftCount}
          icon={Moon}
          trend="Night Patrols"
          glow="border-purple-500/30"
          sparkline={[10, 15, 12, 20, 18, 22, nightShiftCount]}
        />
        <StatCard
          label="Available Bench Pool"
          value={availableBenchGuards.length}
          icon={Users}
          trend="Instant Dispatch"
          glow="border-emerald-500/30"
          sparkline={[2, 3, 3, availableBenchGuards.length]}
        />
      </div>

      {/* Real-time Shortfall Radar (Gs Engine) */}
      {role !== 'STAFF' && (
        <div className="cyber-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Facility Deployment Shortfall Radar</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                    Gs = 1 - N(active)/N(req)
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real-time headcount gap detection across contracted facilities with 1-click replacement dispatch.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShortfallExpanded(!shortfallExpanded)}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {shortfallExpanded ? 'Collapse Radar' : 'Expand Radar'}
            </button>
          </div>

          {shortfallExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {siteShortfallAnalytics.map(({ site, totalReq, totalDeployed, shortfallVal, gs, breakdown }) => {
                const isShortfall = gs > 0;
                return (
                  <div
                    key={site.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isShortfall
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                        : 'bg-slate-900/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs">{site.site_name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">{site.site_code || `SITE-${site.id}`}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                            gs === 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : gs <= 0.3
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          Gs: {gs.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Staffed: {totalDeployed}/{totalReq}</span>
                        <span className={isShortfall ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          {isShortfall ? `Shortfall: -${shortfallVal}` : 'Full Headcount'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isShortfall ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{
                            width: `${totalReq > 0 ? Math.min(100, (totalDeployed / totalReq) * 100) : 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="mt-3 grid grid-cols-3 gap-1 text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                      <div>
                        <p className="text-slate-500">Security</p>
                        <p className="font-bold text-slate-200">{breakdown.security.deployed}/{breakdown.security.required}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Housekeeping</p>
                        <p className="font-bold text-slate-200">{breakdown.housekeeping.deployed}/{breakdown.housekeeping.required}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Nursing</p>
                        <p className="font-bold text-slate-200">{breakdown.nursing.deployed}/{breakdown.nursing.required}</p>
                      </div>
                    </div>

                    {/* Quick Dispatch Action */}
                    {isShortfall && role === 'ADMIN' && (
                      <button
                        onClick={() => handleAutoFillShortfall(site.id)}
                        className="mt-3 w-full py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Dispatch Bench Replacement</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search by guard name, badge #, site location, orders..."
        viewMode={viewMode}
        setViewMode={setViewMode}
        filters={[
          {
            name: 'shift',
            value: shiftFilter,
            options: [
              { value: 'ALL', label: 'All Shift Slots' },
              { value: 'DAY', label: 'Day Shifts (08-20)' },
              { value: 'NIGHT', label: 'Night Shifts (20-08)' },
            ],
          },
          {
            name: 'site',
            value: siteFilter,
            options: [
              { value: 'ALL', label: 'All Locations' },
              ...sites.map((s) => ({ value: String(s.id), label: s.site_name })),
            ],
          },
        ]}
        onFilterChange={(name, val) => {
          if (name === 'shift') setShiftFilter(val);
          if (name === 'site') setSiteFilter(val);
        }}
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRosters.map((roster) => (
            <div
              key={roster.id}
              onClick={() => setSelectedRoster(roster)}
              className="cyber-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-3 bg-slate-950/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-white text-xs group-hover:text-cyan-400 transition-colors">
                        {roster.guard_name}
                      </h3>
                      {roster.guard_is_bench_locked && (
                        <span className="text-[8px] font-bold px-1 rounded bg-red-950 text-red-400 border border-red-500/40">
                          HOLD
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {roster.guard_badge} • {roster.guard_vertical}
                    </p>
                  </div>
                </div>
                <StatusBadge status={roster.status} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-200">{roster.site_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono text-slate-300">{formatDate(roster.date)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Duty Window:</span>
                <StatusBadge status={roster.shift_type} />
              </div>

              {roster.notes && (
                <p className="text-[11px] text-slate-500 italic truncate">
                  "{roster.notes}"
                </p>
              )}

              <div
                className="pt-2 flex justify-end border-t border-slate-800/80"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setEditingRoster(roster);
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modify</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredRosters}
          onRowClick={(row) => setSelectedRoster(row)}
          emptyTitle="No Duty Rosters Found"
          emptyMessage="No shifts matched the current filter combination."
        />
      )}

      <DetailDrawer
        isOpen={!!selectedRoster}
        onClose={() => setSelectedRoster(null)}
        title={selectedRoster?.guard_name || 'Shift Roster Dossier'}
        subtitle={`Site: ${selectedRoster?.site_name} | Shift: ${selectedRoster?.shift_type}`}
        data={selectedRoster}
        type="DUTY ROSTER"
        actions={
          <button
            onClick={() => {
              setEditingRoster(selectedRoster);
              setSelectedRoster(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modify Assignment</span>
          </button>
        }
      />

      <RosterModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRoster(null);
        }}
        onSave={handleSaveRosters}
        guards={guards}
        sites={sites}
        roster={editingRoster}
        existingRosters={rosters}
      />
    </MainLayout>
  );
}