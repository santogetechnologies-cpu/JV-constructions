import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-[#062016] to-[#03130d] text-slate-300 text-sm border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Yazh Land Promoters"
                className="w-12 h-12 rounded-full object-contain ring-2 ring-gold-500/70 shadow-lg bg-[#05281b]"
              />
              <div>
                <span className="font-black text-lg tracking-tight text-white block leading-tight">
                  Yazh <span className="text-emerald-400">Land Promoters</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
                  Your Land • Our Commitment
                </span>
              </div>
            </div>
            <p className="text-xs text-emerald-100/70 leading-relaxed">
              Interactive CAD and blueprint-backed real estate layout inventory and plot reservation platform. Verified DTCP and Local Planning authority approvals.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/40">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Verified DTCP & LP Approved Layouts</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/projects" className="text-slate-300 hover:text-white transition-colors">
                  All Approved Projects
                </Link>
              </li>
              <li>
                <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                  Live Layout Inventory
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Transparency */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3">
              Compliance
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>DTCP Layout Blueprints</li>
              <li>LP Approved Subdivisions</li>
              <li>Official Survey Boundaries</li>
              <li>Transparent Real-time Availability</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3">
              Direct Contact & Advisors
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Baskar:</span>
                  <a href="tel:+919600589191" className="text-amber-300 hover:text-amber-200 font-mono font-bold">
                    +91 96005 89191
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Anto:</span>
                  <a href="tel:+917448926902" className="text-amber-300 hover:text-amber-200 font-mono font-bold">
                    +91 744 892 6902
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Dhinakaran:</span>
                  <a href="tel:+919790493891" className="text-amber-300 hover:text-amber-200 font-mono font-bold">
                    +91 97904 93891
                  </a>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-950 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">info@yazhlandpromoters.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-emerald-950/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Yazh Land Promoters. All rights reserved.</p>
          <p className="text-[11px] text-amber-400/80 font-medium">
            Your Land • Our Commitment | Official DTCP & Local Planning Sanctions.
          </p>
        </div>
      </div>
    </footer>
  );
};
