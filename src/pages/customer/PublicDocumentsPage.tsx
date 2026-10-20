import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileCheck2, Download, ShieldCheck, MapPin } from 'lucide-react';
import { Project, ProjectDocument } from '../../types/database';
import { getProjectBySlug, getProjectDocuments } from '../../services/api';

export const PublicDocumentsPage: React.FC = () => {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!projectSlug) return;
      try {
        setLoading(true);
        const proj = await getProjectBySlug(projectSlug);
        if (!proj) {
          setError('Project not found.');
          return;
        }
        setProject(proj);

        const docs = await getProjectDocuments(proj.id, true);
        setDocuments(docs);
      } catch (err: any) {
        setError(err.message || 'Failed to load documents.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="font-bold text-slate-800 text-base">Project Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
        <Link
          to="/projects"
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          to={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {project.name} Overview</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Legal Clearances & Approvals
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Official Approvals: {project.name}
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-2xl">
            Download certified copies of government layout sanctions, DTCP orders, Local Planning authority blueprints, and official survey certificates.
          </p>

          <div className="mt-8 space-y-4">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{doc.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                        <span className="capitalize">
                          Category: <strong>{doc.category.replace('_', ' ')}</strong>
                        </span>
                        {doc.approval_number && (
                          <span>
                            Approval Ref: <strong>{doc.approval_number}</strong>
                          </span>
                        )}
                        {doc.issue_date && <span>Date: {doc.issue_date}</span>}
                      </div>
                    </div>
                  </div>

                  <a
                    href={doc.storage_path}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No Public Documents Uploaded</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  The administrator has not yet attached public clearance documents to this project record.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
