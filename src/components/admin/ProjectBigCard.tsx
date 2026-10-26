import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  MapPin,
  ChevronDown,
  ExternalLink,
  PenTool,
  Grid,
  CalendarCheck,
  FileText,
  Pencil,
  Trash2,
  ShieldCheck,
  Trees,
  Layers,
  DollarSign,
  Maximize2,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { ProjectWithStats, Plot, getProjectApprovalType, getProjectMapLink } from '../../types/database';
import { formatINR, formatPriceCompact, centsToSqft, getStatusLabel } from '../../lib/utils';

interface ProjectBigCardProps {
  project: ProjectWithStats;
  isInitiallyExpanded?: boolean;
  onTogglePublish?: (project: ProjectWithStats) => void;
  onEdit?: (project: ProjectWithStats) => void;
  onDelete?: (project: ProjectWithStats) => void;
  onActionClick?: () => void;
  compactMode?: boolean;
}

export const ProjectBigCard: React.FC<ProjectBigCardProps> = ({
  project,
  isInitiallyExpanded = false,
  onTogglePublish,
  onEdit,
  onDelete,
  onActionClick,
  compactMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [plotSearchQuery, setPlotSearchQuery] = useState('');
  const [plotStatusFilter, setPlotStatusFilter] = useState<'all' | 'available' | 'booked' | 'sold'>('all');

  const approvalType = getProjectApprovalType(project);
  const isFarmland = approvalType.toLowerCase().includes('farm');
  const { stats } = project;

  // Filter plots inside this project if expanded
  const displayPlots = (project.plots || []).filter((plot) => {
    const matchesPlotSearch =
      !plotSearchQuery ||
      plot.plot_number.toLowerCase().includes(plotSearchQuery.toLowerCase()) ||
      plot.facing.toLowerCase().includes(plotSearchQuery.toLowerCase());

    const matchesPlotStatus =
      plotStatusFilter === 'all' || plot.status === plotStatusFilter;

    return matchesPlotSearch && matchesPlotStatus;
  });

  const soldPct = stats.totalPlots > 0 ? Math.round((stats.soldPlots / stats.totalPlots) * 100) : 0;
  const availPct = stats.totalPlots > 0 ? Math.round((stats.availablePlots / stats.totalPlots) * 100) : 0;
  const bookedPct = stats.totalPlots > 0 ? Math.round(((stats.bookedPlots + stats.onHoldPlots) / stats.totalPlots) * 100) : 0;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg ${
        isExpanded
          ? 'bg-[#062419] border-amber-400/60 ring-1 ring-amber-400/30'
          : 'bg-[#051c13] border-emerald-950 hover:border-emerald-700/60 hover:bg-[#072418]'
      }`}
    >
      {/* BIG BOX MAIN HEADER / TRIGGER */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 sm:p-6 cursor-pointer select-none space-y-4"
      >
        {/* Top Row: Approval badge & Publish Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                isFarmland
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-xs'
                  : 'bg-amber-950/90 text-amber-300 border-amber-500/40 shadow-xs'
              }`}
            >
              {isFarmland ? (
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              )}
              {approvalType}
            </span>

            {onTogglePublish ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePublish(project);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border transition-all hover:scale-105 ${
                  project.status === 'published'
                    ? 'bg-emerald-900/60 text-emerald-200 border-emerald-600/50 hover:bg-emerald-800'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Click to toggle publish status"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    project.status === 'published' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{project.status}</span>
              </button>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border ${
                  project.status === 'published'
                    ? 'bg-emerald-900/60 text-emerald-200 border-emerald-600/50'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    project.status === 'published' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{project.status}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300/80">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {isExpanded ? 'Click to Collapse' : 'Click to View Size & Pricing Details'}
            </span>
            <div
              className={`w-8 h-8 rounded-xl bg-emerald-900/40 border border-emerald-800/60 flex items-center justify-center text-amber-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 bg-amber-400/20 border-amber-400/40 text-amber-300' : ''
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* BIG PROJECT NAME */}
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug hover:text-amber-300 transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-emerald-300/80 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{project.city}, {project.state}</span>
            </span>
            {project.total_land_area && (
              <span className="inline-flex items-center gap-1 font-bold text-amber-300/90">
                <span>•</span>
                <span className="bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800/60">
                  {project.total_land_area}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* PROMINENT PLOT COUNTERS DIRECTLY IN THE CARD ITSELF */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
          {/* AVAILABLE PLOTS BADGE */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex flex-col justify-center shadow-inner">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Available</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {stats.availablePlots}
              <span className="text-xs font-bold text-emerald-300/80 ml-1.5">plots</span>
            </div>
          </div>

          {/* SOLD PLOTS BADGE */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex flex-col justify-center shadow-inner">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
              <span>Sold</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {stats.soldPlots}
              <span className="text-xs font-bold text-rose-300/80 ml-1.5">plots</span>
            </div>
          </div>

          {/* BOOKED / ON HOLD BADGE */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 flex flex-col justify-center shadow-inner">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>Booked</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {stats.bookedPlots + stats.onHoldPlots}
              <span className="text-xs font-bold text-amber-300/80 ml-1.5">plots</span>
            </div>
          </div>

          {/* TOTAL PLOTS BADGE */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-[#03150d] border border-emerald-900/80 flex flex-col justify-center shadow-inner">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Total</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {stats.totalPlots}
              <span className="text-xs font-bold text-slate-400 ml-1.5">plots</span>
            </div>
          </div>
        </div>

        {/* PRICING & SIZE SUMMARY SNIPPET */}
        <div className="flex items-center justify-between pt-2 border-t border-emerald-950/60 text-xs sm:text-sm flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Pricing:</span>
            <span className="font-black text-amber-400 text-sm sm:text-base">
              {stats.minPrice
                ? stats.maxPrice && stats.maxPrice !== stats.minPrice
                  ? `${formatPriceCompact(stats.minPrice)} – ${formatPriceCompact(stats.maxPrice)}`
                  : formatINR(stats.minPrice)
                : 'Prices on Request'}
            </span>
          </div>

          {stats.avgRatePerCent && (
            <div className="text-xs font-semibold text-emerald-300/80">
              Avg: <span className="text-white font-bold">{formatINR(stats.avgRatePerCent)}</span>/cent
            </div>
          )}
        </div>

        {/* PROGRESS BAR */}
        {stats.totalPlots > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="h-2 w-full bg-emerald-950 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${soldPct}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title={`Sold: ${soldPct}%`}
              />
              <div
                style={{ width: `${bookedPct}%` }}
                className="bg-amber-400 h-full transition-all duration-500"
                title={`Booked: ${bookedPct}%`}
              />
              <div
                style={{ width: `${availPct}%` }}
                className="bg-emerald-400 h-full transition-all duration-500"
                title={`Available: ${availPct}%`}
              />
            </div>
            <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-400 font-semibold px-0.5">
              <span className="text-emerald-400">{availPct}% Available ({stats.availablePlots})</span>
              <span className="text-amber-400">{bookedPct}% Booked ({stats.bookedPlots + stats.onHoldPlots})</span>
              <span className="text-rose-400">{soldPct}% Sold ({stats.soldPlots})</span>
            </div>
          </div>
        )}
      </div>

      {/* EXPANDED DETAILS INSIDE THE CARD */}
      {isExpanded && (
        <div className="p-5 sm:p-6 bg-[#02100a] border-t border-emerald-950/90 space-y-6 animate-fadeIn">
          {/* SECTION 1: SIZE BREAKDOWN */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4" />
              <span>Project Size & Plot Dimensions Breakdown</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#041c13] border border-emerald-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Land Area</span>
                <span className="text-sm sm:text-base font-extrabold text-white mt-1 block">
                  {project.total_land_area || 'Not specified'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#041c13] border border-emerald-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Plot Size Range (Cents)</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1 block">
                  {stats.minAreaCents
                    ? `${stats.minAreaCents} – ${stats.maxAreaCents} Cents`
                    : 'Varies'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#041c13] border border-emerald-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Plot Size Range (Sq.Ft.)</span>
                <span className="text-sm sm:text-base font-extrabold text-white mt-1 block">
                  {stats.minAreaSqft
                    ? `${stats.minAreaSqft} – ${stats.maxAreaSqft} sqft`
                    : 'Varies'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#041c13] border border-emerald-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Layout Plots</span>
                <span className="text-sm sm:text-base font-extrabold text-amber-300 mt-1 block">
                  {stats.totalPlots} Plots Registered
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: PRICING BREAKDOWN */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>Comprehensive Pricing & Valuation Breakdown</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#041c13] border border-emerald-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting Price</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1 block">
                  {formatINR(stats.minPrice)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#041c13] border border-emerald-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Plot Price</span>
                <span className="text-sm sm:text-base font-extrabold text-amber-400 mt-1 block">
                  {formatINR(stats.maxPrice)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#041c13] border border-emerald-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Rate / Cent</span>
                <span className="text-sm sm:text-base font-extrabold text-white mt-1 block">
                  {formatINR(stats.avgRatePerCent)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#041c13] border border-emerald-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Valuation</span>
                <span className="text-sm sm:text-base font-extrabold text-white mt-1 block">
                  {formatPriceCompact(stats.totalValuation)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: LOCATION & CONTACT */}
          <div className="p-4 rounded-xl bg-[#041c13] border border-emerald-900/60 text-xs space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Address & Location</span>
                <p className="text-slate-200 font-semibold text-xs sm:text-sm mt-0.5">
                  {project.address || `${project.city}, ${project.state}`}
                  {project.postal_code && ` - ${project.postal_code}`}
                </p>
              </div>

              {getProjectMapLink(project) && (
                <a
                  href={getProjectMapLink(project)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-amber-300 font-bold rounded-lg border border-emerald-700/60 transition-colors shrink-0 text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {(project.contact_information?.phone || project.contact_information?.email || project.contact_information?.sales_office) && (
              <div className="flex items-center gap-4 text-xs text-emerald-300/80 pt-1.5 flex-wrap border-t border-emerald-950/60">
                {project.contact_information.phone && (
                  <span>📞 Phone: <span className="text-white font-bold">{project.contact_information.phone}</span></span>
                )}
                {project.contact_information.email && (
                  <span>✉️ Email: <span className="text-white font-bold">{project.contact_information.email}</span></span>
                )}
                {project.contact_information.sales_office && (
                  <span>🏢 Office: <span className="text-white font-bold">{project.contact_information.sales_office}</span></span>
                )}
              </div>
            )}
          </div>

          {/* SECTION 4: PLOT-BY-PLOT BREAKDOWN LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Grid className="w-4 h-4" />
                <span>Plot Inventory Breakdown ({project.plots?.length || 0})</span>
              </h4>

              {/* Plot Filter Buttons */}
              <div className="flex items-center gap-1.5">
                {(['all', 'available', 'booked', 'sold'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlotStatusFilter(st);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold capitalize transition-all ${
                      plotStatusFilter === st
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'bg-emerald-950/80 text-emerald-300/70 hover:text-white border border-emerald-900/50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search in plots */}
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-400/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search plot number, facing direction..."
                value={plotSearchQuery}
                onChange={(e) => setPlotSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-9 pr-3 py-2 bg-[#03140d] border border-emerald-900/60 rounded-xl text-xs text-white placeholder-emerald-400/30 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Plots Grid/List */}
            <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {displayPlots.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No plots found matching the filter criteria.
                </p>
              ) : (
                displayPlots.map((plot) => (
                  <div
                    key={plot.id}
                    className="p-3 rounded-xl bg-[#03150e] border border-emerald-950/80 hover:border-emerald-700/60 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-white bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800/60 text-xs">
                        Plot {plot.plot_number}
                      </span>
                      <div className="text-xs text-slate-400">
                        <span className="text-slate-100 font-bold">{plot.area_cents} Cents</span>
                        <span className="text-slate-500"> ({plot.area_sqft || centsToSqft(plot.area_cents)} sqft)</span>
                        {plot.facing && (
                          <span className="ml-2 text-emerald-400/90 font-semibold">• {plot.facing} Facing</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <span className="font-extrabold text-amber-400 text-xs sm:text-sm">
                        {formatINR(plot.price_inr)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          plot.status === 'available'
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/40'
                            : plot.status === 'sold'
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-600/40'
                            : 'bg-amber-900/60 text-amber-300 border border-amber-600/40'
                        }`}
                      >
                        {getStatusLabel(plot.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 5: DIRECT MANAGEMENT ACTIONS */}
          <div className="pt-3 border-t border-emerald-950/80">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 block mb-2.5">
              Project Management Actions
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <Link
                to={`/admin/projects/${project.id}/layout`}
                onClick={onActionClick}
                className="p-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <PenTool className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>CAD Layout</span>
              </Link>

              <Link
                to={`/admin/projects/${project.id}/plots`}
                onClick={onActionClick}
                className="p-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <Grid className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Plots</span>
              </Link>

              <Link
                to={`/admin/projects/${project.id}/bookings`}
                onClick={onActionClick}
                className="p-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Bookings</span>
              </Link>

              <Link
                to={`/admin/projects/${project.id}/documents`}
                onClick={onActionClick}
                className="p-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Documents</span>
              </Link>

              {onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  className="p-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <Pencil className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Edit</span>
                </button>
              ) : (
                <Link
                  to={`/admin/projects/${project.id}/edit`}
                  onClick={onActionClick}
                  className="p-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <Pencil className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Edit</span>
                </Link>
              )}

              <Link
                to={`/projects/${project.slug}`}
                target="_blank"
                className="p-2.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Live Site</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
