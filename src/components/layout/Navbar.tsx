import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageSquare, ChevronDown, X, User } from 'lucide-react';
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
      <header className="max-w-7xl mx-auto bg-glossy-green text-white rounded-3xl sm:rounded-full border border-amber-400/50 shadow-2xl shadow-emerald-950/40 relative pointer-events-auto backdrop-blur-md">
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

            {/* ADVISOR CONTACT TRIGGER WITH DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowContacts(!showContacts)}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-400/25 transition-all transform hover:scale-[1.03] active:scale-100 border border-amber-300 cursor-pointer"
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
                          <a href={`tel:${contact.phoneRaw}`} className="font-extrabold text-slate-800 text-xs block font-mono hover:text-emerald-700 transition-colors pt-0.5">
                            {contact.phone}
                          </a>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${contact.phoneRaw}`}
                            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-90"
                            title={`Call ${contact.name}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${contact.phoneRaw.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-transform active:scale-90"
                            title={`WhatsApp ${contact.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Site visits • Live CAD Demo • Instant Booking
                    </p>
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
