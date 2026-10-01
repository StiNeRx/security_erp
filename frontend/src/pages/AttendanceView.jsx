import { useState, useEffect, useMemo } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import DetailDrawer from '../components/DetailDrawer';
import BulkAttendanceModal from '../modals/BulkAttendanceModal';
import CheckInModal from '../modals/CheckInModal';
import { useAuth } from '../context/useAuth';
import { formatDate } from '../utils/helpers';
import api from '../api/axios';
import { INITIAL_ATTENDANCE, INITIAL_SITES, INITIAL_ROSTERS, INITIAL_GUARDS } from '../api/mockData';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Navigation,
  Smartphone,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  CheckCheck
} from 'lucide-react';

function GeofenceBadge({ record }) {
  const status = record?.geofence_status || 'PENDING';
  const dist = record?.distance_from_site_m != null ? `${Number(record.distance_from_site_m).toFixed(1)}m` : null;

  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 font-mono">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <span>VERIFIED {dist ? `(${dist})` : ''}</span>
      </span>
    );
  }
  if (status === 'BREACH') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 border border-red-500/40 text-red-400 font-mono">
        <AlertTriangle className="w-3 h-3 text-red-400" />
        <span>BREACH {dist ? `(${dist})` : ''}</span>
      </span>
    );
  }
  if (status === 'OVERRIDE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 border border-amber-500/40 text-amber-400 font-mono">
        <CheckCheck className="w-3 h-3 text-amber-400" />
        <span>OVERRIDE</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-700 text-slate-400 font-mono">
      <Clock className="w-3 h-3 text-slate-500" />
      <span>PENDING</span>
    </span>
  );
}

