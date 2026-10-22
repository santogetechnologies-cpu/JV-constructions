import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Building2, MapPin, Phone, ShieldCheck, Trees, Sparkles, Check } from 'lucide-react';
import { createProject } from '../../services/api';
import { ProjectStatus } from '../../types/database';
import { OFFICIAL_CONTACTS } from '../../constants/contacts';

export const AdminNewProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  
  // Approval / Property Type State
  const [approvalOption, setApprovalOption] = useState<'dtcp' | 'farmland' | 'custom'>('dtcp');
  const [customApproval, setCustomApproval] = useState('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [totalLandArea, setTotalLandArea] = useState('10.5 Acres');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  
  // Contact State
  const [phone, setPhone] = useState('+91 96005 89191');
  const [email, setEmail] = useState('');
  const [salesOffice, setSalesOffice] = useState('');

  // Auto-generate slug from name in small letters, space replaced by -
  const generateSlugFromName = (val: string) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(generateSlugFromName(val));
  };

  const getFinalApprovalType = () => {
    if (approvalOption === 'farmland') return 'Farm Land';
    if (approvalOption === 'custom') return customApproval.trim() || 'Custom Layout';
    return 'DTCP Approved';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = (slug || generateSlugFromName(name)) || `project-${Date.now()}`;
    if (!name.trim() || !city.trim()) {
      setError('Project name and city are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const finalApproval = getFinalApprovalType();

    try {
      const newProj = await createProject({
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
        booking_policy: {
          allow_enquiries: true,
          hold_duration_hours: 48,
          require_approval: true,
          approval_type: finalApproval,
        },
        contact_information: {
          phone: phone.trim(),
          email: email.trim(),
          sales_office: salesOffice.trim() || 'Site Marketing Office',
        },
      });

      // Proceed immediately to Layout & CAD upload
      navigate(`/admin/projects/${newProj.id}/layout`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project in Supabase');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Link
        to="/admin/projects"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Projects</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Real Estate Project</h1>
        <p className="text-xs text-slate-500 mt-1">
          Add an approved development project. Configure DTCP, Farm Land, or custom approval type, plus CAD drawings and plot polygons.
        </p>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-xs">
          {/* CORE DETAILS */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3">Core Identity</h3>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Green Valley Meadows Phase 1"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* APPROVAL / PROPERTY TYPE SELECTOR */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block font-black text-slate-900 mb-2">
                Approval & Property Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setApprovalOption('dtcp')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    approvalOption === 'dtcp'
                      ? 'bg-amber-50 border-amber-400 text-amber-950 font-black shadow-xs ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs">DTCP Approved</p>
                      <p className="text-[10px] text-slate-500 font-normal">Sanctioned layout</p>
                    </div>
                  </div>
                  {approvalOption === 'dtcp' && <Check className="w-4 h-4 text-amber-700 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setApprovalOption('farmland')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    approvalOption === 'farmland'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Trees className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs">Farm Land</p>
                      <p className="text-[10px] text-slate-500 font-normal">Agricultural / Farm layout</p>
                    </div>
                  </div>
                  {approvalOption === 'farmland' && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setApprovalOption('custom')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    approvalOption === 'custom'
                      ? 'bg-blue-50 border-blue-400 text-blue-950 font-black shadow-xs ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs">Custom Type</p>
                      <p className="text-[10px] text-slate-500 font-normal">Enter custom approval</p>
                    </div>
                  </div>
                  {approvalOption === 'custom' && <Check className="w-4 h-4 text-blue-700 shrink-0" />}
                </button>
              </div>

              {approvalOption === 'custom' && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 animate-in fade-in">
                  <label className="block font-bold text-slate-700 mb-1">
                    Custom Approval / Property Type Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CMDA Approved, Panchayat Sanctioned, Gated Agro Plantation..."
                    value={customApproval}
                    onChange={(e) => setCustomApproval(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Details about layout, roads, ground water, immediate registration..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* CONTACT & ADVISORS */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm mb-2">Project Contact & Advisors</h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Select one of our official property advisors or enter custom contact information:
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {OFFICIAL_CONTACTS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setPhone(c.phone);
                    setSalesOffice(`${c.name} - ${c.role}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    phone === c.phone
                      ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Phone className="w-3 h-3 text-amber-600" />
                  <span>{c.name} ({c.phone})</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 96005 89191"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sales Office / Assigned Desk</label>
                <input
                  type="text"
                  placeholder="Baskar - Sales & Enquiries"
                  value={salesOffice}
                  onChange={(e) => setSalesOffice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Location & Coordinates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coimbatore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  placeholder="641001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Land Extent</label>
                <input
                  type="text"
                  placeholder="e.g. 10.5 Acres"
                  value={totalLandArea}
                  onChange={(e) => setTotalLandArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Latitude (for Satellite Map switch)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="11.0168"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Longitude (for Satellite Map switch)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="76.9558"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* STATUS */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Publication Status</h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="font-bold text-slate-700">Draft (Admin Only)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={status === 'published'}
                  onChange={() => setStatus('published')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="font-bold text-slate-700">Published (Visible on Public Portal)</span>
              </label>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              <span>{isSubmitting ? 'Creating Project...' : 'Save & Configure CAD Layout'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
