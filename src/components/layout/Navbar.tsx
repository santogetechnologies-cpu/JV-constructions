import React from 'react';
import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <div className="sticky top-2.5 sm:top-4 z-40 w-full px-3 sm:px-6 lg:px-8 pointer-events-none">
      <header className="max-w-7xl mx-auto bg-glossy-green text-white rounded-3xl sm:rounded-full border border-amber-400/50 shadow-2xl shadow-emerald-950/40 relative overflow-hidden pointer-events-auto backdrop-blur-md">
        {/* Subtle luxury ambient glows */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-10 w-64 h-32 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="px-3.5 sm:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-4 relative z-10">
          {/* BRAND LOGO EMBLEM ONLY */}
          <Link
            to="/"
            className="flex items-center group transition-transform hover:scale-105 active:scale-95 shrink-0"
            title="Yazh Land Promoters"
          >
            <div className="relative">
              <img
                src="/logo.png"
                alt="Yazh Land Promoters"
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-contain ring-2 sm:ring-4 ring-amber-400/80 shadow-2xl bg-[#05281b] drop-shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 sm:w-3.5 h-3 sm:h-3.5 bg-emerald-400 border-2 border-[#05281b] rounded-full" />
            </div>
          </Link>

          {/* HEADER NAVIGATION & ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/projects"
              className="text-xs sm:text-sm font-black text-emerald-100 hover:text-amber-300 transition-colors px-3.5 py-2 rounded-full hover:bg-white/10"
            >
              All Layouts
            </Link>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-400/25 transition-all transform hover:scale-[1.03] active:scale-100 border border-amber-300"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
              <span className="hidden xs:inline">Talk to Advisor</span>
              <span className="xs:hidden">Contact</span>
            </a>
          </div>
        </div>
      </header>
    </div>
  );
};
