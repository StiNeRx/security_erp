import { useState, useEffect } from 'react';
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
import { Calendar, Plus, Sun, Moon, MapPin, Edit3, CheckCircle2, Shield } from 'lucide-react';

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

  const enrichedRosters = rosters.map((r) => {
    const guard = guards.find((g) => g.id === r.guard_id);
    const site = sites.find((s) => s.id === r.site_id);
    return {
      ...r,
      guard_name: r.guard_name || guard?.user?.full_name || `Guard #${r.guard_id}`,
      guard_badge: r.guard_badge || guard?.badge_number || 'SEC-G',
      site_name: r.site_name || site?.site_name || `Site #${r.site_id}`,
    };
  });

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
  const completedCount = scopedRosters.filter((r) => r.status === 'COMPLETED').length;
  const dayShiftCount = rosters.filter((r) => r.shift_type === 'DAY').length;
  const nightShiftCount = rosters.filter((r) => r.shift_type === 'NIGHT').length;

  const columns = [
    {
      id: 'guard',
      header: 'Guard Personnel',
      accessorKey: 'guard_name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white text-xs">{row.guard_name}</p>
            <span className="text-[10px] text-slate-400 font-mono">{row.guard_badge}</span>
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
            <span>Site Code #{row.site_id}</span>
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
          <span className="text-[10px] font-mono text-slate-500">
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
              : 'Duty Rosters & Shift Matrix'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'STAFF'
              ? 'Your personal upcoming shift allocations, facility gate posts, and duty timings.'
              : role === 'CLIENT'
              ? 'Daily scheduled security officers deployed across your contracted corporate facilities.'
              : 'Allocate security personnel across Day & Night shifts with single or weekly batch dispatch.'}
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
          trend={`${scheduledCount} Shifts`}
          glow={role === 'STAFF' ? 'border-emerald-500/30' : role === 'CLIENT' ? 'border-purple-500/30' : 'border-cyan-500/30'}
          sparkline={[30, 40, 35, 50, 45, 60, scheduledCount]}
        />
        <StatCard
          label="Completed Shifts"
          value={completedCount}
          icon={CheckCircle2}
          trend="100% Attendance"
          glow="border-emerald-500/30"
          sparkline={[50, 60, 70, 75, 80, 85, completedCount]}
        />
        <StatCard
          label="Day Shifts (08:00)"
          value={dayShiftCount}
          icon={Sun}
          trend="Daytime Gate Force"
          glow="border-amber-500/30"
          sparkline={[10, 15, 20, 25, 20, 30, dayShiftCount]}
        />
        <StatCard
          label="Night Shifts (20:00)"
          value={nightShiftCount}
          icon={Moon}
          trend="Perimeter Patrol"
          glow="border-indigo-500/30"
          sparkline={[8, 12, 14, 18, 22, 25, nightShiftCount]}
        />
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search shift rosters by guard, site, gate notes..."
        viewMode={viewMode}
        setViewMode={setViewMode}
        filters={[
          {
            name: 'shift',
            value: shiftFilter,
            options: [
              { value: 'ALL', label: 'All Shift Types' },
              { value: 'DAY', label: 'Day Shift Only (☀️)' },
              { value: 'NIGHT', label: 'Night Shift Only (🌙)' },
            ],
          },
          {
            name: 'site',
            value: siteFilter,
            options: [
              { value: 'ALL', label: 'All Facilities' },
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
              className="cyber-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group space-y-3 bg-slate-950/40"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                    {roster.guard_name}
                  </h3>
                  <span className="font-mono text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
                    {roster.guard_badge}
                  </span>
                </div>
                <StatusBadge status={roster.status} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-200">{roster.site_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono text-slate-300">{formatDate(roster.date)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Slot:</span>
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
      />
    </MainLayout>
  );
}