import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Save,
  CheckCircle,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Eye,
  Sliders,
  DollarSign,
  Tag,
  Eraser,
  MousePointer,
  Download,
  Plus,
  Undo2,
  CheckCircle2,
  Scale,
  FileCode,
  FileSpreadsheet,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  Upload,
  Compass,
  Sparkles,
  X,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { Plot, ProjectLayout, PlotStatus, PlotFacing } from '../../types/database';
import {
  calculatePolygonCentroid,
  calculatePolygonArea,
  centsToSqft,
  getStatusColor,
  getStatusLabel,
  formatINR,
  SQFT_PER_CENT,
} from '../../lib/utils';
import {
  savePlotGeometry,
  createOrUpdatePlot,
  publishProjectLayout,
  deletePlot,
  updatePlotStatusAtomic,
  getStorageFileUrl,
} from '../../services/api';
import { convertPdfUrlToDataUrl } from '../../lib/pdfToImage';
import { parseHtmlBlueprint } from '../../lib/htmlPlotParser';
import {
  generateDxfContent,
  generateSvgContent,
  generateGeoJsonContent,
  downloadFile,
} from '../../lib/exportUtils';

interface PlotBoundaryEditorProps {
  layout: ProjectLayout;
  plots: Plot[];
  onRefresh: () => void;
}

type SidebarTab = 'trace' | 'selected' | 'all_plots' | 'review' | 'bulk';
type ToolMode = 'trace' | 'pan' | 'eraser';

