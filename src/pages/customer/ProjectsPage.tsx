import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Layers, Building2, Tag } from 'lucide-react';
import { Project, Plot } from '../../types/database';
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
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Approved Real Estate Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse published layouts with verified DTCP approvals and live plot availability.
          </p>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by project name, city or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse" />
            ))}
          </div>
        )}

        {/* PROJECTS GRID */}
        {!loading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {p.city}, {p.state}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      DTCP Approved
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {p.description || 'Verified DTCP-approved layout with verified plot boundaries.'}
                  </p>

                  {/* STATS METRICS */}
                  <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Total
                      </span>
                      <span className="text-sm font-extrabold text-slate-800">
                        {p.totalPlots ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                        Available
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700">
                        {p.availablePlots ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Starts
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 truncate block mt-0.5">
                        {p.minPrice ? formatPriceCompact(p.minPrice) : 'Contact'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-2">
                  <Link
                    to={`/projects/${p.slug}`}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Details
                  </Link>
                  <Link
                    to={`/projects/${p.slug}/map`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <span>View Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredProjects.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-900 text-base">No Matching Projects Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or check back later for newly published layouts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
