import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Filter,
  MapPin,
  Download,
  Plus,
  X,
  Wifi,
  WifiOff,
  Sparkles,
  Search,
  Trees,
} from 'lucide-react';
import { Project, ProjectLayout, Plot, ProjectDocument, getProjectApprovalType } from '../../types/database';
import {
  getProjectBySlug,
  getPublishedLayout,
  getPlotsWithGeometries,
  getProjectDocuments,
} from '../../services/api';
import { supabase } from '../../lib/supabaseClient';
import { InteractivePlotMap } from '../../components/map/InteractivePlotMap';
import { PlotSelectionCard } from '../../components/map/PlotSelectionCard';
import {
  NammaPlotFilterDrawer,
  MapFilterState,
} from '../../components/map/NammaPlotFilterDrawer';
import { ExclusiveOfferModal } from '../../components/map/ExclusiveOfferModal';
import { ProjectLocationModal } from '../../components/map/ProjectLocationModal';

export const InteractiveMapPage: React.FC = () => {
  const { projectSlug } = useParams<{ projectSlug: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [layout, setLayout] = useState<ProjectLayout | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [isSpeedDialExpanded, setIsSpeedDialExpanded] = useState(false);

  // Filter criteria matching NammaPlot UI
  const [filters, setFilters] = useState<MapFilterState>({
    availability: 'all',
    facing: 'all',
    areaRange: 'all',
  });

  // Initial load
  const loadProjectAndPlots = useCallback(async () => {
    if (!projectSlug) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch project
      const proj = await getProjectBySlug(projectSlug);
      if (!proj) {
        setError('Project not found in database.');
        return;
      }
      setProject(proj);

      // 2. Fetch published layout
      const l = await getPublishedLayout(proj.id);
      setLayout(l);

      // 3. Fetch plots with geometries
      const plotsList = await getPlotsWithGeometries(proj.id, l?.id);
      setPlots(plotsList);

      // 4. Fetch official documents (for download action)
      try {
        const docs = await getProjectDocuments(proj.id);
        setDocuments(docs);
      } catch (docErr) {
        console.warn('Failed to fetch project documents:', docErr);
      }
    } catch (err: any) {
      console.error('Error loading map data:', err);
      setError(err.message || 'Failed to load interactive plot map.');
    } finally {
      setLoading(false);
    }
  }, [projectSlug]);

  useEffect(() => {
    loadProjectAndPlots();
  }, [loadProjectAndPlots]);

  // Real-time synchronization via Supabase Realtime
  useEffect(() => {
    if (!project?.id) return;

    const channel = supabase
      .channel(`customer_map_${project.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'plots',
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          const updatedPlot = payload.new as Plot;
          setPlots((prev) =>
            prev.map((p) =>
              p.id === updatedPlot.id ? { ...p, status: updatedPlot.status, price_inr: updatedPlot.price_inr } : p
            )
          );
          if (selectedPlot?.id === updatedPlot.id) {
            setSelectedPlot((prev) => (prev ? { ...prev, status: updatedPlot.status, price_inr: updatedPlot.price_inr } : null));
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project?.id, selectedPlot?.id]);

  // Filter evaluation logic
  const filteredPlotIds = useMemo(() => {
    if (filters.availability === 'all' && filters.facing === 'all' && filters.areaRange === 'all') {
      return undefined; // No filtering active
    }

    const matchingIds = new Set<string>();

    plots.forEach((p) => {
      // 1. Availability Filter (handles registered mapping to sold)
      if (filters.availability !== 'all') {
        const isRegisteredMatch = filters.availability === 'registered' && (p.status === 'sold' || (p.status as any) === 'registered');
        if (!isRegisteredMatch && p.status !== filters.availability) {
          return;
        }
      }

      // 2. Facing Filter
      if (filters.facing !== 'all' && p.facing !== filters.facing) {
        return;
      }

      // 3. Area Range Filter (in Cents)
      if (filters.areaRange !== 'all') {
        const cents = p.area_cents;
        if (filters.areaRange === '<2' && cents >= 2.0) return;
        if (filters.areaRange === '2-5' && (cents < 2.0 || cents > 5.0)) return;
        if (filters.areaRange === '5-8' && (cents < 5.0 || cents > 8.0)) return;
        if (filters.areaRange === '8-13' && (cents < 8.0 || cents > 13.0)) return;
        if (filters.areaRange === '>13' && cents <= 13.0) return;
      }

      matchingIds.add(p.id);
    });

    return matchingIds;
  }, [plots, filters]);

  // Download Approval Document (PDF)
  const handleDownloadApproval = () => {
    const approvalDoc = documents.find(
      (d) => d.category === 'dtcp_approval' || d.category === 'lp_approval'
    );
    if (approvalDoc?.storage_path) {
      window.open(approvalDoc.storage_path, '_blank');
    } else {
      alert(`Approval document for ${project?.name || 'this project'} will be uploaded shortly.`);
    }
  };

  // Search Plot
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = plots.find(
      (p) => p.plot_number.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (match) {
      setSelectedPlot(match);
    } else {
      alert(`Plot #${searchQuery.trim()} not found in this project layout.`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-slate-800">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
        <p className="text-xs font-bold text-slate-600">Loading CAD Layout & Plots...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-white text-slate-800">
        <h3 className="font-bold text-slate-900 text-base">Unable to load project layout</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
        <Link
          to="/"
          className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const dtcpRef =
    documents.find((d) => d.category === 'dtcp_approval')?.approval_number || 'APPROVED';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white select-none">
      {/* 1. RESPONSIVE UNIFIED TOP BAR */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 pointer-events-auto">
        {/* LEFT: BACK BUTTON + LOGO + PROJECT INFO */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <Link
            to={`/projects/${project.slug}`}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
            title="Back to Project Overview"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <img
            src="/logo.png"
            alt="JV Constructions"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-contain ring-1 ring-teal-400/60 shadow-xs shrink-0 bg-white"
          />
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-black text-slate-900 tracking-tight truncate leading-tight">
              {project.name}
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              {(() => {
                const approval = getProjectApprovalType(project);
                const isFarm = approval.toLowerCase().includes('farm');
                const label = isFarm
                  ? 'Farm Land'
                  : /dtcp|\blp\b/i.test(approval)
                  ? 'Plotted Layout'
                  : approval;
                return (
                  <span
                    className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 border inline-flex items-center gap-1 ${
                      isFarm
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}
                  >
                    {isFarm && <Trees className="w-3 h-3 text-emerald-700" />}
                    {label}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* CENTER / RIGHT: PLOT SEARCH & ACTIONS */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search Plot Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Plot #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-20 sm:w-32 md:w-40 pl-6 sm:pl-7 pr-2 py-1 sm:py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
            />
            <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          </form>

          {/* Offers button */}
          <button
            onClick={() => setIsOfferOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-glossy-green-btn text-white font-black text-[11px] sm:text-xs shadow-sm transition-transform active:scale-95 shrink-0 border border-amber-400/40"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span className="hidden xs:inline">Offers</span>
          </button>

          {/* Realtime Status */}
          <div
            title={isRealtimeConnected ? 'Live Realtime Sync Connected' : 'Connecting to Realtime...'}
            className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border shrink-0 ${
              isRealtimeConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          </div>
        </div>
      </header>

      {/* 2. MAIN INTERACTIVE SVG CAD MAP CANVAS */}
      <div className="absolute inset-0 pt-12 sm:pt-14">
        <InteractivePlotMap
          layout={layout}
          plots={plots}
          selectedPlotId={selectedPlot?.id}
          onSelectPlot={setSelectedPlot}
          filteredPlotIds={filteredPlotIds}
        />
      </div>

      {/* 3. FLOATING SPEED-DIAL CONTROLS AT BOTTOM CENTER */}
      <div
        className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 pointer-events-auto transition-all ${
          selectedPlot ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {isSpeedDialExpanded && (
          <div className="flex items-center gap-2 sm:gap-3 animate-fade-in">
            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              title="Open Filters"
            >
              <Filter className="w-4 h-4 text-slate-700" />
            </button>

            {/* Location Satellite Button */}
            <button
              onClick={() => setIsLocationOpen(true)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              title="View Live Satellite & Location Map"
            >
              <MapPin className="w-4 h-4 text-slate-700" />
            </button>

            {/* Download Approval PDF Button */}
            <button
              onClick={handleDownloadApproval}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              title="Download Approval Document"
            >
              <Download className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        )}

        {/* FAB Toggle Button */}
        <button
          onClick={() => setIsSpeedDialExpanded(!isSpeedDialExpanded)}
          className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 p-3 border-2 border-white/20"
          title={isSpeedDialExpanded ? 'Collapse Menu' : 'Expand Menu'}
        >
          {isSpeedDialExpanded ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>
      </div>

      {/* 4. WATERMARK / BRANDING BADGE */}
      <div className={`fixed bottom-4 right-4 z-20 pointer-events-none ${selectedPlot ? 'hidden sm:block' : 'block'}`}>
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md flex items-center gap-2">
          <img src="/logo.png" alt="JV Constructions" className="w-5 h-5 rounded-full object-contain ring-1 ring-teal-400/50 bg-white" />
          <span className="text-[10px] font-black text-slate-800 tracking-tight">
            JV <span className="text-teal-700">Constructions</span>
          </span>
        </div>
      </div>

      {/* 5. SLIDE-OUT FILTER DRAWER */}
      <NammaPlotFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
        onReset={() =>
          setFilters({ availability: 'all', facing: 'all', areaRange: 'all' })
        }
      />

      {/* 6. EXCLUSIVE OFFER MODAL */}
      <ExclusiveOfferModal
        isOpen={isOfferOpen}
        onClose={() => setIsOfferOpen(false)}
        projectName={project.name}
        projectId={project.id}
      />

      {/* 7. PROJECT LOCATION / SATELLITE MODAL */}
      <ProjectLocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        project={project}
      />

      {/* 8. SELECTED PLOT CONTEXTUAL CARD / BOTTOM SHEET */}
      {selectedPlot && (
        <div className="sm:fixed sm:bottom-6 sm:left-4 z-40 pointer-events-auto">
          <PlotSelectionCard
            plot={selectedPlot}
            project={project}
            onClose={() => setSelectedPlot(null)}
          />
        </div>
      )}
    </div>
  );
};