export const PlotBoundaryEditor: React.FC<PlotBoundaryEditorProps> = ({
  layout,
  plots,
  onRefresh,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const eraserCanvasRef = useRef<HTMLCanvasElement>(null);

  // Natural blueprint dimensions
  const initialWidth = layout.layout_bounds?.width || 1820;
  const initialHeight = layout.layout_bounds?.height || 2576;
  const [imgDim, setImgDim] = useState({ width: initialWidth, height: initialHeight });
  const W = imgDim.width;
  const H = imgDim.height;

  // Resolved blueprint image URL (supports images and converted PDF)
  const [imageUrl, setImageUrl] = useState<string>(layout.source_file_path || '');
  const [imageError, setImageError] = useState<string | null>(null);
  const [isPdfRendering, setIsPdfRendering] = useState(false);

  // SVG ViewBox for pan and zoom: [minX, minY, width, height]
  const [vb, setVb] = useState<[number, number, number, number]>([0, 0, initialWidth, initialHeight]);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const dragMovedRef = useRef(false);

  // Tool mode: trace corners on image, pan/select, or eraser
  const [toolMode, setToolMode] = useState<ToolMode>('trace');

  // Active tracing state (click corners over image)
  const [currentPts, setCurrentPts] = useState<[number, number][]>([]);
  const [tracePlotNumber, setTracePlotNumber] = useState<string>('1');
  const [traceAreaCents, setTraceAreaCents] = useState<string>('32.00');
  const [tracePriceInr, setTracePriceInr] = useState<string>('2500000');
  const [traceFacing, setTraceFacing] = useState<PlotFacing>('East');

  // Selected plot for inspection/editing
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('trace');

  // Edit vertices state for existing plot
  const [activeCoords, setActiveCoords] = useState<[number, number][]>([]);
  const [draggingVertexIdx, setDraggingVertexIdx] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<[number, number][][]>([]);

  // View toggles
  const [showLabels, setShowLabels] = useState(true);
  const [showEdgeLengths, setShowEdgeLengths] = useState(true);
  const [showSourceImage, setShowSourceImage] = useState(true);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [directorySearch, setDirectorySearch] = useState('');

  // Bulk update state (Configure All plots)
  const [bulkScope, setBulkScope] = useState<'all' | 'range' | 'status' | 'facing'>('all');
  const [bulkRangeFrom, setBulkRangeFrom] = useState('1');
  const [bulkRangeTo, setBulkRangeTo] = useState('63');
  const [bulkFilterStatus, setBulkFilterStatus] = useState<PlotStatus>('available');
  const [bulkFilterFacing, setBulkFilterFacing] = useState<PlotFacing>('East');

  const [bulkPriceType, setBulkPriceType] = useState<'fixed' | 'per_sqft' | 'per_cent' | 'keep'>('fixed');
  const [bulkFixedPrice, setBulkFixedPrice] = useState('2500000');
  const [bulkRatePerSqft, setBulkRatePerSqft] = useState('1800');
  const [bulkRatePerCent, setBulkRatePerCent] = useState('75000');

  const [bulkFacing, setBulkFacing] = useState<PlotFacing | 'keep'>('keep');
  const [bulkStatus, setBulkStatus] = useState<PlotStatus | 'keep'>('keep');
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  // HTML Import Modal inside Editor state
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [htmlModalContent, setHtmlModalContent] = useState('');
  const [isImportingHtml, setIsImportingHtml] = useState(false);

  // Status and feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Calibration: ratio of pixels² to sqft
  const [pxPerSqFt, setPxPerSqFt] = useState<number>(0.5);

  // ── 1. Resolve source blueprint file (Image or PDF) ──
  useEffect(() => {
    let active = true;

    const resolveBlueprint = async () => {
      setImageError(null);
      let resolved = layout.source_file_path;
      try {
        const url = await getStorageFileUrl('layout-source-files', layout.source_file_path);
        if (url) resolved = url;
      } catch {}

      if (!active) return;

      const isPdf =
        layout.source_file_type === 'pdf' ||
        resolved.toLowerCase().includes('.pdf') ||
        resolved.toLowerCase().includes('application%2fpdf');

      if (isPdf) {
        setIsPdfRendering(true);
        try {
          const { dataUrl, width, height } = await convertPdfUrlToDataUrl(resolved, 2.5);
          if (active) {
            setImageUrl(dataUrl);
            setImgDim({ width, height });
            setVb([0, 0, width, height]);
          }
        } catch (err: any) {
          console.error('PDF rendering error:', err);
          if (active) {
            setImageUrl(resolved);
            setImageError('Could not render PDF. Please upload a high-resolution JPG or PNG.');
          }
        } finally {
          if (active) setIsPdfRendering(false);
        }
      } else {
        // Image format: measure natural dimensions
        const img = new Image();
        img.src = resolved;
        img.onload = () => {
          if (active && img.naturalWidth > 0 && img.naturalHeight > 0) {
            setImgDim({ width: img.naturalWidth, height: img.naturalHeight });
            setVb([0, 0, img.naturalWidth, img.naturalHeight]);
          }
        };
        if (active) setImageUrl(resolved);
      }
    };

    resolveBlueprint();
    return () => {
      active = false;
    };
  }, [layout.source_file_path, layout.source_file_type]);

  // Set next untraced plot number by default
  useEffect(() => {
    if (plots.length > 0) {
      // Find lowest untraced plot number
      const existingNums = plots
        .filter((p) => p.geometry && p.geometry.coordinates && p.geometry.coordinates.length >= 3)
        .map((p) => parseInt(p.plot_number, 10))
        .filter((n) => !isNaN(n));

      let next = 1;
      while (existingNums.includes(next)) next++;
      setTracePlotNumber(String(next));
    }
  }, [plots]);

  // Sync selected plot to editor form
  useEffect(() => {
    if (selectedPlot?.geometry?.coordinates) {
      setActiveCoords([...selectedPlot.geometry.coordinates]);
      setUndoStack([]);
    } else {
      setActiveCoords([]);
    }
  }, [selectedPlot]);

  // ── 2. Area Calculation (Shoelace formula in pixels²) ──
  const calcShoelaceArea = useCallback((pts: [number, number][]) => {
    if (!pts || pts.length < 3) return 0;
    return (
      Math.abs(
        pts.reduce((s, [x1, y1], i) => {
          const [x2, y2] = pts[(i + 1) % pts.length];
          return s + (x1 * y2 - x2 * y1);
        }, 0)
      ) / 2
    );
  }, []);

  // Compute measured area in cents and error percentage
  const getPlotMetrics = useCallback(
    (pts: [number, number][], tableCents: number) => {
      const areaPx = calcShoelaceArea(pts);
      // Auto-calibrate if not set
      let effectivePxPerSqFt = pxPerSqFt;
      if (effectivePxPerSqFt <= 0 && tableCents > 0 && areaPx > 0) {
        effectivePxPerSqFt = areaPx / (tableCents * SQFT_PER_CENT);
      }
      const measuredSqft = effectivePxPerSqFt > 0 ? areaPx / effectivePxPerSqFt : 0;
      const measuredCents = Math.round((measuredSqft / SQFT_PER_CENT) * 100) / 100;
      const errorPct =
        tableCents > 0 ? Math.round(((measuredCents - tableCents) / tableCents) * 1000) / 10 : 0;
      const verificationStatus: 'certified' | 'warning' | 'needs_review' =
        Math.abs(errorPct) <= 2.0 ? 'certified' : Math.abs(errorPct) <= 4.0 ? 'warning' : 'needs_review';

      return { areaPx, measuredCents, measuredSqft, errorPct, verificationStatus };
    },
    [calcShoelaceArea, pxPerSqFt]
  );

  // ── 3. Zoom & Pan handlers ──
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const factor = e.deltaY < 0 ? 0.8 : 1.25;

    setVb(([vx, vy, vw, vh]) => {
      const mouseRelX = (e.clientX - rect.left) / rect.width;
      const mouseRelY = (e.clientY - rect.top) / rect.height;
      const px = vx + mouseRelX * vw;
      const py = vy + mouseRelY * vh;

      const newW = vw * factor;
      const newH = vh * factor;
      // Clamp zoom levels
      if (newW < 80 || newW > W * 5) return [vx, vy, vw, vh];

      return [px - mouseRelX * newW, py - mouseRelY * newH, newW, newH];
    });
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Only pan on middle click, right click, or when toolMode === 'pan'
    if (e.button === 1 || e.button === 2 || toolMode === 'pan') {
      isDraggingRef.current = true;
      dragMovedRef.current = false;
      dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) + Math.abs(dy) > 3) {
      dragMovedRef.current = true;
      const rect = containerRef.current.getBoundingClientRect();
      setVb(([vx, vy, vw, vh]) => [
        vx - (dx / rect.width) * vw,
        vy - (dy / rect.height) * vh,
        vw,
        vh,
      ]);
      dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const resetView = () => {
    setVb([0, 0, W, H]);
  };

  // ── 4. Tracer: Click corners directly on image ──
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // If was panning, don't register point
    if (dragMovedRef.current) return;
    if (toolMode !== 'trace') return;
    if (!svgRef.current) return;

    // Convert screen coordinates to exact image pixel coordinates
    const svg = svgRef.current;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM()!.inverse());

    const newPt: [number, number] = [+q.x.toFixed(1), +q.y.toFixed(1)];
    setCurrentPts((prev) => [...prev, newPt]);
    setStatusMessage(null);
  };

  const handleUndoCorner = () => {
    setCurrentPts((prev) => prev.slice(0, -1));
  };

  const handleClearCorners = () => {
    setCurrentPts([]);
  };

  // Save the currently traced plot
  const handleSaveTracedPlot = async () => {
    if (currentPts.length < 3) {
      setStatusMessage({ type: 'error', text: 'Click at least 3 corner points to form a closed plot shape.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const tableCentsNum = parseFloat(traceAreaCents) || 32.0;
      const existing = plots.find((p) => p.plot_number === tracePlotNumber.trim());

      // 1. Create or update plot record
      const plotRecord = await createOrUpdatePlot({
        id: existing?.id,
        project_id: layout.project_id,
        plot_number: tracePlotNumber.trim(),
        area_cents: tableCentsNum,
        area_sqft: centsToSqft(tableCentsNum),
        price_inr: parseFloat(tracePriceInr) || 2500000,
        facing: traceFacing,
        status: existing?.status || 'available',
      });

      // 2. Save exact traced polygon points
      await savePlotGeometry(plotRecord.id, layout.id, currentPts, 'local_cad');

      // Calibrate pxPerSqFt using this plot if not set
      const areaPx = calcShoelaceArea(currentPts);
      if (tableCentsNum > 0 && areaPx > 0) {
        setPxPerSqFt(areaPx / (tableCentsNum * SQFT_PER_CENT));
      }

      setStatusMessage({
        type: 'success',
        text: `Plot #${tracePlotNumber} saved with ${currentPts.length} corners!`,
      });

      // Clear points and automatically advance to next plot number (capped at 63)
      setCurrentPts([]);
      const nextNum = parseInt(tracePlotNumber, 10);
      if (!isNaN(nextNum) && nextNum < 63) {
        setTracePlotNumber(String(nextNum + 1));
      } else {
        setTracePlotNumber('63');
      }

      onRefresh();
    } catch (err: any) {
      console.error('Error saving plot:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save plot' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── 5. Seed 63 Plots (1 to 63) Table Helper ──
  const handleSeed63Plots = async () => {
    if (!confirm('Initialize 63 plot slots (Plots 1 to 63) in database? You can then trace each plot sequentially.')) return;
    setIsSeeding(true);
    setStatusMessage({ type: 'success', text: 'Seeding 63 plots...' });

    try {
      for (let i = 1; i <= 63; i++) {
        const numStr = String(i);
        const exists = plots.some((p) => p.plot_number === numStr);
        if (!exists) {
          await createOrUpdatePlot({
            project_id: layout.project_id,
            plot_number: numStr,
            area_cents: 32.0,
            area_sqft: centsToSqft(32.0),
            price_inr: 2500000,
            facing: i % 2 === 0 ? 'East' : 'West',
            status: 'available',
          });
        }
      }
      setStatusMessage({ type: 'success', text: '63 plot slots initialized! Start tracing Plot #1.' });
      setTracePlotNumber('1');
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to seed plots' });
    } finally {
      setIsSeeding(false);
    }
  };

  // ── 6. Select existing plot ──
  const handleSelectPlot = (p: Plot) => {
    setSelectedPlot(p);
    setActiveTab('selected');
    if (p.geometry?.coordinates) {
      setActiveCoords([...p.geometry.coordinates]);
    }
  };

  // Update selected plot metadata
  const handleUpdateSelectedPlot = async (updates: Partial<Plot>) => {
    if (!selectedPlot) return;
    setIsSaving(true);
    try {
      await createOrUpdatePlot({
        id: selectedPlot.id,
        project_id: layout.project_id,
        plot_number: selectedPlot.plot_number,
        area_cents: updates.area_cents ?? selectedPlot.area_cents,
        area_sqft: updates.area_cents ? centsToSqft(updates.area_cents) : selectedPlot.area_sqft,
        price_inr: updates.price_inr ?? selectedPlot.price_inr,
        facing: updates.facing ?? selectedPlot.facing,
        status: updates.status ?? selectedPlot.status,
      });
      setStatusMessage({ type: 'success', text: `Plot #${selectedPlot.plot_number} updated.` });
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete plot
  const handleDeleteSelectedPlot = async () => {
    if (!selectedPlot) return;
    if (!confirm(`Delete Plot #${selectedPlot.plot_number}?`)) return;
    try {
      await deletePlot(selectedPlot.id);
      setSelectedPlot(null);
      setStatusMessage({ type: 'success', text: 'Plot deleted.' });
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  // Re-trace selected plot corners
  const handleRetraceSelectedPlot = () => {
    if (!selectedPlot) return;
    setTracePlotNumber(selectedPlot.plot_number);
    setTraceAreaCents(String(selectedPlot.area_cents || 32.0));
    setTracePriceInr(String(selectedPlot.price_inr || 2500000));
    setTraceFacing(selectedPlot.facing);
    setCurrentPts([]);
    setToolMode('trace');
    setActiveTab('trace');
    setStatusMessage({
      type: 'success',
      text: `Click corners over Plot #${selectedPlot.plot_number} to redraw boundary.`,
    });
  };

  // Filtered plots for sidebar list
  const filteredPlots = useMemo(() => {
    if (!directorySearch.trim()) return plots;
    const q = directorySearch.toLowerCase();
    return plots.filter(
      (p) =>
        p.plot_number.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        p.facing.toLowerCase().includes(q)
    );
  }, [plots, directorySearch]);

  // Review data: all plots verified against table area
  const reviewData = useMemo(() => {
    return plots.map((p) => {
      const coords = p.geometry?.coordinates || [];
      const hasShape = coords.length >= 3;
      const metrics = hasShape ? getPlotMetrics(coords, p.area_cents) : null;
      return {
        plot: p,
        hasShape,
        metrics,
      };
    });
  }, [plots, getPlotMetrics]);

  // Target plots for bulk configuration
  const targetBulkPlots = useMemo(() => {
    if (bulkScope === 'all') return plots;
    if (bulkScope === 'range') {
      const from = parseInt(bulkRangeFrom, 10) || 1;
      const to = parseInt(bulkRangeTo, 10) || 63;
      return plots.filter((p) => {
        const n = parseInt(p.plot_number, 10);
        return !isNaN(n) && n >= from && n <= to;
      });
    }
    if (bulkScope === 'status') {
      return plots.filter((p) => p.status === bulkFilterStatus);
    }
    if (bulkScope === 'facing') {
      return plots.filter((p) => p.facing === bulkFilterFacing);
    }
    return plots;
  }, [plots, bulkScope, bulkRangeFrom, bulkRangeTo, bulkFilterStatus, bulkFilterFacing]);

  // Bulk configure status, pricing, and direction
  const handleApplyBulk = async () => {
    if (targetBulkPlots.length === 0) return;
    setIsApplyingBulk(true);
    setStatusMessage({ type: 'success', text: `Updating ${targetBulkPlots.length} plots...` });

    try {
      for (const p of targetBulkPlots) {
        let newPrice = p.price_inr;
        if (bulkPriceType === 'fixed') {
          newPrice = parseFloat(bulkFixedPrice) || 0;
        } else if (bulkPriceType === 'per_sqft') {
          const rate = parseFloat(bulkRatePerSqft) || 0;
          newPrice = Math.round(p.area_sqft * rate);
        } else if (bulkPriceType === 'per_cent') {
          const rate = parseFloat(bulkRatePerCent) || 0;
          newPrice = Math.round(p.area_cents * rate);
        }

        const newFacing = bulkFacing === 'keep' ? p.facing : bulkFacing;
        const newStatus = bulkStatus === 'keep' ? p.status : bulkStatus;

        await createOrUpdatePlot({
          id: p.id,
          project_id: layout.project_id,
          plot_number: p.plot_number,
          area_cents: p.area_cents,
          area_sqft: p.area_sqft,
          price_inr: newPrice,
          facing: newFacing,
          status: newStatus,
        });
      }

      setStatusMessage({
        type: 'success',
        text: `Configured status, pricing & direction for all ${targetBulkPlots.length} plots!`,
      });
      onRefresh();
    } catch (err: any) {
      console.error('Error applying bulk updates:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to apply bulk updates' });
    } finally {
      setIsApplyingBulk(false);
    }
  };

  // Import HTML polygons directly into this layout
  const handleImportHtmlPolygons = async (htmlText: string) => {
    if (!htmlText.trim()) return;
    setIsImportingHtml(true);
    try {
      const parsed = parseHtmlBlueprint(htmlText);
      if (!parsed.success || parsed.plots.length === 0) {
        throw new Error(parsed.errors.join(', ') || 'No plot polygons found in HTML code.');
      }

      for (const p of parsed.plots) {
        const plotRecord = await createOrUpdatePlot({
          project_id: layout.project_id,
          plot_number: p.plotNumber,
          area_cents: p.areaCentsTable || 32.0,
          area_sqft: centsToSqft(p.areaCentsTable || 32.0),
          facing: (p.facing as any) || 'East',
          price_inr: p.priceInr || 2500000,
          status: p.status || 'available',
        });
        await savePlotGeometry(plotRecord.id, layout.id, p.points, 'local_cad');
      }

      setShowHtmlModal(false);
      setHtmlModalContent('');
      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${parsed.plots.length} plot polygons from HTML!`,
      });
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to import HTML polygons' });
    } finally {
      setIsImportingHtml(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[840px] w-full select-none">
      {/* ── LEFT: BLUEPRINT TRACER CANVAS ── */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ cursor: toolMode === 'trace' ? 'crosshair' : toolMode === 'pan' ? 'grab' : 'default' }}
      >
        {/* SVG CANVAS LAYER */}
        <svg
          ref={svgRef}
          viewBox={vb.join(' ')}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleSvgClick}
          className="w-full h-full"
          style={{ touchAction: 'none' }}
        >
          {/* 1. Plan Blueprint Image */}
          {imageUrl && showSourceImage && (
            <image
              href={imageUrl}
              width={W}
              height={H}
              opacity={imageOpacity}
              preserveAspectRatio="xMidYMid meet"
            />
          )}

          {/* 2. Saved Plots Layer */}
          {plots.map((p) => {
            const coords = p.geometry?.coordinates;
            if (!coords || coords.length < 3) return null;
            const pointsStr = coords.map((pt) => `${pt[0]},${pt[1]}`).join(' ');
            const centroid = calculatePolygonCentroid(coords);
            const isSel = selectedPlot?.id === p.id;

            return (
              <g
                key={p.id}
                className={`plot cursor-pointer transition-all ${isSel ? 'sel' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!dragMovedRef.current) handleSelectPlot(p);
                }}
              >
                {/* Polygon */}
                <polygon
                  points={pointsStr}
                  fill={
                    isSel
                      ? 'rgba(250, 204, 21, 0.45)'
                      : p.status === 'booked'
                      ? 'rgba(239, 68, 68, 0.25)'
                      : p.status === 'on_hold'
                      ? 'rgba(245, 158, 11, 0.25)'
                      : 'rgba(16, 185, 129, 0.15)'
                  }
                  stroke={isSel ? '#dc2626' : p.status === 'booked' ? '#ef4444' : p.status === 'on_hold' ? '#f59e0b' : '#10b981'}
                  strokeWidth={isSel ? Math.max(3, vb[2] * 0.0025) : Math.max(1.8, vb[2] * 0.0015)}
                  className="hover:fill-blue-500/30 hover:stroke-blue-500 transition-colors"
                />

                {/* Plot Number Label */}
                {showLabels && (
                  <g pointerEvents="none">
                    <rect
                      x={centroid[0] - Math.max(16, vb[2] * 0.012)}
                      y={centroid[1] - Math.max(12, vb[2] * 0.009)}
                      width={Math.max(32, vb[2] * 0.024)}
                      height={Math.max(24, vb[2] * 0.018)}
                      rx={Math.max(4, vb[2] * 0.003)}
                      fill={isSel ? '#dc2626' : '#0f172a'}
                      opacity={0.9}
                    />
                    <text
                      x={centroid[0]}
                      y={centroid[1]}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={Math.max(13, vb[2] * 0.01)}
                      fontWeight="900"
                      fill="#ffffff"
                    >
                      {p.plot_number}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 3. Live Active Tracing Polygon */}
          {currentPts.length > 0 && (
            <g pointerEvents="none">
              {/* Traced polygon fill */}
              {currentPts.length >= 3 && (
                <polygon
                  points={currentPts.map((p) => `${p[0]},${p[1]}`).join(' ')}
                  fill="rgba(250, 204, 21, 0.4)"
                  stroke="#ef4444"
                  strokeWidth={Math.max(2.5, vb[2] * 0.002)}
                />
              )}

              {/* Connecting lines for < 3 points */}
              {currentPts.length < 3 && currentPts.length > 1 && (
                <polyline
                  points={currentPts.map((p) => `${p[0]},${p[1]}`).join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={Math.max(2.5, vb[2] * 0.002)}
                />
              )}

              {/* Corner handle dots with indices */}
              {currentPts.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt[0]}
                    cy={pt[1]}
                    r={Math.max(6, vb[2] * 0.0045)}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth={Math.max(1.5, vb[2] * 0.0012)}
                  />
                  <text
                    x={pt[0]}
                    y={pt[1] - Math.max(10, vb[2] * 0.008)}
                    textAnchor="middle"
                    fontSize={Math.max(11, vb[2] * 0.008)}
                    fontWeight="800"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth={0.5}
                  >
                    #{i + 1}
                  </text>
                </g>
              ))}
            </g>
          )}
        </svg>

        {/* TOP TOOLBAR */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-2xl">
          {/* Tool mode: Trace corners */}
          <button
            onClick={() => setToolMode('trace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              toolMode === 'trace' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Click corners directly over blueprint to trace plot"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Trace Corners</span>
          </button>

          {/* Tool mode: Pan / Select */}
          <button
            onClick={() => setToolMode('pan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              toolMode === 'pan' ? 'bg-blue-600 text-white font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Pan & Select plots"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Pan / Select</span>
          </button>

          {/* Quick Undo corner */}
          {currentPts.length > 0 && (
            <button
              onClick={handleUndoCorner}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700"
              title="Undo last corner (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo Corner ({currentPts.length})</span>
            </button>
          )}

          {/* Quick Clear corners */}
          {currentPts.length > 0 && (
            <button
              onClick={handleClearCorners}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700"
            >
              <span>Clear</span>
            </button>
          )}

          {/* Fast Save Plot button right on toolbar */}
          {currentPts.length >= 3 && (
            <button
              onClick={handleSaveTracedPlot}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md animate-pulse"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Plot #{tracePlotNumber}</span>
            </button>
          )}

          {/* Toggle Labels */}
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`p-1.5 rounded-xl border ${showLabels ? 'bg-blue-950/80 text-blue-300 border-blue-700' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            title="Toggle plot number labels"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Import HTML Blueprint / Polygons */}
          <button
            type="button"
            onClick={() => setShowHtmlModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all cursor-pointer"
            title="Import 63 clickable plot polygons from plot_viewer.html"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Import HTML</span>
          </button>

          {/* Bulk Configure Status, Pricing & Direction */}
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Configure Status, Pricing & Direction for all plots"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configure All</span>
          </button>
        </div>

        {/* TOP RIGHT ZOOM CONTROLS */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-xl">
          <button
            onClick={() =>
              setVb(([x, y, w, h]) => [x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.8])
            }
            title="Zoom In"
            className="p-2 text-slate-300 hover:bg-slate-800 rounded-xl"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setVb(([x, y, w, h]) => [x - w * 0.125, y - h * 0.125, w * 1.25, h * 1.25])
            }
            title="Zoom Out"
            className="p-2 text-slate-300 hover:bg-slate-800 rounded-xl"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            title="Reset View"
            className="p-2 text-emerald-400 hover:bg-slate-800 rounded-xl"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* BOTTOM STATUS BAR */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-xl border backdrop-blur-md ${
              layout.is_published
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                : 'bg-amber-950/80 text-amber-300 border-amber-600'
            }`}
          >
            {layout.is_published ? '● Live on Map' : '○ Draft'}
          </span>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-xl backdrop-blur-md border border-slate-800">
            {W}×{H}px • {plots.length} Plots Digitized
          </span>
          {toolMode === 'trace' && (
            <span className="text-[11px] font-bold text-amber-300 bg-amber-950/90 px-3 py-1 rounded-xl border border-amber-700 animate-pulse">
              Click corners on blueprint to trace Plot #{tracePlotNumber} ({currentPts.length} points)
            </span>
          )}
        </div>
      </div>

      {/* ── RIGHT: SIDEBAR (TRACER & PLOT CONTROLS) ── */}
      <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between shadow-sm overflow-hidden">
        {/* TABS */}
        <div className="p-2 border-b border-slate-100 flex items-center gap-1 bg-slate-50/70 text-[11px] font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('trace')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'trace' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Trace
          </button>
          <button
            onClick={() => setActiveTab('selected')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'selected' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Plot Details
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'bulk' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Configure All
          </button>
          <button
            onClick={() => setActiveTab('all_plots')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'all_plots' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All ({plots.length})
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'review' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Review
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Status notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: TRACER CONTROLS */}
          {activeTab === 'trace' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Tracer: Click Plot Corners</h3>
                  <p className="text-[11px] text-slate-500">Click corners over the blue plot line on the blueprint.</p>
                </div>
                {plots.length === 0 && (
                  <button
                    onClick={handleSeed63Plots}
                    disabled={isSeeding}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold"
                    title="Initialize slots for 63 plots"
                  >
                    Seed 63 Slots
                  </button>
                )}
              </div>

              {/* Target Plot Number with Prev / Next */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Plot Number to Trace *</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const n = parseInt(tracePlotNumber, 10);
                      if (!isNaN(n) && n > 1) setTracePlotNumber(String(n - 1));
                    }}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={tracePlotNumber}
                    onChange={(e) => setTracePlotNumber(e.target.value)}
                    placeholder="e.g. 1"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-center text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const n = parseInt(tracePlotNumber, 10);
                      if (!isNaN(n) && n < 63) setTracePlotNumber(String(n + 1));
                    }}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Table Area (Cents) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Table Area (Cents) <span className="text-slate-400 font-normal">from Area Details table</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={traceAreaCents}
                  onChange={(e) => setTraceAreaCents(e.target.value)}
                  placeholder="32.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  = {centsToSqft(parseFloat(traceAreaCents) || 0)} sq.ft
                </span>
              </div>

              {/* Facing & Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Facing</label>
                  <select
                    value={traceFacing}
                    onChange={(e) => setTraceFacing(e.target.value as PlotFacing)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={tracePriceInr}
                    onChange={(e) => setTracePriceInr(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Live Area Metrics for Current Points */}
              {currentPts.length >= 3 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900">Corners Traced:</span>
                    <span className="font-black text-amber-950">{currentPts.length} points</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900">Shoelace Pixels²:</span>
                    <span className="font-mono text-amber-950 font-bold">{Math.round(calcShoelaceArea(currentPts))} px²</span>
                  </div>
                  {parseFloat(traceAreaCents) > 0 && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60">
                      <span className="font-bold text-amber-900">Target Table Area:</span>
                      <span className="font-black text-amber-950">{traceAreaCents} Cents</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveTracedPlot}
                  disabled={currentPts.length < 3 || isSaving}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Plot #{tracePlotNumber} ({currentPts.length} corners)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUndoCorner}
                    disabled={currentPts.length === 0}
                    className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl disabled:opacity-40"
                  >
                    Undo Last Corner
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCorners}
                    disabled={currentPts.length === 0}
                    className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-rose-600 font-bold text-xs rounded-xl disabled:opacity-40"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">How to trace exact plots:</p>
                <p>1. Zoom in with mouse wheel directly over the plot.</p>
                <p>2. Click each corner along the blue plot boundary line.</p>
                <p>3. Click <strong>Save Plot</strong>. It saves to Supabase and automatically advances to the next plot number!</p>
              </div>
            </div>
          )}

          {/* TAB 2: SELECTED PLOT DETAILS */}
          {activeTab === 'selected' && (
            <div className="space-y-4">
              {selectedPlot ? (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Plot #{selectedPlot.plot_number}</h3>
                      <p className="text-[11px] text-slate-500">Click &amp; inspect plot properties</p>
                    </div>
                    <button
                      onClick={() => setSelectedPlot(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                      Deselect
                    </button>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Inventory Status</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['available', 'booked', 'on_hold'] as PlotStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateSelectedPlot({ status: st })}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                            selectedPlot.status === st
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          {getStatusLabel(st)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table Area (Cents) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Table Area (Cents)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedPlot.area_cents}
                      onChange={(e) =>
                        handleUpdateSelectedPlot({ area_cents: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      = {centsToSqft(selectedPlot.area_cents)} sq.ft
                    </span>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Price (INR)</label>
                    <input
                      type="number"
                      value={selectedPlot.price_inr || 0}
                      onChange={(e) =>
                        handleUpdateSelectedPlot({ price_inr: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:outline-none"
                    />
                    <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                      {formatINR(selectedPlot.price_inr || 0)}
                    </span>
                  </div>

                  {/* Facing (8 Directions Grid) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        Direction / Facing
                      </span>
                      <span className="text-[10px] text-blue-700 font-extrabold bg-blue-50 px-2 py-0.5 rounded-md">
                        {selectedPlot.facing}
                      </span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      {(['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'] as PlotFacing[]).map((dir) => (
                        <button
                          key={dir}
                          type="button"
                          onClick={() => handleUpdateSelectedPlot({ facing: dir })}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all truncate text-center ${
                            selectedPlot.facing === dir
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                          }`}
                          title={dir}
                        >
                          {dir}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Presets */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span>Quick Presets:</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateSelectedPlot({ price_inr: (selectedPlot.price_inr || 0) + 100000 })}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-mono"
                        >
                          +1L
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSelectedPlot({ price_inr: (selectedPlot.price_inr || 0) + 500000 })}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-mono"
                        >
                          +5L
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSelectedPlot({ price_inr: 2500000 })}
                          className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-mono"
                        >
                          25L
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSelectedPlot({ price_inr: 3000000 })}
                          className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-mono"
                        >
                          30L
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Measured vs Table Verification Card */}
                  {selectedPlot.geometry?.coordinates && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-blue-600" />
                        Area Verification
                      </span>
                      {(() => {
                        const m = getPlotMetrics(selectedPlot.geometry!.coordinates, selectedPlot.area_cents);
                        return (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-xl border border-slate-200">
                              <span className="text-[10px] text-slate-400 block font-bold">Table Area</span>
                              <span className="font-black text-slate-900">{selectedPlot.area_cents} Cents</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-200">
                              <span className="text-[10px] text-slate-400 block font-bold">Measured Area</span>
                              <span className="font-black text-slate-900">{m.measuredCents} Cents</span>
                              <span
                                className={`text-[10px] font-extrabold block ${
                                  Math.abs(m.errorPct) <= 2.0
                                    ? 'text-emerald-600'
                                    : Math.abs(m.errorPct) <= 4.0
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {m.errorPct > 0 ? `+${m.errorPct}%` : `${m.errorPct}%`}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetraceSelectedPlot}
                      className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-200"
                    >
                      Redraw Corners
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSelectedPlot}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <Tag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">
                    Click any plot shape on the blueprint to view and edit its details.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: BULK CONFIGURE STATUS, PRICING & DIRECTION */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  Configure Status, Pricing &amp; Direction
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Set status, direction (facing), and pricing across all 63 plots at once or for a range.
                </p>
              </div>

              {/* 1. Target Scope Selector */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  1. Which plots to configure?
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setBulkScope('all')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      bulkScope === 'all'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>All Plots ({plots.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkScope('range')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      bulkScope === 'range'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Plot Number Range</span>
                  </button>
                </div>

                {/* Range inputs if range selected */}
                {bulkScope === 'range' && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">From Plot #</label>
                      <input
                        type="number"
                        value={bulkRangeFrom}
                        onChange={(e) => setBulkRangeFrom(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-center"
                      />
                    </div>
                    <span className="text-slate-400 font-bold text-xs pt-4">to</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">To Plot #</label>
                      <input
                        type="number"
                        value={bulkRangeTo}
                        onChange={(e) => setBulkRangeTo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-center"
                      />
                    </div>
                  </div>
                )}

                <div className="text-[11px] font-bold text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200 text-center">
                  Targeting {targetBulkPlots.length} plots for update
                </div>
              </div>

              {/* 2. Status Configuration */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  2. Inventory Status:
                </label>
                <div className="grid grid-cols-4 gap-1 text-xs">
                  {(['keep', 'available', 'booked', 'on_hold'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBulkStatus(st)}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                        bulkStatus === st
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {st === 'keep' ? 'Keep' : getStatusLabel(st)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Direction (Facing) Configuration */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  3. Direction (Facing):
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['keep', 'East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setBulkFacing(dir)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all truncate text-center ${
                        bulkFacing === dir
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {dir === 'keep' ? 'Keep Current' : dir}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Pricing Configuration */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  4. Pricing Setup:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setBulkPriceType('fixed')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      bulkPriceType === 'fixed'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>Fixed Price (₹)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkPriceType('per_sqft')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      bulkPriceType === 'per_sqft'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>Rate / Sq.Ft (₹)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkPriceType('per_cent')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      bulkPriceType === 'per_cent'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>Rate / Cent (₹)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkPriceType('keep')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      bulkPriceType === 'keep'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>Keep Current</span>
                  </button>
                </div>

                {bulkPriceType === 'fixed' && (
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Fixed Price (₹ INR)</label>
                    <input
                      type="number"
                      value={bulkFixedPrice}
                      onChange={(e) => setBulkFixedPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                    <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                      = {formatINR(parseFloat(bulkFixedPrice) || 0)} per plot
                    </span>
                  </div>
                )}

                {bulkPriceType === 'per_sqft' && (
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Price per Sq.Ft (₹)</label>
                    <input
                      type="number"
                      value={bulkRatePerSqft}
                      onChange={(e) => setBulkRatePerSqft(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                    <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                      e.g. 1,200 sq.ft plot = {formatINR((parseFloat(bulkRatePerSqft) || 0) * 1200)}
                    </span>
                  </div>
                )}

                {bulkPriceType === 'per_cent' && (
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Price per Cent (₹)</label>
                    <input
                      type="number"
                      value={bulkRatePerCent}
                      onChange={(e) => setBulkRatePerCent(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                    <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                      e.g. 32 Cent plot = {formatINR((parseFloat(bulkRatePerCent) || 0) * 32)}
                    </span>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={handleApplyBulk}
                disabled={isApplyingBulk || targetBulkPlots.length === 0}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isApplyingBulk ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Applying Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Apply to {targetBulkPlots.length} Plots</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: ALL PLOTS DIRECTORY */}
          {activeTab === 'all_plots' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-700">Total Plots: {plots.length}</span>
                {plots.length === 0 && (
                  <button
                    onClick={handleSeed63Plots}
                    disabled={isSeeding}
                    className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold border border-purple-200"
                  >
                    Seed 63 Slots
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search plot # or status..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              {/* Plots List */}
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredPlots.map((p) => {
                  const hasShape = p.geometry && p.geometry.coordinates && p.geometry.coordinates.length >= 3;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPlot(p)}
                      className={`py-2 px-2 flex items-center justify-between rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${
                        selectedPlot?.id === p.id ? 'bg-amber-50/80 border border-amber-200' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs text-slate-800">
                          {p.plot_number}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">Plot #{p.plot_number}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'booked' ? 'bg-red-50 text-red-700 border border-red-200' :
                              p.status === 'on_hold' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              p.status === 'sold' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {getStatusLabel(p.status)}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {p.area_cents} Cents • {p.facing} • {p.price_inr ? formatINR(p.price_inr) : '₹ Unset'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            hasShape ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {hasShape ? 'Clickable' : 'No Shape'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: REVIEW & AREA SCHEDULE */}
          {activeTab === 'review' && (
            <div className="space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-purple-600" />
                  Area Schedule Verification
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Compares each polygon’s measured area with printed table area.
                </p>
              </div>

              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {reviewData.map(({ plot: p, hasShape, metrics }) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPlot(p)}
                    className="py-2.5 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 rounded-xl"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900">Plot #{p.plot_number}</span>
                      <span className="text-[10px] text-slate-400 block">Table: {p.area_cents} Cents</span>
                    </div>

                    {metrics ? (
                      <div className="text-right">
                        <span className="font-bold text-slate-800 block">{metrics.measuredCents} Cents</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            metrics.verificationStatus === 'certified'
                              ? 'bg-emerald-50 text-emerald-700'
                              : metrics.verificationStatus === 'warning'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {metrics.errorPct > 0 ? `+${metrics.errorPct}%` : `${metrics.errorPct}%`} •{' '}
                          {metrics.verificationStatus}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Untraced</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
          {/* Publish Button */}
          <button
            type="button"
            onClick={async () => {
              setIsPublishing(true);
              try {
                await publishProjectLayout(layout.id, layout.project_id);
                setStatusMessage({ type: 'success', text: 'Layout and plots published live!' });
                onRefresh();
              } catch (err: any) {
                setStatusMessage({ type: 'error', text: err.message || 'Failed to publish' });
              } finally {
                setIsPublishing(false);
              }
            }}
            disabled={isPublishing || plots.length === 0}
            className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isPublishing ? 'Publishing...' : 'Publish Layout'}</span>
          </button>

          {/* Export DXF */}
          <button
            type="button"
            onClick={() => {
              const dxf = generateDxfContent(plots, layout);
              downloadFile(dxf, `cad_plots_${layout.id.slice(0, 8)}.dxf`, 'application/dxf');
            }}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
            title="Export DXF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HTML BLUEPRINT / POLYGONS IMPORT MODAL */}
      {showHtmlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-purple-600" />
                  Import HTML Blueprint Polygons
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload your <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono font-bold">plot_viewer (1).html</code> file or paste its HTML code.
                  All 63 plot shapes and table areas will be imported directly into this layout canvas.
                </p>
              </div>
              <button
                onClick={() => setShowHtmlModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick File Select */}
            <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-purple-900 block">Select .html file:</span>
                <span className="text-[11px] text-purple-700">Load plot_viewer (1).html directly from your computer.</span>
              </div>
              <label className="cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0">
                Choose .html File
                <input
                  type="file"
                  accept=".html,.htm"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const text = await f.text();
                      setHtmlModalContent(text);
                    }
                  }}
                />
              </label>
            </div>

            {/* HTML Code Textarea */}
            <div className="flex-1 min-h-[200px] flex flex-col">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Or Paste HTML Code:
              </label>
              <textarea
                value={htmlModalContent}
                onChange={(e) => setHtmlModalContent(e.target.value)}
                placeholder="Paste HTML here (containing <svg><image .../><g class=&quot;plot&quot; data-n=&quot;1&quot;><polygon points=&quot;...&quot;/></g>...)"
                className="flex-1 w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              {htmlModalContent && (
                <div className="text-[11px] font-bold text-purple-700 mt-1">
                  Ready to parse ({htmlModalContent.length.toLocaleString()} characters)
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowHtmlModal(false);
                  setHtmlModalContent('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleImportHtmlPolygons(htmlModalContent)}
                disabled={!htmlModalContent.trim() || isImportingHtml}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center gap-2"
              >
                {isImportingHtml ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing 63 Plots...</span>
                  </>
                ) : (
                  <>
                    <FileCode className="w-4 h-4" />
                    <span>Import All Plots</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
