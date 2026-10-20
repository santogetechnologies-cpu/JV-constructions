import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 text-white">
              <Compass className="w-6 h-6 text-blue-500" />
              <span className="font-extrabold text-lg tracking-tight">
                Land<span className="text-blue-500">Estate</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive CAD and blueprint-backed real estate plot inventory management platform. Verified DTCP and LP approval layouts.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Verified DTCP & LP Approved Layouts</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/projects" className="hover:text-white transition-colors">
                  All Approved Projects
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Transparency */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-3">
              Compliance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>DTCP Layout Blueprints</li>
              <li>LP Approved Subdivisions</li>
              <li>Official Survey Boundaries</li>
              <li>Transparent Real-time Availability</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-3">
              Direct Contact
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Central Real Estate Hub</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>enquiries@landestate.local</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} LandEstate Platform. All rights reserved.</p>
          <p className="text-[11px] text-slate-400 font-medium">
            Official DTCP & Local Planning Authority Sanctioned Layouts.
          </p>
        </div>
      </div>
    </footer>
  );
};
