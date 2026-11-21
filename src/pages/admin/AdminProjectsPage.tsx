import React, { useEffect, useState, useMemo } from 'react';
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
  Search,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { ProjectWithStats, ProjectStatus, getProjectApprovalType } from '../../types/database';
import { getAllProjectsWithStatsAdmin, updateProject, deleteProject } from '../../services/api';
import { PRIMARY_CONTACT_PHONE, CONTACT_EMAIL } from '../../constants/contacts';
import { ProjectBigCard } from '../../components/admin/ProjectBigCard';
import { parseMapInput, isValidCoordinate, getProjectLiveMapUrl } from '../../lib/mapUtils';

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'published' | 'draft' | 'farmland' | 'dtcp'>('all');

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
  const [editMapLink, setEditMapLink] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);
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

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !searchQuery ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.address && project.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        getProjectApprovalType(project).toLowerCase().includes(searchQuery.toLowerCase());

      const approval = getProjectApprovalType(project).toLowerCase();
      let matchesFilter = true;
      if (filterType === 'published') matchesFilter = project.status === 'published';
      else if (filterType === 'draft') matchesFilter = project.status === 'draft';
      else if (filterType === 'farmland') matchesFilter = approval.includes('farm');
      else if (filterType === 'dtcp') matchesFilter = approval.includes('dtcp');

      return matchesSearch && matchesFilter;
    });
  }, [projects, searchQuery, filterType]);

  // Overall live aggregate metrics
  const totalPlots = projects.reduce((acc, p) => acc + p.stats.totalPlots, 0);
  const totalAvailable = projects.reduce((acc, p) => acc + p.stats.availablePlots, 0);
  const totalSold = projects.reduce((acc, p) => acc + p.stats.soldPlots, 0);
  const totalBooked = projects.reduce((acc, p) => acc + p.stats.bookedPlots + p.stats.onHoldPlots, 0);

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
    const rawAddr = p.address || '';
    const hasUrlInAddr = rawAddr.startsWith('http://') || rawAddr.startsWith('https://');
    const initialMapLink =
      (p as any).map_link ||
      p.contact_information?.map_link ||
      p.booking_policy?.map_link ||
      (hasUrlInAddr ? rawAddr : '');

    setEditAddress(hasUrlInAddr ? '' : rawAddr);
    setEditCity(p.city || '');
    setEditState(p.state || 'Tamil Nadu');
    setEditPostalCode(p.postal_code || '');
    setEditTotalLandArea(p.total_land_area || '');
    setEditStatus(p.status || 'draft');

    setEditMapLink(initialMapLink || '');
    if (isValidCoordinate(p.latitude, p.longitude)) {
      setEditLatitude(String(p.latitude));
      setEditLongitude(String(p.longitude));
      setDetectedCoords({ lat: p.latitude!, lng: p.longitude! });
    } else if (initialMapLink) {
      const parsed = parseMapInput(initialMapLink);
      if (parsed.latitude != null && parsed.longitude != null) {
        setEditLatitude(String(parsed.latitude));
        setEditLongitude(String(parsed.longitude));
        setDetectedCoords({ lat: parsed.latitude, lng: parsed.longitude });
      } else {
        setEditLatitude('');
        setEditLongitude('');
        setDetectedCoords(null);
      }
    } else {
      setEditLatitude('');
      setEditLongitude('');
      setDetectedCoords(null);
    }

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
    setEditEmail(p.contact_information?.email || CONTACT_EMAIL);
    setEditSalesOffice(p.contact_information?.sales_office || 'Kallakurichi, Tamil Nadu');
  };

  const handleMapInputChange = (val: string) => {
    setEditMapLink(val);
    const parsed = parseMapInput(val);
    if (parsed.latitude != null && parsed.longitude != null) {
      setEditLatitude(String(parsed.latitude));
      setEditLongitude(String(parsed.longitude));
      setDetectedCoords({ lat: parsed.latitude, lng: parsed.longitude });
    }
  };

  const handleCoordChange = (newLat: string, newLng: string) => {
    setEditLatitude(newLat);
    setEditLongitude(newLng);
    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    if (isValidCoordinate(lat, lng)) {
      setDetectedCoords({ lat, lng });
      if (!editMapLink) {
        setEditMapLink(`https://www.google.com/maps?q=${lat},${lng}`);
      }
    } else {
      setDetectedCoords(null);
    }
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

      const numLat = parseFloat(editLatitude);
      const numLng = parseFloat(editLongitude);
      const finalLat = isValidCoordinate(numLat, numLng) ? numLat : null;
      const finalLng = isValidCoordinate(numLat, numLng) ? numLng : null;
      const cleanMapUrl = editMapLink.trim() || (finalLat && finalLng ? `https://www.google.com/maps?q=${finalLat},${finalLng}` : null);

      const updated = await updateProject(editingProject.id, {
        name: editName.trim(),
        slug: editSlug.trim() || editingProject.slug,
        description: editDescription.trim() || null,
        address: editAddress.trim() || null,
        city: editCity.trim(),
        state: editState.trim(),
        postal_code: editPostalCode.trim() || null,
        latitude: finalLat,
        longitude: finalLng,
        map_link: cleanMapUrl || undefined,
        total_land_area: editTotalLandArea.trim() || null,
        status: editStatus,
        booking_policy: {
          ...(editingProject.booking_policy || {}),
          allow_enquiries: editingProject.booking_policy?.allow_enquiries ?? true,
          hold_duration_hours: editingProject.booking_policy?.hold_duration_hours ?? 48,
          require_approval: editingProject.booking_policy?.require_approval ?? true,
          approval_type: finalApproval,
          map_link: cleanMapUrl || undefined,
        },
        contact_information: {
          phone: editPhone.trim(),
          email: editEmail.trim(),
          sales_office: editSalesOffice.trim(),
          map_link: cleanMapUrl || undefined,
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
        text: `Project "${targetName}" was successfully removed.`,
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              All Projects
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-slate-200 text-slate-800">
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time plot inventory, availability counts, sold status, pricing, and size details.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadProjects}
            title="Refresh Data"
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/admin/projects/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* OVERALL INVENTORY SUMMARY BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Projects</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">{projects.length}</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Available Plots</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block">{totalAvailable}</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-black text-rose-800 uppercase tracking-wider">Sold Plots</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-rose-700 mt-1 block">{totalSold}</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inventory</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-1 block">{totalPlots}</span>
        </div>
      </div>

      {/* NOTICES */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-2.5 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg transition-colors text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects by name, city, location or approval..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'published', label: 'Published' },
              { key: 'draft', label: 'Draft' },
              { key: 'dtcp', label: 'DTCP' },
              { key: 'farmland', label: 'Farmland' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterType(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === item.key
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* BIG BOX CARDS LIST */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-2xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-sm">Loading projects & live plot counts...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-xs text-slate-500 shadow-2xs space-y-2">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No Projects Found</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No projects match "${searchQuery}". Try clearing your search.`
                : 'Click the "New Project" button to set up your first layout.'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <ProjectBigCard
              key={project.id}
              project={project}
              onTogglePublish={handleTogglePublish}
              onEdit={openEditModal}
              onDelete={setDeletingProject}
            />
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Project Details</h3>
                  <p className="text-xs text-slate-500">Update identity, approval, and location info</p>
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
                  />
                </div>
              </div>

              {/* Approval Options */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Approval & Classification
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
                      <p className="text-[10px] text-slate-500">Agri/Farm plots</p>
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
                    placeholder="Enter approval type..."
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
                    <option value="draft">Draft (Admin only)</option>
                    <option value="published">Published (Live to public)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
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
                    placeholder="e.g. Salem Main Road"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={editPostalCode}
                      onChange={(e) => setEditPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dedicated Google Maps Link & GPS Coordinates */}
                <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Google Maps Link or GPS Coordinates</span>
                      </label>
                      {editMapLink && (
                        <a
                          href={getProjectLiveMapUrl({
                            latitude: detectedCoords?.lat,
                            longitude: detectedCoords?.lng,
                            map_link: editMapLink,
                            name: editName,
                            city: editCity,
                            state: editState,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1"
                        >
                          <span>Test in Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editMapLink}
                      onChange={(e) => handleMapInputChange(e.target.value)}
                      placeholder="Paste link (https://maps.app.goo.gl/...) or coordinates (8°30'48.9&quot;N 77°40'12.3&quot;E or 8.5135, 77.6700)"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Paste any Google Maps link, share URL, or GPS coordinates. Public site visitors will see this exact location on the satellite map modal and navigation buttons.
                    </p>
                  </div>

                  {/* Coordinate verification pill */}
                  {detectedCoords ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>GPS Coordinates Verified:</strong> {detectedCoords.lat.toFixed(6)}°, {detectedCoords.lng.toFixed(6)}°
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${detectedCoords.lat},${detectedCoords.lng}&t=k&z=17`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline shrink-0 ml-2"
                      >
                        Satellite Preview ↗
                      </a>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200 rounded-xl p-2 font-medium">
                      Tip: You can paste DMS coordinates like <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">8°30'48.9&quot;N 77°40'12.3&quot;E</code> or decimal <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">8.5135, 77.6700</code> below.
                    </p>
                  )}

                  {/* Explicit Latitude / Longitude input controls */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Latitude (e.g. 8.513583)</label>
                      <input
                        type="text"
                        value={editLatitude}
                        onChange={(e) => handleCoordChange(e.target.value, editLongitude)}
                        placeholder="8.513583"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Longitude (e.g. 77.670083)</label>
                      <input
                        type="text"
                        value={editLongitude}
                        onChange={(e) => handleCoordChange(editLatitude, e.target.value)}
                        placeholder="77.670083"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Project Contact Info
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Highlights and details..."
                />
              </div>
            </div>

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
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
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

      {/* DELETE MODAL */}
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
                <strong className="text-slate-900 font-black">"{deletingProject.name}"</strong>?
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
