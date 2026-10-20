import React from 'react';
import { X, ExternalLink, MapPin } from 'lucide-react';
import { Project } from '../../types/database';

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

  const lat = project.latitude || 13.0827;
  const lng = project.longitude || 80.2707;
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 rounded-3xl w-full max-w-4xl h-[75vh] shadow-2xl relative border border-slate-700 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <span>Open in Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
          </a>

          <div className="flex items-center gap-2 text-white text-xs font-bold">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="truncate max-w-xs">{project.name} • {project.city}, {project.state}</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Satellite Map iframe */}
        <div className="flex-1 w-full h-full relative bg-slate-950">
          <iframe
            title="Project Satellite Location"
            src={embedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};
