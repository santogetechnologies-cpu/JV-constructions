import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Layers, Building2, Tag, ShieldCheck, Map, Trees } from 'lucide-react';
import { Project, Plot, getPublicApprovalLabel } from '../../types/database';
import { getPublishedProjects, getPlotsWithGeometries } from '../../services/api';
import { formatPriceCompact } from '../../lib/utils';

interface ProjectWithStats extends Project {
  totalPlots?: number;
  availablePlots?: number;
  minPrice?: number | null;
}

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getPublishedProjects();

        // Fetch stats for each project
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
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.city) set.add(p.city);
    });
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase()) ||
        p.state.toLowerCase().includes(search.toLowerCase());
      const matchesCity = selectedCity === 'all' || p.city === selectedCity;
      return matchesSearch && matchesCity;
    });
  }, [projects, search, selectedCity]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-black text-blue-700 mb-3 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Verified Blueprint Layouts</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Real Estate Projects
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-2xl">
            Browse layouts with exact boundary mapping and live plot inventory.
          </p>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm mb-10 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by project name, city or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition-all"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">All Locations</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-96 rounded-3xl bg-white border border-slate-200 p-8 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="h-6 w-1/3 bg-slate-200 rounded-lg" />
                  <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
                  <div className="h-4 w-full bg-slate-100 rounded-lg" />
                </div>
                <div className="h-20 bg-slate-100 rounded-2xl" />
                <div className="h-12 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* BIG PROJECTS GRID */}
        {!loading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
              >
                {/* Visual Header / Blueprint Theme */}
                <div className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6 sm:p-8 text-[#0b3b64] overflow-hidden border-b border-slate-100">
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#6ee7b7_1px,transparent_1px)] [background-size:16px_16px]" />
                  
                  <div className="flex items-center justify-between gap-3 relative z-10 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white text-teal-700 border border-teal-100 shadow-sm">
                      {getPublicApprovalLabel(p).toLowerCase().includes('farm') ? (
                        <Trees className="w-3.5 h-3.5 text-teal-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      )}
                      {getPublicApprovalLabel(p)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      {p.city}, {p.state}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-[#0b3b64] group-hover:text-teal-700 transition-colors relative z-10 tracking-tight">
                    {p.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 relative z-10 font-medium">
                    {p.address && <span>{p.address}</span>}
                    {p.total_land_area && (
                      <span className="text-teal-700 font-bold">• Extent: {p.total_land_area}</span>
                    )}
                  </div>
                </div>

                {/* Card Content & Metrics */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {p.description ||
                        'Well-planned layout with clear plot boundaries, road networks and ready-to-build documentation.'}
                    </p>

                    {/* STATS METRICS */}
                    <div className="grid grid-cols-3 gap-3 my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <div className="p-2">
                        <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          Total Plots
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
                          {p.totalPlots ?? 0}
                        </span>
                      </div>

                      <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-200/60">
                        <span className="text-[11px] text-blue-800 font-extrabold uppercase tracking-wider block">
                          Available
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-blue-800 mt-0.5 block">
                          {p.availablePlots ?? 0}
                        </span>
                      </div>

                      <div className="p-2">
                        <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          Starting At
                        </span>
                        <span className="text-sm sm:text-base font-black text-slate-900 mt-1 block truncate">
                          {p.minPrice ? formatPriceCompact(p.minPrice) : 'On Request'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Link
                      to={`/projects/${p.slug}`}
                      className="text-xs sm:text-sm font-extrabold text-slate-600 hover:text-slate-900 transition-colors w-full sm:w-auto text-center"
                    >
                      View Layout Details
                    </Link>
                    <Link
                      to={`/projects/${p.slug}/map`}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-full bg-glossy-green-btn hover:opacity-95 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-950/20 border border-amber-400/30 transition-all transform hover:scale-[1.02] active:scale-100 cursor-pointer"
                    >
                      <Map className="w-4 h-4 text-white" />
                      <span>Open Interactive CAD Map</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredProjects.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="font-black text-slate-900 text-lg">No Matching Projects Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Try adjusting your search criteria or check back later for newly published layouts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
