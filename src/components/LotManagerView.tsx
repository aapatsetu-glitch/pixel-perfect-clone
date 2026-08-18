import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Consignment } from '../types';
import { 
  Layers, Package, Search, Plus, Filter, 
  ArrowRight, FileSpreadsheet, Download, RefreshCw,
  Tag, CheckCircle2, ChevronRight, Hash, Building2
} from 'lucide-react';
import { formatNumber } from '../lib/utils';
import ExcelTable from './ExcelTable';
import EditConsignmentModal from './EditConsignmentModal';

export default function LotManagerView() {
  const [data, setData] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConsignment, setEditingConsignment] = useState<Consignment | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getConsignments();
      setData(res);
    } catch (err) {
      console.error('Failed to load consignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditSave = async (id: string, updates: Partial<Consignment>) => {
    await api.updateConsignment(id, updates);
    setData(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete consignment?')) return;
    await api.deleteConsignment(id);
    setData(prev => prev.filter(c => c.id !== id));
  };

  // Group by Lot Number
  const lotGroups = useMemo(() => {
    const map = new Map<string, {
      lotNo: string;
      consignments: Consignment[];
      totalCtn: number;
      totalCbm: number;
      totalGw: number;
      clients: Set<string>;
      origins: Set<string>;
      statusSummary: Set<string>;
    }>();

    data.forEach(c => {
      const lotKey = (c.lotNo?.trim() || 'UNASSIGNED').toUpperCase();
      if (!map.has(lotKey)) {
        map.set(lotKey, {
          lotNo: lotKey,
          consignments: [],
          totalCtn: 0,
          totalCbm: 0,
          totalGw: 0,
          clients: new Set(),
          origins: new Set(),
          statusSummary: new Set()
        });
      }

      const group = map.get(lotKey)!;
      group.consignments.push(c);
      group.totalCtn += (c.totalCtn || 0);
      group.totalCbm += (c.cbm || 0);
      group.totalGw += (c.gw || 0);
      if (c.clientName) group.clients.add(c.clientName);
      if (c.origin) group.origins.add(c.origin);
      if (c.status) group.statusSummary.add(c.status);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.lotNo === 'UNASSIGNED') return 1;
      if (b.lotNo === 'UNASSIGNED') return -1;
      return b.totalCbm - a.totalCbm;
    });
  }, [data]);

  // Filtered lots
  const filteredLots = useMemo(() => {
    if (!searchQuery.trim()) return lotGroups;
    const q = searchQuery.toLowerCase();
    return lotGroups.filter(lg => 
      lg.lotNo.toLowerCase().includes(q) ||
      Array.from(lg.clients).some((c: string) => c.toLowerCase().includes(q)) ||
      Array.from(lg.origins).some((o: string) => o.toLowerCase().includes(q))
    );
  }, [lotGroups, searchQuery]);

  if (selectedLot) {
    const lotData = data.filter(c => (c.lotNo?.trim() || 'UNASSIGNED').toUpperCase() === selectedLot);
    const lotInfo = lotGroups.find(l => l.lotNo === selectedLot);

    return (
      <div className="space-y-6 w-full animate-in fade-in duration-200">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedLot(null)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors font-bold text-sm shadow-xs"
            >
              ← Back to Lots
            </button>
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-700 uppercase tracking-wider">
                <span>Lot Batch Manifest</span>
                <span>•</span>
                <span>{selectedLot === 'UNASSIGNED' ? 'Unassigned Consignments' : `Lot #${selectedLot}`}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                {selectedLot === 'UNASSIGNED' ? 'Pending Lot Assignment' : `Lot Batch: ${selectedLot}`}
              </h2>
            </div>
          </div>

          {lotInfo && (
            <div className="flex items-center gap-3">
              <div className="bg-teal-50 border border-teal-200 px-4 py-2 rounded-xl text-right">
                <span className="text-[10px] font-bold uppercase text-teal-800 block">Lot Batch Total</span>
                <span className="text-sm font-black text-teal-950">
                  {formatNumber(lotInfo.totalCtn)} CTN • {formatNumber(lotInfo.totalCbm)} CBM
                </span>
              </div>
            </div>
          )}
        </div>

        <ExcelTable
          data={lotData}
          title={`ADO International - Lot Manifest: ${selectedLot}`}
          subtitle={`Consignments clustered under batch ${selectedLot}`}
          filenamePrefix={`Lot_${selectedLot}`}
          onEdit={setEditingConsignment}
          onDelete={handleDelete}
          onInlineUpdate={handleEditSave}
          showActions={true}
        />

        {editingConsignment && (
          <EditConsignmentModal
            consignment={editingConsignment}
            onClose={() => setEditingConsignment(null)}
            onSave={handleEditSave}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-inner">
            <Layers size={26} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lot Batch Management</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Organize cargo by dispatch Lot Numbers, track consolidated volumes, and batch manifests
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors flex items-center space-x-2 text-xs font-bold self-start md:self-auto"
        >
          <RefreshCw size={15} />
          <span>Refresh Lots</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by lot number, client, or warehouse origin..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>
        <div className="text-xs font-bold text-slate-600">
          Total Lots: <span className="text-teal-700">{lotGroups.length}</span>
        </div>
      </div>

      {/* Lot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLots.map(lg => {
          const isUnassigned = lg.lotNo === 'UNASSIGNED';
          return (
            <div
              key={lg.lotNo}
              onClick={() => setSelectedLot(lg.lotNo)}
              className={`p-6 rounded-2xl border cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white flex flex-col justify-between ${
                isUnassigned ? 'border-amber-300 bg-amber-50/20' : 'border-slate-300 hover:border-teal-500'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                      isUnassigned ? 'bg-amber-100 text-amber-800' : 'bg-teal-50 text-teal-700 border border-teal-200'
                    }`}>
                      <Hash size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        {isUnassigned ? 'Unassigned Cargo' : `Lot: ${lg.lotNo}`}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {lg.consignments.length} Consignment{lg.consignments.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Volume Total:</span>
                    <span className="font-bold text-slate-800">{formatNumber(lg.totalCtn)} CTN • {formatNumber(lg.totalCbm)} CBM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Weight:</span>
                    <span className="font-bold text-slate-800">{formatNumber(lg.totalGw)} KG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Origins:</span>
                    <span className="font-bold text-slate-800">{Array.from(lg.origins).join(', ') || 'Mixed'}</span>
                  </div>
                </div>

                {lg.clients.size > 0 && (
                  <div className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                    Clients: {Array.from(lg.clients).slice(0, 3).join(', ')}{lg.clients.size > 3 ? '...' : ''}
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
                <span>Open Lot Manifest</span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
