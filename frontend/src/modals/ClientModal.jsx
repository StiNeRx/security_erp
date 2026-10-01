import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

// 15-digit GSTIN regex — mirrors backend validation
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function validateGstin(v) {
  if (!v || v.trim() === '') return null; // optional
  return GSTIN_RE.test(v.trim().toUpperCase());
}
function validatePan(v) {
  if (!v || v.trim() === '') return null;
  return PAN_RE.test(v.trim().toUpperCase());
}

function GstinFeedback({ value }) {
  const result = validateGstin(value);
  if (result === null) return <p className="text-[10px] text-slate-500 mt-0.5">Format: 06AAAAA0000A1Z5 (15 chars)</p>;
  if (result) return (
    <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
      <CheckCircle2 className="w-3 h-3" /> Valid GSTIN
    </p>
  );
  return (
    <p className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
      <XCircle className="w-3 h-3" /> Invalid — must be 15 chars (e.g. 06AAAAA0000A1Z5)
    </p>
  );
}

function ContractExpiryBadge({ endDate }) {
  if (!endDate) return null;
  const days = Math.ceil((new Date(endDate) - new Date()) / 86400000);
  if (days < 0) return (
    <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
      <XCircle className="w-3 h-3" /> EXPIRED {Math.abs(days)}d ago
    </span>
  );
  if (days <= 30) return (
    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" /> Expires in {days}d
    </span>
  );
  return (
    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" /> {days}d remaining
    </span>
  );
}

export default function ClientModal({ isOpen, onClose, onSave, client = null }) {
  const [formData, setFormData] = useState(() => ({
    company_name: client?.company_name || '',
    contact_person: client?.contact_person || '',
    contact_email: client?.contact_email || '',
    contact_phone: client?.contact_phone || '+91-',
    billing_address: client?.billing_address || '',
    gst_number: client?.gst_number || '',
    pan_number: client?.pan_number || '',
    contract_start_date: client?.contract_start_date || '',
    contract_end_date: client?.contract_end_date || '',
    contract_terms: client?.contract_terms || '',
    is_active: client ? client.is_active : true,
  }));

  // Sync when editing client changes (modal reused for edit vs create)
  useEffect(() => {
    setFormData({
      company_name: client?.company_name || '',
      contact_person: client?.contact_person || '',
      contact_email: client?.contact_email || '',
      contact_phone: client?.contact_phone || '+91-',
      billing_address: client?.billing_address || '',
      gst_number: client?.gst_number || '',
      pan_number: client?.pan_number || '',
      contract_start_date: client?.contract_start_date || '',
      contract_end_date: client?.contract_end_date || '',
      contract_terms: client?.contract_terms || '',
      is_active: client ? client.is_active : true,
    });
  }, [client]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gstValid = validateGstin(formData.gst_number);
  const panValid = validatePan(formData.pan_number);

  // Block submit if GSTIN is present but invalid
  const canSubmit = gstValid !== false && panValid !== false;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      setError('Fix validation errors before saving.');
      return;
    }
    setError('');
    setLoading(true);
    // Normalise GSTIN / PAN to uppercase
    const payload = {
      ...formData,
      gst_number: formData.gst_number?.trim().toUpperCase() || null,
      pan_number: formData.pan_number?.trim().toUpperCase() || null,
      contract_start_date: formData.contract_start_date || null,
      contract_end_date: formData.contract_end_date || null,
      contract_terms: formData.contract_terms || null,
    };
    setTimeout(() => {
      onSave({
        ...client,
        ...payload,
        id: client?.id || Date.now(),
        created_at: client?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
      onClose();
    }, 300);
  }

  function field(key) {
    return {
      value: formData[key],
      onChange: (e) => setFormData({ ...formData, [key]: e.target.value }),
    };
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Edit Client Account' : 'Register New Client Company'}
      subtitle="Corporate entity, GSTIN, contract lifecycle & billing address"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* ── Section: Identity ─────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Corporate Identity
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Company / Organization *</label>
              <input type="text" required {...field('company_name')} placeholder="e.g. Fortellus Security Pvt Ltd" className="w-full cyber-input" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Authorised Contact Person *</label>
              <input type="text" required {...field('contact_person')} placeholder="Full name" className="w-full cyber-input" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Billing Email *</label>
              <input type="email" required {...field('contact_email')} placeholder="accounts@company.com" className="w-full cyber-input" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
              <input type="tel" required {...field('contact_phone')} placeholder="+91-9876543210" className="w-full cyber-input" />
            </div>
          </div>
        </div>

        {/* ── Section: Tax Registration ─────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Tax Registration
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">GSTIN</label>
              <input
                type="text"
                maxLength={15}
                {...field('gst_number')}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                placeholder="06AAAAA0000A1Z5"
                className={`w-full cyber-input font-mono uppercase tracking-widest ${gstValid === false ? 'border-red-500/60' : gstValid === true ? 'border-emerald-500/60' : ''}`}
              />
              <GstinFeedback value={formData.gst_number} />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">PAN (if no GST)</label>
              <input
                type="text"
                maxLength={10}
                {...field('pan_number')}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                placeholder="AAAAA9999A"
                className={`w-full cyber-input font-mono uppercase tracking-widest ${panValid === false ? 'border-red-500/60' : panValid === true ? 'border-emerald-500/60' : ''}`}
              />
              {panValid === false && (
                <p className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
                  <XCircle className="w-3 h-3" /> Invalid PAN format
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Section: Contract Lifecycle ───────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Contract Lifecycle
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contract Start Date</label>
              <input type="date" {...field('contract_start_date')} className="w-full cyber-input" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contract End Date</label>
              <input type="date" {...field('contract_end_date')} className="w-full cyber-input" />
              <div className="mt-1">
                <ContractExpiryBadge endDate={formData.contract_end_date} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Contract Terms / SLA Notes</label>
              <textarea
                rows="2"
                {...field('contract_terms')}
                placeholder="Scope of services, SLA clauses, notice period..."
                className="w-full cyber-input"
              />
            </div>
          </div>
        </div>

        {/* ── Section: Billing & Status ─────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Billing & Status
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Full Billing Address *</label>
              <textarea
                rows="2"
                required
                {...field('billing_address')}
                placeholder="Plot / Tower, Sector, City, State, PIN"
                className="w-full cyber-input"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contract Status</label>
              <select
                value={formData.is_active ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'ACTIVE' })}
                className="w-full cyber-input bg-slate-900"
              >
                <option value="ACTIVE">ACTIVE (Operational)</option>
                <option value="INACTIVE">INACTIVE (Suspended)</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : client ? 'Update Client' : 'Add Client Company'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
