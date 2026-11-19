import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-white border-t border-slate-200 text-slate-600 text-sm overflow-hidden">
      <div className="absolute inset-0 bg-blueprint opacity-60 pointer-events-none [mask-image:linear-gradient(to_bottom,transparent,black_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-5">
            <img src="/logo.png" alt="JV Constructions" className="h-16 w-auto object-contain" />
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              Interactive, blueprint-backed layouts with live plot availability and effortless reservations.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-teal-700 font-semibold bg-teal-50 px-3 py-2 rounded-full border border-teal-100">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Transparent, verified layouts</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0b3b64] mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/projects" className="hover:text-teal-700 transition-colors">All Projects</Link></li>
              <li><Link to="/" className="hover:text-teal-700 transition-colors">Live Inventory</Link></li>
              <li><Link to="/admin/login" className="hover:text-teal-700 transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0b3b64] mb-4">Why JV</h4>
            <ul className="space-y-2.5 text-sm">
              <li>Blueprint Layouts</li>
              <li>Live Availability</li>
              <li>Survey Boundaries</li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0b3b64] mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-[#0b3b64] flex items-center justify-center"><Phone className="w-3.5 h-3.5" /></span>
                <div className="leading-tight">
                  <div className="font-semibold text-slate-900">Jesu Vivian</div>
                  <a href="tel:+917708196238" className="text-teal-700 hover:underline font-mono text-xs">+91 77081 96238</a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-[#0b3b64] flex items-center justify-center"><Mail className="w-3.5 h-3.5" /></span>
                <span className="truncate text-xs">contact@jvconstructions.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} JV Constructions. All rights reserved.</p>
          <p>Building Trust • Shaping Futures</p>
        </div>
      </div>
    </footer>
  );
};
