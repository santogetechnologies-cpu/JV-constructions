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
    <div className="sticky top-0 z-40 w-full">
      <header className="glass border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center shrink-0 transition-transform hover:scale-[1.03]" title="JV Constructions">
            <img src="/logo.png" alt="JV Constructions" className="h-11 sm:h-14 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/projects" className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0b3b64] transition-colors px-3 py-2 rounded-full hover:bg-slate-100">
              All Layouts
            </Link>
            <Link to="/admin/login" className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0b3b64] transition-colors px-3 py-2 rounded-full hover:bg-slate-100 flex items-center gap-1.5" title="Admin Portal">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Admin</span>
            </Link>

            <div className="relative ml-1" ref={dropdownRef}>
              <button
                onClick={() => setShowContacts(!showContacts)}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-jv-btn text-white text-xs sm:text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                title="Contact Direct Property Advisors"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden xs:inline">Talk to Advisor</span>
                <span className="xs:hidden">Contact</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showContacts ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN MENU */}
              {showContacts && (
                <div className="absolute right-0 top-full mt-3 w-72 sm:w-80 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-lift p-3.5 z-50 animate-in fade-in slide-in-from-top-2">
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
