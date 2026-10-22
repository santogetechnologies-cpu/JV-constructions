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
  const [newFacing, setNewFacing] = useState<PlotFacing>('East');
  const [newPrice, setNewPrice] = useState('2500000');
  const [newStatus, setNewStatus] = useState<PlotStatus>('available');

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
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
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
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Edit Project Details"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Project Settings</span>
          </Link>

          <Link
            to={`/admin/projects/${projectId}/layout`}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open Editor</span>
          </Link>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <label className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          <button
            onClick={() => setIsAddingPlot(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
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

      {/* PLOTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto mb-2" />
            Loading plot records...
          </div>
        ) : filteredPlots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Plot #</th>
                  <th className="py-3.5 px-4">Area (Cents)</th>
                  <th className="py-3.5 px-4">Area (Sq.Ft)</th>
                  <th className="py-3.5 px-4">Facing</th>
                  <th className="py-3.5 px-4">Price (INR)</th>
                  <th className="py-3.5 px-4">Inventory Status</th>
                  <th className="py-3.5 px-4">Geometry</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlots.map((plot) => (
                  <tr key={plot.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-black text-slate-950 text-base">
                      #{plot.plot_number}
                    </td>
                    <td className="py-4 px-4 font-black text-slate-950">{plot.area_cents} Cent</td>
                    <td className="py-4 px-4 text-slate-700 font-mono font-bold text-xs">({plot.area_sqft} sq.ft)</td>
                    <td className="py-4 px-4 font-bold text-slate-900">{plot.facing}</td>
                    <td className="py-4 px-4 font-black text-slate-950">
                      {formatINR(plot.price_inr)}
                    </td>
                    <td className="py-4 px-4">
                      {/* ATOMIC STATUS DROPDOWN */}
                      <select
                        value={plot.status}
                        onChange={(e) => handleStatusChange(plot.id, e.target.value as PlotStatus)}
                        className={`text-xs font-black rounded-lg px-2.5 py-1.5 border focus:outline-none shadow-xs ${
                          plot.status === 'available'
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                            : plot.status === 'booked'
                            ? 'bg-blue-50 text-blue-950 border-blue-300'
                            : plot.status === 'on_hold'
                            ? 'bg-orange-50 text-orange-950 border-orange-300'
                            : plot.status === 'sold'
                            ? 'bg-rose-50 text-rose-950 border-rose-300'
                            : 'bg-yellow-50 text-yellow-950 border-yellow-300'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                        <option value="on_hold">On Hold</option>
                        <option value="sold">Sold</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      {plot.geometry?.coordinates ? (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {plot.geometry.coordinates.length} pts
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">No Vector</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeletePlot(plot.id, plot.plot_number)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete Plot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {/* ADD PLOT MODAL */}
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
                    onChange={(e) => setNewAreaCents(e.target.value)}
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
                <label className="block font-bold text-slate-700 mb-1">Price (INR)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
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
