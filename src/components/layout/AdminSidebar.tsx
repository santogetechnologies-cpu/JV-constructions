import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  LogOut,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'All Projects', path: '/admin/projects', icon: FolderKanban },
    { label: 'Buyer Leads', path: '/admin/leads', icon: Users },
    { label: 'Team & Security', path: '/admin/team', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-white text-slate-600 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-200 shadow-soft">
      <div>
        {/* LOGO */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 truncate">
            <img
              src="/logo.png"
              alt="JV Constructions"
              className="h-9 w-auto object-contain"
            />
            <div className="truncate">
              <span className="text-[#0b3b64] font-extrabold text-sm block leading-tight truncate">
                JV <span className="text-teal-600">Constructions</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block -mt-0.5">
                Admin Console
              </span>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-[#0b3b64] hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-extrabold text-slate-400 px-3 tracking-wider block mb-2">
            Management
          </span>
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path === '/admin/projects' && location.pathname.startsWith('/admin/projects'));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-jv-btn text-white'
                    : 'text-slate-600 hover:text-[#0b3b64] hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 opacity-90" />
                  <span>{item.label}</span>
                </div>
                {item.path === '/admin/projects' && (
                  <span className="text-[9px] bg-teal-50 text-teal-700 font-extrabold px-1.5 py-0.5 rounded border border-teal-100">
                    Live
                  </span>
                )}
              </Link>
            );
          })}

          {/* Buyer Leads */}
          {navItems.slice(2, 3).map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-jv-btn text-white'
                    : 'text-slate-600 hover:text-[#0b3b64] hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-90" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* VIEW PUBLIC SITE */}
          <div className="pt-2 pb-1">
            <Link
              to="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#0b3b64] bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-teal-600" />
                <span>View Public Site</span>
              </div>
              <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 rounded border border-teal-100">Live</span>
            </Link>
          </div>

          {/* Team & Security */}
          {navItems.slice(3).map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-jv-btn text-white'
                    : 'text-slate-600 hover:text-[#0b3b64] hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-90" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* USER PROFILE & LOGOUT */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-extrabold text-slate-900 truncate block">
              {profile?.full_name || 'Administrator'}
            </span>
            <span className="text-[10px] text-slate-500 truncate block font-mono">
              {profile?.email || 'admin@jvconstructions.com'}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
