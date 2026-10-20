import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  History,
  LogOut,
  Compass,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
    { label: 'Buyer Leads', path: '/admin/leads', icon: Users },
    { label: 'Audit Trail', path: '/admin/audit-logs', icon: History },
    { label: 'Team & Security', path: '/admin/team', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800">
      <div>
        {/* LOGO */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-extrabold text-sm block">LandEstate</span>
            <span className="text-[10px] uppercase font-bold text-blue-400 block -mt-0.5">
              Admin Console
            </span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-extrabold text-slate-500 px-3 tracking-wider block mb-2">
            Management
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* USER PROFILE & LOGOUT */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <Link
          to="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/40 rounded-xl transition-colors"
        >
          <span>View Public Site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center justify-between px-2 pt-1">
          <div className="truncate mr-2">
            <p className="text-xs font-bold text-white truncate">
              {profile?.full_name || 'Administrator'}
            </p>
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
              {profile?.role || 'Staff'}
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
