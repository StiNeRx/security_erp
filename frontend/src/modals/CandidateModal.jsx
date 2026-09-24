import { useState } from 'react';
import Modal from '../components/Modal';
import { UserPlus } from 'lucide-react';

export default function CandidateModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '+91-',
    email: '',
    dob: '1995-01-01',
    gender: 'MALE',
    address: '',
    vertical: 'SECURITY',
    category: 'GUARD',
    status: 'APPLIED',
    screening_notes: '',
  });

  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const intimationId = `INT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const candidate = {
      ...formData,
      id: Date.now(),
      intimation_id: intimationId,
      documents: {},
      created_at: new Date().toISOString(),
    };
    onSave(candidate);
    setLoading(false);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Candidate Pre-Onboarding / Intimation"
      subtitle="Screening intake form generating unique Intimation ID prior to master onboarding"
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
              placeholder="e.g. Ramesh Chandra"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Phone Number *</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91-9876543210"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="candidate@example.com"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full cyber-input"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Operational Vertical *</label>
            <select
              value={formData.vertical}
              onChange={(e) => {
                const v = e.target.value;
                const defaultCat = v === 'SECURITY' ? 'GUARD' : v === 'HOUSEKEEPING' ? 'JANITOR' : 'NURSE_ASSISTANT';
                setFormData({ ...formData, vertical: v, category: defaultCat });
              }}
              className="w-full cyber-input"
            >
              <option value="SECURITY">Security Services</option>
              <option value="HOUSEKEEPING">Housekeeping Operations</option>
              <option value="NURSING">Healthcare / Nursing Personnel</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Designation Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full cyber-input"
            >
              {formData.vertical === 'SECURITY' && (
                <>
                  <option value="GUARD">Security Guard</option>
                  <option value="GUNMAN">Armed Gunman</option>
                  <option value="HEAD_GUARD">Head Guard</option>
                  <option value="SUPERVISOR">Site Supervisor</option>
                  <option value="FIELD_OFFICER">Field Officer</option>
                </>
              )}
              {formData.vertical === 'HOUSEKEEPING' && (
                <>
                  <option value="JANITOR">Janitor / Sanitation Worker</option>
                  <option value="HOUSEKEEPER">Facility Housekeeper</option>
                  <option value="SUPERVISOR">Housekeeping Supervisor</option>
                </>
              )}
              {formData.vertical === 'NURSING' && (
                <>
                  <option value="NURSE_ASSISTANT">Nursing Assistant</option>
                  <option value="GDA">General Duty Assistant (GDA)</option>
                  <option value="SUPERVISOR">Clinical Supervisor</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Residential / Native Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="City, District, State (Uttarakhand / UP / Delhi-NCR)"
            className="w-full cyber-input"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Screening & Physical Notes</label>
          <textarea
            rows={2}
            value={formData.screening_notes}
            onChange={(e) => setFormData({ ...formData, screening_notes: e.target.value })}
            placeholder="Physical measurements, certifications, prior military or clinical background..."
            className="w-full cyber-input resize-none"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl cyber-card border border-slate-800 text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Generate Intimation & Intake</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
