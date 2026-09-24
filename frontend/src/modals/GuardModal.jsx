import { useState } from 'react';
import Modal from '../components/Modal';
import { Shield, AlertTriangle, ShieldCheck, DollarSign, FileText } from 'lucide-react';

export default function GuardModal({ isOpen, onClose, onSave, guard = null }) {
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState(() => ({
    badge_number: guard?.badge_number || `FORT-SEC-${Math.floor(100 + Math.random() * 900)}`,
    intimation_id: guard?.intimation_id || `INT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    vertical: guard?.vertical || 'SECURITY',
    category: guard?.category || 'GUARD',
    full_name: guard?.user?.full_name || '',
    email: guard?.user?.email || '',
    phone: guard?.user?.phone_number || '+91-',
    daily_rate: guard?.daily_rate || 650.0,
    status: guard?.status || 'ACTIVE',
    emergency_contact: guard?.emergency_contact || '+91-',
    joining_date: guard?.joining_date || new Date().toISOString().split('T')[0],
    notes: guard?.notes || '',

    // KYC
    aadhaar_number: guard?.aadhaar_number || '',
    pan_number: guard?.pan_number || '',
    permanent_address: guard?.permanent_address || '',

    // Bank
    bank_account_no: guard?.bank_account_no || '',
    bank_name: guard?.bank_name || 'HDFC Bank',
    bank_ifsc: guard?.bank_ifsc || 'HDFC0001234',

    // Arms (Gunman)
    arms_license_no: guard?.arms_license_no || '',
    arms_caliber: guard?.arms_caliber || '.32 Revolver',
    arms_weapon_serial: guard?.arms_weapon_serial || '',
    arms_ammunition_count: guard?.arms_ammunition_count || 12,
    arms_expiry_date: guard?.arms_expiry_date || '',

    // Uniform EMI
    uniform_total_cost: guard?.uniform_total_cost || 3200,
    uniform_monthly_emi: guard?.uniform_monthly_emi || 400,
    uniform_balance_due: guard?.uniform_balance_due || 3200,
    uniform_issued_items: guard?.uniform_issued_items || ['Shirt', 'Trousers', 'Shoes', 'Belt', 'Cap'],

    // Compliance Expiries
    police_verification_expiry: guard?.police_verification_expiry || '',
    medical_fitness_expiry: guard?.medical_fitness_expiry || '',
    psara_cert_no: guard?.psara_cert_no || '',
  }));

  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const isPvExpired = !formData.police_verification_expiry || formData.police_verification_expiry < today;
  const isMedicalExpired = formData.medical_fitness_expiry && formData.medical_fitness_expiry < today;
  const isArmsExpired = formData.category === 'GUNMAN' && (!formData.arms_expiry_date || formData.arms_expiry_date < today);

  const willBeBenchLocked = isPvExpired || isMedicalExpired || isArmsExpired;

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const lockReasons = [];
      if (isPvExpired) lockReasons.push('Police verification missing or expired');
      if (isMedicalExpired) lockReasons.push('Medical fitness certificate expired');
      if (isArmsExpired) lockReasons.push('Gun license missing or expired');

      onSave({
        ...guard,
        ...formData,
        id: guard?.id || Date.now(),
        daily_rate: Number(formData.daily_rate),
        uniform_total_cost: Number(formData.uniform_total_cost),
        uniform_monthly_emi: Number(formData.uniform_monthly_emi),
        uniform_balance_due: Number(formData.uniform_balance_due),
        is_bench_locked: willBeBenchLocked,
        bench_lock_reason: willBeBenchLocked ? lockReasons.join('; ') : null,
        status: willBeBenchLocked && formData.status !== 'TERMINATED' ? 'BENCH' : formData.status,
        user: {
          id: guard?.user?.id || Date.now(),
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone,
          role: 'STAFF',
          is_active: true,
        },
      });
      setLoading(false);
      onClose();
    }, 300);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={guard ? 'Edit Staff Master Record' : 'Onboard New Staff Member'}
      subtitle="Multi-vertical manpower profile with statutory KYC, Arms verification, and Uniform EMI"
    >
      <div className="flex border-b border-slate-800 mb-4 gap-1 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'general' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          General &amp; Force
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kyc')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'kyc' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          KYC &amp; Bank
        </button>
        {formData.category === 'GUNMAN' && (
          <button
            type="button"
            onClick={() => setActiveTab('arms')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'arms' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Arms Details
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('uniform')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'uniform' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Uniform EMI
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('compliance')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'compliance' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Compliance Expiries
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {willBeBenchLocked && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Bench-Lock Active</p>
              <p className="text-[11px] text-rose-400/80">
                Staff member will be locked in <strong>BENCH</strong> status due to missing/expired compliance documents. Shift scheduling will be blocked.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="block text-slate-300 font-semibold mb-1">Badge Number *</label>
                <input
                  type="text"
                  required
                  value={formData.badge_number}
                  onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })}
                  className="w-full cyber-input font-mono"
                />
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
                  <option value="NURSING">Healthcare / Nursing</option>
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

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Daily Wage Rate (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="10"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                  className="w-full cyber-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deployment Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full cyber-input"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="BENCH">BENCH (Unassigned)</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Aadhaar Identification Number</label>
              <input
                type="text"
                value={formData.aadhaar_number}
                onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                placeholder="12-digit UID"
                className="w-full cyber-input font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">PAN Card Number</label>
              <input
                type="text"
                value={formData.pan_number}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                placeholder="10-digit PAN"
                className="w-full cyber-input font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bank Account Number</label>
              <input
                type="text"
                value={formData.bank_account_no}
                onChange={(e) => setFormData({ ...formData, bank_account_no: e.target.value })}
                placeholder="Account number"
                className="w-full cyber-input font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bank IFSC Code</label>
              <input
                type="text"
                value={formData.bank_ifsc}
                onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase() })}
                placeholder="IFSC"
                className="w-full cyber-input font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Permanent Residential Address</label>
              <input
                type="text"
                value={formData.permanent_address}
                onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                placeholder="Full address, City, District, State"
                className="w-full cyber-input"
              />
            </div>
          </div>
        )}

        {activeTab === 'arms' && formData.category === 'GUNMAN' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Arms License Number *</label>
              <input
                type="text"
                value={formData.arms_license_no}
                onChange={(e) => setFormData({ ...formData, arms_license_no: e.target.value })}
                placeholder="e.g. ARMS-UK-2023-XXXX"
                className="w-full cyber-input font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Weapon Caliber</label>
              <input
                type="text"
                value={formData.arms_caliber}
                onChange={(e) => setFormData({ ...formData, arms_caliber: e.target.value })}
                placeholder=".32 Revolver / 12 Bore DBBL"
                className="w-full cyber-input font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Weapon Serial Number</label>
              <input
                type="text"
                value={formData.arms_weapon_serial}
                onChange={(e) => setFormData({ ...formData, arms_weapon_serial: e.target.value })}
                placeholder="WP-XXXXX"
                className="w-full cyber-input font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ammunition Allotment Count</label>
              <input
                type="number"
                value={formData.arms_ammunition_count}
                onChange={(e) => setFormData({ ...formData, arms_ammunition_count: Number(e.target.value) })}
                className="w-full cyber-input font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Arms License Validity Expiry Date *</label>
              <input
                type="date"
                value={formData.arms_expiry_date}
                onChange={(e) => setFormData({ ...formData, arms_expiry_date: e.target.value })}
                className="w-full cyber-input"
              />
              <span className="text-[10px] text-slate-500 font-mono">Warning generated 60 days prior to expiry</span>
            </div>
          </div>
        )}

        {activeTab === 'uniform' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Total Uniform Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.uniform_total_cost}
                  onChange={(e) => setFormData({ ...formData, uniform_total_cost: e.target.value })}
                  className="w-full cyber-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Monthly EMI Recovery (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.uniform_monthly_emi}
                  onChange={(e) => setFormData({ ...formData, uniform_monthly_emi: e.target.value })}
                  className="w-full cyber-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Outstanding Balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.uniform_balance_due}
                  onChange={(e) => setFormData({ ...formData, uniform_balance_due: e.target.value })}
                  className="w-full cyber-input font-mono"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 font-semibold mb-1">Issued Uniform Components</p>
              <div className="flex flex-wrap gap-2">
                {['Shirt', 'Trousers', 'Shoes', 'Belt', 'Cap', 'Holster', 'ID Badge', 'Medical Scrubs'].map((item) => {
                  const isSelected = formData.uniform_issued_items.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        const items = isSelected
                          ? formData.uniform_issued_items.filter((i) => i !== item)
                          : [...formData.uniform_issued_items, item];
                        setFormData({ ...formData, uniform_issued_items: items });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'cyber-card border-slate-800 text-slate-400'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Police Verification Validity End Date *
              </label>
              <input
                type="date"
                value={formData.police_verification_expiry}
                onChange={(e) => setFormData({ ...formData, police_verification_expiry: e.target.value })}
                className="w-full cyber-input"
              />
              <span className="text-[10px] text-slate-500 font-mono">Alert generated 45 days prior to expiry</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Medical Fitness Expiry Date</label>
              <input
                type="date"
                value={formData.medical_fitness_expiry}
                onChange={(e) => setFormData({ ...formData, medical_fitness_expiry: e.target.value })}
                className="w-full cyber-input"
              />
              <span className="text-[10px] text-slate-500 font-mono">Annual Expiry Tracker</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">PSARA Training Certificate Number</label>
              <input
                type="text"
                value={formData.psara_cert_no}
                onChange={(e) => setFormData({ ...formData, psara_cert_no: e.target.value })}
                placeholder="PSARA-UK-YYYY-XXXX"
                className="w-full cyber-input font-mono"
              />
            </div>
          </div>
        )}

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
            <span>Save Staff Dossier</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
