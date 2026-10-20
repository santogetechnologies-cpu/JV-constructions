import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Trash2,
  MapPin,
  Building2,
  Phone,
  Mail,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  PenTool,
  Grid,
  CalendarCheck,
  FileText,
} from 'lucide-react';
import { Project, ProjectStatus } from '../../types/database';
import { getProjectById, updateProject, deleteProject } from '../../services/api';

export const AdminEditProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [totalLandArea, setTotalLandArea] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salesOffice, setSalesOffice] = useState('');
  const [allowEnquiries, setAllowEnquiries] = useState(true);
  const [holdDurationHours, setHoldDurationHours] = useState(48);
  const [requireApproval, setRequireApproval] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await getProjectById(projectId);
        if (!data) {
          setNotice({ type: 'error', text: 'Project not found.' });
          return;
        }
        setProject(data);
        setName(data.name || '');
        setSlug(data.slug || '');
        setDescription(data.description || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setState(data.state || 'Tamil Nadu');
        setPostalCode(data.postal_code || '');
        setLatitude(data.latitude != null ? String(data.latitude) : '');
        setLongitude(data.longitude != null ? String(data.longitude) : '');
        setTotalLandArea(data.total_land_area || '');
        setStatus(data.status || 'draft');
        setPhone(data.contact_information?.phone || '');
        setEmail(data.contact_information?.email || '');
        setSalesOffice(data.contact_information?.sales_office || '');
        setAllowEnquiries(data.booking_policy?.allow_enquiries ?? true);
        setHoldDurationHours(data.booking_policy?.hold_duration_hours ?? 48);
        setRequireApproval(data.booking_policy?.require_approval ?? true);
      } catch (err: any) {
        setNotice({ type: 'error', text: err.message || 'Failed to load project details' });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    if (!name.trim()) {
      setNotice({ type: 'error', text: 'Project name is required.' });
      return;
    }
    if (!slug.trim()) {
      setNotice({ type: 'error', text: 'URL slug is required.' });
      return;
    }
    if (!city.trim()) {
      setNotice({ type: 'error', text: 'City is required.' });
      return;
    }

    try {
      setSaving(true);
      setNotice(null);

      const updated = await updateProject(projectId, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        total_land_area: totalLandArea.trim() || null,
        status,
        contact_information: {
          phone: phone.trim(),
          email: email.trim(),
          sales_office: salesOffice.trim(),
        },
        booking_policy: {
          allow_enquiries: allowEnquiries,
          hold_duration_hours: Number(holdDurationHours) || 48,
          require_approval: requireApproval,
        },
      });

      setProject(updated);
      setNotice({ type: 'success', text: 'Project details successfully updated!' });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to update project.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    try {
      setDeleting(true);
      await deleteProject(projectId);
      navigate('/admin/projects', { replace: true });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to delete project.' });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-3" />
        Loading project details...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-bold">
          Project not found or has been removed.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* TOP BREADCRUMBS & NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Project: {project.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${
                project.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : project.status === 'archived'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
            >
              {project.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Update name, location, contact information, publication status, and preferences.
          </p>
        </div>

        {/* QUICK SHORTCUT LINKS */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            to={`/admin/projects/${project.id}/layout`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <PenTool className="w-3.5 h-3.5 text-blue-600" />
            <span>CAD Layout</span>
          </Link>

          <Link
            to={`/admin/projects/${project.id}/plots`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Grid className="w-3.5 h-3.5 text-blue-600" />
            <span>Plots</span>
          </Link>

          <Link
            to={`/admin/projects/${project.id}/bookings`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Bookings</span>
          </Link>

          <Link
            to={`/admin/projects/${project.id}/documents`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Docs</span>
          </Link>

          {project.status === 'published' && (
            <Link
              to={`/projects/${project.slug}/map`}
              target="_blank"
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Map</span>
            </Link>
          )}
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{notice.text}</span>
        </div>
      )}

      {/* EDIT FORM */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* CORE IDENTITY */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">Core Identity & Status</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Green Valley Meadows Phase 1"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">URL Slug (Unique) *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. green-valley-meadows"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Used in public web URL: /projects/{slug || '...'}</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Publication Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="draft">Draft (Visible to admins only)</option>
                <option value="published">Published (Live to public)</option>
                <option value="archived">Archived (Read only)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Land Area</label>
              <input
                type="text"
                value={totalLandArea}
                onChange={(e) => setTotalLandArea(e.target.value)}
                placeholder="e.g. 10.5 Acres or 45,000 Sq.Ft"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Project Description & Highlights</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about DTCP approvals, connectivity, amenities, ground water, and features..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* LOCATION & GEOGRAPHY */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">Location & Address</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Survey No. 42/1, Bypass Road"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">City / Taluk *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Coimbatore"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Tamil Nadu"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Postal / PIN Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="641001"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">GPS Coordinates (Latitude, Longitude)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude (e.g. 11.0168)"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude (e.g. 76.9558)"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CONTACT & SALES DESK */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Phone className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-slate-900 text-sm">Contact Information & Sales Office</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sales Hotline Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sales Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@company.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sales Office / Site Desk</label>
              <input
                type="text"
                value={salesOffice}
                onChange={(e) => setSalesOffice(e.target.value)}
                placeholder="Site Marketing Pavilion, Gate 1"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* BOOKING POLICY */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm">Booking Policy & Online Reservation Rules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
              <input
                type="checkbox"
                checked={allowEnquiries}
                onChange={(e) => setAllowEnquiries(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="font-bold text-slate-800">Accept Online Plot Bookings</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="font-bold text-slate-800">Require Admin Approval</span>
            </label>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hold Duration (Hours)</label>
              <input
                type="number"
                min={1}
                max={168}
                value={holdDurationHours}
                onChange={(e) => setHoldDurationHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM SAVE ACTIONS */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to="/admin/projects"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="w-4 h-4 text-white" />
            )}
            <span>{saving ? 'Saving Changes...' : 'Save Project Details'}</span>
          </button>
        </div>
      </form>

      {/* DANGER ZONE: DELETE PROJECT */}
      <div className="mt-12 bg-red-50/50 rounded-3xl border border-red-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Danger Zone: Delete Project</span>
            </div>
            <p className="text-xs text-red-700 mt-1">
              Permanently delete this project along with all uploaded CAD blueprints, plot polygons, pricing, documents, and booking enquiries. This action cannot be reversed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm self-start sm:self-auto transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Project</span>
          </button>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Delete Project?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete <strong className="text-slate-900">"{project.name}"</strong>?
              </p>
              <div className="p-3 bg-red-50 rounded-xl text-red-800 text-[11px] text-left border border-red-100 mt-2">
                <strong>Warning:</strong> All plots, geometries, layouts, documents, and customer booking enquiries belonging to this project will be permanently erased.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{deleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
