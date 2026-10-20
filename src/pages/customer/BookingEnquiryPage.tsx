import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Plot, Project } from '../../types/database';
import { getSinglePlot, getProjectById, submitBookingEnquiry } from '../../services/api';
import { formatINR } from '../../lib/utils';

const bookingSchema = z.object({
  customerName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(7, 'Please enter a valid mobile number with country code'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  location: z.string().optional(),
  preferredContactMethod: z.enum(['phone', 'email', 'whatsapp']),
  message: z.string().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to being contacted regarding this property' }),
  }),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export const BookingEnquiryPage: React.FC = () => {
  const { plotId } = useParams<{ plotId: string }>();
  const navigate = useNavigate();

  const [plot, setPlot] = useState<Plot | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      preferredContactMethod: 'phone',
      consent: true,
    },
  });

  useEffect(() => {
    async function load() {
      if (!plotId) return;
      try {
        setLoading(true);
        const p = await getSinglePlot(plotId);
        if (!p) {
          setSubmitError('The requested plot does not exist in the database.');
          return;
        }
        setPlot(p);

        const proj = await getProjectById(p.project_id);
        setProject(proj);
      } catch (err: any) {
        setSubmitError(err.message || 'Failed to load plot details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [plotId]);

  const onSubmit = async (data: BookingFormData) => {
    if (!plot || !project) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await submitBookingEnquiry({
        projectId: project.id,
        plotId: plot.id,
        customerName: data.customerName,
        phone: data.phone,
        email: data.email || undefined,
        location: data.location || undefined,
        preferredContactMethod: data.preferredContactMethod,
        message: data.message || undefined,
        consent: data.consent,
      });

      if (response && response.booking_reference) {
        navigate(`/booking-confirmation/${response.booking_reference}`);
      } else {
        throw new Error('Server did not return a valid booking reference');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit booking enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (!plot || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="font-bold text-slate-800 text-base">Unable to Load Plot</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{submitError || 'Plot not found'}</p>
        <Link
          to="/projects"
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          to={`/plots/${plot.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Plot #{plot.plot_number} Details</span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* SUMMARY SIDEBAR */}
          <div className="md:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-fit">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Reservation Target
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Plot #{plot.plot_number}
            </h2>
            <p className="text-xs font-medium text-slate-500">{project.name}</p>

            <div className="my-6 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Area (Cents)</span>
                <span className="font-bold text-slate-900">{plot.area_cents} Cents</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Area (Sq.Ft)</span>
                <span className="font-bold text-slate-900">{plot.area_sqft} sq.ft</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Facing</span>
                <span className="font-bold text-slate-900">{plot.facing}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Price</span>
                <span className="font-bold text-blue-700">{formatINR(plot.price_inr)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Verified reservation protection active. Submitting this form registers your enquiry directly and notifies our sales office.
              </span>
            </div>
          </div>

          {/* MAIN FORM */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Submit Plot Reservation Request
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Fill in your contact information below. Our project representative will verify document details and arrange a site visit.
            </p>

            {submitError && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Anand Kumar"
                  {...register('customerName')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                />
                {errors.customerName && (
                  <p className="text-red-600 text-[11px] mt-1">{errors.customerName.message}</p>
                )}
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Number (with country code) *
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    {...register('phone')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-[11px] mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    {...register('email')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-[11px] mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Current Area/Location */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Whitefield, Bengaluru"
                  {...register('location')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                />
              </div>

              {/* Preferred Contact Method */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred Contact Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'phone', label: 'Phone Call' },
                    { value: 'whatsapp', label: 'WhatsApp' },
                    { value: 'email', label: 'Email' },
                  ].map((m) => (
                    <label
                      key={m.value}
                      className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer font-medium hover:bg-slate-100 transition-colors"
                    >
                      <input
                        type="radio"
                        value={m.value}
                        {...register('preferredContactMethod')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Message / Query</label>
                <textarea
                  rows={3}
                  placeholder="Ask about payment schedules, bank loan approvals, registration timeline..."
                  {...register('message')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                />
              </div>

              {/* Consent Checkbox */}
              <div>
                <label className="flex items-start gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    {...register('consent')}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    I consent to be contacted by the project sales team regarding plot availability, pricing, site visits, and official approval documents.
                  </span>
                </label>
                {errors.consent && (
                  <p className="text-red-600 text-[11px] mt-1">{errors.consent.message}</p>
                )}
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/25 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <span>Confirm & Submit Enquiry</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
