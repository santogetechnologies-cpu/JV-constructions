import React, { useState } from 'react';
import { Mail, Phone, User, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { sendLeadNotificationEmail } from '../../services/emailService';

interface ContactFormProps {
  onSuccess?: () => void;
  defaultProjectName?: string;
  defaultProjectId?: string;
  className?: string;
}

export default function ContactForm({
  onSuccess,
  defaultProjectName,
  defaultProjectId,
  className = '',
}: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResultMessage(null);

    try {
      // 1. Record lead in Supabase database so it appears in /admin/leads
      try {
        await supabase.from('leads').insert([
          {
            project_id: defaultProjectId || null,
            customer_name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim() || null,
            location: formData.location.trim() || null,
            notes: formData.message.trim() || 'General website enquiry',
            status: 'new',
          },
        ]);
      } catch (dbErr) {
        console.warn('Database lead record notice:', dbErr);
      }

      // 2. Dispatch automated email notification
      const emailResult = await sendLeadNotificationEmail({
        customerName: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        location: formData.location.trim() || undefined,
        projectName: defaultProjectName,
        message: formData.message.trim(),
        source: defaultProjectName ? `Enquiry - ${defaultProjectName}` : 'General Contact Form',
      });

      if (emailResult.success) {
        setResultMessage({
          type: 'success',
          text: 'Thank you! Your enquiry has been received and our property advisor will contact you shortly.',
        });
        setFormData({ name: '', email: '', phone: '', location: '', message: '' });
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } else {
        setResultMessage({
          type: 'error',
          text: emailResult.message || 'There was an issue submitting your enquiry. Please try again or call us directly.',
        });
      }
    } catch (err: any) {
      setResultMessage({
        type: 'error',
        text: err.message || 'Unable to submit enquiry at this time.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Send Us an Enquiry</h3>
        <p className="text-xs text-slate-500 mt-1">
          Leave your details below. We will send you instant layout plans, pricing, and schedule a site visit.
        </p>
      </div>

      {resultMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
            resultMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {resultMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="font-semibold leading-relaxed">{resultMessage.text}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        {/* Name */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ramesh Kumar"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Phone & Email Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ramesh@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Location / City */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Your City / Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Coimbatore, Tiruppur, Chennai"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Requirement / Message
          </label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <textarea
              name="message"
              rows={3}
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us what size plot or budget you are interested in..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-98 disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
              <span>Sending Enquiry...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Enquiry</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
