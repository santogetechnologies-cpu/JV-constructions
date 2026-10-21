import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Compass,
  Maximize2,
  Tag,
  ShieldCheck,
  CheckCircle,
  Clock,
  Ban,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { Plot, Project, ProjectLayout } from '../../types/database';
import { getSinglePlot, getProjectById, getPublishedLayout } from '../../services/api';
import { formatINR, getStatusLabel, getStatusColor } from '../../lib/utils';
import { InteractivePlotMap } from '../../components/map/InteractivePlotMap';

export const PlotDetailPage: React.FC = () => {
  const { plotId } = useParams<{ plotId: string }>();
  const [plot, setPlot] = useState<Plot | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [layout, setLayout] = useState<ProjectLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!plotId) return;
      try {
        setLoading(true);
        const p = await getSinglePlot(plotId);
        if (!p) {
          setError('Plot not found in database.');
          return;
        }
        setPlot(p);

        const proj = await getProjectById(p.project_id);
        setProject(proj);

        if (proj) {
          const l = await getPublishedLayout(proj.id);
          setLayout(l);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load plot details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [plotId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (error || !plot) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="font-bold text-slate-800 text-base">Plot Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
        <Link
          to="/projects"
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          View Projects
        </Link>
      </div>
    );
  }

  const colors = getStatusColor(plot.status);
  const isBookable = plot.status === 'available';

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <Link
            to={project ? `/projects/${project.slug}/map` : '/projects'}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Layout Map</span>
          </Link>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.badgeBg}`}
          >
            {getStatusLabel(plot.status)}
          </span>
        </div>

        {/* MAIN DETAIL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLS: INTERACTIVE MINI MAP VIEW */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Layout Boundary Position
                </h3>
                <p className="text-xs text-slate-500">
                  Selected plot highlighted in context of the master CAD blueprint.
                </p>
              </div>
              {project && (
                <Link
                  to={`/projects/${project.slug}/map`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Full Map View →
                </Link>
              )}
            </div>

            <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-slate-200">
              <InteractivePlotMap
                layout={layout}
                plots={[plot]}
                selectedPlotId={plot.id}
                onSelectPlot={() => {}}
              />
            </div>
          </div>

          {/* RIGHT COL: PLOT SPECIFICATIONS & ACTION */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {project?.name || 'Real Estate Project'}
                </span>
                <h1 className="text-3xl font-black text-slate-900 mt-1">
                  Plot #{plot.plot_number}
                </h1>
                {project && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {project.city}, {project.state}
                  </p>
                )}
              </div>

              {/* SPECS */}
              <div className="grid grid-cols-2 gap-3 my-5">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-1 text-xs text-slate-600 font-bold">
                    <Maximize2 className="w-3.5 h-3.5 text-slate-500" /> Area
                  </span>
                  <p className="text-lg font-black text-slate-950 mt-1">
                    {plot.area_cents} Cents
                  </p>
                  <p className="text-xs text-slate-600 font-bold font-mono">
                    ({plot.area_sqft} sq.ft)
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-1 text-xs text-slate-600 font-bold">
                    <Compass className="w-3.5 h-3.5 text-slate-500" /> Facing
                  </span>
                  <p className="text-lg font-black text-slate-950 mt-1">
                    {plot.facing}
                  </p>
                  <p className="text-xs text-emerald-800 font-bold">Vastu Standard</p>
                </div>
              </div>

              {/* PRICING */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 mb-6">
                <span className="text-xs font-black text-blue-950 uppercase tracking-wider block">
                  Configured Price
                </span>
                <p className="text-2xl font-black text-slate-950 mt-1">
                  {formatINR(plot.price_inr)}
                </p>
              </div>

              {plot.description && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Plot Overview
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{plot.description}</p>
                </div>
              )}
            </div>

            {/* ACTION */}
            <div className="pt-4 border-t border-slate-100">
              {isBookable ? (
                <Link
                  to={`/booking/${plot.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-glossy-green-btn hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-emerald-950/20 border border-amber-400/30 transition-all"
                >
                  <span>Submit Booking Enquiry</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </Link>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 text-center text-xs font-bold text-slate-500">
                  This plot is {getStatusLabel(plot.status).toLowerCase()} and cannot be reserved directly.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
