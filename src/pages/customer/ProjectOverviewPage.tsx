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
  MessageSquare,
  Trees,
} from 'lucide-react';
import { Project, Plot, ProjectDocument, getProjectApprovalType } from '../../types/database';
import { OFFICIAL_CONTACTS } from '../../constants/contacts';
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
              <span className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 border ${
                getProjectApprovalType(project).toLowerCase().includes('farm')
                  ? 'bg-emerald-100/90 text-emerald-950 border-emerald-300'
                  : 'bg-amber-400/15 text-amber-900 border-amber-400/30'
              }`}>
                {getProjectApprovalType(project).toLowerCase().includes('farm') ? (
                  <Trees className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                )}
                {getProjectApprovalType(project)}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-glossy-green-btn hover:opacity-95 text-white text-sm font-bold shadow-lg shadow-emerald-950/20 border border-amber-400/30 transition-all"
            >
              <Map className="w-4 h-4 text-amber-200" />
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

          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 shadow-xs">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
              Available For Booking
            </span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">
              {availablePlots}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-200/80 shadow-xs">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block">
              Reserved / On Hold
            </span>
            <span className="text-2xl font-black text-sky-700 mt-1 block">{bookedPlots}</span>
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
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
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
                        <FileCheck2 className="w-5 h-5 text-blue-600 shrink-0" />
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
              <h3 className="font-extrabold text-base text-slate-900 mb-3">Direct Property Advisors</h3>
              <p className="text-xs text-slate-500 mb-4">Contact our official property advisors for site visits, boundary surveys, and documentation:</p>

              <div className="space-y-3 mb-5">
                {OFFICIAL_CONTACTS.map((c) => (
                  <div key={c.name} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-black text-slate-950 text-sm leading-tight">{c.name}</div>
                      <div className="text-xs font-semibold text-slate-500 leading-tight">{c.role}</div>
                      <a href={`tel:${c.phoneRaw}`} className="font-bold text-slate-900 text-xs block font-mono hover:text-emerald-700 transition-colors pt-0.5">
                        {c.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${c.phoneRaw}`}
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-95"
                        title={`Call ${c.name}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${c.phoneRaw.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-transform active:scale-95"
                        title={`WhatsApp ${c.name}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-xs text-slate-600">
                {/* Office Address */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Office Address
                    </span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5 leading-relaxed">
                      {project.contact_information?.sales_office &&
                      project.contact_information.sales_office !== 'Site Marketing Suite'
                        ? project.contact_information.sales_office
                        : [
                            project.address || `${project.name} Site Campus`,
                            project.city,
                            `${project.state}${project.postal_code ? ` - ${project.postal_code}` : ''}`,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                    </p>
                  </div>
                </div>

                {/* Email (only if real and configured) */}
                {project.contact_information?.email &&
                  !project.contact_information.email.includes('landestate.local') && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Email
                        </span>
                        <a
                          href={`mailto:${project.contact_information.email}`}
                          className="font-medium text-slate-800 hover:text-blue-600 transition-colors block mt-0.5"
                        >
                          {project.contact_information.email}
                        </a>
                      </div>
                    </div>
                  )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to={`/projects/${project.slug}/map`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-glossy-green-btn hover:opacity-95 text-white text-xs font-bold shadow-md shadow-emerald-950/20 border border-amber-400/30 transition-all"
                >
                  <span>Select a Plot on Map</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
