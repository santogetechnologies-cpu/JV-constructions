import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Map,
  FileCheck2,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  Maximize2,
  Calendar,
} from 'lucide-react';
import { Project, Plot, ProjectDocument } from '../../types/database';
import {
  getProjectBySlug,
  getPlotsWithGeometries,
  getProjectDocuments,
} from '../../services/api';
import { formatPriceCompact } from '../../lib/utils';

export const ProjectOverviewPage: React.FC = () => {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!projectSlug) return;
      try {
        setLoading(true);
        const p = await getProjectBySlug(projectSlug);
        if (!p) {
          setError('Project not found in database.');
          return;
        }
        setProject(p);

        // Fetch plots & public documents
        const [plotsData, docsData] = await Promise.all([
          getPlotsWithGeometries(p.id),
          getProjectDocuments(p.id, true),
        ]);
        setPlots(plotsData);
        setDocuments(docsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load project details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">{error}</p>
        <Link
          to="/projects"
          className="mt-6 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const totalPlots = plots.length;
  const availablePlots = plots.filter((p) => p.status === 'available').length;
  const bookedPlots = plots.filter((p) => p.status === 'booked' || p.status === 'on_hold').length;
  const soldPlots = plots.filter((p) => p.status === 'sold').length;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* HEADER HERO */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Verified DTCP Layout
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.city}, {project.state}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              {project.description ||
                'Modern residential and commercial plotted development with approved infrastructure, standard road widths, and ready-to-build documentation.'}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              to={`/projects/${project.slug}/map`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-lg transition-all"
            >
              <Map className="w-4 h-4 text-emerald-400" />
              <span>Launch Interactive Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Plots
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalPlots}</span>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-xs">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Available For Booking
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {availablePlots}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-xs">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
              Reserved / On Hold
            </span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">{bookedPlots}</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Registered / Sold
            </span>
            <span className="text-2xl font-black text-slate-700 mt-1 block">{soldPlots}</span>
          </div>
        </div>

        {/* DETAILS & DOCUMENTS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT: LOCATION & POLICY */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="font-extrabold text-base text-slate-900 mb-4">Location & Address</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  <strong>Address:</strong> {project.address || 'Central layout sector'}
                </p>
                <p>
                  <strong>City & State:</strong> {project.city}, {project.state}{' '}
                  {project.postal_code ? `- ${project.postal_code}` : ''}
                </p>
                {project.latitude && project.longitude && (
                  <p>
                    <strong>Geographic Coordinates:</strong> {project.latitude.toFixed(6)},{' '}
                    {project.longitude.toFixed(6)} ({project.coordinate_reference})
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-slate-900">
                  Approved Project Documents ({documents.length})
                </h3>
                <Link
                  to={`/documents/${project.slug}`}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  View All Documents
                </Link>
              </div>

              {documents.length > 0 ? (
                <div className="space-y-2.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {doc.category.replace('_', ' ')}{' '}
                            {doc.approval_number ? `• Ref: ${doc.approval_number}` : ''}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.storage_path}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Official approval documents for this project will be uploaded shortly by the project administrator.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: CONTACT & ENQUIRY */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="font-extrabold text-base text-slate-900 mb-4">Project Sales Office</h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{project.contact_information?.phone || '+91 98765 43210'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{project.contact_information?.email || 'sales@landestate.local'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {project.contact_information?.sales_office ||
                      `${project.name} Site Marketing Office, ${project.city}`}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to={`/projects/${project.slug}/map`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all"
                >
                  <span>Select a Plot on Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
