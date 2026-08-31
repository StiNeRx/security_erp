import { Search, Filter, LayoutGrid, List, Download } from 'lucide-react';

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  filters = [],
  onFilterChange,
  placeholder = 'Search operations telemetry...',
  viewMode = null,
  setViewMode = null,
  onExport = null,
}) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
      {/* Search Input with Cyber Look */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/70" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full cyber-input pl-10 h-11 text-sm placeholder:text-slate-500 border border-slate-800 hover:border-slate-700"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <div key={filter.name} className="relative flex items-center">
            <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={filter.value}
              onChange={(e) => onFilterChange(filter.name, e.target.value)}
              className="cyber-input pl-8 pr-8 py-2 text-xs font-medium appearance-none cursor-pointer bg-slate-900 border-slate-800 hover:border-slate-700"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* View Mode Toggle (Optional) */}
        {viewMode && setViewMode && (
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Export Data Button */}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}
      </div>
    </div>
  );
}