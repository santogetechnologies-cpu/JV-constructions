import React from 'react';
import { X } from 'lucide-react';
import { PlotStatus, PlotFacing } from '../../types/database';

export interface MapFilterState {
  availability: 'all' | 'available' | 'blocked' | 'booked' | 'registered';
  facing: 'all' | 'East' | 'West' | 'North' | 'South';
  areaRange: 'all' | '<2' | '2-5' | '5-8' | '8-13' | '>13';
}

interface NammaPlotFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: MapFilterState;
  onApply: (newFilters: MapFilterState) => void;
  onReset: () => void;
}

export const NammaPlotFilterDrawer: React.FC<NammaPlotFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const [draftFilters, setDraftFilters] = React.useState<MapFilterState>(filters);

  React.useEffect(() => {
    setDraftFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const availabilityOptions: { label: string; value: MapFilterState['availability'] }[] = [
    { label: 'All', value: 'all' },
    { label: 'Available', value: 'available' },
    { label: 'Blocked', value: 'blocked' },
    { label: 'Booked', value: 'booked' },
    { label: 'Registered', value: 'registered' },
  ];

  const facingOptions: { label: string; value: MapFilterState['facing'] }[] = [
    { label: 'All', value: 'all' },
    { label: 'East', value: 'East' },
    { label: 'West', value: 'West' },
    { label: 'North', value: 'North' },
    { label: 'South', value: 'South' },
  ];

  const areaOptions: { label: string; value: MapFilterState['areaRange'] }[] = [
    { label: 'All', value: 'all' },
    { label: 'Below 2', value: '<2' },
    { label: '2 - 5', value: '2-5' },
    { label: '5 - 8', value: '5-8' },
    { label: '8 - 13', value: '8-13' },
    { label: 'Above 13', value: '>13' },
  ];

  const handleApplyClick = () => {
    onApply(draftFilters);
    onClose();
  };

  const handleResetClick = () => {
    const cleared: MapFilterState = {
      availability: 'all',
      facing: 'all',
      areaRange: 'all',
    };
    setDraftFilters(cleared);
    onReset();
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 flex animate-slide-in-left">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/20 backdrop-blur-[1px] -z-10"
      />

      {/* Drawer Panel */}
      <div className="w-80 sm:w-96 bg-white h-full shadow-2xl flex flex-col justify-between border-r border-slate-200">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Filters</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Groups */}
        <div className="p-6 space-y-7 flex-1 overflow-y-auto">
          {/* AVAILABILITY */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Availability
            </span>
            <div className="flex flex-wrap gap-2">
              {availabilityOptions.map((opt) => {
                const isActive = draftFilters.availability === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraftFilters((prev) => ({ ...prev, availability: opt.value }))}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FACING */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Facing
            </span>
            <div className="flex flex-wrap gap-2">
              {facingOptions.map((opt) => {
                const isActive = draftFilters.facing === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraftFilters((prev) => ({ ...prev, facing: opt.value }))}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AREA (CENT) */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Area (Cent)
            </span>
            <div className="flex flex-wrap gap-2">
              {areaOptions.map((opt) => {
                const isActive = draftFilters.areaRange === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraftFilters((prev) => ({ ...prev, areaRange: opt.value }))}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <button
            type="button"
            onClick={handleResetClick}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApplyClick}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
