import React, { useState } from 'react';
import { Filter, RotateCcw, X, Check } from 'lucide-react';
import { Plot, PlotStatus, PlotFacing } from '../../types/database';

export interface FilterCriteria {
  status: string; // 'all' | PlotStatus
  facing: string; // 'all' | PlotFacing
  areaRange: string; // 'all' | '<2' | '2-5' | '5-8' | '8-13' | '>13' | 'custom'
  customMinArea?: number;
  customMaxArea?: number;
  minPrice?: number;
  maxPrice?: number;
}

interface PlotFilterBarProps {
  plots: Plot[];
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  onReset: () => void;
  matchingCount: number;
}

export const PlotFilterBar: React.FC<PlotFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  matchingCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const facingOptions: (PlotFacing | 'all')[] = [
    'all',
    'North',
    'South',
    'East',
    'West',
    'North-East',
    'North-West',
    'South-East',
    'South-West',
    'Other',
  ];

  const statusOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'booked', label: 'Booked' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'sold', label: 'Sold / Registered' },
    { value: 'blocked', label: 'Blocked' },
  ];

  return (
    <>
      {/* MOBILE TRIGGER & DESKTOP SUMMARY */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
            isOpen || filters.status !== 'all' || filters.facing !== 'all' || filters.areaRange !== 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white/95 text-slate-700 hover:bg-slate-50 border-slate-200 backdrop-blur-md'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-extrabold">
            {matchingCount}
          </span>
        </button>

        {(filters.status !== 'all' || filters.facing !== 'all' || filters.areaRange !== 'all') && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors font-medium"
            title="Reset Filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* FILTER DRAWER / POPOVER */}
      {isOpen && (
        <div className="absolute top-14 left-4 z-30 w-80 max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Filter Inventory</h4>
              <p className="text-[11px] text-slate-500">{matchingCount} plots match criteria</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* AVAILABILITY STATUS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Availability</label>
            <div className="grid grid-cols-2 gap-1.5">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onFilterChange({ ...filters, status: opt.value })}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border text-left transition-colors flex items-center justify-between ${
                    filters.status === opt.value
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {filters.status === opt.value && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* FACING */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Facing Direction</label>
            <select
              value={filters.facing}
              onChange={(e) => onFilterChange({ ...filters, facing: e.target.value })}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {facingOptions.map((f) => (
                <option key={f} value={f}>
                  {f === 'all' ? 'All Facing Directions' : `${f} Facing`}
                </option>
              ))}
            </select>
          </div>

          {/* AREA RANGE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Plot Area</label>
            <div className="space-y-1 text-xs">
              {[
                { id: 'all', label: 'All Sizes' },
                { id: '<2', label: 'Below 2 Cents (< 871 sq.ft)' },
                { id: '2-5', label: '2 to 5 Cents (871 - 2,178 sq.ft)' },
                { id: '5-8', label: '5 to 8 Cents (2,178 - 3,485 sq.ft)' },
                { id: '8-13', label: '8 to 13 Cents (3,485 - 5,663 sq.ft)' },
                { id: '>13', label: 'Above 13 Cents (> 5,663 sq.ft)' },
              ].map((range) => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => onFilterChange({ ...filters, areaRange: range.id })}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border font-medium flex items-center justify-between transition-colors ${
                    filters.areaRange === range.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{range.label}</span>
                  {filters.areaRange === range.id && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
            <button
              onClick={onReset}
              className="flex-1 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
            >
              Apply ({matchingCount})
            </button>
          </div>
        </div>
      )}
    </>
  );
};
