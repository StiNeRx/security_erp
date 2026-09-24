import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import DetailDrawer from '../components/DetailDrawer';
import GuardModal from '../modals/GuardModal';
import CandidateModal from '../modals/CandidateModal';
import CandidateOnboardModal from '../modals/CandidateOnboardModal';
import { formatCurrency, formatDate } from '../utils/helpers';
import api from '../api/axios';
import { INITIAL_GUARDS, INITIAL_CANDIDATES } from '../api/mockData';
import {
  Shield,
  Plus,
  Calendar,
  DollarSign,
  Edit3,
  Award,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Clock,
  Sparkles,
  Layers,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Personnel() {
  const { user } = useAuth();
  const role = (user?.role || 'ADMIN').toUpperCase();
  const isClient = role === 'CLIENT';

  const [activeSubTab, setActiveSubTab] = useState('directory'); // 'directory' | 'recruitment' | 'compliance'

  // Staff Directory state
  const [guards, setGuards] = useState(INITIAL_GUARDS);
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verticalFilter, setVerticalFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');

  // Modals state
  const [isStaffModalOpen, setStaffModalOpen] = useState(false);
  const [isCandidateModalOpen, setCandidateModalOpen] = useState(false);
  const [onboardingCandidate, setOnboardingCandidate] = useState(null);
  const [editingGuard, setEditingGuard] = useState(null);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [evaluatingLocks, setEvaluatingLocks] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [guardsRes, candRes] = await Promise.allSettled([
          api.get('/guards/'),
          api.get('/recruitment/')
        ]);
        if (!ignore && guardsRes.status === 'fulfilled' && guardsRes.value.data?.length > 0) {
          setGuards(guardsRes.value.data);
        }
        if (!ignore && candRes.status === 'fulfilled' && candRes.value.data?.length > 0) {
          setCandidates(candRes.value.data);
        }
      } catch {
        // use fallback mock data
      }
    }
    loadData();
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

  function handleSaveCandidate(saved) {
    setCandidates([saved, ...candidates]);
  }

  function handleOnboardCandidate(candidate, onboardData) {
    const today = new Date().toISOString().split('T')[0];
    const isPvExpired = !onboardData.police_verification_expiry || onboardData.police_verification_expiry < today;

    const newStaff = {
      id: Date.now(),
      user_id: Date.now() + 1,
      badge_number: onboardData.badge_number,
      intimation_id: candidate.intimation_id,
      vertical: candidate.vertical,
      category: candidate.category,
      daily_rate: Number(onboardData.daily_rate),
      status: isPvExpired ? 'BENCH' : 'ACTIVE',
      emergency_contact: candidate.phone,
      joining_date: onboardData.joining_date,
      aadhaar_number: onboardData.aadhaar_number,
      pan_number: onboardData.pan_number,
      bank_account_no: onboardData.bank_account_no,
      bank_name: onboardData.bank_name,
      bank_ifsc: onboardData.bank_ifsc,
      police_verification_expiry: onboardData.police_verification_expiry,
      medical_fitness_expiry: onboardData.medical_fitness_expiry,
      is_bench_locked: isPvExpired,
      bench_lock_reason: isPvExpired ? 'Police verification missing or expired' : null,
      uniform_total_cost: 3200,
      uniform_monthly_emi: 400,
      uniform_balance_due: 3200,
      user: {
        id: Date.now() + 1,
        full_name: candidate.full_name,
        email: candidate.email || `${candidate.phone}@fortellus.internal`,
        phone_number: candidate.phone,
        role: 'STAFF',
        is_active: true,
      },
      created_at: new Date().toISOString(),
    };

    setGuards([newStaff, ...guards]);
    setCandidates(
      candidates.map((c) =>
        c.id === candidate.id ? { ...c, status: 'ONBOARDED', guard_profile_id: newStaff.id } : c
      )
    );
    setOnboardingCandidate(null);
  }

  function handleTriggerBenchLocks() {
    setEvaluatingLocks(true);
    setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      const updated = guards.map((g) => {
        const isPvExpired = !g.police_verification_expiry || g.police_verification_expiry < today;
        const isMedicalExpired = g.medical_fitness_expiry && g.medical_fitness_expiry < today;
        const isArmsExpired = g.category === 'GUNMAN' && (!g.arms_expiry_date || g.arms_expiry_date < today);
        const shouldLock = isPvExpired || isMedicalExpired || isArmsExpired;

        const reasons = [];
        if (isPvExpired) reasons.push('Police verification missing or expired');
        if (isMedicalExpired) reasons.push('Medical fitness certificate expired');
        if (isArmsExpired) reasons.push('Gun license missing or expired');

        return {
          ...g,
          is_bench_locked: shouldLock,
          bench_lock_reason: shouldLock ? reasons.join('; ') : null,
          status: shouldLock && g.status !== 'TERMINATED' ? 'BENCH' : g.status,
        };
      });
      setGuards(updated);
      setEvaluatingLocks(false);
    }, 400);
  }

  // Filter calculations
  const filteredGuards = guards.filter((g) => {
    const matchesSearch =
      g.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.badge_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.intimation_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.user?.phone_number?.includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    const matchesVertical = verticalFilter === 'ALL' || g.vertical === verticalFilter;

    return matchesSearch && matchesStatus && matchesVertical;
  });

  const activeCount = guards.filter((g) => g.status === 'ACTIVE').length;
  const benchCount = guards.filter((g) => g.is_bench_locked || g.status === 'BENCH').length;
  const candidatesInPipeline = candidates.filter((c) => c.status !== 'ONBOARDED').length;

  const today = new Date().toISOString().split('T')[0];
  const expiringStaff = guards.filter((g) => {
    if (!g.police_verification_expiry) return true;
    const diffDays = Math.ceil((new Date(g.police_verification_expiry) - new Date(today)) / (1000 * 60 * 60 * 24));
    return diffDays <= 45;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">
                Fortellus Human Capital Matrix
              </span>
              <span className="text-[10px] font-mono text-slate-500">Multi-Vertical ERP v2.0</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide mt-1">
              Staff &amp; Workforce Master
            </h1>
            <p className="text-xs text-slate-400">
              Security Services, Housekeeping Operations &amp; Healthcare Personnel across Uttarakhand, UP &amp; Delhi-NCR
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'compliance' && (
              <button
                onClick={handleTriggerBenchLocks}
                disabled={evaluatingLocks}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${evaluatingLocks ? 'animate-spin' : ''}`} />
                <span>Evaluate &amp; Lock Bench</span>
              </button>
            )}

            {activeSubTab === 'recruitment' && !isClient && (
              <button
                onClick={() => setCandidateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Intake Candidate (Intimation ID)</span>
              </button>
            )}

            {activeSubTab === 'directory' && !isClient && (
              <button
                onClick={() => {
                  setEditingGuard(null);
                  setStaffModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard New Staff</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Main Sub-Tabs */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'directory'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Staff Master Directory ({guards.length})</span>
          </button>

          {!isClient && (
            <button
              onClick={() => setActiveSubTab('recruitment')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeSubTab === 'recruitment'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Recruitment Pipeline ({candidatesInPipeline} Active)</span>
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('compliance')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'compliance'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Compliance &amp; Expiry Radar ({expiringStaff.length} Alerts)</span>
          </button>
        </div>

        {/* 4 Telemetry Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Deployed Force"
            value={activeCount}
            subtitle="Actively Assigned to Rosters"
            icon={Shield}
            color="cyan"
          />
          <StatCard
            title="Bench Locked / Unassigned"
            value={benchCount}
            subtitle="Prevented from deployment"
            icon={AlertTriangle}
            color={benchCount > 0 ? "rose" : "slate"}
          />
          <StatCard
            title="Recruitment Pipeline"
            value={candidatesInPipeline}
            subtitle="Pre-onboarding screening"
            icon={UserPlus}
            color="purple"
          />
          <StatCard
            title="Compliance Alerts"
            value={expiringStaff.length}
            subtitle="Police/Arms expiring in <45d"
            icon={FileCheck2}
            color="amber"
          />
        </div>

        {/* ────────────────── SUB-TAB 1: STAFF MASTER DIRECTORY ────────────────── */}
        {activeSubTab === 'directory' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between cyber-panel p-3 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <span className="text-[11px] font-mono text-slate-400">Vertical:</span>
                {['ALL', 'SECURITY', 'HOUSEKEEPING', 'NURSING'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVerticalFilter(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                      verticalFilter === v
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'cyber-card border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <input
                  type="text"
                  placeholder="Search name, badge, intimation, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cyber-input h-9 text-xs w-full sm:w-64"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="cyber-input h-9 text-xs w-32"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="BENCH">BENCH</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
              </div>
            </div>

            {/* Staff Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGuards.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => setSelectedGuard(staff)}
                  className="cyber-panel p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group relative overflow-hidden space-y-3"
                >
                  {/* Bench Lock Red Banner */}
                  {staff.is_bench_locked && (
                    <div className="bg-rose-500/20 border-b border-rose-500/30 text-rose-300 text-[10px] font-mono px-3 py-1 -mx-4 -mt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        BENCH LOCKED: Roster Blocked
                      </span>
                      <span>{staff.bench_lock_reason?.slice(0, 30)}...</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-white text-sm group-hover:text-cyan-400 transition-colors">
                          {staff.user?.full_name || 'Staff Member'}
                        </h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {staff.badge_number}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {staff.intimation_id || 'ID Pending'} // {staff.category}
                      </p>
                    </div>

                    <StatusBadge status={staff.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Vertical</span>
                      <span className="text-cyan-300 font-semibold">{staff.vertical}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Daily Rate</span>
                      <span className="text-white font-semibold">₹{staff.daily_rate}/Day</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Police Verification</span>
                      <span className={`${staff.police_verification_expiry ? 'text-slate-300' : 'text-rose-400 font-bold'}`}>
                        {staff.police_verification_expiry || 'MISSING'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Uniform EMI</span>
                      <span className="text-slate-300">₹{staff.uniform_monthly_emi || 0}/Mo</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      📞 {staff.user?.phone_number || staff.emergency_contact}
                    </span>

                    {!isClient && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGuard(staff);
                          setStaffModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg cyber-card border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300"
                        title="Edit Staff Record"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────── SUB-TAB 2: RECRUITMENT PIPELINE ────────────────── */}
        {activeSubTab === 'recruitment' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center cyber-panel p-3 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-400">
                Candidate Intake &amp; Identity Pre-Onboarding. Onboarding transfers records directly to the Staff Master.
              </span>
              <button
                onClick={() => setCandidateModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Screening Intake</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['APPLIED', 'VERIFIED', 'ONBOARDED'].map((stage) => {
                const stageCandidates = candidates.filter((c) => c.status === stage);
                return (
                  <div key={stage} className="cyber-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase">
                        {stage} ({stageCandidates.length})
                      </span>
                      <span className={`w-2 h-2 rounded-full ${
                        stage === 'ONBOARDED' ? 'bg-emerald-400' : stage === 'VERIFIED' ? 'bg-cyan-400' : 'bg-amber-400'
                      }`} />
                    </div>

                    <div className="space-y-3">
                      {stageCandidates.map((cand) => (
                        <div
                          key={cand.id}
                          className="cyber-card p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-white">{cand.full_name}</p>
                              <span className="text-[10px] font-mono text-cyan-400">
                                {cand.intimation_id}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              {cand.category}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400">
                            📞 {cand.phone} {cand.address ? `• ${cand.address}` : ''}
                          </p>

                          {cand.screening_notes && (
                            <p className="text-[10px] text-slate-500 italic bg-slate-950 p-1.5 rounded">
                              "{cand.screening_notes}"
                            </p>
                          )}

                          {stage !== 'ONBOARDED' && (
                            <button
                              onClick={() => setOnboardingCandidate(cand)}
                              className="w-full mt-2 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Onboard to Staff Master</span>
                            </button>
                          )}

                          {stage === 'ONBOARDED' && (
                            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 justify-center pt-1">
                              ✓ Transferred to Staff Master
                            </span>
                          )}
                        </div>
                      ))}

                      {stageCandidates.length === 0 && (
                        <p className="text-center text-slate-600 text-[11px] font-mono py-6">
                          No candidates in {stage} stage.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ────────────────── SUB-TAB 3: COMPLIANCE & EXPIRY RADAR ────────────────── */}
        {activeSubTab === 'compliance' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm">Automated Compliance &amp; Document Expiry Tracking</h3>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    Evaluates Police Verification (45-day alerts), Gun Licenses (60-day warnings), and Medical Certificates. Unverified staff are automatically locked in Bench status to prevent deployment SLA breaches.
                  </p>
                </div>
              </div>

              <button
                onClick={handleTriggerBenchLocks}
                disabled={evaluatingLocks}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${evaluatingLocks ? 'animate-spin' : ''}`} />
                <span>Run System Evaluation</span>
              </button>
            </div>

            <div className="cyber-panel p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Staff Records Requiring Immediate Renewal
              </h4>

              <div className="divide-y divide-slate-800 text-xs">
                {expiringStaff.map((staff) => (
                  <div key={staff.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{staff.user?.full_name}</span>
                        <span className="font-mono text-cyan-400 text-[10px]">[{staff.badge_number}]</span>
                        <span className="font-mono text-slate-500 text-[10px]">{staff.vertical} // {staff.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Police Verification: <strong className={staff.police_verification_expiry ? 'text-amber-400' : 'text-rose-400'}>
                          {staff.police_verification_expiry || 'MISSING (Action Required)'}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {staff.is_bench_locked ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          BENCH LOCKED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          RENEWAL PENDING
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setEditingGuard(staff);
                          setStaffModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-lg cyber-card border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40"
                      >
                        Update Docs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedGuard}
        onClose={() => setSelectedGuard(null)}
        title={selectedGuard?.user?.full_name || 'Staff Dossier'}
        badge={selectedGuard?.badge_number}
      >
        {selectedGuard && (
          <div className="space-y-4 text-xs font-mono">
            {selectedGuard.is_bench_locked && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  BENCH LOCKED
                </p>
                <p className="text-[11px] text-rose-400/90">{selectedGuard.bench_lock_reason}</p>
              </div>
            )}

            <div className="cyber-card p-3 rounded-xl border border-slate-800 space-y-2">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Identification &amp; Force</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-500">Vertical:</span> <span className="text-cyan-300">{selectedGuard.vertical}</span></div>
                <div><span className="text-slate-500">Category:</span> <span className="text-white">{selectedGuard.category}</span></div>
                <div><span className="text-slate-500">Intimation:</span> <span className="text-slate-300">{selectedGuard.intimation_id || 'N/A'}</span></div>
                <div><span className="text-slate-500">Wage Rate:</span> <span className="text-white">₹{selectedGuard.daily_rate}/Day</span></div>
                <div><span className="text-slate-500">Aadhaar:</span> <span className="text-slate-300">{selectedGuard.aadhaar_number || 'N/A'}</span></div>
                <div><span className="text-slate-500">PAN:</span> <span className="text-slate-300">{selectedGuard.pan_number || 'N/A'}</span></div>
              </div>
            </div>

            <div className="cyber-card p-3 rounded-xl border border-slate-800 space-y-2">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Banking &amp; Payroll Details</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-500">Bank:</span> <span className="text-slate-300">{selectedGuard.bank_name || 'N/A'}</span></div>
                <div><span className="text-slate-500">IFSC:</span> <span className="text-slate-300">{selectedGuard.bank_ifsc || 'N/A'}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Account:</span> <span className="text-slate-300">{selectedGuard.bank_account_no || 'N/A'}</span></div>
              </div>
            </div>

            <div className="cyber-card p-3 rounded-xl border border-slate-800 space-y-2">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Uniform EMI Status</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-500">Monthly EMI:</span> <span className="text-white">₹{selectedGuard.uniform_monthly_emi || 0}</span></div>
                <div><span className="text-slate-500">Balance Due:</span> <span className="text-rose-400">₹{selectedGuard.uniform_balance_due || 0}</span></div>
              </div>
            </div>

            <div className="cyber-card p-3 rounded-xl border border-slate-800 space-y-2">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Statutory Expiries</p>
              <div className="space-y-1 text-[11px]">
                <div><span className="text-slate-500">Police Verification:</span> <span className={selectedGuard.police_verification_expiry ? 'text-white' : 'text-rose-400 font-bold'}>{selectedGuard.police_verification_expiry || 'MISSING'}</span></div>
                <div><span className="text-slate-500">Medical Fitness:</span> <span className="text-white">{selectedGuard.medical_fitness_expiry || 'N/A'}</span></div>
                {selectedGuard.category === 'GUNMAN' && (
                  <div><span className="text-slate-500">Arms License:</span> <span className="text-amber-400">{selectedGuard.arms_expiry_date || 'N/A'}</span></div>
                )}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Staff Master Edit / Create Modal */}
      <GuardModal
        isOpen={isStaffModalOpen}
        onClose={() => {
          setStaffModalOpen(false);
          setEditingGuard(null);
        }}
        onSave={handleSaveGuard}
        guard={editingGuard}
      />

      {/* Candidate Screening Modal */}
      <CandidateModal
        isOpen={isCandidateModalOpen}
        onClose={() => setCandidateModalOpen(false)}
        onSave={handleSaveCandidate}
      />

      {/* Candidate Onboarding Modal */}
      <CandidateOnboardModal
        isOpen={!!onboardingCandidate}
        onClose={() => setOnboardingCandidate(null)}
        candidate={onboardingCandidate}
        onOnboard={handleOnboardCandidate}
      />
    </MainLayout>
  );
}