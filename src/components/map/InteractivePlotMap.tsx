import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Plot, ProjectLayout } from '../../types/database';
import {
  pointsToSvgPolygon,
  calculatePolygonCentroid,
  getStatusColor,
  getStatusLabel,
} from '../../lib/utils';
import { getStorageFileUrl } from '../../services/api';
import { convertPdfUrlToDataUrl } from '../../lib/pdfToImage';

interface InteractivePlotMapProps {
  layout: ProjectLayout | null;
  plots: Plot[];
  selectedPlotId?: string | null;
  onSelectPlot: (plot: Plot | null) => void;
  filteredPlotIds?: Set<string>;
}

export const InteractivePlotMap: React.FC<InteractivePlotMapProps> = ({
  layout,
  plots,
  selectedPlotId,
  onSelectPlot,
  filteredPlotIds,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport transformation state
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false); // detect if mouse actually moved (drag vs click)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPlot, setHoveredPlot] = useState<Plot | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);

  // Resolve storage URL for blueprint image
  useEffect(() => {
    let active = true;
    setImageLoaded(false);
    if (layout?.source_file_path) {
      getStorageFileUrl('layout-source-files', layout.source_file_path).then(async (url) => {
        if (!active) return;
        const targetUrl = url || layout.source_file_path;
        const isPdf =
          layout.source_file_type === 'pdf' ||
          targetUrl.toLowerCase().includes('.pdf') ||
          targetUrl.toLowerCase().includes('application%2fpdf');

        if (isPdf) {
          try {
            const { dataUrl } = await convertPdfUrlToDataUrl(targetUrl, 2.0);
            if (active) setResolvedImageUrl(dataUrl);
          } catch {
            if (active) setResolvedImageUrl(targetUrl);
          }
        } else {
          setResolvedImageUrl(targetUrl);
        }
      }).catch(() => {
        if (active) setResolvedImageUrl(layout.source_file_path);
      });
    } else {
      setResolvedImageUrl('');
    }
    return () => { active = false; };
  }, [layout?.source_file_path, layout?.source_file_type]);

  // Default layout bounds
  const bounds = layout?.layout_bounds || {
    minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800,
  };

  const viewWidth = bounds.width || (bounds.maxX - bounds.minX) || 1200;
  const viewHeight = bounds.height || (bounds.maxY - bounds.minY) || 800;

  // Center & Fit Layout to Container
  const fitToLayout = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const padding = 20;
    const scaleX = (clientWidth - padding * 2) / viewWidth;
    const scaleY = (clientHeight - padding * 2) / viewHeight;
    const fitScale = Math.min(scaleX, scaleY, 4);

    const centerX = (clientWidth - viewWidth * fitScale) / 2;
    const centerY = (clientHeight - viewHeight * fitScale) / 2;

    setTransform({ scale: fitScale, x: centerX, y: centerY });
  }, [viewWidth, viewHeight]);

  useEffect(() => {
    fitToLayout();
  }, [fitToLayout, layout?.id]);

  // Selected plot highlight is handled directly in SVG rendering without zooming or shifting the map


  // Native non-passive Wheel listener (fixes Chrome passive listener errors)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setTransform((prev) => {
        const newScale = Math.min(Math.max(prev.scale * zoomFactor, 0.05), 12);
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
        return { scale: newScale, x: newX, y: newY };
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Handle Drag/Pan with click discrimination
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - (dragStart.x + transform.x);
    const dy = e.clientY - (dragStart.y + transform.y);
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragMovedRef.current = true;
    }
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  }, [dragStart, transform]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Touch pan & pinch-zoom
  const touchState = useRef<{ lastDist: number; lastX: number; lastY: number }>({
    lastDist: 0, lastX: 0, lastY: 0,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchState.current.lastX = e.touches[0].clientX - transform.x;
      touchState.current.lastY = e.touches[0].clientY - transform.y;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchState.current.lastDist = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTransform((prev) => ({
        ...prev,
        x: e.touches[0].clientX - touchState.current.lastX,
        y: e.touches[0].clientY - touchState.current.lastY,
      }));
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchState.current.lastDist > 0) {
        const factor = dist / touchState.current.lastDist;
        setTransform((prev) => ({
          ...prev,
          scale: Math.min(Math.max(prev.scale * factor, 0.1), 12),
        }));
      }
      touchState.current.lastDist = dist;
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Zoom buttons
  const handleZoomIn = () => setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.25, 12) }));
  const handleZoomOut = () => setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.05) }));

  const plotsWithGeometry = plots.filter(
    (p) => p.geometry?.coordinates && p.geometry.coordinates.length >= 3
  );

  // Determine label scale-adaptive font size
  const labelSize = Math.max(8, Math.min(16, 12 / transform.scale));

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white overflow-hidden select-none"
      style={{
        cursor: isDraggingRef.current && dragMovedRef.current ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* MAP CANVAS CONTENT */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0px) scale(${transform.scale})`,
        }}
      >
        {/* Layer 1: Source Blueprint Image / Raster Background */}
        {resolvedImageUrl && (
          <img
            src={resolvedImageUrl}
            alt="Layout Plan CAD Vector"
            className="absolute top-0 left-0 max-w-none pointer-events-none select-none transition-opacity duration-300"
            style={{
              width: `${viewWidth}px`,
              height: `${viewHeight}px`,
              opacity: imageLoaded ? 1 : 0.4,
              filter: 'contrast(1.05) brightness(1.02)',
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        )}

        {/* Layer 2: Vector SVG Plot Polygons & Numbers */}
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          width={viewWidth}
          height={viewHeight}
          className="absolute top-0 left-0 pointer-events-auto"
        >
          {plotsWithGeometry.map((plot) => {
            const isSelected = selectedPlotId === plot.id;
            const isHovered = hoveredPlot?.id === plot.id;
            const isFilteredOut = filteredPlotIds && !filteredPlotIds.has(plot.id);
            const centroid = calculatePolygonCentroid(plot.geometry!.coordinates);
            const pointsString = pointsToSvgPolygon(plot.geometry!.coordinates);
            const statusStyle = getStatusColor(plot.status);

            return (
              <g
                key={plot.id}
                className="transition-opacity duration-200"
                style={{ opacity: isFilteredOut ? 0.2 : 1 }}
                onMouseEnter={() => setHoveredPlot(plot)}
                onMouseLeave={() => setHoveredPlot(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!dragMovedRef.current) {
                    onSelectPlot(isSelected ? null : plot);
                  }
                }}
              >
                {/* Plot Boundary Polygon */}
                <polygon
                  points={pointsString}
                  fill={
                    isSelected
                      ? '#38bdf8'
                      : isHovered
                      ? '#86efac'
                      : statusStyle.fill
                  }
                  stroke={
                    isSelected
                      ? '#0284c7'
                      : isHovered
                      ? '#16a34a'
                      : statusStyle.stroke
                  }
                  strokeWidth={
                    isSelected
                      ? Math.max(2.5, 4 / transform.scale)
                      : isHovered
                      ? Math.max(2, 3 / transform.scale)
                      : Math.max(1.2, 1.8 / transform.scale)
                  }
                  strokeLinejoin="round"
                  className="cursor-pointer transition-all duration-150"
                  fillOpacity={
                    isSelected
                      ? 0.88
                      : isHovered
                      ? 0.78
                      : 0.65
                  }
                />

                {/* Plot Number Label */}
                {showLabels && (
                  <text
                    x={centroid[0]}
                    y={centroid[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={labelSize}
                    fontWeight={isSelected ? 'bold' : '600'}
                    fill={isSelected ? '#020617' : '#0f172a'}
                    stroke="#ffffff"
                    strokeWidth={Math.max(1, 2 / transform.scale)}
                    paintOrder="stroke fill"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {plot.plot_number}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ZOOM & LABEL TOOLBAR */}
      <div className="absolute top-16 sm:top-20 right-2.5 sm:right-4 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-md pointer-events-auto">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 sm:p-2 text-slate-700 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors active:scale-95"
        >
          <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 sm:p-2 text-slate-700 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors active:scale-95"
        >
          <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <div className="h-px bg-slate-200 my-0.5" />
        <button
          onClick={fitToLayout}
          title="Fit to Layout"
          className="p-1.5 sm:p-2 text-slate-700 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={() => setShowLabels(!showLabels)}
          title={showLabels ? 'Hide Plot Labels' : 'Show Plot Labels'}
          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors active:scale-95 ${
            showLabels ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {showLabels ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-1.5 sm:p-2 text-slate-700 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors active:scale-95 hidden sm:block"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* LEGEND (DESKTOP ONLY) */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-md text-xs font-semibold text-slate-700 pointer-events-none">
        {[
          { label: 'Available', color: '#22c55e', border: '#15803d' },
          { label: 'Booked', color: '#3b82f6', border: '#1d4ed8' },
          { label: 'Registered', color: '#f43f5e', border: '#be123c' },
          { label: 'Blocked', color: '#eab308', border: '#a16207' },
        ].map(({ label, color, border }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color, border: `1.5px solid ${border}` }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* HOVER TOOLTIP (DESKTOP) */}
      {hoveredPlot && !selectedPlotId && (
        <div className="absolute top-20 left-4 z-30 hidden md:block bg-slate-900/90 text-white backdrop-blur-md px-3 py-2 rounded-xl text-xs shadow-xl pointer-events-none border border-slate-700">
          <p className="font-bold text-sm">Plot {hoveredPlot.plot_number}</p>
          <p className="text-slate-300">{hoveredPlot.area_cents} Cents ({hoveredPlot.area_sqft} sq.ft)</p>
          <p className="text-slate-300">Facing: {hoveredPlot.facing}</p>
          <span
            className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
              hoveredPlot.status === 'available'
                ? 'bg-emerald-500/20 text-emerald-300'
                : hoveredPlot.status === 'booked'
                ? 'bg-blue-500/20 text-blue-300'
                : hoveredPlot.status === 'blocked'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {getStatusLabel(hoveredPlot.status)}
          </span>
        </div>
      )}

      {/* EMPTY STATE */}
      {plots.length > 0 && plotsWithGeometry.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm text-center pointer-events-none text-white">
          <p className="text-sm font-bold">No Plot Boundaries Configured</p>
          <p className="text-xs text-slate-400 mt-1">Boundaries can be configured in the admin CAD editor.</p>
        </div>
      )}
    </div>
  );
};
