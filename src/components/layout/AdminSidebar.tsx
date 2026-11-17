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
    <aside className="w-64 bg-[#041624] text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-[#0c3757] shadow-2xl">
      <div>
        {/* LOGO */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#0c3757] bg-[#03101c]">
          <div className="flex items-center gap-3 truncate">
            <img
              src="/logo.png"
              alt="JV Constructions"
              className="w-9 h-9 rounded-full object-contain ring-1 ring-teal-400/50 shadow-md bg-white"
            />
            <div className="truncate">
              <span className="text-white font-extrabold text-sm block leading-tight truncate">
                JV <span className="text-teal-400">Constructions</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-teal-300 block -mt-0.5">
                Admin Console
              </span>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-teal-300 hover:text-white hover:bg-[#0c3757] transition-colors"
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
                    ? 'bg-jv-btn text-white shadow-md border border-teal-400/30'
                    : 'text-slate-300/80 hover:text-white hover:bg-[#0c3757]/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-teal-400" />
                  <span>{item.label}</span>
                </div>
                {item.path === '/admin/projects' && (
                  <span className="text-[9px] bg-[#0c3757] text-teal-300 font-extrabold px-1.5 py-0.5 rounded border border-teal-500/30">
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
                    ? 'bg-jv-btn text-white shadow-md border border-teal-400/30'
                    : 'text-slate-300/80 hover:text-white hover:bg-[#0c3757]/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 text-teal-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* VIEW PUBLIC SITE */}
          <div className="pt-2 pb-1">
            <Link
              to="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 text-xs font-bold text-white bg-[#0c3757]/70 hover:bg-[#0c3757] rounded-xl transition-all border border-[#11476f] shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-teal-400" />
                <span>View Public Site</span>
              </div>
              <span className="text-[10px] bg-[#07263e] text-teal-300 font-bold px-1.5 py-0.5 rounded border border-teal-500/30">Live</span>
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
                    ? 'bg-jv-btn text-white shadow-md border border-teal-400/30'
                    : 'text-slate-300/80 hover:text-white hover:bg-[#0c3757]/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 text-teal-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* USER PROFILE & LOGOUT */}
      <div className="p-4 border-t border-[#0c3757] bg-[#03101c]">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-extrabold text-white truncate block">
              {profile?.full_name || 'Administrator'}
            </span>
            <span className="text-[10px] text-teal-300 truncate block font-mono">
              {profile?.email || 'admin@jvconstructions.com'}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-[#0c3757] rounded-lg transition-colors cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
