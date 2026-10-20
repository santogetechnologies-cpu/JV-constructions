import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const CustomerLayout: React.FC = () => {
  const location = useLocation();
  const isMapPage = location.pathname.includes('/map');

  if (isMapPage) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-slate-900">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
