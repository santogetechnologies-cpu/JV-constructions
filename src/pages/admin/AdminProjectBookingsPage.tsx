import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Settings,
  Trash2,
} from 'lucide-react';
import { Booking, Project, BookingStatus } from '../../types/database';
import {
  getProjectById,
  getBookingsAdmin,
  updateBookingStatus,
  updatePlotStatusAtomic,
  deleteBooking,
} from '../../services/api';

export const AdminProjectBookingsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const proj = await getProjectById(projectId);
      setProject(proj);

      const bks = await getBookingsAdmin(projectId);
      setBookings(bks);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to load bookings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleStatusTransition = async (
    bookingId: string,
    plotId: string,
    newStatus: BookingStatus
  ) => {
    try {
      await updateBookingStatus(bookingId, newStatus);

      // If status becomes 'on_hold', update plot status to 'on_hold'
      if (newStatus === 'on_hold') {
        await updatePlotStatusAtomic(plotId, 'on_hold', 'Hold approved by administrator');
      } else if (newStatus === 'confirmed' || newStatus === 'sold') {
        await updatePlotStatusAtomic(
          plotId,
          newStatus === 'sold' ? 'sold' : 'booked',
          `Reservation confirmed (${newStatus})`
        );
      } else if (newStatus === 'cancelled') {
        await updatePlotStatusAtomic(plotId, 'available', 'Booking cancelled, inventory released');
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      setNotice({ type: 'success', text: `Booking status transitioned to ${newStatus}` });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to update booking status' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBooking) return;
    try {
      setIsDeleting(true);
      // If booking was holding or booking the plot, free it back to available
      if (deletingBooking.plot_id && (deletingBooking.status === 'on_hold' || deletingBooking.status === 'booking_pending')) {
        try {
          await updatePlotStatusAtomic(deletingBooking.plot_id, 'available', 'Booking deleted by admin, inventory released');
        } catch (e) {
          console.warn('Could not reset plot status:', e);
        }
      }

      await deleteBooking(deletingBooking.id);
      setBookings((prev) => prev.filter((b) => b.id !== deletingBooking.id));
      setNotice({
        type: 'success',
        text: `Enquiry Ref: ${deletingBooking.booking_reference} (${deletingBooking.customer_name}) was deleted.`,
      });
      setDeletingBooking(null);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to delete booking' });
    } finally {
      setIsDeleting(false);
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
            Reservations & Leads: {project?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process customer booking submissions, manage reservation holds, and finalize plot allocations.
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
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* BOOKINGS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto mb-2" />
            Loading booking records...
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Ref ID</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Plot Target</th>
                  <th className="py-3.5 px-4">Preferred Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {b.booking_reference}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-slate-900">{b.customer_name}</div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{b.phone}</span>
                      </div>
                      {b.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Mail className="w-3 h-3" />
                          <span>{b.email}</span>
                        </div>
                      )}
                      {b.location && (
                        <div className="text-[10px] text-slate-500 mt-0.5">Loc: {b.location}</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-extrabold text-slate-900">
                        Plot #{b.plot?.plot_number || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4 capitalize text-slate-600">
                      {b.preferred_contact_method}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
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
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {b.status !== 'confirmed' && b.status !== 'sold' && (
                          <button
                            onClick={() =>
                              handleStatusTransition(b.id, b.plot_id, 'confirmed')
                            }
                            title="Confirm Booking"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition-colors"
                          >
                            Confirm
                          </button>
                        )}

                        {b.status === 'new_enquiry' && (
                          <button
                            onClick={() =>
                              handleStatusTransition(b.id, b.plot_id, 'contacted')
                            }
                            title="Mark Contacted"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors"
                          >
                            Contacted
                          </button>
                        )}

                        {b.status !== 'cancelled' && (
                          <button
                            onClick={() =>
                              handleStatusTransition(b.id, b.plot_id, 'cancelled')
                            }
                            title="Cancel Request & Release Plot"
                            className="px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold rounded-lg text-[11px] transition-colors"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          onClick={() => setDeletingBooking(b)}
                          title="Permanently Delete Enquiry"
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            No enquiries submitted for this project yet.
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
              <h3 className="text-lg font-black text-slate-900">Delete Booking Enquiry?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete the booking inquiry from{' '}
                <strong className="text-slate-900">"{deletingBooking.customer_name}"</strong>?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-[11px] text-left border border-slate-200 mt-2 space-y-1">
                <div><strong>Ref:</strong> {deletingBooking.booking_reference}</div>
                <div><strong>Phone:</strong> {deletingBooking.phone}</div>
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
