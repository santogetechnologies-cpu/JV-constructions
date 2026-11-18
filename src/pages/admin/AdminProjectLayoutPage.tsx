import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
  FileCode,
  Upload,
  X,
  Settings,
} from 'lucide-react';
import { Project, ProjectLayout, Plot } from '../../types/database';
import {
  getProjectById,
  getLatestLayout,
  getPlotsWithGeometries,
  createProjectLayout,
  uploadFileToStorage,
  createOrUpdatePlot,
  savePlotGeometry,
  publishProjectLayout,
} from '../../services/api';
import { supabase } from '../../lib/supabaseClient';
import { PlotBoundaryEditor } from '../../components/admin/PlotBoundaryEditor';
import { parseHtmlBlueprint } from '../../lib/htmlPlotParser';
import { centsToSqft } from '../../lib/utils';

export const AdminProjectLayoutPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [layout, setLayout] = useState<ProjectLayout | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0); // 0–100
  const [uploadNotice, setUploadNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm delete dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Paste / Import HTML modal state
  const [showHtmlPasteModal, setShowHtmlPasteModal] = useState(false);
  const [pastedHtml, setPastedHtml] = useState('');
  const [isImportingHtml, setIsImportingHtml] = useState(false);
  const [uploadRatePerCent, setUploadRatePerCent] = useState('75000');

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const proj = await getProjectById(projectId);
      setProject(proj);

      const l = await getLatestLayout(projectId);
      setLayout(l);

      if (l) {
        const p = await getPlotsWithGeometries(projectId, l.id);
        setPlots(p);
      } else {
        setPlots([]);
      }
    } catch (err: any) {
      console.error('Failed to load project layout:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Silent refresh of plots without triggering full page reload or unmounting editor
  const refreshPlots = useCallback(async () => {
    if (!projectId) return;
    try {
      const l = await getLatestLayout(projectId);
      setLayout(l);
      if (l) {
        const p = await getPlotsWithGeometries(projectId, l.id);
        setPlots(p);
      }
    } catch (err: any) {
      console.error('Failed to silently refresh plots:', err);
    }
  }, [projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ──────────────────────────────────────────────────────────
  // Upload with XHR progress tracking
  // ──────────────────────────────────────────────────────────
  const uploadWithProgress = useCallback(
    async (
      file: File | Blob,
      storagePath: string
    ): Promise<{ path: string; publicUrl: string; signedUrl: string }> => {
      return new Promise(async (resolve, reject) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

        if (!supabaseUrl) {
          // Fallback: use SDK without progress
          try {
            const result = await uploadFileToStorage('layout-source-files', storagePath, file);
            setUploadProgress(90);
            resolve(result);
          } catch (e) {
            reject(e);
          }
          return;
        }

        // Supabase Storage REST API: PUT /storage/v1/object/{bucket}/{path}
        const uploadUrl = `${supabaseUrl}/storage/v1/object/layout-source-files/${storagePath}`;
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${token || supabaseKey}`);
        xhr.setRequestHeader('apikey', supabaseKey);
        xhr.setRequestHeader('x-upsert', 'true');

        // Set correct content type
        const mimeType = file instanceof File ? file.type : 'application/octet-stream';
        xhr.setRequestHeader('Content-Type', mimeType);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 82);
            setUploadProgress(Math.max(10, pct));
          }
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(90);
            try {
              const { data: { publicUrl } } = supabase.storage
                .from('layout-source-files')
                .getPublicUrl(storagePath);

              let signedUrl = publicUrl;
              try {
                const { data: sData } = await supabase.storage
                  .from('layout-source-files')
                  .createSignedUrl(storagePath, 31536000);
                if (sData?.signedUrl) signedUrl = sData.signedUrl;
              } catch {}

              setUploadProgress(100);
              resolve({ path: storagePath, publicUrl, signedUrl });
            } catch (e) {
              reject(e);
            }
          } else {
            // XHR failed – fall back to the Supabase SDK (no progress but reliable)
            console.warn('XHR upload got status', xhr.status, '— falling back to SDK');
            try {
              const result = await uploadFileToStorage('layout-source-files', storagePath, file);
              setUploadProgress(90);
              resolve(result);
            } catch (sdkErr) {
              reject(sdkErr);
            }
          }
        };

        xhr.onerror = async () => {
          // Network error – fall back to SDK
          console.warn('XHR upload network error — falling back to SDK');
          try {
            const result = await uploadFileToStorage('layout-source-files', storagePath, file);
            setUploadProgress(90);
            resolve(result);
          } catch (sdkErr) {
            reject(sdkErr);
          }
        };

        // Send raw binary body (Supabase storage expects this for PUT)
        xhr.send(file);
      });
    },
    []
  );

  // ──────────────────────────────────────────────────────────
  // Main file handler — one unified entry point
  // ──────────────────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    if (!file || !project) return;
    if (uploadState === 'uploading' || uploadState === 'processing') return;

    // If a layout already exists, block upload (must delete first)
    if (layout) {
      setUploadNotice({
        type: 'error',
        text: 'A blueprint is already uploaded. Please delete the current blueprint before uploading a new one.',
      });
      return;
    }

    setUploadState('uploading');
    setUploadProgress(0);
    setUploadNotice(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext !== 'html' && ext !== 'htm') {
        throw new Error('Only Interactive HTML Blueprint files (.html, .htm) can be uploaded. JPG, PNG, and PDF uploads are disabled. Please upload your plot_viewer.html file.');
      }

      setUploadProgress(15);
      setUploadState('processing');
      const htmlText = await file.text();
      const parsed = parseHtmlBlueprint(htmlText);

      if (!parsed.success || parsed.plots.length === 0) {
        throw new Error(parsed.errors.join(', ') || 'No plot polygons found in HTML file.');
      }

      setUploadProgress(35);

      // If the HTML has a base64 background image, extract and upload it as a fast JPEG
      let resolvedImageUrl = parsed.imageUrl;
      if (resolvedImageUrl && resolvedImageUrl.startsWith('data:image/')) {
        try {
          const res = await fetch(resolvedImageUrl);
          const blob = await res.blob();
          const imgPath = `layouts/${project.id}/${Date.now()}_extracted_plan.jpg`;
          const uploadedImg = await uploadWithProgress(blob, imgPath);
          resolvedImageUrl = uploadedImg.publicUrl || uploadedImg.signedUrl || resolvedImageUrl;
        } catch (e) {
          console.warn('Could not re-upload base64 image, keeping data URL', e);
        }
      }

      // Upload the HTML blueprint file to storage for reference
      const storagePath = `layouts/${project.id}/${Date.now()}_${file.name}`;
      const { publicUrl, signedUrl } = await uploadWithProgress(file, storagePath);
      setUploadProgress(65);

      const newLayout = await createProjectLayout({
        project_id: project.id,
        source_file_path: resolvedImageUrl || '',
        source_file_type: resolvedImageUrl ? 'image' : 'svg',
        layout_bounds: {
          minX: parsed.minX,
          minY: parsed.minY,
          maxX: Number((parsed.minX + parsed.width).toFixed(2)),
          maxY: Number((parsed.minY + parsed.height).toFixed(2)),
          width: parsed.width,
          height: parsed.height,
        },
      });

      // Automatically publish the layout so it displays on public site and editor immediately
      try {
        await publishProjectLayout(newLayout.id, project.id);
      } catch (pubErr) {
        console.warn('Auto-publish layout warning:', pubErr);
      }

      setUploadProgress(80);
      const parsedRatePerCent = parseFloat(uploadRatePerCent) || 75000;

      // Insert all parsed plots and their exact polygon coordinates into Supabase with automatic price calculation
      for (const p of parsed.plots) {
        const plotCents = p.areaCentsTable || 32.0;
        const autoPrice = p.priceInr || Math.round(plotCents * parsedRatePerCent);

        const plotRecord = await createOrUpdatePlot({
          project_id: project.id,
          plot_number: p.plotNumber,
          area_cents: plotCents,
          area_sqft: centsToSqft(plotCents),
          facing: (p.facing as any) || 'East',
          price_inr: autoPrice,
          status: p.status || 'available',
        });
        await savePlotGeometry(plotRecord.id, newLayout.id, p.points, 'local_cad');
      }

      setUploadProgress(100);
      setUploadState('done');
      setUploadNotice({
        type: 'success',
        text: `HTML blueprint imported & published! Successfully created ${parsed.plots.length} clickable plot shapes with automatic price calculation (Rate: ₹${parsedRatePerCent.toLocaleString('en-IN')}/cent).`,
      });

      await loadAll();
    } catch (err: any) {
      setUploadState('error');
      setUploadNotice({ type: 'error', text: err.message || 'Failed to upload blueprint' });
    }
  };

  // Import from pasted HTML string
  const handleImportHtmlString = async (htmlText: string) => {
    if (!htmlText.trim() || !project) return;
    setIsImportingHtml(true);
    setUploadNotice(null);

    try {
      const parsed = parseHtmlBlueprint(htmlText);
      if (!parsed.success || parsed.plots.length === 0) {
        throw new Error(parsed.errors.join(', ') || 'No plot polygons found in HTML code.');
      }

      // If existing layout exists, we will attach to it or create a new one
      let targetLayoutId = layout?.id;
      if (!layout) {
        let resolvedSourceUrl = parsed.imageUrl || '';
        if (resolvedSourceUrl && resolvedSourceUrl.startsWith('data:image/')) {
          try {
            const res = await fetch(resolvedSourceUrl);
            const blob = await res.blob();
            const imgPath = `layouts/${project.id}/${Date.now()}_extracted_plan.jpg`;
            const uploadedImg = await uploadWithProgress(blob, imgPath);
            resolvedSourceUrl = uploadedImg.publicUrl || uploadedImg.signedUrl || resolvedSourceUrl;
          } catch (e) {
            console.warn('Could not re-upload base64 image, keeping data URL', e);
          }
        }

        const newLayout = await createProjectLayout({
          project_id: project.id,
          source_file_path: resolvedSourceUrl || '',
          source_file_type: resolvedSourceUrl ? 'image' : 'svg',
          layout_bounds: {
            minX: parsed.minX,
            minY: parsed.minY,
            maxX: Number((parsed.minX + parsed.width).toFixed(2)),
            maxY: Number((parsed.minY + parsed.height).toFixed(2)),
            width: parsed.width,
            height: parsed.height,
          },
        });
        targetLayoutId = newLayout.id;

        // Auto-publish layout immediately so it's visible on public site
        try {
          await publishProjectLayout(newLayout.id, project.id);
        } catch (pubErr) {
          console.warn('Auto-publish layout warning:', pubErr);
        }
      }

      if (!targetLayoutId) throw new Error('Could not initialize layout for plots.');

      const parsedRatePerCent = parseFloat(uploadRatePerCent) || 75000;

      // Insert or update all plots and exact geometries into Supabase
      for (const p of parsed.plots) {
        const plotCents = p.areaCentsTable || 32.0;
        const autoPrice = p.priceInr || Math.round(plotCents * parsedRatePerCent);

        const plotRecord = await createOrUpdatePlot({
          project_id: project.id,
          plot_number: p.plotNumber,
          area_cents: plotCents,
          area_sqft: centsToSqft(plotCents),
          facing: (p.facing as any) || 'East',
          price_inr: autoPrice,
          status: p.status || 'available',
        });
        await savePlotGeometry(plotRecord.id, targetLayoutId, p.points, 'local_cad');
      }

      setShowHtmlPasteModal(false);
      setPastedHtml('');
      setUploadNotice({
        type: 'success',
        text: `HTML blueprint imported & published! Successfully loaded ${parsed.plots.length} clickable plot shapes with pricing auto-calculated (Rate: ₹${parsedRatePerCent.toLocaleString('en-IN')}/cent).`,
      });
      await loadAll();
    } catch (err: any) {
      setUploadNotice({ type: 'error', text: err.message || 'Failed to import HTML blueprint.' });
    } finally {
      setIsImportingHtml(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    // Reset input so same file can be re-selected after delete
    e.target.value = '';
  };

  // Drop zone
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // ──────────────────────────────────────────────────────────
  // Delete current layout (and all its plots/geometries)
  // ──────────────────────────────────────────────────────────
  const handleDeleteLayout = async () => {
    if (!layout || !projectId) return;
    setIsDeleting(true);
    try {
      // 1. Delete plot geometries for this layout
      await supabase.from('plot_geometries').delete().eq('layout_id', layout.id);

      // 2. Delete all plots for this project
      await supabase.from('plots').delete().eq('project_id', projectId);

      // 3. Delete the layout record
      await supabase.from('project_layouts').delete().eq('id', layout.id);

      // 4. Try to remove file from storage
      try {
        const marker = '/storage/v1/object/public/layout-source-files/';
        const signMarker = '/storage/v1/object/sign/layout-source-files/';
        let storagePath = layout.source_file_path;
        if (storagePath.includes(marker)) storagePath = decodeURIComponent(storagePath.split(marker)[1]?.split('?')[0] || storagePath);
        else if (storagePath.includes(signMarker)) storagePath = decodeURIComponent(storagePath.split(signMarker)[1]?.split('?')[0] || storagePath);
        await supabase.storage.from('layout-source-files').remove([storagePath]);
      } catch {}

      setLayout(null);
      setPlots([]);
      setUploadState('idle');
      setUploadProgress(0);
      setUploadNotice(null);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setUploadNotice({ type: 'error', text: `Failed to delete: ${err.message}` });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto" />
        <p>Loading Layout Workspace...</p>
      </div>
    );
  }

  if (!project) {
    return <div className="p-8 text-center text-xs text-slate-500">Project not found.</div>;
  }

  const isUploading = uploadState === 'uploading' || uploadState === 'processing';

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Projects
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Layout & Plot Editor: {project.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload clickable HTML blueprint plan. All 63 plot numbers and boundaries are pre-digitized and 100% clickable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {layout && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete & Re-upload
            </button>
          )}
        </div>
      </div>

      {/* HTML PASTE / IMPORT MODAL */}
      {showHtmlPasteModal && (
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
                  All 63 plot shapes and table areas will be imported instantly into Supabase.
                </p>
              </div>
              <button
                onClick={() => setShowHtmlPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick File Select */}
            <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-purple-900 block">Have a .html file on your computer?</span>
                <span className="text-[11px] text-purple-700">Select it directly to load all coordinates automatically.</span>
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
                      setPastedHtml(text);
                    }
                  }}
                />
              </label>
            </div>

            {/* HTML Code Textarea */}
            <div className="flex-1 min-h-[220px] flex flex-col">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Or Paste HTML Code Directly:
              </label>
              <textarea
                value={pastedHtml}
                onChange={(e) => setPastedHtml(e.target.value)}
                placeholder="Paste HTML here (containing <svg><image .../><g class=&quot;plot&quot; data-n=&quot;1&quot;><polygon points=&quot;...&quot;/></g>...)"
                className="flex-1 w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              {pastedHtml && (
                <div className="text-[11px] font-bold text-purple-700 mt-1">
                  Ready to parse ({pastedHtml.length.toLocaleString()} characters)
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowHtmlPasteModal(false);
                  setPastedHtml('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleImportHtmlString(pastedHtml)}
                disabled={!pastedHtml.trim() || isImportingHtml}
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

      {/* DELETE CONFIRM DIALOG */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">Delete Blueprint?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  This will permanently delete the uploaded blueprint, all plot shapes, and all plot data for this project. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLayout}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD NOTICE */}
      {uploadNotice && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-start gap-2 border ${
            uploadNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {uploadNotice.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{uploadNotice.text}</span>
          <button onClick={() => setUploadNotice(null)} className="shrink-0 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* UPLOAD AREA — only when no layout */}
      {!layout && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative bg-white rounded-3xl border-2 border-dashed transition-all cursor-pointer ${
            dragOver ? 'border-purple-500 bg-purple-50/50 scale-[1.005]' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/70'
          } ${isUploading ? 'pointer-events-none' : ''} p-10 text-center space-y-4 shadow-sm`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            onChange={handleInputChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-5">
              {/* Animated icon */}
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 absolute" />
                <div
                  className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin absolute"
                  style={{ animationDuration: '0.8s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-purple-600 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-extrabold text-slate-800">
                  {uploadState === 'uploading' ? 'Uploading HTML Blueprint...' : 'Loading 63 Digitalized Clickable Plots...'}
                </p>
                <p className="text-xs text-slate-500">Please wait, do not close this tab</p>
              </div>

              {/* Progress bar */}
              <div className="max-w-xs mx-auto space-y-1.5">
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>{uploadState === 'uploading' ? 'Uploading...' : 'Processing...'}</span>
                  <span className="text-purple-600">{uploadProgress}%</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                <FileCode className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {dragOver ? 'Drop your plot_viewer.html here!' : 'Upload Clickable HTML Blueprint (.html)'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload your <code className="font-bold text-purple-700 bg-purple-50 px-1 rounded">plot_viewer (1).html</code> file. All plot numbers and boundaries are pre-digitized and 100% clickable.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-[11px]">
                <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg font-bold">
                  Clickable HTML (.html / .htm)
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold">
                  All 63 Numbers Digitized &amp; Clickable
                </span>
              </div>

              {/* Automatic Amount Calculation Input */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="max-w-md mx-auto p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-1.5 cursor-default"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>Rate / Price per Cent (INR):</span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600">
                    ₹{parseInt(uploadRatePerCent || '0', 10).toLocaleString('en-IN')} / Cent
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-500 pl-1">₹</span>
                  <input
                    type="number"
                    value={uploadRatePerCent}
                    onChange={(e) => setUploadRatePerCent(e.target.value)}
                    placeholder="e.g. 75000"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Every plot's total price will calculate automatically based on its surveyed cents (e.g. 32 cents × ₹{parseInt(uploadRatePerCent || '0', 10).toLocaleString('en-IN')} = ₹{(32 * (parseInt(uploadRatePerCent || '0', 10) || 75000)).toLocaleString('en-IN')}).
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <FileCode className="w-4 h-4" />
                  Choose .html Blueprint File
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowHtmlPasteModal(true); }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  Paste HTML Code
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                JPG and PNG uploads are disabled. Only interactive HTML blueprints with clickable plots are supported.
              </p>
            </>
          )}
        </div>
      )}

      {/* EDITOR — shown after upload */}
      {layout && (
        <PlotBoundaryEditor layout={layout} plots={plots} onRefresh={refreshPlots} />
      )}
    </div>
  );
};
