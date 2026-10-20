import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Building2, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { createProject } from '../../services/api';
import { ProjectStatus } from '../../types/database';

export const AdminNewProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [totalLandArea, setTotalLandArea] = useState('10.5 Acres');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('');
  const [salesOffice, setSalesOffice] = useState('');

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !city.trim()) {
      setError('Project name, slug, and city are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

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
        contact_information: {
          phone: phone.trim(),
          email: email.trim(),
          sales_office: salesOffice.trim(),
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
          Add an approved development project. Once created, you will upload CAD drawings and configure plot polygons.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Valley Meadows Phase 1"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Slug (Unique) *</label>
                <input
                  type="text"
                  required
                  placeholder="green-valley-meadows"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="DTCP approved layout with 40ft blacktop roads, underground drainage, and immediate registration..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  placeholder="641001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="text-emerald-600 focus:ring-emerald-500"
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
                  className="text-emerald-600 focus:ring-emerald-500"
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
              className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{isSubmitting ? 'Creating Project...' : 'Save & Configure CAD Layout'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
