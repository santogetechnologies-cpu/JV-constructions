import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileCheck2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Settings,
} from 'lucide-react';
import { Project, ProjectDocument, DocumentCategory } from '../../types/database';
import {
  getProjectById,
  getProjectDocuments,
  uploadFileToStorage,
} from '../../services/api';
import { supabase } from '../../lib/supabaseClient';

export const AdminProjectDocumentsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Doc Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('dtcp_approval');
  const [approvalNumber, setApprovalNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const proj = await getProjectById(projectId);
      setProject(proj);

      const docs = await getProjectDocuments(projectId, false); // All docs including non-public
      setDocuments(docs);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to load documents' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !project || !title.trim()) {
      setNotice({ type: 'error', text: 'Title and file are required.' });
      return;
    }

    setUploading(true);
    setNotice(null);

    try {
      const storagePath = `documents/${project.id}/${Date.now()}_${selectedFile.name}`;
      const { publicUrl } = await uploadFileToStorage('project-documents', storagePath, selectedFile);

      const { data, error } = await supabase
        .from('project_documents')
        .insert([
          {
            project_id: project.id,
            title: title.trim(),
            category,
            approval_number: approvalNumber.trim() || null,
            issue_date: issueDate || null,
            description: description.trim() || null,
            storage_path: publicUrl,
            mime_type: selectedFile.type || 'application/pdf',
            file_size: selectedFile.size,
            is_public: true,
            is_published: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setNotice({ type: 'success', text: 'Document uploaded and published successfully!' });
      setTitle('');
      setApprovalNumber('');
      setDescription('');
      setSelectedFile(null);
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to upload document' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const { error } = await supabase.from('project_documents').delete().eq('id', docId);
      if (error) throw error;
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setNotice({ type: 'success', text: 'Document deleted.' });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Approval Documents: {project?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload and manage verified DTCP clearances, Local Planning authority blueprints, and official survey orders.
          </p>
        </div>

        {project && (
          <Link
            to={`/admin/projects/${project.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto"
            title="Edit Project Details"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Project Settings</span>
          </Link>
        )}
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-start gap-2 border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* UPLOAD FORM */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs h-fit">
          <h3 className="font-extrabold text-base text-slate-900 mb-4">Attach Official Document</h3>
          <form onSubmit={handleUploadDocument} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. DTCP Layout Approval Order"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="dtcp_approval">DTCP Approval</option>
                <option value="lp_approval">LP Sanction Blueprint</option>
                <option value="layout_plan">Master Layout Plan</option>
                <option value="survey_plan">Survey Map Certificate</option>
                <option value="brochure">Marketing Brochure</option>
                <option value="other">Other Official Document</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Approval Reference #</label>
              <input
                type="text"
                placeholder="DTCP/RERA/2026/841"
                value={approvalNumber}
                onChange={(e) => setApprovalNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Summary of terms or approval validity..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Approval Document / Plan File *</label>
              <input
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.webp,.avif,.dxf,.dwg,.svg,.tiff,.tif,.bmp,.gif"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Upload className="w-3.5 h-3.5 text-white" />
              <span>{uploading ? 'Uploading to Supabase...' : 'Upload & Publish'}</span>
            </button>
          </form>
        </div>

        {/* DOCUMENTS LIST */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-extrabold text-base text-slate-900">Published Documents</h3>
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">{doc.title}</h4>
                    <p className="text-[11px] text-slate-500 capitalize">
                      {doc.category.replace('_', ' ')}{' '}
                      {doc.approval_number ? `• Ref: ${doc.approval_number}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={doc.storage_path}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No official documents attached to this project yet. Use the upload form on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
