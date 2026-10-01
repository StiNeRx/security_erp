import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import DetailDrawer from '../components/DetailDrawer';
import ClientModal from '../modals/ClientModal';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import { INITIAL_CLIENTS, INITIAL_SITES, INITIAL_INVOICES } from '../api/mockData';
import {
  Users,
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar
} from 'lucide-react';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function getContractStatus(client) {
  if (!client?.contract_end_date) return { label: 'NO CONTRACT', color: 'slate', days: null, status: 'NO_CONTRACT' };
  const days = Math.ceil((new Date(client.contract_end_date) - new Date()) / 86400000);
  if (days < 0) return { label: `EXPIRED (${Math.abs(days)}d ago)`, color: 'red', days, status: 'EXPIRED' };
  if (days <= 30) return { label: `EXPIRING (${days}d)`, color: 'amber', days, status: 'EXPIRING' };
  return { label: `ACTIVE (${days}d left)`, color: 'emerald', days, status: 'ACTIVE' };
}

export function ContractBadge({ client }) {
  const status = getContractStatus(client);
  if (status.color === 'red') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 border border-red-500/40 text-red-400">
        <XCircle className="w-2.5 h-2.5" />
        {status.label}
      </span>
    );
  }
  if (status.color === 'amber') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 border border-amber-500/40 text-amber-400">
        <AlertTriangle className="w-2.5 h-2.5" />
        {status.label}
      </span>
    );
  }
  if (status.color === 'emerald') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
        <CheckCircle2 className="w-2.5 h-2.5" />
        {status.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-700 text-slate-400">
      <Clock className="w-2.5 h-2.5" />
      NO CONTRACT
    </span>
  );
}

