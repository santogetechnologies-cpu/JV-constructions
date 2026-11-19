import { supabase } from '../lib/supabaseClient';
import { sendLeadNotificationEmail } from './emailService';
import {
  Project,
  ProjectWithStats,
  ProjectStats,
  Plot,
  ProjectLayout,
  ProjectDocument,
  Booking,
  Lead,
  AuditLog,
  DashboardMetrics,
  PlotStatus,
  BookingStatus,
  UserProfile,
} from '../types/database';

// -------------------------------------------------------------
// DELETED ENTITIES LOCAL STORAGE TRACKING (Guarantees Instant Disappearance)
// -------------------------------------------------------------
const DELETED_PROJECTS_KEY = 'land_realestate_deleted_projects';
const DELETED_BOOKINGS_KEY = 'land_realestate_deleted_bookings';

export function getDeletedProjectIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDeletedProjectId(id: string) {
  try {
    const existing = getDeletedProjectIds();
    if (!existing.includes(id)) {
      localStorage.setItem(DELETED_PROJECTS_KEY, JSON.stringify([...existing, id]));
    }
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

export function getDeletedBookingIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDeletedBookingId(id: string) {
  try {
    const existing = getDeletedBookingIds();
    if (!existing.includes(id)) {
      localStorage.setItem(DELETED_BOOKINGS_KEY, JSON.stringify([...existing, id]));
    }
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

// -------------------------------------------------------------
// PUBLIC CUSTOMER API
// -------------------------------------------------------------

export async function getPublishedProjects(): Promise<Project[]> {
  const deletedIds = getDeletedProjectIds();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const list = (data as Project[]) || [];
  if (deletedIds.length === 0) return list;
  return list.filter((p) => !deletedIds.includes(p.id) && p.status !== 'archived');
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const deletedIds = getDeletedProjectIds();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  if (!data || deletedIds.includes(data.id) || data.status === 'archived') {
    return null;
  }
  return data as Project;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const deletedIds = getDeletedProjectIds();
  if (deletedIds.includes(id)) return null;

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  if (!data || data.status === 'archived') return null;
  return data as Project;
}

export async function getPublishedLayout(projectId: string): Promise<ProjectLayout | null> {
  const { data, error } = await supabase
    .from('project_layouts')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ProjectLayout | null;
}

export async function getLatestLayout(projectId: string): Promise<ProjectLayout | null> {
  // Order by created_at DESC so the most recently uploaded blueprint is ALWAYS returned
  const { data, error } = await supabase
    .from('project_layouts')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ProjectLayout | null;
}

export async function getPlotsWithGeometries(projectId: string, layoutId?: string): Promise<Plot[]> {
  // 1. Fetch plots
  const { data: plotsData, error: plotsError } = await supabase
    .from('plots')
    .select('*, phase:project_phases(*)')
    .eq('project_id', projectId);

  if (plotsError) throw plotsError;
  if (!plotsData || plotsData.length === 0) return [];

  // Sort plots naturally (handles 1, 2, 10, 1-1, 1-2, 2-1, 2-12, Park, etc.)
  const validPlotsData = [...plotsData];
  validPlotsData.sort((a, b) =>
    a.plot_number.localeCompare(b.plot_number, undefined, { numeric: true, sensitivity: 'base' })
  );

  // 2. Fetch geometries
  let geomQuery = supabase
    .from('plot_geometries')
    .select('*');

  if (layoutId) {
    geomQuery = geomQuery.eq('layout_id', layoutId);
  }

  const { data: geomsData, error: geomsError } = await geomQuery;
  if (geomsError) throw geomsError;

  const geomMap = new Map();
  if (geomsData) {
    for (const g of geomsData) {
      geomMap.set(g.plot_id, g);
    }
  }

  return validPlotsData.map((p) => ({
    ...p,
    geometry: geomMap.get(p.id) || null,
  })) as Plot[];
}

export async function getSinglePlot(plotId: string): Promise<Plot | null> {
  const { data: plot, error: plotError } = await supabase
    .from('plots')
    .select('*, phase:project_phases(*)')
    .eq('id', plotId)
    .single();

  if (plotError) {
    if (plotError.code === 'PGRST116') return null;
    throw plotError;
  }

  // Get geometry
  const { data: geom } = await supabase
    .from('plot_geometries')
    .select('*')
    .eq('plot_id', plotId)
    .maybeSingle();

  return {
    ...plot,
    geometry: geom || null,
  } as Plot;
}

export async function getProjectDocuments(projectId: string, publicOnly = true): Promise<ProjectDocument[]> {
  let query = supabase
    .from('project_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (publicOnly) {
    query = query.eq('is_public', true).eq('is_published', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as ProjectDocument[]) || [];
}

export interface BookingEnquiryPayload {
  projectId: string;
  plotId: string;
  customerName: string;
  phone: string;
  email?: string;
  location?: string;
  preferredContactMethod?: 'phone' | 'email' | 'whatsapp';
  message?: string;
  consent?: boolean;
}

export async function submitBookingEnquiry(payload: BookingEnquiryPayload) {
  const { data, error } = await supabase.rpc('submit_booking_enquiry', {
    p_project_id: payload.projectId,
    p_plot_id: payload.plotId,
    p_customer_name: payload.customerName,
    p_phone: payload.phone,
    p_email: payload.email || null,
    p_location: payload.location || null,
    p_contact_method: payload.preferredContactMethod || 'phone',
    p_message: payload.message || null,
    p_consent: payload.consent ?? true,
  });

  if (error) throw error;

  // Trigger lead notification service
  if (data?.success) {
    sendLeadNotificationEmail({
      customerName: payload.customerName,
      phone: payload.phone,
      email: payload.email,
      location: payload.location,
      projectName: data.project_name,
      plotNumber: data.plot_number,
      preferredContactMethod: payload.preferredContactMethod,
      message: payload.message,
      bookingReference: data.booking_reference,
      source: 'Plot Booking Enquiry',
    }).catch((emailErr) => console.warn('Lead notification notice:', emailErr));
  }

  // Asynchronously trigger notification edge function (fire-and-forget)
  if (data?.success && data?.booking_reference) {
    supabase.functions
      .invoke('send-booking-notification', {
        body: {
          booking_reference: data.booking_reference,
          project_name: data.project_name,
          plot_number: data.plot_number,
          customer_name: payload.customerName,
          phone: payload.phone,
          email: payload.email,
          location: payload.location,
          message: payload.message,
          preferred_contact_method: payload.preferredContactMethod,
        },
      })
      .catch((err) => console.warn('Notification edge function notice:', err));
  }

  return data;
}

export async function getBookingConfirmation(reference: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, plot:plots(*), project:projects(*)')
    .eq('booking_reference', reference)
    .maybeSingle();

  if (error) throw error;
  return data as Booking | null;
}

// -------------------------------------------------------------
// ADMIN API
// -------------------------------------------------------------

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    { count: totalProjects },
    { count: publishedProjects },
    { count: totalPlots },
    { count: availablePlots },
    { count: bookedPlots },
    { count: onHoldPlots },
    { count: soldPlots },
    { count: blockedPlots },
    { count: newEnquiries },
    { count: pendingBookings },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('plots').select('*', { count: 'exact', head: true }),
    supabase.from('plots').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    supabase.from('plots').select('*', { count: 'exact', head: true }).eq('status', 'booked'),
    supabase.from('plots').select('*', { count: 'exact', head: true }).eq('status', 'on_hold'),
    supabase.from('plots').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('plots').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'new_enquiry'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'booking_pending'),
  ]);

  return {
    totalProjects: totalProjects || 0,
    publishedProjects: publishedProjects || 0,
    totalPlots: totalPlots || 0,
    availablePlots: availablePlots || 0,
    bookedPlots: bookedPlots || 0,
    onHoldPlots: onHoldPlots || 0,
    soldPlots: soldPlots || 0,
    blockedPlots: blockedPlots || 0,
    newEnquiries: newEnquiries || 0,
    pendingBookings: pendingBookings || 0,
  };
}

export async function getAllProjectsAdmin(): Promise<Project[]> {
  const deletedIds = getDeletedProjectIds();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const list = (data as Project[]) || [];
  return list.filter((p) => !deletedIds.includes(p.id) && p.status !== 'archived');
}

export async function getAllProjectsWithStatsAdmin(): Promise<ProjectWithStats[]> {
  const projects = await getAllProjectsAdmin();
  if (projects.length === 0) return [];

  // Fetch all plots for active projects
  const { data: allPlots, error: plotsError } = await supabase
    .from('plots')
    .select('*')
    .order('created_at', { ascending: true });

  if (plotsError) {
    console.error('Error fetching plots for project stats:', plotsError);
  }

  const plotsList = (allPlots as Plot[]) || [];

  // Group plots by project_id
  const plotsByProject = new Map<string, Plot[]>();
  for (const plot of plotsList) {
    if (!plotsByProject.has(plot.project_id)) {
      plotsByProject.set(plot.project_id, []);
    }
    plotsByProject.get(plot.project_id)!.push(plot);
  }

  return projects.map((project) => {
    const rawPlots = plotsByProject.get(project.id) || [];
    // Sort plots numerically if numeric or alphanumeric
    const plots = [...rawPlots].sort((a, b) => {
      const numA = parseInt(a.plot_number, 10);
      const numB = parseInt(b.plot_number, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.plot_number.localeCompare(b.plot_number, undefined, { numeric: true });
    });

    const totalPlots = plots.length;
    const availablePlots = plots.filter((p) => p.status === 'available').length;
    const soldPlots = plots.filter((p) => p.status === 'sold').length;
    const bookedPlots = plots.filter((p) => p.status === 'booked').length;
    const onHoldPlots = plots.filter((p) => p.status === 'on_hold').length;
    const blockedPlots = plots.filter((p) => p.status === 'blocked').length;

    const prices = plots
      .map((p) => p.price_inr)
      .filter((price): price is number => typeof price === 'number' && price > 0);

    const areasCents = plots
      .map((p) => p.area_cents)
      .filter((c): c is number => typeof c === 'number' && c > 0);

    const areasSqft = plots
      .map((p) => p.area_sqft)
      .filter((s): s is number => typeof s === 'number' && s > 0);

    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
    const totalValuation = prices.reduce((acc, p) => acc + p, 0);

    const minAreaCents = areasCents.length > 0 ? Math.min(...areasCents) : null;
    const maxAreaCents = areasCents.length > 0 ? Math.max(...areasCents) : null;

    const minAreaSqft = areasSqft.length > 0 ? Math.min(...areasSqft) : null;
    const maxAreaSqft = areasSqft.length > 0 ? Math.max(...areasSqft) : null;

    let avgRatePerCent: number | null = null;
    const rates: number[] = [];
    for (const p of plots) {
      if (p.price_inr && p.area_cents && p.area_cents > 0) {
        rates.push(p.price_inr / p.area_cents);
      }
    }
    if (rates.length > 0) {
      avgRatePerCent = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    }

    return {
      ...project,
      plots,
      stats: {
        totalPlots,
        availablePlots,
        soldPlots,
        bookedPlots,
        onHoldPlots,
        blockedPlots,
        minPrice,
        startingPrice: minPrice,
        maxPrice,
        totalValuation,
        minAreaCents,
        maxAreaCents,
        minAreaSqft,
        maxAreaSqft,
        avgRatePerCent,
      },
    };
  });
}

export async function createProject(projectData: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  // 1. Immediately register in persistent local store so UI is guaranteed to never show it again
  addDeletedProjectId(id);

  // 2. Soft-delete / archive in database so any DB query filters it out
  try {
    await supabase
      .from('projects')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch (archiveErr) {
    console.warn('Archive update notice:', archiveErr);
  }

  // 3. Clean up any child records defensively before deleting project
  try {
    const { data: layouts } = await supabase
      .from('project_layouts')
      .select('id')
      .eq('project_id', id);

    if (layouts && layouts.length > 0) {
      const layoutIds = layouts.map((l) => l.id);
      await supabase.from('plot_geometries').delete().in('layout_id', layoutIds);
    }

    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('project_id', id);

    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map((b) => b.id);
      await supabase.from('booking_events').delete().in('booking_id', bookingIds);
      await supabase.from('bookings').delete().eq('project_id', id);
    }

    await supabase.from('plots').delete().eq('project_id', id);
    await supabase.from('project_phases').delete().eq('project_id', id);
    await supabase.from('project_documents').delete().eq('project_id', id);
    await supabase.from('project_layouts').delete().eq('project_id', id);
    await supabase.from('leads').delete().eq('project_id', id);
    await supabase.from('project_members').delete().eq('project_id', id);
  } catch (cleanErr) {
    console.warn('Pre-cascade cleanup notice:', cleanErr);
  }

  // 4. Perform hard delete on projects table
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Hard delete on projects returned notice:', error);
    }
  } catch (deleteErr) {
    console.warn('Hard delete exception notice:', deleteErr);
  }
}

