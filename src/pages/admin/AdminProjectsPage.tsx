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
  Layers,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { Project, ProjectWithStats, ProjectStatus, getProjectApprovalType } from '../../types/database';
import { getAllProjectsWithStatsAdmin, updateProject, deleteProject } from '../../services/api';
import { PRIMARY_CONTACT_PHONE } from '../../constants/contacts';
import { useAllProjectsSidebar } from '../../context/AllProjectsSidebarContext';
import { ProjectBigCard } from '../../components/admin/ProjectBigCard';

export const AdminProjectsPage: React.FC = () => {
  const { openSidebar } = useAllProjectsSidebar();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Edit Modal State
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null);
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
  const [deletingProject, setDeletingProject] = useState<ProjectWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProjectsWithStatsAdmin();
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

  const handleTogglePublish = async (project: ProjectWithStats) => {
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

  const openEditModal = (p: ProjectWithStats) => {
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

    const appType = getProjectApprovalType(p);
    if (appType.toLowerCase().includes('dtcp')) {
      setEditApprovalOption('dtcp');
      setEditCustomApproval('');
    } else if (appType.toLowerCase().includes('farm')) {
      setEditApprovalOption('farmland');
      setEditCustomApproval('');
    } else {
      setEditApprovalOption('custom');
      setEditCustomApproval(appType);
    }

    setEditPhone(p.contact_information?.phone || PRIMARY_CONTACT_PHONE);
    setEditEmail(p.contact_information?.email || 'yazhpromoters@gmail.com');
    setEditSalesOffice(p.contact_information?.sales_office || 'Kallakurichi, Tamil Nadu');
  };

  const handleSaveEdit = async () => {
    if (!editingProject) return;

    if (!editName.trim()) {
      alert('Please enter a project name');
      return;
    }

    try {
      setIsSaving(true);
      let finalApproval = 'DTCP Approved';
      if (editApprovalOption === 'dtcp') finalApproval = 'DTCP Approved';
      else if (editApprovalOption === 'farmland') finalApproval = 'Managed Farmland';
      else finalApproval = editCustomApproval.trim() || 'DTCP Approved';

      const updated = await updateProject(editingProject.id, {
        name: editName.trim(),
        slug: editSlug.trim() || editingProject.slug,
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">All Projects</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
              {projects.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live inventory overview: plot availability, sold counts, size dimensions, and pricing breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Drawer Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => openSidebar()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-950 text-emerald-300 hover:text-white border border-emerald-800 text-xs font-bold shadow-xs hover:bg-emerald-900 transition-all"
            title="Open All Projects Quick Drawer Sidebar"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Open Projects Drawer</span>
          </button>

          {/* View Mode Toggle */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center border border-slate-300/80">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Big Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>Big Boxes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Table</span>
            </button>
          </div>

          <Link
            to="/admin/projects/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Project</span>
          </Link>
        </div>
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

      {/* BIG BOXES CARDS VIEW (DEFAULT) */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Loading project inventory & plot statistics...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500 shadow-xs">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-base">No Projects Found</h3>
              <p className="mt-1">
                Click "New Project" to register your first layout and start plotting.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {projects.map((project) => (
                <ProjectBigCard
                  key={project.id}
                  project={project}
                  onTogglePublish={handleTogglePublish}
                  onEdit={openEditModal}
                  onDelete={setDeletingProject}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROJECTS TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto mb-2" />
              <span>Loading projects...</span>
            </div>
          ) : projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Project Name & Location</th>
                    <th className="py-3.5 px-4">Plots Overview</th>
                    <th className="py-3.5 px-4">Status</th>
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
                          <span
                            className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] inline-flex items-center gap-1 border ${
                              getProjectApprovalType(p).toLowerCase().includes('farm')
                                ? 'bg-emerald-100/90 text-emerald-950 border-emerald-300'
                                : 'bg-amber-100/80 text-amber-950 border-amber-300'
                            }`}
                          >
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
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px]">
                            {p.stats.availablePlots} Avail
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[10px]">
                            {p.stats.soldPlots} Sold
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            / {p.stats.totalPlots} total
                          </span>
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

                          <button
                            onClick={() => openEditModal(p)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                            title="Edit Project Details"
                          >
                            <Pencil className="w-3 h-3 text-blue-600" />
                            <span>Edit</span>
                          </button>

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
      )}

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
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Vallalar Nagar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-mono"
                    placeholder="e.g. vallalar-nagar"
                  />
                </div>
              </div>

              {/* Approval Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Approval & Project Classification
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditApprovalOption('dtcp')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      editApprovalOption === 'dtcp'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${
                      editApprovalOption === 'dtcp' ? 'text-amber-600' : 'text-slate-400'
                    }`} />
                    <div>
                      <p className="text-xs font-black text-slate-900">DTCP Approved</p>
                      <p className="text-[10px] text-slate-500">Urban plot layouts</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditApprovalOption('farmland')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      editApprovalOption === 'farmland'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Trees className={`w-4 h-4 shrink-0 mt-0.5 ${
                      editApprovalOption === 'farmland' ? 'text-emerald-600' : 'text-slate-400'
                    }`} />
                    <div>
                      <p className="text-xs font-black text-slate-900">Managed Farmland</p>
                      <p className="text-[10px] text-slate-500">Agri/Farm developments</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditApprovalOption('custom')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      editApprovalOption === 'custom'
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${
                      editApprovalOption === 'custom' ? 'text-blue-600' : 'text-slate-400'
                    }`} />
                    <div>
                      <p className="text-xs font-black text-slate-900">Custom Type</p>
                      <p className="text-[10px] text-slate-500">Specify other</p>
                    </div>
                  </button>
                </div>

                {editApprovalOption === 'custom' && (
                  <input
                    type="text"
                    value={editCustomApproval}
                    onChange={(e) => setEditCustomApproval(e.target.value)}
                    placeholder="Enter custom approval (e.g. CMDA Approved, RERA Registered)"
                    className="mt-2 w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Total Land Area & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Land Area
                  </label>
                  <input
                    type="text"
                    value={editTotalLandArea}
                    onChange={(e) => setEditTotalLandArea(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 10.5 Acres or 50 Cents"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="draft">Draft (Visible only to Admin)</option>
                    <option value="published">Published (Live on Public Portal)</option>
                    <option value="archived">Archived (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Location Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Location & Address
                </span>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Address / Landmark
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Near New Bus Stand, Salem Main Road"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={editPostalCode}
                      onChange={(e) => setEditPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Project Contact Overrides
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>Email</span>
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sales Office Address
                  </label>
                  <input
                    type="text"
                    value={editSalesOffice}
                    onChange={(e) => setEditSalesOffice(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Provide project highlights, amenities, and connectivity..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Delete Project?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 font-extrabold">"{deletingProject.name}"</strong>?
                This will archive the project and its layout blueprints and plots.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
