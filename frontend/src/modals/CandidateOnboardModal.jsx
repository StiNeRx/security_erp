import { useState } from 'react';
import Modal from '../components/Modal';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export default function CandidateOnboardModal({ isOpen, onClose, onOnboard, candidate }) {
  const [formData, setFormData] = useState({
    badge_number: `FORT-${candidate?.vertical?.slice(0, 3) || 'SEC'}-${Math.floor(100 + Math.random() * 900)}`,
    daily_rate: candidate?.category === 'GUNMAN' ? 950 : candidate?.vertical === 'NURSING' ? 850 : 650,
    joining_date: new Date().toISOString().split('T')[0],
    police_verification_expiry: '',
    medical_fitness_expiry: '',
    bank_account_no: '',
    bank_name: 'HDFC Bank',
    bank_ifsc: 'HDFC0001234',
    aadhaar_number: '',
    pan_number: '',
  });

  const [loading, setLoading] = useState(false);

  if (!candidate) return null;

  const today = new Date().toISOString().split('T')[0];
  const isPvMissingOrExpired = !formData.police_verification_expiry || formData.police_verification_expiry < today;

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    onOnboard(candidate, formData);
    setLoading(false);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Onboard Candidate to Staff Master`}
      subtitle={`Intimation ID: ${candidate.intimation_id} // ${candidate.full_name} (${candidate.vertical})`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {isPvMissingOrExpired && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Automated Bench-Lock Notice</p>
              <p className="text-[11px] text-amber-400/80">
                Police verification date is missing or in the past. This profile will be automatically locked to <strong>BENCH</strong> status and blocked from site roster deployment until a valid certificate is verified.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Badge / Force Serial Number *</label>
            <input
              type="text"
              required
              value={formData.badge_number}
              onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })}
              className="w-full cyber-input font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Contract Daily Wage Rate (₹/Day) *</label>
            <input
              type="number"
              required
              min="0"
              step="10"
              value={formData.daily_rate}
              onChange={(e) => setFormData({ ...formData, daily_rate: Number(e.target.value) })}
              className="w-full cyber-input font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Official Joining Date *</label>
            <input
              type="date"
              required
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Aadhaar Identification Number</label>
            <input
              type="text"
              value={formData.aadhaar_number}
              onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
              placeholder="XXXX-XXXX-XXXX"
              className="w-full cyber-input font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">PAN Card Number</label>
            <input
              type="text"
              value={formData.pan_number}
              onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
              placeholder="ABCDE1234F"
              className="w-full cyber-input font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Bank IFSC Code</label>
            <input
              type="text"
              value={formData.bank_ifsc}
              onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase() })}
              placeholder="HDFC0001234"
              className="w-full cyber-input font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Bank Account Number</label>
            <input
              type="text"
              value={formData.bank_account_no}
              onChange={(e) => setFormData({ ...formData, bank_account_no: e.target.value })}
              placeholder="50100XXXXXXXXX"
              className="w-full cyber-input font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Police Verification Validity End Date
            </label>
            <input
              type="date"
              value={formData.police_verification_expiry}
              onChange={(e) => setFormData({ ...formData, police_verification_expiry: e.target.value })}
              className="w-full cyber-input"
            />
            <span className="text-[10px] text-slate-500 font-mono">Alert triggers 45 days prior to expiry</span>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">Medical Fitness Expiry Date</label>
            <input
              type="date"
              value={formData.medical_fitness_expiry}
              onChange={(e) => setFormData({ ...formData, medical_fitness_expiry: e.target.value })}
              className="w-full cyber-input"
            />
          </div>
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
            <ShieldCheck className="w-4 h-4" />
            <span>Complete Master Onboarding</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
