import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  Search,
  RefreshCw,
  FolderKanban,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { ProjectWithStats, getProjectApprovalType } from '../../types/database';
import { getAllProjectsWithStatsAdmin } from '../../services/api';
import { useAllProjectsSidebar } from '../../context/AllProjectsSidebarContext';
import { ProjectBigCard } from './ProjectBigCard';

export const AdminAllProjectsSidebar: React.FC = () => {
  const { isOpen, closeSidebar, selectedProjectId } = useAllProjectsSidebar();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProjectsWithStatsAdmin();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.address && project.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        getProjectApprovalType(project).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'published' && project.status === 'published') ||
        (filterStatus === 'draft' && project.status === 'draft');

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, filterStatus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Slide-over Sidebar Container */}
      <div className="relative w-full max-w-xl md:max-w-2xl bg-[#04160f] text-slate-100 h-full shadow-2xl border-l border-emerald-950/80 flex flex-col z-10 transition-transform duration-300 ease-out">
        {/* HEADER */}
        <div className="px-6 py-5 bg-[#020e0a] border-b border-emerald-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-amber-400 shadow-inner">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">All Projects</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {projects.length} Total
                </span>
              </div>
              <p className="text-xs text-emerald-300/70">
                Live inventory, plot counters, pricing & size breakdown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refresh projects and plot counters"
              className="p-2 rounded-xl text-emerald-300/80 hover:text-white hover:bg-emerald-900/50 border border-emerald-900/40 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/admin/projects/new"
              onClick={closeSidebar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-glossy-green-btn text-white text-xs font-bold border border-amber-400/30 hover:brightness-110 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </Link>
            <button
              onClick={closeSidebar}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="px-6 py-3.5 bg-[#03130d] border-b border-emerald-950/60 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by project name, city, location or approval..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#020b07] border border-emerald-900/70 rounded-xl text-xs text-white placeholder-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {(['all', 'published', 'draft'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                    filterStatus === st
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-emerald-950/60 border border-transparent'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-emerald-400/60 font-semibold">
              Showing {filteredProjects.length} of {projects.length}
            </span>
          </div>
        </div>

        {/* PROJECTS LIST WITH BIG BOXES */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
          {loading && projects.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-emerald-300">Loading projects & live plot stats...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200">
              <p className="font-bold">Error loading projects</p>
              <p className="text-[11px] mt-1 text-red-300/80">{error}</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FolderKanban className="w-10 h-10 mx-auto text-emerald-800/80" />
              <p className="text-sm font-bold text-slate-300">No projects found</p>
              <p className="text-xs text-slate-500">
                Try adjusting your search query or create a new project.
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <ProjectBigCard
                key={project.id}
                project={project}
                isInitiallyExpanded={selectedProjectId === project.id}
                onActionClick={closeSidebar}
              />
            ))
          )}
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 bg-[#020e0a] border-t border-emerald-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-300/80">Yazh Land Inventory Engine</span>
          </div>

          <button
            onClick={() => {
              closeSidebar();
              navigate('/admin/projects');
            }}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>Full Projects Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
