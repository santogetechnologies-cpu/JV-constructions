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
  Lock,
  PlusCircle,
} from 'lucide-react';
import { Project } from '../../types/database';
import { getPublishedProjects } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const HomePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isStaff } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getPublishedProjects();
        setProjects(data);
      } catch (err: any) {
        console.error('Failed to load published projects:', err);
        setError(err.message || 'Could not load projects from database');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>DTCP & LP Approved Layout Blueprints</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Interactive CAD Blueprints & Live Real Estate Plot Inventory.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Transforming static engineering survey drawings, DTCP approvals, and CAD blueprints into a fully synchronized digital layout. Inspect actual plot boundaries, verify approvals, and reserve plots in real time.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl transition-all"
              >
                <span>Explore Approved Layouts</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all"
              >
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Admin CAD Portal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
      </section>

      {/* PUBLISHED PROJECTS SECTION (REAL SUPABASE RECORDS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Featured Approved Layouts
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select a project to explore its interactive vector plot map and live availability.
            </p>
          </div>
          <Link
            to="/projects"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse">
                <div className="h-6 w-3/4 bg-slate-200 rounded mb-4" />
                <div className="h-4 w-1/2 bg-slate-100 rounded mb-6" />
                <div className="h-24 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
            <p className="font-bold">Error loading live data from Supabase:</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* REAL PROJECTS GRID */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {proj.city}, {proj.state}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Approved Layout
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {proj.description || 'Verified DTCP-approved layout with verified plot boundaries.'}
                  </p>
                </div>

                <div className="p-6 pt-0">
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/projects/${proj.slug}`}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      Project Info
                    </Link>
                    <Link
                      to={`/projects/${proj.slug}/map`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      <span>Open Interactive Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROPER DATABASE EMPTY STATE (NO MOCK DATA) */}
        {!loading && !error && projects.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              No Published Projects in Database
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
              Our verified DTCP approved layouts and live plot inventories will be published here shortly. Please check back soon or contact our desk.
            </p>
          </div>
        )}
      </section>

      {/* TRUST / CAPABILITY PILLARS */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1">
                Local CAD Precision
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vector polygons drawn directly on engineering blueprints preserving exact geometry, measurements, and orientation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1">
                Real-Time Synchronization
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When an administrator reserves or registers a plot, all connected customer maps reflect the status update immediately via Supabase Realtime.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1">
                Verified Documents
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download official DTCP approval orders, Local Planning authority sanction blueprints, and survey certificates securely.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
