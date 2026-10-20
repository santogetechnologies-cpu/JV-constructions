import React from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle, BookOpen } from 'lucide-react';
import { Plot, Project } from '../../types/database';
import { formatPriceCompact, getStatusLabel, centsToSqft } from '../../lib/utils';

interface PlotSelectionCardProps {
  plot: Plot | null;
  project: Project | null;
  onClose: () => void;
}

function getStatusBadgeStyle(status: string): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'available':
      return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    case 'booked':
      return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' };
    case 'on_hold':
      return { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500' };
    case 'sold':
      return { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' };
    case 'blocked':
      return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' };
    default:
      return { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' };
  }
}

export const PlotSelectionCard: React.FC<PlotSelectionCardProps> = ({
  plot,
  project,
  onClose,
}) => {
  if (!plot) return null;

  const isBookable = plot.status === 'available';
  const isEnquiryAllowed = ['available', 'booked', 'on_hold'].includes(plot.status);
  const phaseName = (plot as any).phase?.name || null;
  const statusLabel = getStatusLabel(plot.status);
  const badge = getStatusBadgeStyle(plot.status);
  const priceCompact = plot.price_inr ? formatPriceCompact(plot.price_inr) : null;
  const sqft = plot.area_sqft || centsToSqft(plot.area_cents);

  return (
    <>
      {/* ── MOBILE BOTTOM SHEET (Screens < 640px) ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-lg rounded-t-3xl border-t border-slate-200/90 shadow-[0_-10px_35px_-5px_rgba(0,0,0,0.2)] p-4 space-y-3 animate-in slide-in-from-bottom duration-200 pointer-events-auto">
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto -mt-1 mb-1" />

        {/* Top line: Plot number, status, and close */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">
              Plot {plot.plot_number}
            </h3>
            {phaseName && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {phaseName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border uppercase tracking-wider ${badge.bg} ${badge.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {statusLabel}
            </span>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Specs & Pricing Line */}
        <div className="flex items-center justify-between text-xs py-1 px-1 bg-slate-50 rounded-xl border border-slate-100">
          <div className="px-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Area</span>
            <span className="font-extrabold text-slate-900">{plot.area_cents} Cent <span className="text-[10px] text-slate-500 font-normal">({sqft} sq.ft)</span></span>
          </div>

          <div className="px-2 border-l border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Facing</span>
            <span className="font-extrabold text-slate-900">{plot.facing}</span>
          </div>

          {priceCompact && (
            <div className="px-2 border-l border-slate-200 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Price</span>
              <span className="font-black text-emerald-600">{priceCompact}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {isEnquiryAllowed ? (
          <Link
            to={`/booking/${plot.id}`}
            className="w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isBookable ? 'Book Now' : 'Enquire Plot'}</span>
          </Link>
        ) : (
          <button
            disabled
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-400 bg-slate-100 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Not Available for Booking</span>
          </button>
        )}
      </div>

      {/* ── DESKTOP FLOATING CARD (Screens >= 640px) ── */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden w-[290px] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
        {/* HEADER */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {phaseName ? `${phaseName}: Plot no: ${plot.plot_number}` : `Plot no: ${plot.plot_number}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors mt-0.5"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SPECS */}
        <div className="px-5 py-3 grid grid-cols-3 gap-2 text-xs border-b border-slate-100">
          <div>
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] mb-0.5">AREA</p>
            <p className="font-bold text-slate-800">{plot.area_cents} Cent</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] mb-0.5">FACING</p>
            <p className="font-bold text-slate-800">{plot.facing}</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] mb-0.5">STATUS</p>
            <p className={`font-black ${badge.text}`}>{statusLabel}</p>
          </div>
        </div>

        {/* PRICE + CTA */}
        <div className="px-5 py-3">
          {priceCompact && (
            <div className="mb-3">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Estimated Price</p>
              <p className="text-xl font-black text-slate-900">{priceCompact}</p>
            </div>
          )}

          {isEnquiryAllowed ? (
            <Link
              to={`/booking/${plot.id}`}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-sm text-white transition-all active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isBookable ? 'Book Now' : 'Enquire'}</span>
            </Link>
          ) : (
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-slate-400 bg-slate-100 cursor-not-allowed"
            >
              <BookOpen className="w-4 h-4" />
              <span>Not Available</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
