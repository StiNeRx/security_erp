import { useState } from 'react';
import Modal from '../components/Modal';

export default function GuardModal({ isOpen, onClose, onSave, guard = null }) {
  const [formData, setFormData] = useState(() => ({
    badge_number: guard?.badge_number || `SEC-G-00${Math.floor(Math.random() * 90) + 10}`,
    full_name: guard?.user?.full_name || '',
    email: guard?.user?.email || '',
    phone: guard?.user?.phone_number || '+91-',
    daily_rate: guard?.daily_rate || 650.0,
    status: guard?.status || 'ACTIVE',
    emergency_contact: guard?.emergency_contact || '+91-',
    joining_date: guard?.joining_date || new Date().toISOString().split('T')[0],
    notes: guard?.notes || '',
  }));

  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onSave({
        ...guard,
        ...formData,
        id: guard?.id || Date.now(),
        daily_rate: Number(formData.daily_rate),
        user: {
          id: guard?.user?.id || Date.now(),
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone,
          role: 'STAFF',
          is_active: true,
        }
      });
      setLoading(false);
      onClose();
    }, 300);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={guard ? 'Edit Guard Dossier' : 'Commission New Security Guard'}
      subtitle="Register personnel profile, badge credentials, and rate cards"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Badge ID / Code *</label>
            <input
              type="text"
              required
              value={formData.badge_number}
              onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })}
              placeholder="e.g. SEC-G-005"
              className="w-full cyber-input font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Login Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="guard@securityerp.com"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Primary Phone Number *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91-9876543210"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Daily Wage Rate (₹) *</label>
            <input
              type="number"
              required
              min="100"
              step="50"
              value={formData.daily_rate}
              onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Operational Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full cyber-input bg-slate-900"
            >
              <option value="ACTIVE">ACTIVE (On-Duty Ready)</option>
              <option value="ON_LEAVE">ON_LEAVE (Temporary Hold)</option>
              <option value="TERMINATED">TERMINATED (Offboarded)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Emergency Contact</label>
            <input
              type="tel"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              placeholder="+91-9123456780"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Joining Date</label>
            <input
              type="date"
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              className="w-full cyber-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Special Certifications & Notes</label>
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. CCTV monitoring certified, Fire safety marshal, VIP escort"
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
            {loading ? 'Saving...' : guard ? 'Update Guard' : 'Enroll Guard'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
