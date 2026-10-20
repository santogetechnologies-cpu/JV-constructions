import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Building2, MapPin, Phone, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Booking } from '../../types/database';
import { getBookingConfirmation } from '../../services/api';
import { getStatusLabel } from '../../lib/utils';

export const BookingConfirmationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!reference) return;
      try {
        setLoading(true);
        const b = await getBookingConfirmation(reference);
        if (!b) {
          setError('Booking reference not found.');
          return;
        }
        setBooking(b);
      } catch (err: any) {
        setError(err.message || 'Failed to load booking confirmation.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="font-bold text-slate-800 text-base">Booking Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
        <Link
          to="/"
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center">
          {/* SUCCESS ICON */}
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
            Request Logged in Database
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Enquiry Received Successfully
          </h1>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Your booking request has been registered in the Supabase PostgreSQL database. Our sales team has been notified.
          </p>

          {/* REFERENCE BADGE */}
          <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 inline-block w-full text-left">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                  Reference ID
                </span>
                <span className="font-mono font-extrabold text-sm text-slate-900 block mt-0.5">
                  {booking.booking_reference}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                  Status
                </span>
                <span className="font-extrabold text-emerald-700 block mt-0.5 capitalize">
                  {booking.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                  Project
                </span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  {booking.project?.name || 'Project'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                  Plot Target
                </span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  Plot #{booking.plot?.plot_number || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* NEXT STEPS NOTICE */}
          <div className="text-left bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 mb-6 text-xs text-emerald-950 space-y-2">
            <h4 className="font-extrabold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              What Happens Next:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>Our property manager reviews your enquiry against the latest layout survey.</li>
              <li>You will receive a call via {booking.preferred_contact_method} to coordinate a physical site inspection.</li>
              <li>Once verified, an official hold or advance registration agreement will be processed.</li>
            </ul>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={booking.project ? `/projects/${booking.project.slug}/map` : '/projects'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
            >
              <span>Back to Interactive Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
