import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Layers,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import { DashboardMetrics, Project, Booking } from '../../types/database';
import { getDashboardMetrics, getAllProjectsAdmin, getBookingsAdmin } from '../../services/api';
import { supabase } from '../../lib/supabaseClient';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [m, projs, bks] = await Promise.all([
        getDashboardMetrics(),
        getAllProjectsAdmin(),
        getBookingsAdmin(),
      ]);
      setMetrics(m);
      setRecentProjects(projs.slice(0, 5));
      setRecentBookings(bks.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Real-time synchronization for dashboard counters
    const channel = supabase
      .channel('admin-dashboard-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plots' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventory & Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time synchronization across CAD blueprints, plot availability, and customer reservations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh Metrics"
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/projects/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
          <p className="font-bold">Error loading live metrics:</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {/* METRICS CARDS GRID (100% REAL SUPABASE COUNTERS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Plots */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Plots</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">
            {metrics ? metrics.totalPlots : '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Across all registered layouts</p>
        </div>

        {/* Available Plots */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold uppercase tracking-wider">Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-800 mt-2">
            {metrics ? metrics.availablePlots : '—'}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1">Open for public enquiry</p>
        </div>

        {/* Booked / On Hold */}
        <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-xs font-bold uppercase tracking-wider">Booked / Hold</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-800 mt-2">
            {metrics ? metrics.bookedPlots + metrics.onHoldPlots : '—'}
          </p>
          <p className="text-[11px] text-blue-700/80 mt-1">
            {metrics ? `${metrics.onHoldPlots} on active hold` : 'Active reservations'}
          </p>
        </div>

        {/* New Enquiries */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">New Enquiries</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">
            {metrics ? metrics.newEnquiries : '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Pending sales follow-up</p>
        </div>
      </div>

      {/* RECENT PROJECTS & RECENT BOOKINGS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RECENT PROJECTS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Projects Directory</h3>
              <Link
                to="/admin/projects"
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                View All →
              </Link>
            </div>

            {recentProjects.length > 0 ? (
              <div className="space-y-3">
                {recentProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {p.city}, {p.state} • Slug: {p.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                          p.status === 'published'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                      <Link
                        to={`/admin/projects/${p.id}/layout`}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100"
                      >
                        CAD Editor
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No projects created yet. Click "New Project" above to create your first layout.
              </div>
            )}
          </div>
        </div>

        {/* RECENT BOOKING ENQUIRIES */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Recent Customer Leads</h3>
              <Link
                to="/admin/leads"
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                View Leads →
              </Link>
            </div>

            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{b.customer_name}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {b.booking_reference}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {b.phone} • Target: Plot #{b.plot?.plot_number || 'N/A'} (
                        {b.project?.name || 'Project'})
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 capitalize">
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No customer enquiries submitted yet. When buyers submit from the public map, they will appear here live.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
