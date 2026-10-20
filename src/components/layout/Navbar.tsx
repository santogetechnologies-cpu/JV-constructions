import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* BRAND LOGO */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md group-hover:bg-emerald-600 transition-colors">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 block leading-tight">
              Land<span className="text-emerald-600">Estate</span>
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block -mt-0.5">
              Approved Layout Maps
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};
