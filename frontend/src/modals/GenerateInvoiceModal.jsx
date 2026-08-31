import { useState } from 'react';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/helpers';

export default function GenerateInvoiceModal({
  isOpen,
  onClose,
  onSave,
  clients = [],
  sites = [],
}) {
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-08"
  const [clientId, setClientId] = useState(() => clients[0]?.id ?? 1);
  const [billingMonth, setBillingMonth] = useState(currentMonth);
  const [taxRate, setTaxRate] = useState(18.0);
  const [ratePerShift, setRatePerShift] = useState(650.0);
  const [overtimeRate, setOvertimeRate] = useState(100.0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Selected client sites
  const clientSites = sites.filter((s) => s.client_id === Number(clientId));
  const estimatedShifts = clientSites.reduce(
    (sum, s) => sum + ((s.shift_requirements?.day_shift_guards || 1) + (s.shift_requirements?.night_shift_guards || 1)) * 30,
    0
  );
  const estimatedSubtotal = estimatedShifts * Number(ratePerShift);
  const estimatedTax = (estimatedSubtotal * Number(taxRate)) / 100;
  const estimatedTotal = estimatedSubtotal + estimatedTax;

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const selectedClient = clients.find((c) => c.id === Number(clientId));
      const todayStr = new Date().toISOString().split('T')[0];
      const invNumber = `INV-${billingMonth.replace('-', '')}-${String(clientId).padStart(3, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      onSave({
        id: Date.now(),
        client_id: Number(clientId),
        client_name: selectedClient?.company_name || 'Client',
        invoice_number: invNumber,
        billing_month: billingMonth,
        issue_date: todayStr,
        due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        subtotal: estimatedSubtotal,
        tax_rate: Number(taxRate),
        tax_amount: estimatedTax,
        total_amount: estimatedTotal,
        status: 'DRAFT',
        notes: notes || `Automated billing calculation for ${billingMonth}. Total estimated shifts: ${estimatedShifts}.`,
        breakdown_by_site: clientSites.map((s) => ({
          site_id: s.id,
          site_name: s.site_name,
          total_shifts: Math.round(estimatedShifts / Math.max(clientSites.length, 1)),
          present_shifts: Math.round(estimatedShifts / Math.max(clientSites.length, 1)),
          billable_amount: Math.round(estimatedSubtotal / Math.max(clientSites.length, 1)),
        })),
        created_at: new Date().toISOString(),
      });

      setLoading(false);
      onClose();
    }, 400);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title="Automated Billing Engine & Invoice Generator"
      subtitle="Compute billable shifts, overtime pay, 18% GST, and itemized client breakdown"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Client Account *</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full cyber-input bg-slate-900"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.gst_number || 'No GST'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Billing Month (YYYY-MM) *</label>
            <input
              type="month"
              required
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Shift Rate Override (₹ / Shift)</label>
            <input
              type="number"
              min="100"
              step="25"
              value={ratePerShift}
              onChange={(e) => setRatePerShift(e.target.value)}
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Overtime Rate (₹ / Hour)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={overtimeRate}
              onChange={(e) => setOvertimeRate(e.target.value)}
              className="w-full cyber-input"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Applicable GST Tax Rate (%)</label>
            <input
              type="number"
              min="0"
              max="28"
              step="0.5"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full cyber-input font-mono"
            />
          </div>
        </div>

        {/* Live Calculation Simulation Card */}
        <div className="p-4 rounded-xl cyber-card border border-cyan-500/20 bg-cyan-950/20 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span>Linked Client Facilities:</span>
            <span className="font-bold text-white">{clientSites.length} Active Sites</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Estimated Monthly Shift Count:</span>
            <span className="font-mono font-bold text-cyan-400">~{estimatedShifts} Shifts</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Subtotal (Shifts & Deployments):</span>
            <span className="font-mono text-white">{formatCurrency(estimatedSubtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Goods & Services Tax ({taxRate}% GST):</span>
            <span className="font-mono text-amber-400">+{formatCurrency(estimatedTax)}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm">
            <span className="text-white">Estimated Invoice Total:</span>
            <span className="font-mono text-emerald-400 text-base">{formatCurrency(estimatedTotal)}</span>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Invoice Notes / Memo</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Automated calculation based on daily guard rosters and verified attendance"
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
            {loading ? 'Generating...' : 'Generate & Issue Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
