import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import DetailDrawer from '../components/DetailDrawer';
import SiteModal from '../modals/SiteModal';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import { INITIAL_SITES, INITIAL_CLIENTS, INITIAL_ROSTERS } from '../api/mockData';
import { MapPin, Plus, Building2, Sun, Moon, ShieldCheck, Edit3, Phone } from 'lucide-react';

export default function SitesView() {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const [sites, setSites] = useState(INITIAL_SITES);
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [rosters, setRosters] = useState(INITIAL_ROSTERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [sRes, cRes, rRes] = await Promise.allSettled([
          api.get('/sites/'),
          api.get('/clients/'),
          api.get('/rosters/'),
        ]);
        if (!ignore) {
          if (sRes.status === 'fulfilled' && sRes.value?.data?.length) setSites(sRes.value.data);
          if (cRes.status === 'fulfilled' && cRes.value?.data?.length) setClients(cRes.value.data);
          if (rRes.status === 'fulfilled' && rRes.value?.data?.length) setRosters(rRes.value.data);
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

  function handleSaveSite(saved) {
    if (editingSite) {
      setSites(sites.map((s) => (s.id === saved.id ? saved : s)));
    } else {
      setSites([saved, ...sites]);
    }
    setEditingSite(null);
  }

  const scopedSites = role === 'CLIENT'
    ? sites.filter((s) => s.client_id === 2 || s.client_name?.toLowerCase().includes('acme') || s.id <= 2)
    : role === 'STAFF'
    ? sites.filter((s) => s.id === 1 || s.id <= 2)
    : sites;

  const filteredSites = scopedSites.filter((site) => {
    const name = site.site_name || '';
    const code = site.site_code || '';
    const city = site.city || '';
    const address = site.address || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient = clientFilter === 'ALL' || site.client_id === Number(clientFilter);
    return matchesSearch && matchesClient;
  });

  const totalDayQuotas = scopedSites.reduce((sum, s) => sum + (s.shift_requirements?.day_shift_guards || 0), 0);
  const totalNightQuotas = scopedSites.reduce((sum, s) => sum + (s.shift_requirements?.night_shift_guards || 0), 0);

  const columns = [
    {
      id: 'site',
      header: 'Deployment Facility',
      accessorKey: 'site_name',
      render: (row) => {
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">{row.site_name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{row.address}, {row.city}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'code',
      header: 'Site Code',
      accessorKey: 'site_code',
      render: (row) => <span className="font-mono text-xs font-bold text-cyan-400">{row.site_code}</span>,
    },
    {
      id: 'quotas',
      header: 'Shift Quotas',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <p className="text-slate-300">Day: <span className="font-bold text-amber-400">{row.shift_requirements?.day_shift_guards || 1}</span></p>
          <p className="text-slate-400">Night: <span className="font-bold text-indigo-400">{row.shift_requirements?.night_shift_guards || 1}</span></p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Facility Status',
      accessorKey: 'is_active',
      render: (row) => <StatusBadge status={row.is_active ? 'ACTIVE' : 'INACTIVE'} />,
    },
    ...(role === 'ADMIN'
      ? [
          {
            id: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setEditingSite(row);
                    setModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                  title="Edit Site"
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
            {role === 'CLIENT'
              ? 'My Protected Facilities & Quotas'
              : role === 'STAFF'
              ? 'Facility Deployment Posts'
              : 'Deployment Sites & Facilities'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'CLIENT'
              ? 'Active facility locations, post deployment addresses, and contracted day/night security quotas.'
              : role === 'STAFF'
              ? 'Official client facility locations, gate access perimeters, and assigned shift quotas.'
              : 'Configure surveillance locations, client contracts, and day/night shift guard quotas.'}
          </p>
        </div>
        {role === 'ADMIN' && (
          <button
            onClick={() => {
              setEditingSite(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deployment Site</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={role === 'CLIENT' ? 'My Contracted Sites' : 'Total Facilities'}
          value={scopedSites.length}
          icon={MapPin}
          trend={`${scopedSites.filter((s) => s.is_active).length} Active`}
          glow={role === 'CLIENT' ? 'border-purple-500/30' : 'border-cyan-500/30'}
          sparkline={[2, 3, 3, 4, 4, 4, sites.length]}
        />
        <StatCard
          label="Day Guard Capacity"
          value={`${totalDayQuotas} Posts`}
          icon={Sun}
          trend="08:00 - 20:00 Shift"
          glow="border-amber-500/30"
          sparkline={[4, 5, 6, 7, 8, 8, totalDayQuotas]}
        />
        <StatCard
          label="Night Patrol Capacity"
          value={`${totalNightQuotas} Posts`}
          icon={Moon}
          trend="20:00 - 08:00 Shift"
          glow="border-indigo-500/30"
          sparkline={[4, 4, 5, 6, 7, 7, totalNightQuotas]}
        />
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search by facility name, site code, city..."
        viewMode={viewMode}
        setViewMode={setViewMode}
        filters={[
          {
            name: 'client',
            value: clientFilter,
            options: [
              { value: 'ALL', label: 'All Client Companies' },
              ...clients.map((c) => ({ value: String(c.id), label: c.company_name })),
            ],
          },
        ]}
        onFilterChange={(_, val) => setClientFilter(val)}
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map((site) => {
            const client = clients.find((c) => c.id === site.client_id);
            const activeRosters = rosters.filter((r) => r.site_id === site.id);

            return (
              <div
                key={site.id}
                onClick={() => setSelectedSite(site)}
                className="cyber-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4 bg-slate-950/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                        {site.site_name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {client?.company_name || `Client #${site.client_id}`}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
                    {site.site_code}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <p className="line-clamp-1">{site.address}</p>
                  <p className="text-slate-300">
                    {site.city}, {site.state} — {site.postal_code}
                  </p>
                  {site.contact_phone && (
                    <p className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {site.contact_phone}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Sun className="w-3.5 h-3.5" /> Day Shift Quota:
                    </span>
                    <span className="font-mono font-bold text-white">{site.shift_requirements?.day_shift_guards || 1} Guards</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-indigo-300">
                      <Moon className="w-3.5 h-3.5" /> Night Shift Quota:
                    </span>
                    <span className="font-mono font-bold text-white">{site.shift_requirements?.night_shift_guards || 1} Guards</span>
                  </div>
                  {site.shift_requirements?.supervisor_required && (
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 pt-1 border-t border-slate-800">
                      <ShieldCheck className="w-3 h-3" /> Dedicated Site Supervisor Assigned
                    </p>
                  )}
                </div>

                <div
                  className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                    {activeRosters.length} Active Shifts
                  </span>
                  <button
                    onClick={() => {
                      setEditingSite(site);
                      setModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredSites}
          onRowClick={(row) => setSelectedSite(row)}
          emptyTitle="No Deployment Sites Found"
          emptyMessage="No facility locations match the selected criteria."
        />
      )}

      <DetailDrawer
        isOpen={!!selectedSite}
        onClose={() => setSelectedSite(null)}
        title={selectedSite?.site_name || 'Site Dossier'}
        subtitle={`Code: ${selectedSite?.site_code} | City: ${selectedSite?.city}`}
        data={{
          ...selectedSite,
          day_guards: selectedSite?.shift_requirements?.day_shift_guards,
          night_guards: selectedSite?.shift_requirements?.night_shift_guards,
          supervisor: selectedSite?.shift_requirements?.supervisor_required ? 'YES' : 'NO',
        }}
        type="DEPLOYMENT FACILITY"
        actions={
          <button
            onClick={() => {
              setEditingSite(selectedSite);
              setSelectedSite(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Facility</span>
          </button>
        }
      />

      <SiteModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSite(null);
        }}
        onSave={handleSaveSite}
        clients={clients}
        site={editingSite}
      />
    </MainLayout>
  );
}
