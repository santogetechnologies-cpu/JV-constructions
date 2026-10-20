import React, { useEffect, useState } from 'react';
import { Users, Phone, Mail, Calendar, CheckCircle2, Clock, Search, Trash2, AlertTriangle, X } from 'lucide-react';
import { Lead, Booking } from '../../types/database';
import { getBookingsAdmin, deleteBooking } from '../../services/api';

export const AdminLeadsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getBookingsAdmin();
        setBookings(data);
      } catch (err: any) {
        setNotice({ type: 'error', text: err.message || 'Failed to load leads' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingBooking) return;
    try {
      setIsDeleting(true);
      await deleteBooking(deletingBooking.id);
      setBookings((prev) => prev.filter((b) => b.id !== deletingBooking.id));
      setNotice({
        type: 'success',
        text: `Enquiry from "${deletingBooking.customer_name}" (Ref: ${deletingBooking.booking_reference}) was deleted successfully.`,
      });
      setDeletingBooking(null);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to delete booking enquiry' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search) ||
      b.booking_reference.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Leads & Inquiries</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track customer booking requests, contact history, follow-ups, and manage enquiries.
        </p>
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

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or reference..."
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
          <option value="all">All Statuses ({bookings.length})</option>
          <option value="new_enquiry">New Enquiry</option>
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
                  <th className="py-3.5 px-4">Project & Plot</th>
                  <th className="py-3.5 px-4">Preferred Channel</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-slate-900">{b.customer_name}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        Ref: {b.booking_reference}
                      </div>
                      {b.location && (
                        <div className="text-[10px] text-slate-500 mt-0.5">Loc: {b.location}</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{b.phone}</span>
                      </div>
                      {b.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{b.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900 block">
                        Plot #{b.plot?.plot_number || 'N/A'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {b.project?.name || 'Project'}
                      </span>
                    </td>
                    <td className="py-4 px-4 capitalize text-slate-600 font-medium">
                      {b.preferred_contact_method}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          b.status === 'confirmed' || b.status === 'sold'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'on_hold'
                            ? 'bg-indigo-100 text-indigo-800'
                            : b.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setDeletingBooking(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-[11px] transition-colors"
                        title="Delete this inquiry"
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
      {deletingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Delete Enquiry?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete the booking inquiry from{' '}
                <strong className="text-slate-900">"{deletingBooking.customer_name}"</strong>?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-[11px] text-left border border-slate-200 mt-2 space-y-1">
                <div><strong>Ref:</strong> {deletingBooking.booking_reference}</div>
                <div><strong>Phone:</strong> {deletingBooking.phone}</div>
                <div><strong>Project:</strong> {deletingBooking.project?.name || 'Project'}</div>
                <div><strong>Plot:</strong> #{deletingBooking.plot?.plot_number || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingBooking(null)}
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
