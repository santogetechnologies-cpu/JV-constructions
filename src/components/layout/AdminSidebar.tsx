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
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAllProjectsSidebar } from '../../context/AllProjectsSidebarContext';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { openSidebar, isOpen: isDrawerOpen } = useAllProjectsSidebar();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'All Projects', path: '/admin/projects', icon: FolderKanban, isProjects: true },
    { label: 'Buyer Leads', path: '/admin/leads', icon: Users },
    { label: 'Team & Security', path: '/admin/team', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-[#051c13] text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-emerald-950/80 shadow-2xl">
      <div>
        {/* LOGO */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-emerald-950/80 bg-[#03140d]">
          <div className="flex items-center gap-3 truncate">
            <img
              src="/logo.png"
              alt="Yazh Land Promoters"
              className="w-9 h-9 rounded-full object-contain ring-1 ring-amber-400/50 shadow-md bg-[#05281b]"
            />
            <div className="truncate">
              <span className="text-white font-extrabold text-sm block leading-tight truncate">
                Yazh <span className="text-emerald-400">Promoters</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-400/90 block -mt-0.5">
                Admin Console
              </span>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900/60 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-extrabold text-slate-500 px-3 tracking-wider block mb-2">
            Management
          </span>
          {navItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            if (item.isProjects) {
              return (
                <div key={item.path} className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Link
                      to={item.path}
                      onClick={onCloseMobile}
                      className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-glossy-green-btn text-white shadow-md border border-amber-400/30'
                          : 'text-emerald-100/80 hover:text-white hover:bg-emerald-950/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-400/30">
                        Live
                      </span>
                    </Link>

                    {/* Quick drawer toggle icon button */}
                    <button
                      type="button"
                      onClick={() => {
                        openSidebar();
                        if (onCloseMobile) onCloseMobile();
                      }}
                      title="Open All Projects Quick Drawer Sidebar"
                      className={`p-2 rounded-xl border transition-all ${
                        isDrawerOpen
                          ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-emerald-950/80 text-emerald-300 hover:text-amber-300 hover:bg-emerald-900/80 border-emerald-900/60'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>

                  {/* QUICK DRAWER LAUNCHER BANNER BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      openSidebar();
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-bold text-amber-300/90 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900/50 hover:border-amber-400/40 transition-all text-left group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span>Quick Projects Drawer</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400/60 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-glossy-green-btn text-white shadow-md border border-amber-400/30'
                    : 'text-emerald-100/70 hover:text-white hover:bg-emerald-950/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* VIEW PUBLIC SITE */}
          <div className="pt-2 pb-1">
            <Link
              to="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 text-xs font-bold text-white bg-emerald-900/60 hover:bg-emerald-800/80 rounded-xl transition-all border border-emerald-700/60 shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>View Public Site</span>
              </div>
              <span className="text-[10px] bg-emerald-800/90 text-amber-300 font-bold px-1.5 py-0.5 rounded">Live</span>
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
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-glossy-green-btn text-white shadow-md border border-amber-400/30'
                    : 'text-emerald-100/70 hover:text-white hover:bg-emerald-950/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* USER PROFILE & LOGOUT */}
      <div className="p-4 border-t border-emerald-950/80 bg-[#03140d]/60">
        <div className="flex items-center justify-between px-2">
          <div className="truncate mr-2">
            <p className="text-xs font-bold text-white truncate">
              {profile?.full_name || 'admin'}
            </p>
            <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
              {profile?.role || 'SUPER_ADMIN'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