export default function ClientsView() {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [sites, setSites] = useState(INITIAL_SITES);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [cRes, sRes, iRes] = await Promise.allSettled([
          api.get('/clients/'),
          api.get('/sites/'),
          api.get('/invoices/'),
        ]);
        if (!ignore) {
          if (cRes.status === 'fulfilled' && cRes.value?.data?.length) setClients(cRes.value.data);
          if (sRes.status === 'fulfilled' && sRes.value?.data?.length) setSites(sRes.value.data);
          if (iRes.status === 'fulfilled' && iRes.value?.data?.length) setInvoices(iRes.value.data);
        }
      } catch {
        // fallback to initial
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  function handleSaveClient(saved) {
    if (editingClient) {
      setClients(clients.map((c) => (c.id === saved.id ? saved : c)));
    } else {
      setClients([saved, ...clients]);
    }
    setEditingClient(null);
  }

  if (role === 'STAFF') {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Client Directory Restricted</h2>
          <p className="text-xs text-slate-400 max-w-md">
            Corporate client accounts and contractual agreements are restricted to Management and Client Representatives. For your post assignments and shift orders, please access the Guard Console.
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

  const scopedClients = role === 'CLIENT'
    ? clients.filter((c) => c.id === 2 || c.company_name?.toLowerCase().includes('acme') || c.id === 1)
    : clients;

  const filteredClients = scopedClients.filter((client) => {
    const compName = client.company_name || '';
    const contact = client.contact_person || '';
    const email = client.contact_email || '';
    const gst = client.gst_number || '';
    const pan = client.pan_number || '';

    const matchesSearch =
      compName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gst.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pan.toLowerCase().includes(searchTerm.toLowerCase());

    const cStatus = getContractStatus(client).status;

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') matchesStatus = client.is_active && cStatus === 'ACTIVE';
    else if (statusFilter === 'EXPIRING') matchesStatus = cStatus === 'EXPIRING';
    else if (statusFilter === 'EXPIRED') matchesStatus = cStatus === 'EXPIRED';
    else if (statusFilter === 'INACTIVE') matchesStatus = !client.is_active;

    return matchesSearch && matchesStatus;
  });

  const expiringCount = clients.filter((c) => getContractStatus(c).status === 'EXPIRING').length;
  const expiredCount = clients.filter((c) => getContractStatus(c).status === 'EXPIRED').length;

  const columns = [
    {
      id: 'company',
      header: 'Company / Organization',
      accessorKey: 'company_name',
      render: (row) => {
        const isGstValid = row.gst_number && GSTIN_REGEX.test(row.gst_number.toUpperCase());
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
              {row.company_name?.charAt(0) || 'C'}
            </div>
            <div>
              <p className="font-bold text-white text-xs">{row.company_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-400 font-mono">
                  {row.gst_number || 'GST Unregistered'}
                </span>
                {row.gst_number && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                      isGstValid
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {isGstValid ? '15-DIGIT GSTIN' : 'INVALID'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'contact',
      header: 'Contact Person',
      accessorKey: 'contact_person',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-200 text-xs">{row.contact_person}</p>
          <p className="text-[10px] text-slate-400">{row.contact_email}</p>
        </div>
      ),
    },
    {
      id: 'contract',
      header: 'Contract Health',
      render: (row) => (
        <div className="space-y-1">
          <ContractBadge client={row} />
          {row.contract_end_date && (
            <p className="text-[10px] text-slate-500 font-mono">Exp: {row.contract_end_date}</p>
          )}
        </div>
      ),
    },
    {
      id: 'sites',
      header: 'Active Sites',
      render: (row) => {
        const count = sites.filter((s) => s.client_id === row.id).length;
        return (
          <span className="font-mono text-xs text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20 font-bold">
            {count} Facilities
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'is_active',
      render: (row) => <StatusBadge status={row.is_active ? 'ACTIVE' : 'INACTIVE'} />,
    },
    ...(role === 'ADMIN'
      ? [
          {
            id: 'actions',
            header: 'Action',
            render: (row) => (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setEditingClient(row);
                    setModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                  title="Edit Client"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {role === 'CLIENT' ? 'Corporate Account & Agreement' : 'Client Master & Contracts'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'CLIENT'
              ? 'Your registered enterprise profile, authorized POC, tax registration, and billing details.'
              : 'Manage client profiles, 15-digit GSTIN compliance, dynamic contract rates, and SLAs.'}
          </p>
        </div>
        {role === 'ADMIN' && (
          <button
            onClick={() => {
              setEditingClient(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client Company</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Contracted Clients"
          value={clients.length}
          icon={Users}
          trend="+1 This Month"
          glow="border-purple-500/30"
          sparkline={[2, 2, 3, 3, 3, 4, clients.length]}
        />
        <StatCard
          label="Active Facilities"
          value={sites.length}
          icon={Building2}
          trend="Multi-Site Distribution"
          glow="border-cyan-500/30"
          sparkline={[3, 4, 4, 5, 5, 6, sites.length]}
        />
        <StatCard
          label="Contract Expiries (<30d)"
          value={expiringCount}
          icon={AlertTriangle}
          trend={expiringCount > 0 ? "Requires Renewal" : "All Healthy"}
          glow={expiringCount > 0 ? "border-amber-500/40" : "border-slate-800"}
          sparkline={[0, 1, 1, expiringCount]}
        />
        <StatCard
          label="Expired Contracts"
          value={expiredCount}
          icon={ShieldAlert}
          trend={expiredCount > 0 ? "Hold Risk" : "Zero Overdue"}
          glow={expiredCount > 0 ? "border-red-500/40" : "border-emerald-500/30"}
          sparkline={[0, 0, expiredCount]}
        />
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search by company name, contact, 15-digit GSTIN, PAN..."
        viewMode={viewMode}
        setViewMode={setViewMode}
        filters={[
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'ALL', label: 'All Accounts' },
              { value: 'ACTIVE', label: 'Active Contracts' },
              { value: 'EXPIRING', label: 'Expiring Soon (≤30d)' },
              { value: 'EXPIRED', label: 'Expired Contracts' },
              { value: 'INACTIVE', label: 'Inactive / Suspended' },
            ],
          },
        ]}
        onFilterChange={(_, val) => setStatusFilter(val)}
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const clientSites = sites.filter((s) => s.client_id === client.id);
            const clientInvoices = invoices.filter((i) => i.client_id === client.id);
            const isGstValid = client.gst_number && GSTIN_REGEX.test(client.gst_number.toUpperCase());

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="cyber-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4 bg-slate-950/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-base group-hover:scale-105 transition-transform">
                      {client.company_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                        {client.company_name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{client.contact_person}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={client.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    <ContractBadge client={client} />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate text-slate-300">{client.contact_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-slate-300">{client.contact_phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                    <span className="text-[11px] line-clamp-1">{client.billing_address}</span>
                  </div>
                  {client.contract_terms && (
                    <div className="flex items-start gap-2 pt-1 border-t border-slate-800/40">
                      <FileText className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-slate-400 line-clamp-1 italic">
                        {client.contract_terms}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Sites</p>
                    <p className="font-mono font-bold text-cyan-400 mt-0.5">{clientSites.length} Active</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Invoices</p>
                    <p className="font-mono font-bold text-amber-400 mt-0.5">{clientInvoices.length} Bills</p>
                  </div>
                </div>

                <div
                  className="pt-2 flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-slate-400">
                      GST: {client.gst_number || 'UNREGISTERED'}
                    </span>
                    {client.gst_number && (
                      <span
                        className={`text-[8px] font-bold px-1 rounded ${
                          isGstValid ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                        }`}
                      >
                        {isGstValid ? 'VERIFIED' : 'INVALID'}
                      </span>
                    )}
                  </div>
                  {role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setEditingClient(client);
                        setModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredClients}
          onRowClick={(row) => setSelectedClient(row)}
          emptyTitle="No Client Companies Found"
          emptyMessage="No client accounts match your search parameters."
        />
      )}

      {/* Detailed 360 Client Drawer */}
      <DetailDrawer
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={selectedClient?.company_name || 'Client 360° Dossier'}
        subtitle={`Contact: ${selectedClient?.contact_person} | GST: ${selectedClient?.gst_number || 'None'}`}
        data={selectedClient}
        type="CLIENT ACCOUNT"
        actions={
          role === 'ADMIN' ? (
            <button
              onClick={() => {
                setEditingClient(selectedClient);
                setSelectedClient(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Client</span>
            </button>
          ) : null
        }
      />

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </MainLayout>
  );
}