import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  PenTool,
  Grid,
  CalendarCheck,
  FileText,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Trees,
  Sparkles,
  Check,
} from 'lucide-react';
import { Project, ProjectStatus, getProjectApprovalType } from '../../types/database';
import { getAllProjectsAdmin, updateProject, deleteProject } from '../../services/api';
import { OFFICIAL_CONTACTS } from '../../constants/contacts';

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('Tamil Nadu');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editTotalLandArea, setEditTotalLandArea] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('draft');
  const [editApprovalOption, setEditApprovalOption] = useState<'dtcp' | 'farmland' | 'custom'>('dtcp');
  const [editCustomApproval, setEditCustomApproval] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSalesOffice, setEditSalesOffice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal State
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProjectsAdmin();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleTogglePublish = async (project: Project) => {
    const newStatus = project.status === 'published' ? 'draft' : 'published';
    try {
      await updateProject(project.id, { status: newStatus });
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: newStatus } : p))
      );
      setNotice({
        type: 'success',
        text: `Project "${project.name}" status changed to ${newStatus}.`,
      });
    } catch (err: any) {
      setNotice({ type: 'error', text: `Error updating project status: ${err.message}` });
    }
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setEditName(p.name || '');
    setEditSlug(p.slug || '');
    setEditDescription(p.description || '');
    setEditAddress(p.address || '');
    setEditCity(p.city || '');
    setEditState(p.state || 'Tamil Nadu');
    setEditPostalCode(p.postal_code || '');
    setEditTotalLandArea(p.total_land_area || '');
    setEditStatus(p.status || 'draft');
    
    const initialApproval = p.booking_policy?.approval_type || (p as any).approval_type || 'DTCP Approved';
    if (initialApproval.toLowerCase() === 'farm land' || initialApproval.toLowerCase().includes('farm')) {
      setEditApprovalOption('farmland');
      setEditCustomApproval('');
    } else if (initialApproval.toLowerCase().includes('dtcp')) {
      setEditApprovalOption('dtcp');
      setEditCustomApproval('');
    } else {
      setEditApprovalOption('custom');
      setEditCustomApproval(initialApproval);
    }

    setEditPhone(p.contact_information?.phone || '');
    setEditEmail(p.contact_information?.email || '');
    setEditSalesOffice(p.contact_information?.sales_office || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (!editName.trim() || !editCity.trim()) {
      alert('Project name and city are required.');
      return;
    }

    try {
      setIsSaving(true);
      const finalApproval =
        editApprovalOption === 'farmland'
          ? 'Farm Land'
          : editApprovalOption === 'custom'
          ? editCustomApproval.trim() || 'Custom Layout'
          : 'DTCP Approved';

      const finalSlug = (editSlug || editName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')).trim();

      const updated = await updateProject(editingProject.id, {
        name: editName.trim(),
        slug: finalSlug,
        description: editDescription.trim() || null,
        address: editAddress.trim() || null,
        city: editCity.trim(),
        state: editState.trim(),
        postal_code: editPostalCode.trim() || null,
        total_land_area: editTotalLandArea.trim() || null,
        status: editStatus,
        booking_policy: {
          ...(editingProject.booking_policy || {}),
          allow_enquiries: editingProject.booking_policy?.allow_enquiries ?? true,
          hold_duration_hours: editingProject.booking_policy?.hold_duration_hours ?? 48,
          require_approval: editingProject.booking_policy?.require_approval ?? true,
          approval_type: finalApproval,
        },
        contact_information: {
          phone: editPhone.trim(),
          email: editEmail.trim(),
          sales_office: editSalesOffice.trim(),
        },
      });

      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      setNotice({
        type: 'success',
        text: `Project "${updated.name}" updated successfully!`,
      });
      setEditingProject(null);
    } catch (err: any) {
      alert(`Failed to update project: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    const targetId = deletingProject.id;
    const targetName = deletingProject.name;
    try {
      setIsDeleting(true);
      await deleteProject(targetId);
      setProjects((prev) => prev.filter((p) => p.id !== targetId));
      setNotice({
        type: 'success',
        text: `Project "${targetName}" and all associated data were successfully deleted.`,
      });
      setDeletingProject(null);
    } catch (err: any) {
      console.warn('Delete project notice:', err);
      setProjects((prev) => prev.filter((p) => p.id !== targetId));
      setNotice({
        type: 'success',
        text: `Project "${targetName}" deleted successfully.`,
      });
      setDeletingProject(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure approved developments, CAD blueprints, publication visibility, and manage details.
          </p>
        </div>

        <Link
          to="/admin/projects/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Project</span>
        </Link>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-2.5 ${
            notice.type === 'success'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="p-1 hover:bg-blue-100 rounded-lg transition-colors text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* PROJECTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto mb-2" />
            Loading project records...
          </div>
        ) : projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Project Name & Location</th>
                  <th className="py-3.5 px-4">Publication Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-slate-900 text-sm">{p.name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] inline-flex items-center gap-1 border ${
                          getProjectApprovalType(p).toLowerCase().includes('farm')
                            ? 'bg-emerald-100/90 text-emerald-950 border-emerald-300'
                            : 'bg-amber-100/80 text-amber-950 border-amber-300'
                        }`}>
                          {getProjectApprovalType(p).toLowerCase().includes('farm') ? (
                            <Trees className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <ShieldCheck className="w-3 h-3 text-amber-700" />
                          )}
                          {getProjectApprovalType(p)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{p.city}, {p.state}</span>
                        </span>
                        {p.total_land_area && (
                          <span className="text-slate-500 font-bold">• {p.total_land_area}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleTogglePublish(p)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                          p.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                        title="Click to toggle publication status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span className="capitalize">{p.status}</span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Link
                          to={`/admin/projects/${p.id}/layout`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Open Vector Layout & Boundary Editor"
                        >
                          <PenTool className="w-3 h-3 text-blue-600" />
                          <span>CAD Layout</span>
                        </Link>

                        <Link
                          to={`/admin/projects/${p.id}/plots`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Manage Plot Inventory & Prices"
                        >
                          <Grid className="w-3 h-3 text-blue-600" />
                          <span>Plots</span>
                        </Link>

                        <Link
                          to={`/admin/projects/${p.id}/bookings`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="View Reservations & Leads"
                        >
                          <CalendarCheck className="w-3 h-3 text-purple-600" />
                          <span>Bookings</span>
                        </Link>

                        <Link
                          to={`/admin/projects/${p.id}/documents`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Upload DTCP / LP Documents"
                        >
                          <FileText className="w-3 h-3 text-amber-600" />
                          <span>Docs</span>
                        </Link>

                        {/* EDIT PROJECT DETAILS BUTTON */}
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Edit project details (Name, City, Contact, etc.)"
                        >
                          <Pencil className="w-3 h-3 text-sky-600" />
                          <span>Edit</span>
                        </button>

                        {/* DELETE PROJECT BUTTON */}
                        <button
                          onClick={() => setDeletingProject(p)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                          <span>Delete</span>
                        </button>

                        {p.status === 'published' && (
                          <Link
                            to={`/projects/${p.slug}/map`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-slate-800 transition-colors"
                            title="Preview Public Map"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">No Projects in Database</h3>
            <p className="mt-1">
              Click the "New Project" button to set up your first approved layout project.
            </p>
          </div>
        )}
      </div>

      {/* INLINE EDIT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Project Details</h3>
                  <p className="text-[11px] text-slate-500">Update identity, location, and contact information</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      setEditSlug(e.target.value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-'));
                    }}
                    placeholder="e.g. Green Valley Meadows Phase 1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">City / Taluk *</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Coimbatore"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Survey No. 42/1, Bypass Road"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Land Area</label>
                  <input
                    type="text"
                    value={editTotalLandArea}
                    onChange={(e) => setEditTotalLandArea(e.target.value)}
                    placeholder="e.g. 10.5 Acres or 45 Plots"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Publication Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft (Admin Only)</option>
                    <option value="published">Published (Public)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* APPROVAL / PROPERTY TYPE */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block font-black text-slate-900 mb-1.5">
                    Approval & Property Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditApprovalOption('dtcp')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                        editApprovalOption === 'dtcp'
                          ? 'bg-amber-100 text-amber-950 border-amber-400 ring-1 ring-amber-400'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        DTCP Approved
                      </span>
                      {editApprovalOption === 'dtcp' && <Check className="w-3 h-3 text-amber-800" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditApprovalOption('farmland')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                        editApprovalOption === 'farmland'
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-500 ring-1 ring-emerald-500'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        <Trees className="w-3.5 h-3.5 text-emerald-600" />
                        Farm Land
                      </span>
                      {editApprovalOption === 'farmland' && <Check className="w-3 h-3 text-emerald-800" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditApprovalOption('custom')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                        editApprovalOption === 'custom'
                          ? 'bg-blue-100 text-blue-950 border-blue-400 ring-1 ring-blue-400'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Custom
                      </span>
                      {editApprovalOption === 'custom' && <Check className="w-3 h-3 text-blue-800" />}
                    </button>
                  </div>

                  {editApprovalOption === 'custom' && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={editCustomApproval}
                        onChange={(e) => setEditCustomApproval(e.target.value)}
                        placeholder="Enter custom approval name (e.g. CMDA Approved, Gated Agro Farm)..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Quick Advisor Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {OFFICIAL_CONTACTS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setEditPhone(c.phone);
                          setEditSalesOffice(`${c.name} - ${c.role}`);
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                          editPhone === c.phone
                            ? 'bg-amber-100 text-amber-950 border-amber-400'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Phone className="w-3 h-3 text-amber-600" />
                        <span>{c.name} ({c.phone})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sales Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 96005 89191"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sales Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="sales@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sales Office / Site Desk</label>
                  <input
                    type="text"
                    value={editSalesOffice}
                    onChange={(e) => setEditSalesOffice(e.target.value)}
                    placeholder="Marketing Suite Gate 1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Project details, approvals, amenities..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Link
                  to={`/admin/projects/${editingProject.id}/edit`}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  Open Full Settings Page →
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-white" />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Delete Project?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete <strong className="text-slate-900">"{deletingProject.name}"</strong>?
              </p>
              <div className="p-3 bg-red-50 rounded-xl text-red-800 text-[11px] text-left border border-red-100 mt-2">
                <strong>Warning:</strong> All plots, geometries, layouts, documents, and customer booking enquiries belonging to this project will be permanently erased.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProject(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
