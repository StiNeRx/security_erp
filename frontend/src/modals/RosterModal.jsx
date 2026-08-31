import { useState } from 'react';
import Modal from '../components/Modal';

export default function RosterModal({
  isOpen,
  onClose,
  onSave,
  guards = [],
  sites = [],
  roster = null,
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

  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (mode === 'single') {
        const selectedGuard = guards.find((g) => g.id === Number(formData.guard_id));
        const selectedSite = sites.find((s) => s.id === Number(formData.site_id));
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
        const selectedGuard = guards.find((g) => g.id === Number(formData.guard_id));
        const selectedSite = sites.find((s) => s.id === Number(formData.site_id));
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
      subtitle="Allocate guards to site locations across Day or Night duty windows"
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
                  {s.site_name} ({s.site_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Assigned Guard *</label>
            <select
              required
              value={formData.guard_id}
              onChange={(e) => setFormData({ ...formData, guard_id: e.target.value })}
              className="w-full cyber-input bg-slate-900"
            >
              {guards.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.user?.full_name} — {g.badge_number} ({g.status})
                </option>
              ))}
            </select>
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
          <label className="block text-slate-300 font-semibold mb-1">Deployment Notes & Specific Gate Instructions</label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Main Gate 1, Loading Dock Patrol, Visitor Access Desk"
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
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {loading ? 'Scheduling...' : mode === 'weekly' ? 'Schedule Batch Week' : 'Confirm Shift Slot'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
