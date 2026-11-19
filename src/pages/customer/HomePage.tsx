import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  MapPin,
  Layers,
  Map,
  Trees,
} from 'lucide-react';
import { Project, getPublicApprovalLabel } from '../../types/database';
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
    <div className="bg-white flex flex-col font-sans">
      {/* PUBLISHED PROJECTS */}
      <section id="layouts" className="bg-slate-50/70 py-10 sm:py-14 min-h-[70vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">Live Layout Inventory</span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0b3b64] tracking-tight mt-2">Featured layouts</h2>
              <p className="text-slate-500 mt-2 max-w-xl">Inspect master-planned layouts, dimensions and live reservation status on interactive maps.</p>
            </div>
            <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0b3b64] hover:text-teal-700 transition-colors group">
              <span>View all projects</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-white border border-slate-200 p-8 animate-pulse flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="h-6 w-1/3 bg-slate-200 rounded-lg" />
                    <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-full bg-slate-100 rounded-lg" />
                  </div>
                  <div className="h-24 bg-slate-100 rounded-2xl" />
                  <div className="h-12 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
              <p className="font-bold">Error loading live layout data:</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-white rounded-3xl border border-slate-200 shadow-soft hover:shadow-lift transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-1">
                  <div className="relative p-6 sm:p-8 overflow-hidden border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-teal-50">
                    <div className="absolute inset-0 bg-dots opacity-60 pointer-events-none [mask-image:linear-gradient(to_bottom_left,black,transparent_70%)]" />
                    <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-teal-700 border border-teal-100 shadow-sm">
                        {getPublicApprovalLabel(proj).toLowerCase().includes('farm') ? <Trees className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        {getPublicApprovalLabel(proj)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-600 border border-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-[#0b3b64]" />
                        {proj.city}, {proj.state}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#0b3b64] relative z-10 tracking-tight">{proj.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 relative z-10 font-medium">
                      {proj.address && <span>{proj.address}</span>}
                      {proj.total_land_area && <span className="text-teal-700 font-bold">• Extent: {proj.total_land_area}</span>}
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {proj.description || 'Well-planned layout with clear plot boundaries, road networks and ready-to-build documentation.'}
                      </p>
                      <div className="grid grid-cols-3 gap-3 my-6">
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total plots</span>
                          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">{proj.totalPlots ?? 0}</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-teal-50 border border-teal-100 text-center">
                          <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">Available</span>
                          <span className="text-xl sm:text-2xl font-black text-teal-700 mt-0.5 block">{proj.availablePlots ?? 0}</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Starting at</span>
                          <span className="text-sm sm:text-base font-black text-slate-900 mt-1.5 block truncate">{proj.minPrice ? formatPriceCompact(proj.minPrice) : 'On Request'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <Link to={`/projects/${proj.slug}`} className="text-sm font-bold text-slate-500 hover:text-[#0b3b64] transition-colors w-full sm:w-auto text-center">
                        View layout details
                      </Link>
                      <Link to={`/projects/${proj.slug}/map`} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-full bg-jv-btn text-white text-sm font-bold transition-all hover:-translate-y-0.5 cursor-pointer">
                        <Map className="w-4 h-4" />
                        <span>Open interactive map</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-[#0b3b64] flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No published projects yet</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
                Layouts and live plot inventories will appear here shortly.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
