import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Layers,
  Sparkles,
  FileCheck2,
  Map,
  CheckCircle2,
  Building2,
  Calendar,
} from 'lucide-react';
import { Project, Plot } from '../../types/database';
import { getPublishedProjects, getPlotsWithGeometries } from '../../services/api';
import { formatPriceCompact } from '../../lib/utils';

interface ProjectWithStats extends Project {
  totalPlots?: number;
  availablePlots?: number;
  minPrice?: number | null;
}

export const HomePage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getPublishedProjects();

        // Fetch stats for each project to show rich metrics on big cards
        const withStats: ProjectWithStats[] = await Promise.all(
          data.map(async (p) => {
            try {
              const plots = await getPlotsWithGeometries(p.id);
              const totalPlots = plots.length;
              const availablePlots = plots.filter((plot) => plot.status === 'available').length;
              const prices = plots
                .map((plot) => plot.price_inr)
                .filter((pr): pr is number => pr !== null && pr > 0);
              const minPrice = prices.length > 0 ? Math.min(...prices) : null;
              return { ...p, totalPlots, availablePlots, minPrice };
            } catch {
              return { ...p, totalPlots: 0, availablePlots: 0, minPrice: null };
            }
          })
        );

        setProjects(withStats);
      } catch (err: any) {
        console.error('Failed to load published projects:', err);
        setError(err.message || 'Could not load layouts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans py-8 sm:py-12">
      {/* PUBLISHED PROJECTS SECTION WITH BIG LUXURY CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-blue-700">
                Live Layout Inventory
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Approved Real Estate Layouts
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-xl">
              Inspect master-planned layouts, exact survey geometries, dimensions, and live reservation status directly on interactive CAD vector maps.
            </p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-96 rounded-3xl bg-white border border-slate-200 p-8 animate-pulse flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-4">
                  <div className="h-6 w-1/3 bg-slate-200 rounded-lg" />
                  <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
                  <div className="h-4 w-full bg-slate-100 rounded-lg" />
                  <div className="h-4 w-2/3 bg-slate-100 rounded-lg" />
                </div>
                <div className="h-24 bg-slate-100 rounded-2xl" />
                <div className="h-12 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
            <p className="font-bold">Error loading live layout data:</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* BIG LUXURIOUS PROJECT CARDS (2-Column Large Showcase) */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-1"
              >
                {/* Visual Header / Blueprint Graphic Canvas */}
                <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white overflow-hidden border-b border-slate-800">
                  {/* Subtle Blueprint grid pattern */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:16px_16px]" />
                  
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-3 relative z-10 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      DTCP & LP Approved
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-200 backdrop-blur-md">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {proj.city}, {proj.state}
                    </span>
                  </div>

                  {/* Big Card Title */}
                  <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-blue-300 transition-colors relative z-10 tracking-tight">
                    {proj.name}
                  </h3>

                  {/* Location / Land Area details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-2 relative z-10 font-medium">
                    {proj.address && <span>{proj.address}</span>}
                    {proj.total_land_area && (
                      <span className="text-blue-300 font-bold">• Extent: {proj.total_land_area}</span>
                    )}
                  </div>
                </div>

                {/* Card Body & Description */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {proj.description ||
                        'Verified DTCP-approved layout with verified plot boundaries, clear road networks, and ready-to-build documentation.'}
                    </p>

                    {/* BIG METRICS ROW */}
                    <div className="grid grid-cols-3 gap-3 my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <div className="p-2">
                        <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          Total Plots
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
                          {proj.totalPlots ?? 0}
                        </span>
                      </div>

                      <div className="p-2 bg-blue-50/80 rounded-xl border border-blue-200/60">
                        <span className="text-[11px] text-blue-700 font-extrabold uppercase tracking-wider block">
                          Available
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5 block">
                          {proj.availablePlots ?? 0}
                        </span>
                      </div>

                      <div className="p-2">
                        <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          Starting At
                        </span>
                        <span className="text-sm sm:text-base font-black text-slate-900 mt-1 block truncate">
                          {proj.minPrice ? formatPriceCompact(proj.minPrice) : 'On Request'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Link
                      to={`/projects/${proj.slug}`}
                      className="text-xs sm:text-sm font-extrabold text-slate-600 hover:text-slate-900 transition-colors w-full sm:w-auto text-center"
                    >
                      View Layout Details
                    </Link>
                    <Link
                      to={`/projects/${proj.slug}/map`}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-100 cursor-pointer"
                    >
                      <Map className="w-4 h-4 text-blue-200" />
                      <span>Open Interactive CAD Map</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DATABASE EMPTY STATE */}
        {!loading && !error && projects.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              No Published Projects Currently Available
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
              Our verified DTCP approved layouts and live plot inventories will be published here shortly. Please check back soon or contact our desk.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
