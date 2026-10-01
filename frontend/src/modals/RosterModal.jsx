import { useState, useMemo, useEffect } from 'react';
import Modal from '../components/Modal';
import { AlertTriangle, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function RosterModal({
  isOpen,
  onClose,
  onSave,
  guards = [],
  sites = [],
  roster = null,
  existingRosters = [],
}) {
  const [mode, setMode] = useState('single'); // 'single' | 'weekly'
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState(() => ({
    site_id: roster?.site_id || (sites[0]?.id ?? 1),
    guard_id: roster?.guard_id || (guards[0]?.id ?? 1),
    date: roster?.date || todayStr,
    shift_type: roster?.shift_type || 'DAY',
    status: roster?.status || 'SCHEDULED',
    notes: roster?.notes || '',
    // For weekly batch
    start_date: todayStr,
    days_count: 7,
  }));

  useEffect(() => {
    if (roster) {
      setFormData({
        site_id: roster.site_id,
        guard_id: roster.guard_id,
        date: roster.date,
        shift_type: roster.shift_type,
        status: roster.status || 'SCHEDULED',
        notes: roster.notes || '',
        start_date: roster.date,
        days_count: 7,
      });
    }
  }, [roster]);

  const [loading, setLoading] = useState(false);

  // Selected entities
  const selectedGuard = useMemo(
    () => guards.find((g) => g.id === Number(formData.guard_id)),
    [guards, formData.guard_id]
  );
  const selectedSite = useMemo(
    () => sites.find((s) => s.id === Number(formData.site_id)),
    [sites, formData.site_id]
  );

  // Bench-Lock verification
  const isBenchLocked = Boolean(selectedGuard?.is_bench_locked);
  const benchLockReason = selectedGuard?.bench_lock_reason || 'Compliance Hold (Expired/Missing Police Verification or Medical)';

  // Collision detection for single shift
  const collision = useMemo(() => {
    if (mode !== 'single') return null;
    const match = existingRosters.find(
      (r) =>
        r.guard_id === Number(formData.guard_id) &&
        r.date === formData.date &&
        r.shift_type === formData.shift_type &&
        r.id !== roster?.id &&
        r.status !== 'CANCELLED'
    );
    if (!match) return null;
    const otherSite = sites.find((s) => s.id === match.site_id);
    return {
      ...match,
      siteName: otherSite?.site_name || `Site #${match.site_id}`,
    };
  }, [existingRosters, formData.guard_id, formData.date, formData.shift_type, roster?.id, mode, sites]);

  function handleSubmit(e) {
    e.preventDefault();
    if (isBenchLocked) return;
    if (collision) return;

    setLoading(true);

    setTimeout(() => {
      if (mode === 'single') {
        onSave([
          {
            ...roster,
            ...formData,
            id: roster?.id || Date.now(),
            site_id: Number(formData.site_id),
            guard_id: Number(formData.guard_id),
            guard_name: selectedGuard?.user?.full_name || 'Guard',
            guard_badge: selectedGuard?.badge_number || 'SEC-G',
            site_name: selectedSite?.site_name || 'Site HQ',
          },
        ]);
      } else {
        // Generate batch weekly entries
        const generated = [];
        const base = new Date(formData.start_date);

        for (let i = 0; i < Number(formData.days_count); i++) {
          const nextDate = new Date(base);
          nextDate.setDate(base.getDate() + i);
          const dateStr = nextDate.toISOString().split('T')[0];

          generated.push({
            id: Date.now() + i,
            site_id: Number(formData.site_id),
            guard_id: Number(formData.guard_id),
            date: dateStr,
            shift_type: formData.shift_type,
            status: 'SCHEDULED',
            notes: formData.notes || `Scheduled Shift Day ${i + 1}`,
            guard_name: selectedGuard?.user?.full_name || 'Guard',
            guard_badge: selectedGuard?.badge_number || 'SEC-G',
            site_name: selectedSite?.site_name || 'Site HQ',
            created_at: new Date().toISOString(),
          });
        }
        onSave(generated);
      }
      setLoading(false);
      onClose();
    }, 350);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={roster ? 'Modify Shift Assignment' : 'Dispatch Guard & Schedule Shifts'}
      subtitle="Allocate verified personnel to facility posts with automated collision & compliance safeguards"
    >
      {/* Mode switcher if creating new */}
      {!roster && (
        <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl mb-4 border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'single' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Single Shift Slot
          </button>
          <button
            type="button"
            onClick={() => setMode('weekly')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'weekly' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Batch Weekly Schedule (Multi-Day)
          </button>
        </div>
      )}

      {/* Compliance Bench-Lock Warning Banner */}
      {isBenchLocked && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-red-400 uppercase tracking-wide">
              Compliance Hold: Personnel Bench-Locked
            </p>
            <p className="text-[11px] text-red-300/90 leading-relaxed">
              <strong>{selectedGuard?.user?.full_name || 'Selected personnel'}</strong> cannot be assigned to any deployment roster.
              Reason: <span className="underline decoration-red-400">{benchLockReason}</span>.
              Update verification credentials in Personnel Master before roster dispatch.
            </p>
          </div>
        </div>
      )}

      {/* Overlapping Collision Warning Banner */}
      {collision && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-start gap-3 text-amber-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-400 uppercase tracking-wide">
              Shift Collision Detected
            </p>
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              This guard is already rostered for <strong>{collision.shift_type} SHIFT</strong> on{' '}
              <strong>{collision.date}</strong> at <strong>{collision.siteName}</strong>. Double booking overlapping 12-hour shifts is strictly blocked.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Deployment Site *</label>
            <select
              required
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
              className="w-full cyber-input bg-slate-900"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.site_name} ({s.site_code || `SITE-${s.id}`})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Assigned Guard / Personnel *</label>
            <select
              required
              value={formData.guard_id}
              onChange={(e) => setFormData({ ...formData, guard_id: e.target.value })}
              className={`w-full cyber-input bg-slate-900 ${
                isBenchLocked ? 'border-red-500/60 text-red-300' : ''
              }`}
            >
              {guards.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.user?.full_name} — {g.badge_number} [{g.vertical || 'SECURITY'}] {g.is_bench_locked ? '(🔒 BENCH-LOCKED)' : `(${g.status})`}
                </option>
              ))}
            </select>
            {isBenchLocked && (
              <span className="text-[10px] text-red-400 font-semibold flex items-center gap-1 mt-1">
                <Lock className="w-3 h-3" /> Locked: {benchLockReason}
              </span>
            )}
          </div>

          {mode === 'single' ? (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Shift Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full cyber-input"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Schedule Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full cyber-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Duration (Consecutive Days)</label>
                <select
                  value={formData.days_count}
                  onChange={(e) => setFormData({ ...formData, days_count: e.target.value })}
                  className="w-full cyber-input bg-slate-900"
                >
                  <option value="5">5 Days (Mon - Fri)</option>
                  <option value="7">7 Days (Full Week)</option>
                  <option value="14">14 Days (Bi-Weekly Sprint)</option>
                  <option value="30">30 Days (Full Month)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Shift Type *</label>
            <select
              value={formData.shift_type}
              onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
              className="w-full cyber-input bg-slate-900"
            >
              <option value="DAY">DAY SHIFT (08:00 - 20:00)</option>
              <option value="NIGHT">NIGHT SHIFT (20:00 - 08:00)</option>
            </select>
          </div>

          {mode === 'single' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Roster Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full cyber-input bg-slate-900"
              >
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Deployment Notes & Post Orders
          </label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Main Gate 1, Loading Dock Patrol, Biometric Entry Escort"
            className="w-full cyber-input"
          />
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isBenchLocked || Boolean(collision)}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Scheduling...'
              : isBenchLocked
              ? 'Action Blocked: Bench Locked'
              : collision
              ? 'Action Blocked: Shift Collision'
              : mode === 'weekly'
              ? 'Schedule Batch Week'
              : 'Confirm Shift Slot'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