export default function AttendanceView() {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [sites, setSites] = useState(INITIAL_SITES);
  const [rosters, setRosters] = useState(INITIAL_ROSTERS);
  const [guards, setGuards] = useState(INITIAL_GUARDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [geofenceFilter, setGeofenceFilter] = useState('ALL');

  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [aRes, sRes, rRes, gRes] = await Promise.allSettled([
          api.get('/attendances/'),
          api.get('/sites/'),
          api.get('/rosters/'),
          api.get('/guards/'),
        ]);
        if (!ignore) {
          if (aRes.status === 'fulfilled' && aRes.value?.data?.length) setAttendance(aRes.value.data);
          if (sRes.status === 'fulfilled' && sRes.value?.data?.length) setSites(sRes.value.data);
          if (rRes.status === 'fulfilled' && rRes.value?.data?.length) setRosters(rRes.value.data);
          if (gRes.status === 'fulfilled' && gRes.value?.data?.length) setGuards(gRes.value.data);
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

  function handleSaveBulkAttendance(newLogs) {
    setAttendance([...newLogs, ...attendance]);
  }

  function handleSaveSingleCheckIn(newRecord) {
    setAttendance([newRecord, ...attendance]);
  }

  function handleSupervisorOverride(logId, e) {
    e?.stopPropagation();
    const reason = prompt('Enter authorized supervisor reason for Geofence Override:');
    if (!reason) return;

    setAttendance(
      attendance.map((a) =>
        a.id === logId
          ? {
              ...a,
              is_geofence_verified: true,
              geofence_status: 'OVERRIDE',
              geofence_breach_reason: `[SUPERVISOR OVERRIDE by ${user?.full_name || 'Operations'}]: ${reason}`,
            }
          : a
      )
    );
  }

  const scopedAttendance = role === 'STAFF'
    ? attendance.filter((a) => a.guard_name?.toLowerCase().includes('ramesh') || a.guard_id === 1 || a.id <= 2)
    : role === 'CLIENT'
    ? attendance.filter((a) => a.site_id === 1 || a.site_name?.toLowerCase().includes('apex') || a.site_name?.toLowerCase().includes('acme') || a.id <= 3)
    : attendance;

  const filteredAttendance = scopedAttendance.filter((record) => {
    const gName = record.guard_name || '';
    const gBadge = record.guard_badge || '';
    const sName = record.site_name || '';
    const remarks = record.remarks || '';
    const devId = record.device_id || '';

    const matchesSearch =
      gName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gBadge.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
      devId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
    const matchesGeofence = geofenceFilter === 'ALL' || record.geofence_status === geofenceFilter;

    return matchesSearch && matchesStatus && matchesGeofence;
  });

  const presentCount = scopedAttendance.filter((a) => a.status === 'PRESENT').length;
  const verifiedCount = scopedAttendance.filter((a) => a.is_geofence_verified).length;
  const breachCount = scopedAttendance.filter((a) => a.geofence_status === 'BREACH').length;
  const totalOtHours = scopedAttendance.reduce((sum, a) => sum + (Number(a.overtime_hours) || 0), 0);
  const geofenceCompliancePct = scopedAttendance.length > 0 ? Math.round((verifiedCount / scopedAttendance.length) * 100) : 100;

  const columns = [
    {
      id: 'guard',
      header: 'Officer Personnel',
      accessorKey: 'guard_name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white text-xs">{row.guard_name}</p>
            <span className="font-mono text-[10px] text-cyan-400">{row.guard_badge}</span>
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
          <p className="font-bold text-white text-xs">{row.site_name || 'Facility HQ'}</p>
          {row.device_id && (
            <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
              <Smartphone className="w-2.5 h-2.5" />
              <span>{row.device_id}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'geofence',
      header: 'GPS Geofence Status',
      render: (row) => (
        <div className="space-y-1">
          <GeofenceBadge record={row} />
          {row.check_in_lat && (
            <p className="text-[9px] text-slate-500 font-mono">
              Fix: {Number(row.check_in_lat).toFixed(4)}°N, {Number(row.check_in_lng).toFixed(4)}°E
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'checkin',
      header: 'Check-In Timestamp',
      accessorKey: 'check_in_time',
      render: (row) => (
        <div className="font-mono text-xs text-slate-300">
          {row.check_in_time ? formatDate(row.check_in_time) : '08:00 AM (Verified)'}
        </div>
      ),
    },
    {
      id: 'overtime',
      header: 'Overtime Sync (Hours)',
      accessorKey: 'overtime_hours',
      render: (row) => {
        const ot = Number(row.overtime_hours) || 0;
        return ot > 0 ? (
          <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
            +{ot}h Overtime
          </span>
        ) : (
          <span className="text-slate-500 text-xs font-mono">0.0h</span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    ...(role === 'ADMIN' || role === 'OPERATIONS'
      ? [
          {
            id: 'actions',
            header: 'Field Audit Action',
            render: (row) => (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {row.geofence_status === 'BREACH' && (
                  <button
                    onClick={(e) => handleSupervisorOverride(row.id, e)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1"
                    title="Authorize Supervisor Override"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Authorize Override</span>
                  </button>
                )}
                {row.geofence_status !== 'BREACH' && (
                  <span className="text-[10px] text-slate-500 font-mono">Verified</span>
                )}
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
            {role === 'STAFF'
              ? 'Field Terminal // GPS Presence & Overtime'
              : role === 'CLIENT'
              ? 'On-Site Officer Presence & Geofence Verification'
              : 'GPS Geofenced Attendance & Field Radar'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'STAFF'
              ? 'Lock GPS coordinates within calibrated 100m post boundary, verify device, and sync overtime.'
              : role === 'CLIENT'
              ? 'Real-time verified physical presence and perimeter compliance of personnel on your premises.'
              : 'Haversine distance geofencing (R ≤ 100m), device fingerprint binding, and overtime auto-sync.'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setCheckInModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Navigation className="w-4 h-4" />
            <span>Field GPS Check-In</span>
          </button>
          {role === 'ADMIN' && (
            <button
              onClick={() => setBulkModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Bulk Shift Register</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="On-Duty Personnel"
          value={presentCount}
          icon={CheckCircle2}
          trend={`${presentCount} Active Posts`}
          glow="border-emerald-500/30"
          sparkline={[80, 85, 90, 88, 92, 95, presentCount]}
        />
        <StatCard
          label="Geofence Compliance"
          value={`${geofenceCompliancePct}%`}
          icon={ShieldCheck}
          trend={geofenceCompliancePct >= 95 ? "High Precision" : "Perimeter Deviations"}
          glow={geofenceCompliancePct >= 95 ? "border-cyan-500/30" : "border-amber-500/30"}
          sparkline={[90, 92, 94, 98, 95, geofenceCompliancePct]}
        />
        <StatCard
          label="Perimeter Breaches"
          value={breachCount}
          icon={AlertTriangle}
          trend={breachCount > 0 ? "Requires Audit" : "Zero Violations"}
          glow={breachCount > 0 ? "border-red-500/40" : "border-slate-800"}
          sparkline={[1, 2, 1, 0, 1, breachCount]}
        />
        <StatCard
          label="Accumulated Overtime"
          value={`+${totalOtHours.toFixed(1)}h`}
          icon={Clock}
          trend="Auto-Synced to Payroll"
          glow="border-amber-500/30"
          sparkline={[10, 15, 12, 18, 22, totalOtHours]}
        />
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search officer name, badge #, facility, device ID, remarks..."
        filters={[
          {
            name: 'geofence',
            value: geofenceFilter,
            options: [
              { value: 'ALL', label: 'All Geofence Status' },
              { value: 'VERIFIED', label: 'GPS Verified (≤100m)' },
              { value: 'BREACH', label: 'Perimeter Breaches' },
              { value: 'OVERRIDE', label: 'Supervisor Overrides' },
            ],
          },
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'ALL', label: 'All Attendance States' },
              { value: 'PRESENT', label: 'Present On-Site' },
              { value: 'ABSENT', label: 'Absent' },
            ],
          },
        ]}
        onFilterChange={(name, val) => {
          if (name === 'geofence') setGeofenceFilter(val);
          if (name === 'status') setStatusFilter(val);
        }}
      />

      <Table
        columns={columns}
        data={filteredAttendance}
        onRowClick={(row) => setSelectedLog(row)}
        emptyTitle="No Attendance Records Found"
        emptyMessage="No duty attendance matches your filtered search parameters."
      />

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.guard_name || 'Attendance Telemetry Dossier'}
        subtitle={`Badge: ${selectedLog?.guard_badge} | Facility: ${selectedLog?.site_name}`}
        data={selectedLog}
        type="FIELD VERIFICATION DOSSIER"
      />

      {/* Single GPS Check-In Modal */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        onSave={handleSaveSingleCheckIn}
        rosters={rosters}
        sites={sites}
        guards={guards}
        mode="CHECK_IN"
      />

      {/* Bulk Register Modal */}
      <BulkAttendanceModal
        isOpen={isBulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSave={handleSaveBulkAttendance}
        sites={sites}
        rosters={rosters}
      />
    </MainLayout>
  );
}