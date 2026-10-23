import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  PenTool,
  Settings,
  Pencil,
  X,
} from 'lucide-react';
import { Plot, Project, PlotStatus, PlotFacing } from '../../types/database';
import {
  getProjectById,
  getPlotsWithGeometries,
  updatePlotStatusAtomic,
  createOrUpdatePlot,
  deletePlot,
} from '../../services/api';
import { formatINR, centsToSqft, getStatusLabel } from '../../lib/utils';

export const AdminProjectPlotsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New plot modal / drawer state
  const [isAddingPlot, setIsAddingPlot] = useState(false);
  const [newPlotNumber, setNewPlotNumber] = useState('');
  const [newAreaCents, setNewAreaCents] = useState('2.5');
  const [newRatePerCent, setNewRatePerCent] = useState('75000');
  const [newFacing, setNewFacing] = useState<PlotFacing>('East');
  const [newPrice, setNewPrice] = useState('187500');
  const [newStatus, setNewStatus] = useState<PlotStatus>('available');

  // Edit plot modal state
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [editPlotNumber, setEditPlotNumber] = useState('');
  const [editAreaCents, setEditAreaCents] = useState('2.5');
  const [editRatePerCent, setEditRatePerCent] = useState('75000');
  const [editFacing, setEditFacing] = useState<PlotFacing>('East');
  const [editPrice, setEditPrice] = useState('2500000');
  const [editStatus, setEditStatus] = useState<PlotStatus>('available');
  const [isUpdating, setIsUpdating] = useState(false);

  const startEditPlot = (plot: Plot) => {
    setEditingPlot(plot);
    setEditPlotNumber(plot.plot_number);
    const centsStr = String(plot.area_cents ?? 2.5);
    setEditAreaCents(centsStr);
    const priceVal = plot.price_inr ?? 0;
    setEditPrice(priceVal ? String(priceVal) : '');
    const centsVal = parseFloat(centsStr) || 0;
    const rate = centsVal > 0 && priceVal > 0 ? Math.round(priceVal / centsVal) : 75000;
    setEditRatePerCent(String(rate));
    setEditFacing(plot.facing);
    setEditStatus(plot.status);
  };

  // Auto calculate price for Edit Modal
  const handleEditCentsChange = (val: string) => {
    setEditAreaCents(val);
    const c = parseFloat(val);
    const r = parseFloat(editRatePerCent);
    if (!isNaN(c) && !isNaN(r) && c > 0 && r > 0) {
      setEditPrice(String(Math.round(c * r)));
    }
  };

  const handleEditRateChange = (val: string) => {
    setEditRatePerCent(val);
    const c = parseFloat(editAreaCents);
    const r = parseFloat(val);
    if (!isNaN(c) && !isNaN(r) && c > 0 && r > 0) {
      setEditPrice(String(Math.round(c * r)));
    }
  };

  const handleEditPriceChange = (val: string) => {
    setEditPrice(val);
    const p = parseFloat(val);
    const c = parseFloat(editAreaCents);
    if (!isNaN(p) && !isNaN(c) && c > 0 && p > 0) {
      setEditRatePerCent(String(Math.round(p / c)));
    }
  };

  // Auto calculate price for Add Modal
  const handleNewCentsChange = (val: string) => {
    setNewAreaCents(val);
    const c = parseFloat(val);
    const r = parseFloat(newRatePerCent);
    if (!isNaN(c) && !isNaN(r) && c > 0 && r > 0) {
      setNewPrice(String(Math.round(c * r)));
    }
  };

  const handleNewRateChange = (val: string) => {
    setNewRatePerCent(val);
    const c = parseFloat(newAreaCents);
    const r = parseFloat(val);
    if (!isNaN(c) && !isNaN(r) && c > 0 && r > 0) {
      setNewPrice(String(Math.round(c * r)));
    }
  };

  const handleNewPriceChange = (val: string) => {
    setNewPrice(val);
    const p = parseFloat(val);
    const c = parseFloat(newAreaCents);
    if (!isNaN(p) && !isNaN(c) && c > 0 && p > 0) {
      setNewRatePerCent(String(Math.round(p / c)));
    }
  };

  const handleUpdatePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !editingPlot) return;

    const num = parseInt(editPlotNumber.trim(), 10);
    if (isNaN(num) || num < 1 || num > 63) {
      setNotice({ type: 'error', text: 'Plot number must be between 1 and 63 only.' });
      return;
    }

    const cents = parseFloat(editAreaCents);
    if (isNaN(cents) || cents <= 0) {
      setNotice({ type: 'error', text: 'Please enter a valid area in cents (greater than 0).' });
      return;
    }

    try {
      setIsUpdating(true);
      const updated = await createOrUpdatePlot({
        id: editingPlot.id,
        project_id: project.id,
        plot_number: String(num),
        area_cents: cents,
        area_sqft: centsToSqft(cents),
        facing: editFacing,
        price_inr: editPrice ? parseFloat(editPrice) : null,
        status: editStatus,
      });

      setPlots((prev) => prev.map((p) => (p.id === editingPlot.id ? { ...p, ...updated } : p)));
      setEditingPlot(null);
      setNotice({ type: 'success', text: `Plot #${updated.plot_number} updated successfully!` });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to update plot' });
    } finally {
      setIsUpdating(false);
    }
  };

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const proj = await getProjectById(projectId);
      setProject(proj);

      const pList = await getPlotsWithGeometries(projectId);
      setPlots(pList);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to load plots' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Handle single status change
  const handleStatusChange = async (plotId: string, status: PlotStatus) => {
    try {
      await updatePlotStatusAtomic(plotId, status, 'Admin updated status from inventory table');
      setPlots((prev) =>
        prev.map((p) => (p.id === plotId ? { ...p, status } : p))
      );
      setNotice({ type: 'success', text: `Plot status updated to ${status}` });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to update status' });
    }
  };

  // Delete plot
  const handleDeletePlot = async (plotId: string, plotNumber: string) => {
    if (!confirm(`Are you sure you want to delete Plot #${plotNumber}?`)) return;
    try {
      await deletePlot(plotId);
      setPlots((prev) => prev.filter((p) => p.id !== plotId));
      setNotice({ type: 'success', text: `Plot #${plotNumber} deleted.` });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to delete plot' });
    }
  };

  // Create new plot manually
  const handleCreatePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newPlotNumber.trim()) return;

    const num = parseInt(newPlotNumber.trim(), 10);
    if (isNaN(num) || num < 1 || num > 63) {
      setNotice({ type: 'error', text: 'Plot number must be between 1 and 63 only.' });
      return;
    }

    const cents = parseFloat(newAreaCents) || 2.5;
    try {
      const created = await createOrUpdatePlot({
        project_id: project.id,
        plot_number: String(num),
        area_cents: cents,
        area_sqft: centsToSqft(cents),
        facing: newFacing,
        price_inr: newPrice ? parseFloat(newPrice) : null,
        status: newStatus,
      });

      setPlots((prev) => [...prev, created]);
      setIsAddingPlot(false);
      setNewPlotNumber('');
      setNotice({ type: 'success', text: `Plot #${created.plot_number} created!` });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to create plot' });
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (plots.length === 0) return;
    const headers = ['Plot Number', 'Area (Cents)', 'Area (SqFt)', 'Facing', 'Price (INR)', 'Status'];
    const rows = plots.map((p) => [
      `"${p.plot_number}"`,
      p.area_cents,
      p.area_sqft,
      `"${p.facing}"`,
      p.price_inr || '',
      `"${p.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${project?.slug || 'project'}_plot_inventory.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error('CSV is empty or lacks data rows');

      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 2 && cols[0]) {
          const plotNum = cols[0];
          const cents = parseFloat(cols[1]) || 2.5;
          const facing = (cols[3] || 'East') as PlotFacing;
          const price = parseFloat(cols[4]) || 2500000;
          const status = (cols[5] || 'available') as PlotStatus;

          await createOrUpdatePlot({
            project_id: project.id,
            plot_number: plotNum,
            area_cents: cents,
            area_sqft: centsToSqft(cents),
            facing,
            price_inr: price,
            status,
          });
          importedCount++;
        }
      }

      setNotice({ type: 'success', text: `Imported ${importedCount} plots from CSV successfully!` });
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'CSV Import failed' });
    }
  };

  const filteredPlots = useMemo(() => {
    return plots.filter((p) => {
      const matchSearch = p.plot_number.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [plots, search, statusFilter]);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Plot Inventory Manager: {project?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage plot numbers, sizes, pricing, and live inventory availability.
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/admin/projects/${projectId}/edit`}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Edit Project Details"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden xs:inline">Project Settings</span>
          </Link>

          <Link
            to={`/admin/projects/${projectId}/layout`}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open Layout CAD</span>
          </Link>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden xs:inline">Export CSV</span>
          </button>

          <label className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden xs:inline">Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          <button
            onClick={() => setIsAddingPlot(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Plot</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-start gap-2 border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* SEARCH & STATUS FILTER */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by plot number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Statuses ({plots.length})</option>
          <option value="available">Available</option>
          <option value="booked">Booked</option>
          <option value="on_hold">On Hold</option>
          <option value="sold">Sold / Registered</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* PLOTS TABLE — Freezes plot # and header on mobile, smooth scrolling */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto mb-2" />
            Loading plot records...
          </div>
        ) : filteredPlots.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-[72vh] relative" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] shadow-xs">
                <tr>
                  <th className="py-3.5 px-6 sticky left-0 z-30 bg-slate-50 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">Plot #</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Area (Cents)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Area (Sq.Ft)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Facing</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Price (INR)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Inventory Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Geometry</th>
                  <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlots.map((plot) => (
                  <tr key={plot.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6 font-black text-slate-950 text-base sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap">
                      #{plot.plot_number}
                    </td>
                    <td className="py-4 px-4 font-black text-slate-950 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{plot.area_cents} Cent</span>
                        <button
                          type="button"
                          onClick={() => startEditPlot(plot)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-1 rounded transition-opacity"
                          title="Edit Area Cents"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-mono font-bold text-xs whitespace-nowrap">({plot.area_sqft} sq.ft)</td>
                    <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">{plot.facing}</td>
                    <td className="py-4 px-4 font-black text-slate-950 whitespace-nowrap">
                      {formatINR(plot.price_inr)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {/* ATOMIC STATUS DROPDOWN */}
                      <select
                        value={plot.status}
                        onChange={(e) => handleStatusChange(plot.id, e.target.value as PlotStatus)}
                        className={`text-xs font-black rounded-lg px-2.5 py-1.5 border focus:outline-none shadow-xs ${
                          plot.status === 'available'
                            ? 'bg-[#4efa34]/15 text-emerald-950 border-[#4efa34]/40'
                            : plot.status === 'booked'
                            ? 'bg-[#343efa]/15 text-blue-950 border-[#343efa]/40'
                            : plot.status === 'on_hold'
                            ? 'bg-[#f3fa34]/25 text-amber-950 border-[#f3fa34]/50'
                            : plot.status === 'sold'
                            ? 'bg-[#fa348a]/15 text-rose-950 border-[#fa348a]/40'
                            : 'bg-[#f3fa34]/25 text-yellow-950 border-[#f3fa34]/50'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                        <option value="on_hold">On Hold</option>
                        <option value="sold">Sold / Registered</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {plot.geometry?.coordinates ? (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {plot.geometry.coordinates.length} pts
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">No Vector</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditPlot(plot)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Plot Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlot(plot.id, plot.plot_number)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Plot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No plots found. Use "Add Plot" or import via CSV / CAD upload.
          </div>
        )}
      </div>

      {/* EDIT PLOT MODAL WITH AUTOMATIC AMOUNT CALCULATION */}
      {editingPlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Edit Plot #{editingPlot.plot_number} Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update area in cents, price per cent, facing, and inventory status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlot(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlot} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plot Number * (1 - 63)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15"
                  value={editPlotNumber}
                  onChange={(e) => setEditPlotNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area (Cents) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editAreaCents}
                    onChange={(e) => handleEditCentsChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calculated Sq.Ft</label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono font-bold">
                    {centsToSqft(parseFloat(editAreaCents) || 0)} sq.ft
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate / Cent (INR) *</label>
                  <input
                    type="number"
                    value={editRatePerCent}
                    onChange={(e) => handleEditRateChange(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calculated Total Price</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => handleEditPriceChange(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-50/60 border border-emerald-300 rounded-lg text-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {editPrice && !isNaN(parseFloat(editPrice)) && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">Formatted Price:</span>
                  <span className="text-sm font-black text-emerald-600">
                    {formatINR(parseFloat(editPrice))}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Facing / Direction</label>
                <select
                  value={editFacing}
                  onChange={(e) => setEditFacing(e.target.value as PlotFacing)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West', 'Other'].map(
                    (f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Inventory Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as PlotStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="on_hold">On Hold</option>
                  <option value="sold">Sold / Registered</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlot(null)}
                  className="px-3.5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PLOT MODAL WITH AUTOMATIC AMOUNT CALCULATION */}
      {isAddingPlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in fade-in">
            <h3 className="font-extrabold text-base text-slate-900 mb-4">Add Single Plot Record</h3>
            <form onSubmit={handleCreatePlot} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plot Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 105"
                  value={newPlotNumber}
                  onChange={(e) => setNewPlotNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area (Cents) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAreaCents}
                    onChange={(e) => handleNewCentsChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calculated Sq.Ft</label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono">
                    {centsToSqft(parseFloat(newAreaCents) || 0)} sq.ft
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate / Cent (INR)</label>
                  <input
                    type="number"
                    value={newRatePerCent}
                    onChange={(e) => handleNewRateChange(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Price (INR)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => handleNewPriceChange(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-50/60 border border-emerald-300 rounded-lg text-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {newPrice && !isNaN(parseFloat(newPrice)) && (
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">Calculated:</span>
                  <span className="text-xs font-black text-emerald-600">
                    {formatINR(parseFloat(newPrice))}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Facing</label>
                <select
                  value={newFacing}
                  onChange={(e) => setNewFacing(e.target.value as PlotFacing)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West', 'Other'].map(
                    (f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PlotStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="on_hold">On Hold</option>
                  <option value="sold">Sold</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingPlot(false)}
                  className="px-3.5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Save Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
