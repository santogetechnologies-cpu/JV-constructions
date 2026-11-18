import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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

  // Only attempt to load image if source_file_type is image or contains an actual image extension / base64
  const hasValidImageSource = useMemo(() => {
    if (!layout?.source_file_path) return false;
    const path = layout.source_file_path.toLowerCase();
    if (path.endsWith('.html') || path.endsWith('.htm')) return false;
    return (
      layout.source_file_type === 'image' ||
      layout.source_file_type === 'pdf' ||
      path.includes('.jpg') ||
      path.includes('.jpeg') ||
      path.includes('.png') ||
      path.includes('.webp') ||
      path.includes('.pdf') ||
      path.startsWith('data:image/')
    );
  }, [layout?.source_file_path, layout?.source_file_type]);

  // Resolve storage URL for blueprint image
  useEffect(() => {
    let active = true;
    setImageLoaded(false);
    if (hasValidImageSource && layout?.source_file_path) {
      if (layout.source_file_path.startsWith('data:image/')) {
        setResolvedImageUrl(layout.source_file_path);
        return;
      }

      getStorageFileUrl('layout-source-files', layout.source_file_path)
        .then(async (url) => {
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
        })
        .catch(() => {
          if (active) setResolvedImageUrl(layout.source_file_path);
        });
    } else {
      setResolvedImageUrl('');
    }
    return () => {
      active = false;
    };
  }, [layout?.source_file_path, layout?.source_file_type, hasValidImageSource]);

  // Dynamically compute exact bounding box from layout_bounds AND actual plot coordinates
  const bounds = useMemo(() => {
    let minX = layout?.layout_bounds?.minX ?? 0;
    let minY = layout?.layout_bounds?.minY ?? 0;
    let width =
      layout?.layout_bounds?.width ||
      (layout?.layout_bounds
        ? layout.layout_bounds.maxX - layout.layout_bounds.minX
        : 0);
    let height =
      layout?.layout_bounds?.height ||
      (layout?.layout_bounds
        ? layout.layout_bounds.maxY - layout.layout_bounds.minY
        : 0);

    // Collect all valid plot polygon coordinates
    const allCoords: [number, number][] = [];
    plots.forEach((p) => {
      if (p.geometry?.coordinates && p.geometry.coordinates.length >= 3) {
        allCoords.push(...p.geometry.coordinates);
      }
    });

    if (allCoords.length > 0) {
      const xs = allCoords.map((pt) => pt[0]);
      const ys = allCoords.map((pt) => pt[1]);
      const pMinX = Math.min(...xs);
      const pMaxX = Math.max(...xs);
      const pMinY = Math.min(...ys);
      const pMaxY = Math.max(...ys);
      const pW = pMaxX - pMinX;
      const pH = pMaxY - pMinY;

      // Check if layout bounds are missing, default 0,0, or cut off any plot polygon
      const isOutOfBounds =
        width <= 0 ||
        height <= 0 ||
        pMinX < minX ||
        pMaxX > minX + width ||
        pMinY < minY ||
        pMaxY > minY + height ||
        (minX === 0 && minY === 0 && (pMinX > 30 || pMinY > 30));

      if (isOutOfBounds) {
        const padX = Math.max(16, pW * 0.08);
        const padY = Math.max(16, pH * 0.08);
        minX = pMinX - padX;
        minY = pMinY - padY;
        width = pW + padX * 2;
        height = pH + padY * 2;
      }
    }

    if (width <= 0) width = 1200;
    if (height <= 0) height = 800;

    return {
      minX,
      minY,
      width,
      height,
    };
  }, [layout?.layout_bounds, plots]);

  // Center & Fit Layout to Container
  const fitToLayout = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const padding = 28;
    const scaleX = (clientWidth - padding * 2) / bounds.width;
    const scaleY = (clientHeight - padding * 2) / bounds.height;
    const fitScale = Math.min(scaleX, scaleY, 6);

    const centerX =
      (clientWidth - bounds.width * fitScale) / 2 - bounds.minX * fitScale;
    const centerY =
      (clientHeight - bounds.height * fitScale) / 2 - bounds.minY * fitScale;

    setTransform({ scale: fitScale, x: centerX, y: centerY });
  }, [bounds]);

  useEffect(() => {
    fitToLayout();
  }, [fitToLayout, layout?.id, plots.length]);

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
        const newScale = Math.min(Math.max(prev.scale * zoomFactor, 0.05), 14);
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
        return { scale: newScale, x: newX, y: newY };
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Handle Drag/Pan with click discrimination
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      dragMovedRef.current = false;
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    },
    [transform]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [dragStart, transform]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Zoom centered on container focal point
  const zoomAtPoint = (factor: number, clientX?: number, clientY?: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const focalX = clientX !== undefined ? clientX - rect.left : rect.width / 2;
    const focalY = clientY !== undefined ? clientY - rect.top : rect.height / 2;

    setTransform((prev) => {
      const newScale = Math.min(Math.max(prev.scale * factor, 0.05), 14);
      const newX = focalX - (focalX - prev.x) * (newScale / prev.scale);
      const newY = focalY - (focalY - prev.y) * (newScale / prev.scale);
      return { scale: newScale, x: newX, y: newY };
    });
  };

  // Touch pan & pinch-zoom with focal midpoint tracking
  const touchState = useRef<{
    lastDist: number;
    lastX: number;
    lastY: number;
  }>({
    lastDist: 0,
    lastX: 0,
    lastY: 0,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    dragMovedRef.current = false;
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
      const newX = e.touches[0].clientX - touchState.current.lastX;
      const newY = e.touches[0].clientY - touchState.current.lastY;
      if (Math.abs(newX - transform.x) > 4 || Math.abs(newY - transform.y) > 4) {
        dragMovedRef.current = true;
      }
      setTransform((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    } else if (e.touches.length === 2 && containerRef.current) {
      dragMovedRef.current = true;
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);

      if (touchState.current.lastDist > 0) {
        const factor = dist / touchState.current.lastDist;
        const rect = containerRef.current.getBoundingClientRect();
        const midX = (t0.clientX + t1.clientX) / 2 - rect.left;
        const midY = (t0.clientY + t1.clientY) / 2 - rect.top;

        setTransform((prev) => {
          const newScale = Math.min(Math.max(prev.scale * factor, 0.05), 14);
          const newX = midX - (midX - prev.x) * (newScale / prev.scale);
          const newY = midY - (midY - prev.y) * (newScale / prev.scale);
          return { scale: newScale, x: newX, y: newY };
        });
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

  // Smooth Center Zoom buttons
  const handleZoomIn = () => zoomAtPoint(1.3);
  const handleZoomOut = () => zoomAtPoint(0.75);

  const plotsWithGeometry = plots.filter(
    (p) => p.geometry?.coordinates && p.geometry.coordinates.length >= 3
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#f8fafc] overflow-hidden select-none"
      style={{
        cursor:
          isDraggingRef.current && dragMovedRef.current ? 'grabbing' : 'grab',
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
            className="absolute max-w-none pointer-events-none select-none transition-opacity duration-300"
            style={{
              top: `${bounds.minY}px`,
              left: `${bounds.minX}px`,
              width: `${bounds.width}px`,
              height: `${bounds.height}px`,
              opacity: imageLoaded ? 1 : 0.4,
              filter: 'contrast(1.05) brightness(1.02)',
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        )}

        {/* Layer 2: Vector SVG Plot Polygons & Numbers */}
        <svg
          viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
          width={bounds.width}
          height={bounds.height}
          style={{
            position: 'absolute',
            top: `${bounds.minY}px`,
            left: `${bounds.minX}px`,
            overflow: 'visible',
          }}
          className="pointer-events-auto"
        >
          {plotsWithGeometry.map((plot) => {
            const isSelected = selectedPlotId === plot.id;
            const isHovered = hoveredPlot?.id === plot.id;
            const isFilteredOut = filteredPlotIds && !filteredPlotIds.has(plot.id);
            const centroid = calculatePolygonCentroid(plot.geometry!.coordinates);
            const pointsString = pointsToSvgPolygon(plot.geometry!.coordinates);
            const statusStyle = getStatusColor(plot.status);

            // Responsive badge sizing based on layout coordinates
            const badgeW = Math.max(16, bounds.width * 0.045);
            const badgeH = Math.max(12, bounds.height * 0.035);
            const fontSize = Math.max(9, Math.min(22, badgeH * 0.75));

            return (
              <g
                key={plot.id}
                className="transition-opacity duration-200 cursor-pointer"
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
                {/* Plot Boundary Polygon - High visibility with crisp borders */}
                <polygon
                  points={pointsString}
                  fill={isSelected ? '#2563eb' : statusStyle.fill}
                  stroke={
                    isSelected
                      ? '#1d4ed8'
                      : isHovered
                      ? '#2563eb'
                      : statusStyle.stroke
                  }
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2.0 : 1.2}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  className="transition-all duration-150"
                  fillOpacity={isSelected ? 0.65 : isHovered ? 0.70 : 0.45}
                />

                {/* Plot Number Label - Clean, high-contrast dark badge */}
                {showLabels && (
                  <g pointerEvents="none">
                    <rect
                      x={centroid[0] - badgeW / 2}
                      y={centroid[1] - badgeH / 2}
                      width={badgeW}
                      height={badgeH}
                      rx={Math.max(3, badgeH * 0.2)}
                      fill={isSelected ? '#1d4ed8' : '#0f172a'}
                      opacity={0.92}
                    />
                    <text
                      x={centroid[0]}
                      y={centroid[1]}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={fontSize}
                      fontWeight="900"
                      fill="#ffffff"
                      style={{
                        userSelect: 'none',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {plot.plot_number}
                    </text>
                  </g>
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
          className="p-2 sm:p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 sm:p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={fitToLayout}
          className="p-2 sm:p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors"
          title="Reset View / Fit to Screen"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-colors ${
            showLabels
              ? 'text-teal-700 bg-teal-50'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title={showLabels ? 'Hide Plot Numbers' : 'Show Plot Numbers'}
        >
          {showLabels ? (
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 sm:p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors hidden sm:block"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>

      {/* PLOT STATUS LEGEND AT BOTTOM-LEFT */}
      <div className="fixed bottom-4 sm:bottom-6 left-3 sm:left-6 z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-md flex items-center gap-3 sm:gap-4 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4efa34] border border-emerald-600/30" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#343efa] border border-blue-600/30" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fa348a] border border-red-600/30" />
            <span>Registered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f3fa34] border border-amber-600/30" />
            <span>Blocked</span>
          </div>
        </div>
      </div>
    </div>
  );
};
