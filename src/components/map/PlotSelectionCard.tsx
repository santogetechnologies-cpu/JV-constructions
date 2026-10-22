import React from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle, BookOpen, Lock } from 'lucide-react';
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
      return { bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-950 font-black', dot: 'bg-emerald-600' };
    case 'booked':
      return { bg: 'bg-blue-50 border-blue-300', text: 'text-blue-950 font-black', dot: 'bg-blue-600' };
    case 'on_hold':
      return { bg: 'bg-orange-50 border-orange-300', text: 'text-orange-950 font-black', dot: 'bg-orange-600' };
    case 'sold':
      return { bg: 'bg-rose-50 border-rose-300', text: 'text-rose-950 font-black', dot: 'bg-rose-600' };
    case 'blocked':
      return { bg: 'bg-yellow-50 border-yellow-300', text: 'text-yellow-950 font-black', dot: 'bg-yellow-600' };
    default:
      return { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-800 font-bold', dot: 'bg-slate-400' };
  }
}

export const PlotSelectionCard: React.FC<PlotSelectionCardProps> = ({
  plot,
  project,
  onClose,
}) => {
  if (!plot) return null;

  const isBookable = plot.status === 'available';
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
            <h3 className="text-xl font-black text-slate-950 tracking-tight leading-none">
              Plot {plot.plot_number}
            </h3>
            {phaseName && (
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
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
        <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50/80 rounded-xl border border-slate-200">
          <div className="px-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Area</span>
            <span className="font-black text-slate-950 text-sm">{plot.area_cents} Cent <span className="text-[11px] text-slate-600 font-bold">({sqft} sq.ft)</span></span>
          </div>

          <div className="px-2 border-l border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Facing</span>
            <span className="font-black text-slate-950 text-sm">{plot.facing}</span>
          </div>

          {priceCompact && (
            <div className="px-2 border-l border-slate-200 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Est. Price</span>
              <span className="font-black text-emerald-950 text-base">{priceCompact}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {isBookable ? (
          <Link
            to={`/booking/${plot.id}`}
            className="w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all bg-glossy-green-btn border border-amber-400/30"
          >
            <CheckCircle className="w-4 h-4 text-amber-300" />
            <span>Book Now</span>
          </Link>
        ) : (
          <button
            disabled
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-500 bg-slate-100 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span>{plot.status === 'booked' ? 'Booked' : statusLabel}</span>
          </button>
        )}
      </div>

      {/* ── DESKTOP FLOATING CARD (Screens >= 640px) ── */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden w-[290px] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
        {/* HEADER */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-950 leading-tight">
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
        <div className="px-5 py-3 grid grid-cols-3 gap-2 text-xs border-b border-slate-100 bg-slate-50/50">
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">AREA</p>
            <p className="font-black text-slate-950 text-xs">{plot.area_cents} Cent</p>
          </div>
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">FACING</p>
            <p className="font-black text-slate-950 text-xs">{plot.facing}</p>
          </div>
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">STATUS</p>
            <p className={`font-black text-xs ${badge.text}`}>{statusLabel}</p>
          </div>
        </div>

        {/* PRICE + CTA */}
        <div className="px-5 py-3">
          {priceCompact && (
            <div className="mb-3 p-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <p className="text-[10px] text-emerald-900 font-bold uppercase tracking-wider mb-0.5">Estimated Price</p>
              <p className="text-xl font-black text-slate-950">{priceCompact}</p>
            </div>
          )}

          {isBookable ? (
            <Link
              to={`/booking/${plot.id}`}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-sm text-white transition-all active:scale-95 shadow-md bg-glossy-green-btn border border-amber-400/30"
            >
              <CheckCircle className="w-4 h-4 text-amber-300" />
              <span>Book Now</span>
            </Link>
          ) : (
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 border border-slate-200 cursor-not-allowed"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>{plot.status === 'booked' ? 'Booked' : statusLabel}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
