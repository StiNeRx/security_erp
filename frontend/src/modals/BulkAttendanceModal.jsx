import { useState } from 'react';
import Modal from '../components/Modal';

export default function BulkAttendanceModal({
  isOpen,
  onClose,
  onSave,
  sites = [],
  rosters = [],
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedSiteId, setSelectedSiteId] = useState(() => sites[0]?.id ?? 1);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Scheduled rosters matching the site & date
  const relevantRosters = rosters.filter(
    (r) => r.site_id === Number(selectedSiteId) && r.date === selectedDate
  );

  const [attendances, setAttendances] = useState({});
  const [loading, setLoading] = useState(false);

  function handleStatusChange(rosterId, status) {
    setAttendances((prev) => ({
      ...prev,
      [rosterId]: {
        ...(prev[rosterId] || { overtime: 0, remarks: '' }),
        status,
      },
    }));
  }

  function handleOvertimeChange(rosterId, overtime) {
    setAttendances((prev) => ({
      ...prev,
      [rosterId]: {
        ...(prev[rosterId] || { status: 'PRESENT', remarks: '' }),
        overtime: Number(overtime),
      },
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const selectedSite = sites.find((s) => s.id === Number(selectedSiteId));
      const recordsToSave = relevantRosters.map((r) => {
        const item = attendances[r.id] || { status: 'PRESENT', overtime: 0, remarks: '' };
        return {
          id: Date.now() + Math.random(),
          roster_id: r.id,
          guard_name: r.guard_name,
          guard_badge: r.guard_badge,
          site_name: selectedSite?.site_name || 'Site',
          date: selectedDate,
          shift_type: r.shift_type,
          status: item.status,
          check_in_time: `${selectedDate}T08:00:00Z`,
          check_out_time: `${selectedDate}T18:00:00Z`,
          overtime_hours: item.overtime,
          remarks: item.remarks || 'Daily operational check-in',
        };
      });

      onSave(recordsToSave);
      setLoading(false);
      onClose();
    }, 350);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      title="Bulk Daily Attendance Logger"
      subtitle="Log presence, absentees, and overtime hours across all assigned site guards"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Site & Date Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-800">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Facility Site *</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
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
            <label className="block text-slate-300 font-semibold mb-1">Attendance Date *</label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full cyber-input"
            />
          </div>
        </div>

        {/* Guards on Roster List */}
        <div>
          <h4 className="font-semibold text-slate-200 mb-2 flex items-center justify-between">
            <span>Scheduled Guard Personnel ({relevantRosters.length} Shifts)</span>
            <span className="text-[10px] text-cyan-400 font-mono">Real-Time Sync</span>
          </h4>

          {relevantRosters.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400">
              <p>No shift rosters scheduled for this site on {selectedDate}.</p>
              <p className="text-[11px] text-slate-500 mt-1">Please schedule guards on the Rosters page first.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {relevantRosters.map((roster) => {
                const currentStatus = attendances[roster.id]?.status || 'PRESENT';
                const currentOvertime = attendances[roster.id]?.overtime || 0;

                return (
                  <div
                    key={roster.id}
                    className="p-3.5 rounded-xl cyber-card border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm">{roster.guard_name}</p>
                        <span className="font-mono text-[10px] text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
                          {roster.guard_badge}
                        </span>
                        <span className="text-[10px] text-amber-300 font-semibold uppercase">
                          [{roster.shift_type}]
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{roster.notes || 'Station duty'}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Chips */}
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        {['PRESENT', 'HALF_DAY', 'ABSENT', 'LATE'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(roster.id, st)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                              currentStatus === st
                                ? st === 'PRESENT'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : st === 'ABSENT'
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-amber-500 text-slate-950'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {st === 'HALF_DAY' ? 'Half' : st}
                          </button>
                        ))}
                      </div>

                      {/* Overtime input */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          step="0.5"
                          value={currentOvertime}
                          onChange={(e) => handleOvertimeChange(roster.id, e.target.value)}
                          placeholder="OT hrs"
                          title="Overtime Hours"
                          className="w-16 cyber-input py-1 px-2 text-center text-xs"
                        />
                        <span className="text-[10px] text-slate-400">hrs OT</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
            disabled={loading || relevantRosters.length === 0}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {loading ? 'Logging...' : `Log Attendance (${relevantRosters.length})`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
