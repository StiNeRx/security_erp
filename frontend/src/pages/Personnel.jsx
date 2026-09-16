import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import DetailDrawer from '../components/DetailDrawer';
import GuardModal from '../modals/GuardModal';
import { formatCurrency, formatDate } from '../utils/helpers';
import api from '../api/axios';
import { INITIAL_GUARDS } from '../api/mockData';
import { Shield, Plus, Calendar, DollarSign, Edit3, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Personnel() {
  const { user } = useAuth();
  const role = (user?.role || 'ADMIN').toUpperCase();
  const [guards, setGuards] = useState(INITIAL_GUARDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingGuard, setEditingGuard] = useState(null);
  const [selectedGuard, setSelectedGuard] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadGuards() {
      try {
        const res = await api.get('/guards/');
        if (!ignore && res.data && res.data.length > 0) {
          setGuards(res.data);
        }
      } catch {
        // fallback
      }
    }
    loadGuards();
    return () => {
      ignore = true;
    };
  }, []);

  function handleSaveGuard(saved) {
    if (editingGuard) {
      setGuards(guards.map((g) => (g.id === saved.id ? saved : g)));
    } else {
      setGuards([saved, ...guards]);
    }
    setEditingGuard(null);
  }

  function handleToggleStatus(guardId, newStatus, e) {
    e?.stopPropagation();
    setGuards(
      guards.map((g) => (g.id === guardId ? { ...g, status: newStatus } : g))
    );
  }

  const filteredGuards = guards.filter((guard) => {
    const fullName = guard.user?.full_name || '';
    const badge = guard.badge_number || '';
    const notes = guard.notes || '';
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || guard.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = guards.filter((g) => g.status === 'ACTIVE').length;
  const onLeaveCount = guards.filter((g) => g.status === 'ON_LEAVE').length;
  const avgRate = Math.round(
    guards.reduce((sum, g) => sum + (Number(g.daily_rate) || 0), 0) / Math.max(guards.length, 1)
  );

  const columns = [
    {
      id: 'guard',
      header: 'Personnel Info',
      accessorKey: 'full_name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
            {row.user?.full_name?.charAt(0) || 'G'}
          </div>
          <div>
            <p className="font-bold text-white text-xs">{row.user?.full_name}</p>
            <p className="text-[10px] text-slate-400">{row.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'badge',
      header: 'Badge ID',
      accessorKey: 'badge_number',
      render: (row) => (
        <span className="font-mono text-xs text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
          {row.badge_number}
        </span>
      ),
    },
    ...(role === 'ADMIN'
      ? [
          {
            id: 'rate',
            header: 'Daily Wage Rate',
            accessorKey: 'daily_rate',
            render: (row) => <span className="font-mono font-bold text-white">{formatCurrency(row.daily_rate)}</span>,
          },
        ]
      : []),
    {
      id: 'status',
      header: 'Operational Status',
      accessorKey: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'joined',
      header: 'Commissioned',
      accessorKey: 'joining_date',
      render: (row) => <span className="text-slate-400 text-xs">{formatDate(row.joining_date)}</span>,
    },
    ...(role === 'ADMIN'
      ? [
          {
            id: 'actions',
            header: 'Quick Action',
            render: (row) => (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setEditingGuard(row);
                    setModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                  title="Edit Guard"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {role === 'CLIENT' ? 'Assigned Facility Guard Force' : 'Security Force & Personnel'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'CLIENT'
              ? 'Certified security officers, verified badges, and active duty status deployed across your facilities.'
              : 'Manage guard rosters, certifications, wage rates, and operational readiness.'}
          </p>
        </div>
        {role === 'ADMIN' && (
          <button
            onClick={() => {
              setEditingGuard(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Commission Guard</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active On-Duty Force"
          value={activeCount}
          icon={Shield}
          trend={`${Math.round((activeCount / Math.max(guards.length, 1)) * 100)}% Available`}
          glow="border-cyan-500/30"
          sparkline={[60, 65, 70, 75, 80, 85, 90]}
        />
        <StatCard
          label="Guards On Leave"
          value={onLeaveCount}
          icon={Calendar}
          trend={`${onLeaveCount} Rostered Off`}
          glow="border-amber-500/30"
          sparkline={[20, 15, 30, 25, 10, 15, 12]}
        />
        {role === 'ADMIN' ? (
          <StatCard
            label="Average Daily Wage Rate"
            value={formatCurrency(avgRate)}
            icon={DollarSign}
            description="Standard 8-12hr Shift Base"
            glow="border-emerald-500/30"
            sparkline={[500, 550, 600, 620, 650, 680, 700]}
          />
        ) : (
          <StatCard
            label="Security Verification Rate"
            value="100%"
            icon={Award}
            description="Background & Biometric Verified"
            glow="border-emerald-500/30"
            sparkline={[100, 100, 100, 100, 100, 100, 100]}
          />
        )}
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search personnel by name, badge ID, skills..."
        viewMode={viewMode}
        setViewMode={setViewMode}
        filters={[
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active Only' },
              { value: 'ON_LEAVE', label: 'On Leave' },
              { value: 'TERMINATED', label: 'Terminated' },
            ],
          },
        ]}
        onFilterChange={(_, val) => setStatusFilter(val)}
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuards.map((guard) => (
            <div
              key={guard.id}
              onClick={() => setSelectedGuard(guard)}
              className="cyber-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4 bg-slate-950/40 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm group-hover:scale-105 transition-transform">
                    {guard.user?.full_name?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                      {guard.user?.full_name}
                    </h3>
                    <span className="font-mono text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
                      {guard.badge_number}
                    </span>
                  </div>
                </div>
                <StatusBadge status={guard.status} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                {role === 'ADMIN' && (
                  <div className="flex items-center justify-between">
                    <span>Daily Rate:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(guard.daily_rate)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Phone:</span>
                  <span className="text-slate-300 font-mono">{guard.user?.phone_number || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Commissioned:</span>
                  <span className="text-slate-300">{formatDate(guard.joining_date)}</span>
                </div>
              </div>

              {guard.notes && (
                <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  "{guard.notes}"
                </p>
              )}

              {role === 'ADMIN' && (
                <div
                  className="pt-3 border-t border-slate-800/80 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    {guard.status === 'ACTIVE' ? (
                      <button
                        onClick={(e) => handleToggleStatus(guard.id, 'ON_LEAVE', e)}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-950/40 border border-amber-500/30"
                      >
                        Set On-Leave
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleToggleStatus(guard.id, 'ACTIVE', e)}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/30"
                      >
                        Activate Duty
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEditingGuard(guard);
                      setModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredGuards}
          onRowClick={(row) => setSelectedGuard(row)}
          emptyTitle="No Security Personnel Found"
          emptyMessage="No guards matched your search criteria or filter status."
        />
      )}

      <DetailDrawer
        isOpen={!!selectedGuard}
        onClose={() => setSelectedGuard(null)}
        title={selectedGuard?.user?.full_name || 'Guard Dossier'}
        subtitle={`Badge: ${selectedGuard?.badge_number} ${
          role === 'ADMIN' ? `| Daily Rate: ${formatCurrency(selectedGuard?.daily_rate)}` : '| Verified Officer'
        }`}
        data={{
          ...selectedGuard,
          full_name: selectedGuard?.user?.full_name,
          email: selectedGuard?.user?.email,
          phone: selectedGuard?.user?.phone_number,
          daily_rate: role === 'ADMIN' ? formatCurrency(selectedGuard?.daily_rate) : undefined,
        }}
        type="SECURITY PERSONNEL"
        actions={
          role === 'ADMIN' ? (
            <button
              onClick={() => {
                setEditingGuard(selectedGuard);
                setSelectedGuard(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Dossier</span>
            </button>
          ) : null
        }
      />

      <GuardModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGuard(null);
        }}
        onSave={handleSaveGuard}
        guard={editingGuard}
      />
    </MainLayout>
  );
}