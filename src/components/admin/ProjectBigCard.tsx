import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
  Search,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Tag,
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
}

export const ProjectBigCard: React.FC<ProjectBigCardProps> = ({
  project,
  isInitiallyExpanded = false,
  onTogglePublish,
  onEdit,
  onDelete,
  onActionClick,
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
      className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
        isExpanded ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* BIG BOX HEADER */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 sm:p-8 cursor-pointer select-none space-y-6"
      >
        {/* TOP ROW: BADGES & EXPAND PROMPT */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Approval Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                isFarmland
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isFarmland ? (
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              )}
              {approvalType}
            </span>

            {/* Publication Status Pill */}
            {onTogglePublish ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePublish(project);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  project.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title="Click to toggle publish status"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    project.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span className="capitalize">{project.status}</span>
              </button>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  project.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    project.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span className="capitalize">{project.status}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="hidden sm:inline">
              {isExpanded ? 'Click to close details' : 'Click to view size & pricing breakdown'}
            </span>
            <div
              className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 bg-emerald-100 text-emerald-800' : ''
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* PROJECT NAME & LOCATION */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            {project.name}
          </h2>
          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{project.city}, {project.state}</span>
            </span>
            {project.total_land_area && (
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                <span>•</span>
                <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {project.total_land_area}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* BIG BOX PLOT COUNTERS - MINIMAL & EASY TO UNDERSTAND */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* AVAILABLE PLOTS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Available</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950 mt-1.5">
              {stats.availablePlots}
              <span className="text-xs font-bold text-emerald-700 ml-1.5">plots</span>
            </div>
          </div>

          {/* SOLD PLOTS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-800">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Sold</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-rose-950 mt-1.5">
              {stats.soldPlots}
              <span className="text-xs font-bold text-rose-700 ml-1.5">plots</span>
            </div>
          </div>

          {/* BOOKED PLOTS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Booked</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-950 mt-1.5">
              {stats.bookedPlots + stats.onHoldPlots}
              <span className="text-xs font-bold text-amber-700 ml-1.5">plots</span>
            </div>
          </div>

          {/* TOTAL PLOTS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Total Plots</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-1.5">
              {stats.totalPlots}
              <span className="text-xs font-bold text-slate-500 ml-1.5">plots</span>
            </div>
          </div>
        </div>

        {/* PRICING & INVENTORY PROGRESS */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-semibold">Pricing:</span>
            <span className="text-base sm:text-lg font-black text-slate-900">
              {stats.minPrice
                ? stats.maxPrice && stats.maxPrice !== stats.minPrice
                  ? `${formatPriceCompact(stats.minPrice)} – ${formatPriceCompact(stats.maxPrice)}`
                  : formatINR(stats.minPrice)
                : 'Prices on Request'}
            </span>
            {stats.avgRatePerCent && (
              <span className="text-xs text-slate-500 font-medium">
                (Avg: <strong className="text-slate-800">{formatINR(stats.avgRatePerCent)}</strong>/cent)
              </span>
            )}
          </div>

          {stats.totalPlots > 0 && (
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="text-emerald-700">{availPct}% Available</span>
              <span>•</span>
              <span className="text-rose-700">{soldPct}% Sold</span>
              {bookedPct > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-700">{bookedPct}% Booked</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* PROGRESS BAR */}
        {stats.totalPlots > 0 && (
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${availPct}%` }}
              className="bg-emerald-500 h-full"
              title={`Available: ${availPct}%`}
            />
            <div
              style={{ width: `${bookedPct}%` }}
              className="bg-amber-400 h-full"
              title={`Booked: ${bookedPct}%`}
            />
            <div
              style={{ width: `${soldPct}%` }}
              className="bg-rose-500 h-full"
              title={`Sold: ${soldPct}%`}
            />
          </div>
        )}
      </div>

      {/* EXPANDED DETAILS INSIDE THE CARD - CLEAN WHITE THEMED */}
      {isExpanded && (
        <div className="bg-slate-50/70 border-t border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          {/* SECTION 1: SIZE & DIMENSIONS */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-emerald-600" />
              <span>Project Size & Land Area Details</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 block uppercase">Total Land Area</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {project.total_land_area || 'Not specified'}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 block uppercase">Plot Size Range</span>
                <span className="text-base font-black text-emerald-700 mt-1 block">
                  {stats.minAreaCents
                    ? `${stats.minAreaCents} – ${stats.maxAreaCents} Cents`
                    : 'Varies'}
                </span>
                {stats.minAreaSqft && (
                  <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                    ({stats.minAreaSqft} – {stats.maxAreaSqft} Sq.Ft.)
                  </span>
                )}
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 block uppercase">Total Layout Plots</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {stats.totalPlots} Registered Plots
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 block uppercase">Approval Status</span>
                <span className="text-base font-black text-amber-700 mt-1 block">
                  {approvalType}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: PRICING & VALUATION */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Pricing & Valuation Breakdown</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 block uppercase">Starting Price</span>
                <span className="text-base sm:text-lg font-black text-emerald-700 mt-1 block">
                  {formatINR(stats.minPrice)}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 block uppercase">Highest Price</span>
                <span className="text-base sm:text-lg font-black text-slate-900 mt-1 block">
                  {formatINR(stats.maxPrice)}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 block uppercase">Average Rate / Cent</span>
                <span className="text-base sm:text-lg font-black text-blue-700 mt-1 block">
                  {formatINR(stats.avgRatePerCent)}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 block uppercase">Total Valuation</span>
                <span className="text-base sm:text-lg font-black text-slate-900 mt-1 block">
                  {formatPriceCompact(stats.totalValuation)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: LOCATION & CONTACT */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block">Address & Location</span>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {project.address || `${project.city}, ${project.state}`}
                  {project.postal_code && ` - ${project.postal_code}`}
                </p>
              </div>

              {getProjectMapLink(project) && (
                <a
                  href={getProjectMapLink(project)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-colors text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {(project.contact_information?.phone || project.contact_information?.email || project.contact_information?.sales_office) && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-5 text-xs text-slate-600 flex-wrap">
                {project.contact_information.phone && (
                  <span>📞 <strong>{project.contact_information.phone}</strong></span>
                )}
                {project.contact_information.email && (
                  <span>✉️ <strong>{project.contact_information.email}</strong></span>
                )}
                {project.contact_information.sales_office && (
                  <span>🏢 Office: <strong>{project.contact_information.sales_office}</strong></span>
                )}
              </div>
            )}
          </div>

          {/* SECTION 4: PLOT-BY-PLOT BREAKDOWN LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-purple-600" />
                <span>Plot Inventory Breakdown ({project.plots?.length || 0} plots)</span>
              </h3>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5">
                {(['all', 'available', 'booked', 'sold'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlotStatusFilter(st);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      plotStatusFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search plot number */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search plot number, facing direction..."
                value={plotSearchQuery}
                onChange={(e) => setPlotSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Plots List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {displayPlots.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 bg-white rounded-2xl border border-slate-200">
                  No plots match the selected filter.
                </p>
              ) : (
                displayPlots.map((plot) => (
                  <div
                    key={plot.id}
                    className="p-3 sm:p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between text-xs transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                        Plot {plot.plot_number}
                      </span>
                      <div className="text-xs text-slate-600">
                        <span className="font-bold text-slate-900">{plot.area_cents} Cents</span>
                        <span className="text-slate-400"> ({plot.area_sqft || centsToSqft(plot.area_cents)} sqft)</span>
                        {plot.facing && (
                          <span className="ml-2 font-medium text-slate-500">• {plot.facing} Facing</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <span className="font-black text-slate-900 text-xs sm:text-sm">
                        {formatINR(plot.price_inr)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          plot.status === 'available'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : plot.status === 'sold'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
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

          {/* SECTION 5: ACTION BUTTONS */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-3">
              Management Shortcuts
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <Link
                to={`/admin/projects/${project.id}/layout`}
                onClick={onActionClick}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center shadow-2xs hover:border-slate-300"
              >
                <PenTool className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>CAD Layout</span>
              </Link>

              <Link
                to={`/admin/projects/${project.id}/plots`}
                onClick={onActionClick}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center shadow-2xs hover:border-slate-300"
              >
                <Grid className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Plots</span>
              </Link>

              <Link
                to={`/admin/projects/${project.id}/bookings`}
                onClick={onActionClick}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center shadow-2xs hover:border-slate-300"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Bookings</span>
              </Link>

              <Link
                to={`/admin/projects/${project.id}/documents`}
                onClick={onActionClick}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center shadow-2xs hover:border-slate-300"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Documents</span>
              </Link>

              {onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center shadow-2xs hover:border-slate-300"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Edit</span>
                </button>
              ) : (
                <Link
                  to={`/admin/projects/${project.id}/edit`}
                  onClick={onActionClick}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center shadow-2xs hover:border-slate-300"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Edit</span>
                </Link>
              )}

              <Link
                to={`/projects/${project.slug}`}
                target="_blank"
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Live Site</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
