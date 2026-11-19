import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout: React.FC = () => {
  const { user, isStaff, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  // Database-backed authorization check: redirect unauthenticated or non-staff users
  if (!user || !isStaff) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* MOBILE TOP BAR (visible on screens < md) */}
      <header className="md:hidden glass border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="JV Constructions"
            className="h-8 w-auto object-contain"
          />
          <div>
            <span className="text-[#0b3b64] font-extrabold text-sm block leading-tight">
              JV <span className="text-teal-600">Constructions</span>
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-400 block -mt-0.5">
              Admin Console
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-100 text-[#0b3b64] border border-slate-200 focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR: Slide-over drawer on mobile, static column on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:transform-none md:static transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <AdminSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto min-h-[calc(100vh-57px)] md:min-h-screen relative bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
};
