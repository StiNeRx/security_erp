import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import DetailDrawer from '../components/DetailDrawer';
import GenerateInvoiceModal from '../modals/GenerateInvoiceModal';
import InvoicePrintModal from '../modals/InvoicePrintModal';
import { useAuth } from '../context/useAuth';
import { formatCurrency, formatDate } from '../utils/helpers';
import api from '../api/axios';
import { INITIAL_INVOICES, INITIAL_CLIENTS, INITIAL_SITES } from '../api/mockData';
import { ReceiptText, Plus, DollarSign, CheckCircle2, Clock, Printer, ShieldAlert } from 'lucide-react';

export default function InvoicesView() {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [sites, setSites] = useState(INITIAL_SITES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');

  const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [iRes, cRes, sRes] = await Promise.allSettled([
          api.get('/invoices/'),
          api.get('/clients/'),
          api.get('/sites/'),
        ]);
        if (!ignore) {
          if (iRes.status === 'fulfilled' && iRes.value?.data?.length) setInvoices(iRes.value.data);
          if (cRes.status === 'fulfilled' && cRes.value?.data?.length) setClients(cRes.value.data);
          if (sRes.status === 'fulfilled' && sRes.value?.data?.length) setSites(sRes.value.data);
        }
      } catch {
        // fallback
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  function handleSaveInvoice(newInv) {
    setInvoices([newInv, ...invoices]);
  }

  function handleStatusToggle(invId, newStatus, e) {
    e?.stopPropagation();
    setInvoices(
      invoices.map((inv) => (inv.id === invId ? { ...inv, status: newStatus } : inv))
    );
  }

  const enrichedInvoices = invoices.map((inv) => {
    const client = clients.find((c) => c.id === inv.client_id);
    return {
      ...inv,
      client_name: inv.client_name || client?.company_name || `Client #${inv.client_id}`,
    };
  });

  if (role === 'STAFF') {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Billing Records Restricted</h2>
          <p className="text-xs text-slate-400 max-w-md">
            Corporate invoicing, client billing, and GST statements are restricted to Administrators and Corporate Clients. For wage payment schedules and overtime rates, please refer to your Guard Console.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-slate-900 border border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-200 rounded-xl transition-all"
          >
            Return to Officer Terminal
          </button>
        </div>
      </MainLayout>
    );
  }

  const clientScopedInvoices = role === 'CLIENT'
    ? enrichedInvoices.filter((inv) => inv.client_id === 2 || inv.client_name?.toLowerCase().includes('acme') || inv.id <= 2)
    : enrichedInvoices;

  const filteredInvoices = clientScopedInvoices.filter((inv) => {
    const cName = inv.client_name || '';
    const num = inv.invoice_number || '';
    const notes = inv.notes || '';

    const matchesSearch =
      cName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      num.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesMonth = monthFilter === 'ALL' || inv.billing_month === monthFilter;

    return matchesSearch && matchesStatus && matchesMonth;
  });

  const totalRevenue = clientScopedInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const paidRevenue = clientScopedInvoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const pendingDraftRevenue = clientScopedInvoices
    .filter((inv) => inv.status === 'DRAFT' || inv.status === 'SENT')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalTaxCollected = clientScopedInvoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);

  const columns = [
    {
      id: 'invoice',
      header: 'Invoice Reference',
      accessorKey: 'invoice_number',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-cyan-400">{row.invoice_number}</span>
          <p className="text-[10px] text-slate-400 font-mono">Issued: {formatDate(row.issue_date)}</p>
        </div>
      ),
    },
    {
      id: 'client',
      header: 'Client Company',
      accessorKey: 'client_name',
      render: (row) => (
        <div>
          <p className="font-bold text-white text-xs">{row.client_name}</p>
          <span className="text-[10px] text-slate-400 font-mono">Month: {row.billing_month}</span>
        </div>
      ),
    },
    {
      id: 'subtotal',
      header: 'Subtotal',
      accessorKey: 'subtotal',
      render: (row) => <span className="font-mono text-xs text-slate-300">{formatCurrency(row.subtotal)}</span>,
    },
    {
      id: 'tax',
      header: 'GST (18%)',
      accessorKey: 'tax_amount',
      render: (row) => <span className="font-mono text-xs text-amber-400">+{formatCurrency(row.tax_amount)}</span>,
    },
    {
      id: 'total',
      header: 'Total Amount',
      accessorKey: 'total_amount',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-emerald-400">{formatCurrency(row.total_amount)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Payment Status',
      accessorKey: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setPrintingInvoice(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title="Print / View PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          {role === 'ADMIN' && row.status !== 'PAID' && (
            <button
              onClick={(e) => handleStatusToggle(row.id, 'PAID', e)}
              className="px-2 py-1 rounded text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50"
            >
              Mark Paid
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {role === 'CLIENT' ? 'Corporate Invoices & Statements' : 'Automated Billing & Invoices Studio'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'CLIENT'
              ? 'Monthly 18% GST tax invoices and payment receipts for your facility security service agreement.'
              : 'Automated monthly invoice calculation based on verified guard shifts, 18% GST, and printable PDF receipts.'}
          </p>
        </div>
        {role === 'ADMIN' && (
          <button
            onClick={() => setGenerateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Client Invoice</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label={role === 'CLIENT' ? 'Billed Statement Total' : 'Total Invoiced Volume'}
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          trend={role === 'CLIENT' ? 'Verified' : '+18% YoY'}
          glow={role === 'CLIENT' ? 'border-purple-500/30' : 'border-cyan-500/30'}
          sparkline={[100, 120, 140, 150, 170, 190, 210]}
        />
        <StatCard
          label="Collected / Paid"
          value={formatCurrency(paidRevenue)}
          icon={CheckCircle2}
          trend="Settled Funds"
          glow="border-emerald-500/30"
          sparkline={[50, 60, 70, 75, 80, 90, 95]}
        />
        <StatCard
          label="Pending / Draft"
          value={formatCurrency(pendingDraftRevenue)}
          icon={Clock}
          trend="Awaiting Client"
          glow="border-amber-500/30"
          sparkline={[20, 25, 30, 20, 35, 40, 30]}
        />
        <StatCard
          label="GST Tax Collected"
          value={formatCurrency(totalTaxCollected)}
          icon={ReceiptText}
          trend="18% Standard"
          glow="border-purple-500/30"
          sparkline={[18, 22, 25, 28, 30, 35, 38]}
        />
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search invoices by reference #, client company, memo..."
        filters={[
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'ALL', label: 'All Billing Statuses' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SENT', label: 'Sent / Issued' },
              { value: 'PAID', label: 'Paid & Settled' },
              { value: 'OVERDUE', label: 'Overdue' },
            ],
          },
          {
            name: 'month',
            value: monthFilter,
            options: [
              { value: 'ALL', label: 'All Billing Months' },
              { value: '2026-08', label: 'August 2026' },
              { value: '2026-07', label: 'July 2026' },
              { value: '2026-06', label: 'June 2026' },
            ],
          },
        ]}
        onFilterChange={(name, val) => {
          if (name === 'status') setStatusFilter(val);
          if (name === 'month') setMonthFilter(val);
        }}
      />

      <Table
        columns={columns}
        data={filteredInvoices}
        onRowClick={(row) => setSelectedInvoice(row)}
        emptyTitle="No Client Invoices Found"
        emptyMessage="No billing records matched the selected query parameters."
      />

      <DetailDrawer
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice?.client_name || 'Invoice Dossier'}
        subtitle={`Invoice #: ${selectedInvoice?.invoice_number} | Month: ${selectedInvoice?.billing_month}`}
        data={selectedInvoice}
        type="TAX INVOICE"
        actions={
          <button
            onClick={() => {
              setPrintingInvoice(selectedInvoice);
              setSelectedInvoice(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printable PDF</span>
          </button>
        }
      />

      <GenerateInvoiceModal
        isOpen={isGenerateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onSave={handleSaveInvoice}
        clients={clients}
        sites={sites}
      />

      <InvoicePrintModal
        isOpen={!!printingInvoice}
        onClose={() => setPrintingInvoice(null)}
        invoice={printingInvoice}
      />
    </MainLayout>
  );
}