import { useState } from 'react';
import Modal from '../components/Modal';

export default function SiteModal({ isOpen, onClose, onSave, clients = [], site = null }) {
  const [formData, setFormData] = useState(() => ({
    client_id: site?.client_id || (clients[0]?.id ?? 1),
    site_name: site?.site_name || '',
    site_code: site?.site_code || `SITE-${Math.floor(Math.random() * 900) + 100}`,
    address: site?.address || '',
    city: site?.city || 'Gurugram',
    state: site?.state || 'Haryana',
    postal_code: site?.postal_code || '122001',
    day_shift_guards: site?.shift_requirements?.day_shift_guards || 2,
    night_shift_guards: site?.shift_requirements?.night_shift_guards || 2,
    supervisor_required: site?.shift_requirements?.supervisor_required ?? true,
    contact_phone: site?.contact_phone || '+91-',
    is_active: site ? site.is_active : true,
  }));

  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onSave({
        ...site,
        ...formData,
        client_id: Number(formData.client_id),
        id: site?.id || Date.now(),
        shift_requirements: {
          day_shift_guards: Number(formData.day_shift_guards),
          night_shift_guards: Number(formData.night_shift_guards),
          supervisor_required: Boolean(formData.supervisor_required),
        },
        created_at: site?.created_at || new Date().toISOString(),
      });
      setLoading(false);
      onClose();
    }, 300);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={site ? 'Edit Deployment Site' : 'Establish New Deployment Site'}
      subtitle="Define facility location, client assignment, and guard shift quotas"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Parent Client Account *</label>
            <select
              required
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full cyber-input bg-slate-900"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Site Code / Identifier *</label>
            <input
              type="text"
              required
              value={formData.site_code}
              onChange={(e) => setFormData({ ...formData, site_code: e.target.value })}
              placeholder="e.g. ACME-HQ-01"
              className="w-full cyber-input font-mono uppercase"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">Facility / Site Name *</label>
            <input
              type="text"
              required
              value={formData.site_name}
              onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
              placeholder="e.g. Acme Corporate Head Office"
              className="w-full cyber-input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">Street Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Plot 101, Phase 2, Udyog Vihar"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">City *</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">State *</label>
            <input
              type="text"
              required
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Postal Code (PIN) *</label>
            <input
              type="text"
              required
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              className="w-full cyber-input font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Site Contact Phone</label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+91-124-4567890"
              className="w-full cyber-input"
            />
          </div>
        </div>

        {/* Shift Requirements Sub-box */}
        <div className="p-4 rounded-xl cyber-card border border-cyan-500/20 space-y-3 bg-cyan-950/20">
          <h4 className="font-semibold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-2">
            <span>Shift Guard Quota Parameters</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 text-[11px] mb-1">Day Shift Guards</label>
              <input
                type="number"
                min="0"
                value={formData.day_shift_guards}
                onChange={(e) => setFormData({ ...formData, day_shift_guards: e.target.value })}
                className="w-full cyber-input"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-[11px] mb-1">Night Shift Guards</label>
              <input
                type="number"
                min="0"
                value={formData.night_shift_guards}
                onChange={(e) => setFormData({ ...formData, night_shift_guards: e.target.value })}
                className="w-full cyber-input"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={formData.supervisor_required}
                  onChange={(e) => setFormData({ ...formData, supervisor_required: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-xs">Supervisor Req.</span>
              </label>
            </div>
          </div>
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
            {loading ? 'Saving...' : site ? 'Update Site' : 'Establish Site'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
