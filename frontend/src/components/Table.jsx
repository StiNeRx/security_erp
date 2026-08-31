import { useState } from 'react';
import { ChevronUp, ChevronDown, Inbox } from 'lucide-react';

export default function Table({
  columns,
  data = [],
  onRowClick = null,
  emptyMessage = 'No records matched current operational parameters',
  emptyTitle = 'No Data Found',
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(key) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc 
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  if (!data || data.length === 0) {
    return (
      <div className="py-16 text-center cyber-panel rounded-2xl border border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-3">
          <Inbox className="w-7 h-7" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">{emptyTitle}</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto cyber-panel rounded-2xl border border-slate-800">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/60">
            {columns.map((col) => (
              <th
                key={col.id || col.accessorKey}
                onClick={() => col.accessorKey && handleSort(col.accessorKey)}
                className={`px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider ${
                  col.accessorKey ? 'cursor-pointer hover:text-cyan-400 select-none' : ''
                } ${col.className || ''}`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{col.header}</span>
                  {col.accessorKey && sortKey === col.accessorKey && (
                    sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {sortedData.map((row, idx) => (
            <tr
              key={row.id || idx}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors duration-150 ${
                onRowClick ? 'cursor-pointer hover:bg-cyan-950/20 hover:border-l-2 hover:border-l-cyan-400' : 'hover:bg-slate-900/40'
              }`}
            >
              {columns.map((col) => {
                const cellValue = col.render ? col.render(row) : row[col.accessorKey];
                return (
                  <td
                    key={col.id || col.accessorKey}
                    className={`px-5 py-3.5 text-xs text-slate-300 ${col.cellClassName || ''}`}
                  >
                    {cellValue ?? '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}