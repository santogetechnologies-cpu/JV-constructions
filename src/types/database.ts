export type UserRole = 'super_admin' | 'project_admin' | 'sales_staff' | 'read_only';
export type ProjectStatus = 'draft' | 'published' | 'archived';
export type PlotStatus = 'available' | 'booked' | 'on_hold' | 'sold' | 'blocked';
export type PlotFacing = 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West' | 'Other';
export type BookingStatus = 'new_enquiry' | 'contacted' | 'visit_scheduled' | 'booking_pending' | 'on_hold' | 'confirmed' | 'cancelled' | 'sold';
export type DocumentCategory = 'dtcp_approval' | 'lp_approval' | 'layout_plan' | 'survey_plan' | 'brochure' | 'other';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinate_reference: string;
  status: ProjectStatus;
  cover_image_path: string | null;
  contact_information: {
    phone?: string;
    email?: string;
    sales_office?: string;
    map_link?: string;
  };
  booking_policy: {
    allow_enquiries: boolean;
    hold_duration_hours: number;
    require_approval: boolean;
    approval_type?: string;
    map_link?: string;
  };
  approval_type?: string;
  map_link?: string;
  total_land_area: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  totalPlots: number;
  availablePlots: number;
  soldPlots: number;
  bookedPlots: number;
  onHoldPlots: number;
  blockedPlots: number;
  startingPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  totalValuation: number;
  minAreaCents: number | null;
  maxAreaCents: number | null;
  minAreaSqft: number | null;
  maxAreaSqft: number | null;
  avgRatePerCent: number | null;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
  plots: Plot[];
}

export function getProjectApprovalType(project?: Partial<Project> | null): string {
  if (!project) return 'Plotted Layout';
  return (
    project.booking_policy?.approval_type ||
    (project as any).approval_type ||
    'Plotted Layout'
  );
}

/** Customer-facing label: never exposes DTCP wording. */
export function getPublicApprovalLabel(project?: Partial<Project> | null): string {
  const t = getProjectApprovalType(project);
  return /dtcp|\blp\b/i.test(t) ? 'Plotted Layout' : t;
}

export function getProjectMapLink(project?: Partial<Project> | null): string {
  if (!project) return '';
  return (
    (project as any).map_link ||
    project.contact_information?.map_link ||
    project.booking_policy?.map_link ||
    (project.latitude && project.longitude
      ? `https://www.google.com/maps?q=${project.latitude},${project.longitude}`
      : '')
  );
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface LayoutBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface ProjectLayout {
  id: string;
  project_id: string;
  version: number;
  source_file_path: string;
  source_file_type: 'svg' | 'dxf' | 'pdf' | 'image';
  processing_status: 'pending' | 'processing' | 'processed' | 'failed';
  coordinate_reference: string;
  layout_bounds: LayoutBounds;
  is_published: boolean;
  uploaded_by: string | null;
  created_at: string;
  published_at: string | null;
}

export interface Plot {
  id: string;
  project_id: string;
  phase_id: string | null;
  plot_number: string;
  area_cents: number;
  area_sqft: number;
  facing: PlotFacing;
  price_inr: number | null;
  status: PlotStatus;
  description: string | null;
  internal_notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  geometry?: PlotGeometry | null;
  phase?: ProjectPhase | null;
}

export interface PlotGeometry {
  id: string;
  plot_id: string;
  layout_id: string;
  geometry_type: 'polygon' | 'multipolygon';
  coordinates: [number, number][]; // 2D points [[x, y], ...]
  coordinate_space: 'local_cad' | 'geo_epsg4326';
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  project_id: string;
  plot_id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  location: string | null;
  preferred_contact_method: 'phone' | 'email' | 'whatsapp';
  message: string | null;
  consent_to_contact: boolean;
  status: BookingStatus;
  assigned_to: string | null;
  hold_expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  plot?: Plot;
  project?: Project;
}

export interface BookingEvent {
  id: string;
  booking_id: string;
  event_type: string;
  previous_status: string | null;
  new_status: string;
  notes: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  title: string;
  category: DocumentCategory;
  description: string | null;
  approval_number: string | null;
  issue_date: string | null;
  storage_path: string;
  mime_type: string;
  file_size: number;
  is_public: boolean;
  is_published: boolean;
  version: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  project_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  location: string | null;
  preferred_plot_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  notes: string | null;
  assigned_to: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  project_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  previous_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  // Join field
  actor?: UserProfile | null;
}

export interface DashboardMetrics {
  totalProjects: number;
  publishedProjects: number;
  totalPlots: number;
  availablePlots: number;
  bookedPlots: number;
  onHoldPlots: number;
  soldPlots: number;
  blockedPlots: number;
  newEnquiries: number;
  pendingBookings: number;
}
