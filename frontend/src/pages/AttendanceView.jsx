import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import DetailDrawer from '../components/DetailDrawer';
import BulkAttendanceModal from '../modals/BulkAttendanceModal';
import { formatDate } from '../utils/helpers';
import api from '../api/axios';
import { INITIAL_ATTENDANCE, INITIAL_SITES, INITIAL_ROSTERS } from '../api/mockData';
import { ClipboardList, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AttendanceView() {
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [sites, setSites] = useState(INITIAL_SITES);
  const [rosters, setRosters] = useState(INITIAL_ROSTERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [aRes, sRes, rRes] = await Promise.allSettled([
          api.get('/attendances/'),
          api.get('/sites/'),
          api.get('/rosters/'),
        ]);
        if (!ignore) {
          if (aRes.status === 'fulfilled' && aRes.value?.data?.length) setAttendance(aRes.value.data);
          if (sRes.status === 'fulfilled' && sRes.value?.data?.length) setSites(sRes.value.data);
          if (rRes.status === 'fulfilled' && rRes.value?.data?.length) setRosters(rRes.value.data);
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

  function handleSaveAttendance(newLogs) {
    setAttendance([...newLogs, ...attendance]);
  }

  function handleQuickStatus(logId, newStatus, e) {
    e?.stopPropagation();
    setAttendance(
      attendance.map((a) => (a.id === logId ? { ...a, status: newStatus } : a))
    );
  }

  const filteredAttendance = attendance.filter((record) => {
    const gName = record.guard_name || '';
    const gBadge = record.guard_badge || '';
    const sName = record.site_name || '';
    const remarks = record.remarks || '';

    const matchesSearch =
      gName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gBadge.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remarks.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const overtimeCount = attendance.filter((a) => Number(a.overtime_hours) > 0).length;
  const totalOtHours = attendance.reduce((sum, a) => sum + (Number(a.overtime_hours) || 0), 0);

  const columns = [
    {
      id: 'guard',
      header: 'Guard Personnel',
      accessorKey: 'guard_name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            {row.guard_name?.charAt(0) || 'G'}
          </div>
          <div>
            <p className="font-bold text-white text-xs">{row.guard_name}</p>
            <span className="font-mono text-[10px] text-cyan-400">{row.guard_badge || 'SEC-G'}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'site',
      header: 'Deployment Facility',
      accessorKey: 'site_name',
      render: (row) => <span className="text-xs text-slate-300 font-medium">{row.site_name}</span>,
    },
    {
      id: 'date',
      header: 'Date & Shift',
      render: (row) => (
        <div>
          <p className="font-mono text-xs text-slate-200">{formatDate(row.date)}</p>
          <StatusBadge status={row.shift_type || 'DAY'} />
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Attendance Status',
      accessorKey: 'status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} />
        </div>
      ),
    },
    {
      id: 'overtime',
      header: 'Overtime Pay (Hours)',
      accessorKey: 'overtime_hours',
      render: (row) => {
        const ot = Number(row.overtime_hours) || 0;
        return ot > 0 ? (
          <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
            +{ot} hrs OT
          </span>
        ) : (
          <span className="text-slate-500 text-xs">—</span>
        );
      },
    },
    {
      id: 'remarks',
      header: 'Duty Remarks',
      accessorKey: 'remarks',
      render: (row) => <span className="text-slate-400 text-xs truncate max-w-xs">{row.remarks || 'Standard verified'}</span>,
    },
    {
      id: 'actions',
      header: 'Quick Verification',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {['PRESENT', 'ABSENT'].map((st) => (
            <button
              key={st}
              onClick={(e) => handleQuickStatus(row.id, st, e)}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                row.status === st
                  ? st === 'PRESENT'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-500 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Attendance & Overtime Radar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time verified guard attendance logging, shift completion sync, and overtime tracking.
          </p>
        </div>
        <button
          onClick={() => setBulkModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Bulk Attendance</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Present & On-Duty"
          value={presentCount}
          icon={CheckCircle2}
          trend={`${Math.round((presentCount / Math.max(attendance.length, 1)) * 100)}% Rate`}
          glow="border-emerald-500/30"
          sparkline={[70, 75, 80, 85, 90, 92, presentCount]}
        />
        <StatCard
          label="Absentees Logged"
          value={absentCount}
          icon={XCircle}
          trend="Immediate Replacements"
          glow="border-rose-500/30"
          sparkline={[5, 4, 3, 2, 1, 1, absentCount]}
        />
        <StatCard
          label="Total Overtime Hours"
          value={`${totalOtHours} hrs`}
          icon={Clock}
          trend="Billable OT Pay"
          glow="border-amber-500/30"
          sparkline={[10, 15, 12, 18, 20, 24, totalOtHours]}
        />
        <StatCard
          label="OT Deployments"
          value={overtimeCount}
          icon={ClipboardList}
          trend="Guards with OT"
          glow="border-cyan-500/30"
          sparkline={[2, 3, 4, 3, 5, 6, overtimeCount]}
        />
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search attendance by guard name, badge, site, remarks..."
        filters={[
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'ALL', label: 'All Attendance Statuses' },
              { value: 'PRESENT', label: 'Present (On-Duty)' },
              { value: 'ABSENT', label: 'Absent' },
              { value: 'HALF_DAY', label: 'Half Day' },
              { value: 'LATE', label: 'Late Arrival' },
            ],
          },
        ]}
        onFilterChange={(_, val) => setStatusFilter(val)}
      />

      <Table
        columns={columns}
        data={filteredAttendance}
        onRowClick={(row) => setSelectedLog(row)}
        emptyTitle="No Attendance Records Found"
        emptyMessage="No verified attendance records match your search parameters."
      />

      <DetailDrawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.guard_name || 'Attendance Log'}
        subtitle={`Site: ${selectedLog?.site_name} | Status: ${selectedLog?.status}`}
        data={selectedLog}
        type="ATTENDANCE LOG"
      />

      <BulkAttendanceModal
        isOpen={isBulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSave={handleSaveAttendance}
        sites={sites}
        rosters={rosters}
      />
    </MainLayout>
  );
}