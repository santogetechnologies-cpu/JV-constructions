import React from 'react';
import { X, ExternalLink, MapPin, Navigation } from 'lucide-react';
import { Project } from '../../types/database';
import { getProjectLiveMapUrl, getProjectEmbedMapUrl } from '../../lib/mapUtils';

interface ProjectLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ProjectLocationModal: React.FC<ProjectLocationModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  if (!isOpen) return null;

  const liveMapUrl = getProjectLiveMapUrl(project);
  const embedUrl = getProjectEmbedMapUrl(project);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 rounded-3xl w-full max-w-4xl h-[80vh] shadow-2xl relative border border-slate-700/80 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-4 py-3 sm:py-3.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2 text-white text-xs sm:text-sm font-bold min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-extrabold text-white block truncate">{project.name}</span>
              <span className="text-[11px] text-slate-400 font-normal block truncate">
                {project.city}, {project.state}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={liveMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </a>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Satellite Map iframe */}
        <div className="flex-1 w-full h-full relative bg-slate-950">
          <iframe
            title={`${project.name} Live Satellite Map`}
            src={embedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
          />

          {/* Quick Floating Action for Mobile */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
            <a
              href={liveMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-900/90 hover:bg-slate-900 text-white border border-slate-700/80 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2 hover:scale-105 transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Launch Live GPS Navigation</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
