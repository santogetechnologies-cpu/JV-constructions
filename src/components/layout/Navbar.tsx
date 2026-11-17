import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ChevronDown, X, Shield } from 'lucide-react';
import { OFFICIAL_CONTACTS } from '../../constants/contacts';

export const Navbar: React.FC = () => {
  const [showContacts, setShowContacts] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowContacts(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-2.5 sm:top-4 z-40 w-full px-3 sm:px-6 lg:px-8 pointer-events-none">
      <header className="max-w-7xl mx-auto bg-glossy-navy text-white rounded-3xl sm:rounded-full border border-teal-500/40 shadow-2xl shadow-slate-950/40 relative pointer-events-auto backdrop-blur-md">
        {/* Subtle luxury ambient glows */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-teal-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-10 w-64 h-32 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="px-3.5 sm:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-4 relative z-10">
          {/* BRAND LOGO EMBLEM ONLY */}
          <Link
            to="/"
            className="flex items-center group transition-transform hover:scale-105 active:scale-95 shrink-0"
            title="JV Constructions"
          >
            <div className="relative">
              <img
                src="/logo.png"
                alt="JV Constructions"
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-contain ring-2 sm:ring-4 ring-teal-400/80 shadow-2xl bg-white drop-shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 sm:w-3.5 h-3 sm:h-3.5 bg-teal-400 border-2 border-[#062542] rounded-full" />
            </div>
          </Link>

          {/* HEADER NAVIGATION & ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/projects"
              className="text-xs sm:text-sm font-black text-slate-100 hover:text-teal-300 transition-colors px-3 py-2 rounded-full hover:bg-white/10"
            >
              All Layouts
            </Link>

            <Link
              to="/admin/login"
              className="text-xs sm:text-sm font-bold text-slate-200 hover:text-teal-300 transition-colors px-2.5 py-2 rounded-full hover:bg-white/10 flex items-center gap-1.5"
              title="Admin Portal"
            >
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Admin</span>
            </Link>

            {/* ADVISOR CONTACT TRIGGER WITH DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowContacts(!showContacts)}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-gradient-to-r from-teal-400 via-teal-300 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-teal-500/25 transition-all transform hover:scale-[1.03] active:scale-100 border border-teal-200 cursor-pointer"
                title="Contact Direct Property Advisors"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 shrink-0" />
                <span className="hidden xs:inline">Talk to Advisor</span>
                <span className="xs:hidden">Contact</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-950 transition-transform ${showContacts ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN MENU */}
              {showContacts && (
                <div className="absolute right-0 top-full mt-3 w-72 sm:w-80 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Direct Property Advisors
                    </span>
                    <button
                      onClick={() => setShowContacts(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {OFFICIAL_CONTACTS.map((contact) => (
                      <div
                        key={contact.name}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-black text-slate-900 text-sm leading-tight">
                            {contact.name}
                          </div>
                          <div className="text-xs font-semibold text-slate-500 leading-tight">
                            {contact.role}
                          </div>
                          <a href={`tel:${contact.phoneRaw}`} className="font-extrabold text-slate-800 text-xs block font-mono hover:text-teal-700 transition-colors pt-0.5">
                            {contact.phone}
                          </a>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${contact.phoneRaw}`}
                            className="p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors"
                            title="Call directly"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
