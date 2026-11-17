import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { sendLeadNotificationEmail } from '../../services/emailService';

interface ExclusiveOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId?: string;
}

export const ExclusiveOfferModal: React.FC<ExclusiveOfferModalProps> = ({
  isOpen,
  onClose,
  projectName,
  projectId,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Please enter your name and phone number.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from('leads').insert([
        {
          project_id: projectId || null,
          customer_name: name.trim(),
          phone: phone.trim(),
          location: city || 'Not specified',
          notes: `Exclusive Offer enquiry submitted for project: ${projectName}`,
          status: 'new',
        },
      ]);

      if (error) throw error;

      // Automatically send lead email to mail2baskar88@gmail.com via Web3Forms
      sendLeadNotificationEmail({
        customerName: name.trim(),
        phone: phone.trim(),
        location: city.trim() || undefined,
        projectName: projectName,
        source: 'Exclusive Offer / Callback Request',
        message: `Customer requested callback / exclusive offer enquiry for project: ${projectName}`,
      }).catch((emailErr) => console.warn('Web3Forms notification error:', emailErr));

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        setName('');
        setPhone('');
        setCity('');
      }, 2500);
    } catch (err: any) {
      console.error('Failed to submit callback enquiry:', err);
      setErrorMsg(err.message || 'Unable to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative border border-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">Thank you!</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Our site manager will contact you shortly with the brochure and exclusive pricing.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="JV Constructions"
                className="w-12 h-12 rounded-full object-contain ring-2 ring-teal-400/60 shadow-md bg-white shrink-0"
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Exclusive Site Offer
                </h2>
                <p className="text-[10px] uppercase font-bold text-teal-600">
                  JV Constructions
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 -mt-2 leading-relaxed">
              Interested in <span className="font-bold text-slate-800">{projectName}</span>? Share your details to receive our brochure and current site offers.
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>

              <div>
                <input
                  type="tel"
                  required
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>

              <div>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                >
                  <option value="">Select City</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Madurai">Madurai</option>
                  <option value="Trichy">Trichy</option>
                  <option value="Salem">Salem</option>
                  <option value="Tirunelveli">Tirunelveli</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Other">Other City</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-glossy-green-btn hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-amber-400/30"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Get Exclusive Call Back</span>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center">
                By submitting, you agree to be contacted by our sales team.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
