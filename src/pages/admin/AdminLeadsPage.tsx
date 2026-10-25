import React, { useEffect, useState } from 'react';
import {
  Users,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Trash2,
  AlertTriangle,
  X,
  Send,
  Building,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { Lead, Booking } from '../../types/database';
import { getBookingsAdmin, deleteBooking, getLeadsAdmin, deleteLead } from '../../services/api';

type LeadItem =
  | {
      kind: 'booking';
      id: string;
      customer_name: string;
      phone: string;
      email?: string | null;
      location?: string | null;
      booking_reference: string;
      project_name: string;
      plot_number?: string | null;
      channel: string;
      status: string;
      notes?: string | null;
      created_at: string;
      raw: Booking;
    }
  | {
      kind: 'lead';
      id: string;
      customer_name: string;
      phone: string;
      email?: string | null;
      location?: string | null;
      booking_reference: string;
      project_name: string;
      plot_number?: string | null;
      channel: string;
      status: string;
      notes?: string | null;
      created_at: string;
      raw: Lead;
    };

export const AdminLeadsPage: React.FC = () => {
  const [items, setItems] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'booking' | 'lead'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingItem, setDeletingItem] = useState<LeadItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, leadsData] = await Promise.all([
        getBookingsAdmin().catch((err) => {
          console.warn('Could not load bookings:', err);
          return [] as Booking[];
        }),
        getLeadsAdmin().catch((err) => {
          console.warn('Could not load direct leads:', err);
          return [] as Lead[];
        }),
      ]);

      const formattedBookings: LeadItem[] = bookingsData.map((b) => ({
        kind: 'booking',
        id: b.id,
        customer_name: b.customer_name,
        phone: b.phone,
        email: b.email,
        location: b.location,
        booking_reference: b.booking_reference,
        project_name: b.project?.name || 'Project',
        plot_number: b.plot?.plot_number || null,
        channel: b.preferred_contact_method || 'phone',
        status: b.status,
        notes: b.message,
        created_at: b.created_at,
        raw: b,
      }));

      const formattedLeads: LeadItem[] = leadsData.map((l) => ({
        kind: 'lead',
        id: l.id,
        customer_name: l.customer_name,
        phone: l.phone,
        email: l.email,
        location: l.location,
        booking_reference: `LEAD-${l.id.slice(0, 6).toUpperCase()}`,
        project_name: (l as any).project?.name || 'General Inquiry',
        plot_number: null,
        channel: 'callback',
        status: l.status,
        notes: l.notes,
        created_at: l.created_at,
        raw: l,
      }));

      // Combine and sort by date descending
      const combined = [...formattedBookings, ...formattedLeads].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setItems(combined);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to load leads' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      if (deletingItem.kind === 'booking') {
        await deleteBooking(deletingItem.id);
      } else {
        await deleteLead(deletingItem.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
      setNotice({
        type: 'success',
        text: `Enquiry from "${deletingItem.customer_name}" (Ref: ${deletingItem.booking_reference}) was deleted successfully.`,
      });
      setDeletingItem(null);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to delete lead' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search) ||
      item.booking_reference.toLowerCase().includes(search.toLowerCase()) ||
      item.project_name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.kind === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const bookingCount = items.filter((i) => i.kind === 'booking').length;
  const leadCount = items.filter((i) => i.kind === 'lead').length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER WITH EMAIL ALERT BADGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Leads & Inquiries</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer booking requests, callback inquiries, follow-ups, and manage all leads.
          </p>
        </div>

        {/* AUTOMATIC EMAIL ALERT STATUS BADGE */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-900 shadow-xs">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div className="text-xs">
            <span className="font-extrabold block text-emerald-950">Auto Email Alerts Active</span>
            <span className="text-[11px] text-emerald-700 font-mono">mail2baskar88@gmail.com</span>
          </div>
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
            className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* METRIC PILLS & FILTER BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            categoryFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">Total Enquiries</div>
          <div className="text-2xl font-black mt-1">{items.length}</div>
        </button>

        <button
          onClick={() => setCategoryFilter('booking')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            categoryFilter === 'booking'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">Plot Bookings</div>
          <div className="text-2xl font-black mt-1">{bookingCount}</div>
        </button>

        <button
          onClick={() => setCategoryFilter('lead')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            categoryFilter === 'lead'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">Direct Callbacks & Offers</div>
          <div className="text-2xl font-black mt-1">{leadCount}</div>
        </button>
      </div>

      {/* SEARCH & STATUS FILTER */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name, phone, project, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses ({items.length})</option>
          <option value="new_enquiry">New Enquiry</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="visit_scheduled">Visit Scheduled</option>
          <option value="booking_pending">Booking Pending</option>
          <option value="on_hold">On Hold</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* LEADS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto mb-2" />
            Loading leads...
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Type & Project</th>
                  <th className="py-3.5 px-4">Requirement / Notes</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={`${item.kind}-${item.id}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-slate-900">{item.customer_name}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        Ref: {item.booking_reference}
                      </div>
                      {item.location && (
                        <div className="text-[10px] text-slate-500 mt-0.5">Loc: {item.location}</div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a href={`tel:${item.phone}`} className="hover:text-emerald-600 transition-colors">
                          {item.phone}
                        </a>
                      </div>
                      {item.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <a href={`mailto:${item.email}`} className="hover:text-emerald-600 transition-colors">
                            {item.email}
                          </a>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            item.kind === 'booking'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.kind === 'booking' ? 'Plot Booking' : 'Callback Request'}
                        </span>
                      </div>
                      {item.plot_number && (
                        <span className="font-bold text-slate-900 block text-xs">
                          Plot #{item.plot_number}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                        {item.project_name}
                      </span>
                    </td>

                    <td className="py-4 px-4 max-w-[240px]">
                      <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                        {item.notes || 'No extra notes provided.'}
                      </p>
                      <span className="text-[10px] text-slate-400 capitalize mt-0.5 block">
                        Channel: {item.channel}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          item.status === 'confirmed' || item.status === 'sold'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'on_hold'
                            ? 'bg-indigo-100 text-indigo-800'
                            : item.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {new Date(item.created_at).toLocaleString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        title="Delete this lead"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            No leads matching current filter.
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Delete Enquiry?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete the inquiry from{' '}
                <strong className="text-slate-900">"{deletingItem.customer_name}"</strong>?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-[11px] text-left border border-slate-200 mt-2 space-y-1">
                <div><strong>Ref:</strong> {deletingItem.booking_reference}</div>
                <div><strong>Phone:</strong> {deletingItem.phone}</div>
                <div><strong>Project:</strong> {deletingItem.project_name}</div>
                {deletingItem.plot_number && <div><strong>Plot:</strong> #{deletingItem.plot_number}</div>}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingItem(null)}
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
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