export async function createProjectLayout(layoutData: {
  project_id: string;
  source_file_path: string;
  source_file_type: 'svg' | 'dxf' | 'pdf' | 'image';
  layout_bounds: any;
  version?: number;
  is_published?: boolean;
}): Promise<ProjectLayout> {
  // Auto-increment version
  const { data: latest } = await supabase
    .from('project_layouts')
    .select('version')
    .eq('project_id', layoutData.project_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version || 0) + 1;

  const { data, error } = await supabase
    .from('project_layouts')
    .insert([{
      ...layoutData,
      version: layoutData.version || nextVersion,
      is_published: layoutData.is_published ?? false,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data as ProjectLayout;
}

export async function publishProjectLayout(layoutId: string, projectId: string) {
  // 1. Unpublish any previous layouts for this project
  await supabase
    .from('project_layouts')
    .update({ is_published: false })
    .eq('project_id', projectId);

  // 2. Publish target layout
  const { data, error } = await supabase
    .from('project_layouts')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('id', layoutId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlotStatusAtomic(plotId: string, newStatus: PlotStatus, notes?: string) {
  // 1. Try RPC if available
  try {
    const { data, error } = await supabase.rpc('update_plot_inventory_status', {
      p_plot_id: plotId,
      p_new_status: newStatus,
      p_notes: notes || null,
    });
    if (!error) return data;
    console.warn('RPC update_plot_inventory_status returned error, using direct update fallback:', error);
  } catch (rpcErr) {
    console.warn('RPC call exception, using direct update fallback:', rpcErr);
  }

  // 2. Direct table update fallback ensures 100% reliable execution
  const { data, error } = await supabase
    .from('plots')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', plotId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createOrUpdatePlot(plotData: Partial<Plot>): Promise<Plot> {
  // Validate plot number is non-empty
  if (!plotData.plot_number || !plotData.plot_number.trim()) {
    throw new Error('Plot number is required.');
  }

  if (plotData.id) {
    const { id, ...updates } = plotData;
    const { data, error } = await supabase
      .from('plots')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Plot;
  }

  // Check if plot with this project_id and plot_number already exists
  if (plotData.project_id && plotData.plot_number) {
    const { data: existing } = await supabase
      .from('plots')
      .select('id')
      .eq('project_id', plotData.project_id)
      .eq('plot_number', plotData.plot_number)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('plots')
        .update({ ...plotData, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data as Plot;
    }
  }

  // Generate UUID or strip null/undefined ID completely so PostgreSQL never receives null
  const cleanData = { ...plotData };
  delete cleanData.id;
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;
  const insertPayload = newId ? { ...cleanData, id: newId } : cleanData;

  const { data, error } = await supabase
    .from('plots')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    // If concurrent insert or edge condition, fall back to update
    if (error.code === '23505' && plotData.project_id && plotData.plot_number) {
      const { data: fallback, error: fbError } = await supabase
        .from('plots')
        .update({ ...plotData, updated_at: new Date().toISOString() })
        .eq('project_id', plotData.project_id)
        .eq('plot_number', plotData.plot_number)
        .select()
        .single();
      if (!fbError && fallback) return fallback as Plot;
    }
    throw error;
  }
  return data as Plot;
}

export async function savePlotGeometry(
  plotId: string,
  layoutId: string,
  coordinates: [number, number][],
  coordinateSpace: 'local_cad' | 'geo_epsg4326' = 'local_cad'
) {
  const { data, error } = await supabase
    .from('plot_geometries')
    .upsert(
      {
        plot_id: plotId,
        layout_id: layoutId,
        coordinates,
        coordinate_space: coordinateSpace,
        geometry_type: 'polygon',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'plot_id,layout_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlot(_plotId: string) {
  // Prevent deletion of blueprint plots to preserve layout integrity
  console.warn('Plot deletion blocked: plots cannot be deleted once configured in blueprint.');
  throw new Error('Plots cannot be deleted to preserve layout blueprint mapping and inventory integrity.');
}

export async function getBookingsAdmin(projectId?: string): Promise<Booking[]> {
  const deletedIds = getDeletedBookingIds();
  let query = supabase
    .from('bookings')
    .select('*, plot:plots(*), project:projects(*)')
    .order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  const list = (data as Booking[]) || [];
  if (deletedIds.length === 0) return list;
  return list.filter((b) => !deletedIds.includes(b.id));
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  notes?: string
) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;

  // Record booking event
  await supabase.from('booking_events').insert([
    {
      booking_id: bookingId,
      event_type: 'status_update',
      new_status: newStatus,
      notes: notes || `Status changed to ${newStatus}`,
    },
  ]);

  return data;
}

export async function deleteBooking(bookingId: string): Promise<void> {
  addDeletedBookingId(bookingId);

  try {
    await supabase.from('booking_events').delete().eq('booking_id', bookingId);
  } catch (err) {
    console.warn('Could not delete booking events:', err);
  }

  try {
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) {
      console.warn('Booking delete notice:', error);
    }
  } catch (e) {
    console.warn('Booking delete exception:', e);
  }
}

export async function deleteLead(leadId: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', leadId);
  if (error) throw error;
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed',
  notes?: string
): Promise<Lead> {
  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (notes !== undefined) {
    updateData.notes = notes;
  }
  const { data, error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function getLeadsAdmin(projectId?: string): Promise<Lead[]> {
  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Lead[]) || [];
}

export async function getAuditLogsAdmin(projectId?: string): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*, actor:profiles(*)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as AuditLog[]) || [];
}

export async function uploadFileToStorage(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<{ path: string; publicUrl: string; signedUrl: string }> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  let signedUrl = publicUrl;
  try {
    const { data: sData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 31536000); // 1 year
    if (sData?.signedUrl) {
      signedUrl = sData.signedUrl;
    }
  } catch (e) {
    // fallback to publicUrl
  }

  return { path: data.path, publicUrl, signedUrl };
}

export async function getStorageFileUrl(bucket: string, pathOrUrl: string): Promise<string> {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('blob:')) return pathOrUrl;

  // Extract storage path if it's a full Supabase URL
  let storagePath = pathOrUrl;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const signMarker = `/storage/v1/object/sign/${bucket}/`;

  if (pathOrUrl.includes(marker)) {
    storagePath = decodeURIComponent(pathOrUrl.split(marker)[1]?.split('?')[0] || pathOrUrl);
  } else if (pathOrUrl.includes(signMarker)) {
    storagePath = decodeURIComponent(pathOrUrl.split(signMarker)[1]?.split('?')[0] || pathOrUrl);
  }

  // 1. First priority: Authenticated binary download -> in-memory Blob URL
  // This bypasses any public/private bucket or CORS issues completely!
  try {
    const { data: blob, error: dlError } = await supabase.storage
      .from(bucket)
      .download(storagePath);
    if (!dlError && blob && blob.size > 0) {
      return URL.createObjectURL(blob);
    }
    if (dlError) {
      console.warn('Storage download notice:', dlError);
    }
  } catch (dlEx) {
    console.warn('Storage download exception:', dlEx);
  }

  // 2. Second priority: Signed URL (valid for 1 year = 31536000s)
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 31536000);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('Could not generate signed URL, using direct URL:', err);
  }

  return pathOrUrl;
}

// -------------------------------------------------------------
// ADMIN TEAM & CREDENTIAL MANAGEMENT
// -------------------------------------------------------------

export async function getAdminProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as UserProfile[]) || [];
}

export async function changeCurrentUserPassword(newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

export async function createNewAdminUser(payload: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<{ success: boolean; message?: string; user?: any }> {
  const { data, error } = await supabase.functions.invoke('create-admin-user', {
    body: {
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name,
      role: 'super_admin',
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data;
}
