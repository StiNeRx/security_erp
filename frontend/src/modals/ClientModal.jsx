import { useState } from 'react';
import Modal from '../components/Modal';

export default function ClientModal({ isOpen, onClose, onSave, client = null }) {
  const [formData, setFormData] = useState(() => ({
    company_name: client?.company_name || '',
    contact_person: client?.contact_person || '',
    contact_email: client?.contact_email || '',
    contact_phone: client?.contact_phone || '+91-',
    billing_address: client?.billing_address || '',
    gst_number: client?.gst_number || '',
    is_active: client ? client.is_active : true,
  }));

  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onSave({
        ...client,
        ...formData,
        id: client?.id || Date.now(),
        created_at: client?.created_at || new Date().toISOString(),
      });
      setLoading(false);
      onClose();
    }, 300);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Edit Client Account' : 'Register New Client Company'}
      subtitle="Configure corporate entity, GST credentials, and billing address"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Company / Organization Name *</label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="e.g. Acme Corporation"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Contact Person *</label>
            <input
              type="text"
              required
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Billing Email *</label>
            <input
              type="email"
              required
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="accounts@company.com"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
            <input
              type="tel"
              required
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+91-9876543211"
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">GST / Tax Identification #</label>
            <input
              type="text"
              value={formData.gst_number}
              onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
              placeholder="e.g. 06AAAAA0000A1Z5"
              className="w-full cyber-input font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Contract Status *</label>
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

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Full Billing Address *</label>
          <textarea
            rows="2"
            required
            value={formData.billing_address}
            onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
            placeholder="Plot / Tower, Sector, City, State, PIN"
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
            {loading ? 'Saving...' : client ? 'Update Client' : 'Add Client Company'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
