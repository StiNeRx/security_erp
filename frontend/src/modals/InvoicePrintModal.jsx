import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import { Printer, Shield, CheckCircle2 } from 'lucide-react';

export default function InvoicePrintModal({ isOpen, onClose, invoice = null }) {
  if (!invoice) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      title={`Tax Invoice: ${invoice.invoice_number}`}
      subtitle={`Billing Month: ${invoice.billing_month} | Status: ${invoice.status}`}
    >
      <div className="space-y-6 text-xs text-slate-300 print:text-black">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wider">APEX SECURITY OPS ERP</h2>
              <p className="text-slate-400 text-xs">Facility Guard Management & Surveillance</p>
              <p className="text-[11px] text-slate-500 mt-0.5">GSTIN: 06AAAAA9999Z1Z8 | info@apexsecurity.io</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <StatusBadge status={invoice.status} />
            <p className="font-mono text-sm font-bold text-white mt-2">{invoice.invoice_number}</p>
            <p className="text-slate-400 text-[11px]">Issue Date: {formatDate(invoice.issue_date)}</p>
            <p className="text-slate-400 text-[11px]">Due Date: {formatDate(invoice.due_date)}</p>
          </div>
        </div>

        {/* Bill To Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl cyber-card border border-slate-800 bg-slate-950/40">
          <div>
            <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">BILLED TO (CLIENT)</span>
            <h4 className="text-sm font-bold text-white mt-1">{invoice.client_name}</h4>
            <p className="text-slate-400 mt-1">Client ID: #{invoice.client_id}</p>
            <p className="text-slate-400">Billing Period: {invoice.billing_month}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">PAYMENT TERMS</span>
            <p className="text-slate-300 mt-1">Net 15 Days from date of invoice</p>
            <p className="text-slate-400 mt-1">Direct Bank Wire / UPI Corporate Gateway</p>
          </div>
        </div>

        {/* Breakdown Items */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Itemized Shift Deployments</h4>
          <table className="w-full text-left border-collapse cyber-panel rounded-xl overflow-hidden">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-[10px] font-bold text-slate-400 uppercase">
                <th className="p-3">Description</th>
                <th className="p-3 text-center">Billing Month</th>
                <th className="p-3 text-right">Taxable Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="p-3">
                  <p className="font-semibold text-white">Security Guard Deployments & Facility Patrol</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{invoice.notes || 'Full monthly deployment force'}</p>
                </td>
                <td className="p-3 text-center font-mono">{invoice.billing_month}</td>
                <td className="p-3 text-right font-mono font-bold text-white">{formatCurrency(invoice.subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 border-t border-slate-800">
          <div className="space-y-1 text-slate-400 text-[11px]">
            <p className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Digitally Verified Operations & Shift Attendance
            </p>
            <p>Computer generated invoice, no physical signature required.</p>
          </div>

          <div className="w-full sm:w-64 space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>GST ({invoice.tax_rate || 18}%):</span>
              <span className="font-mono text-amber-400">+{formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
              <span className="text-white">Total Due:</span>
              <span className="font-mono text-emerald-400">{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
