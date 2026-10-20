# LandEstate | Real-Time Real Estate Plot Management & Booking Platform

A complete, production-ready, web-based real estate plot management and booking platform that transforms static CAD drawings, DTCP-approved layouts, LP-approved blueprints, and plot survey plans into a fully interactive digital map.

---

## 1. Architectural Highlights

- **Supabase as Source of Truth:** All project information, plot geometries, availability statuses, customer enquiries, and audit records reside in PostgreSQL.
- **Hybrid Rendering Architecture:**
  - Local engineering CAD vector canvas rendered in SVG for sub-millimeter precision, preserving layout proportions and relative measurements.
  - Interactive zoom, pan, hover inspection, and responsive touch gestures.
  - Geographic satellite map toggle for verified coordinates.
- **Live Supabase Realtime Synchronization:** When an administrator reserves, blocks, or registers a plot, all connected customer maps and administrator dashboards update immediately without full-page reloads.
- **Atomic Reservation Concurrency:** PostgreSQL row locking (`SELECT ... FOR UPDATE`) inside the stored procedure `submit_booking_enquiry()` prevents two buyers from placing conflicting reservations on the same plot.
- **Strict Row Level Security (RLS):** Anonymous visitors can only read published projects, published layouts, and public plot statuses. Customer contact data, mobile numbers, and audit trails remain restricted to authenticated staff.

---

## 2. Technology Stack

- **Frontend:** React 18, TypeScript (Strict), Vite, Tailwind CSS, Lucide React, React Router v6
- **Forms & Validation:** React Hook Form + Zod
- **Server Cache:** TanStack Query (@tanstack/react-query)
- **CAD & Vector Processing:** `dxf-parser`, custom SVG vector editor engine, line-intersection detector, ray-casting point-in-polygon math
- **Backend & Database:** Supabase (PostgreSQL, Auth, RLS, Realtime, Storage, RPC functions)
- **Testing:** Vitest

---

## 3. Directory Structure

```text
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── PlotBoundaryEditor.tsx    # CAD layout vector boundary editor
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx           # Protected admin wrapper with RBAC
│   │   │   ├── AdminSidebar.tsx          # Admin console navigation
│   │   │   ├── CustomerLayout.tsx        # Customer site wrapper
│   │   │   ├── Navbar.tsx                # Customer navigation & live badge
│   │   │   └── Footer.tsx                # Compliance & contact info
│   │   └── map/
│   │       ├── InteractivePlotMap.tsx    # SVG interactive layout map
│   │       ├── PlotFilterBar.tsx         # Inventory filter drawer
│   │       └── PlotSelectionCard.tsx     # Contextual floating plot details
│   ├── context/
│   │   └── AuthContext.tsx               # Supabase session & user profile RBAC
│   ├── lib/
│   │   ├── dxfParser.ts                  # DXF polyline & text extraction engine
│   │   ├── supabaseClient.ts             # Supabase client initialization
│   │   └── utils.ts                      # Area math, price format, polygon logic
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminAuditLogsPage.tsx
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── AdminLeadsPage.tsx
│   │   │   ├── AdminLoginPage.tsx
│   │   │   ├── AdminNewProjectPage.tsx
│   │   │   ├── AdminProjectBookingsPage.tsx
│   │   │   ├── AdminProjectDocumentsPage.tsx
│   │   │   ├── AdminProjectLayoutPage.tsx
│   │   │   └── AdminProjectPlotsPage.tsx
│   │   └── customer/
│   │       ├── BookingConfirmationPage.tsx
│   │       ├── BookingEnquiryPage.tsx
│   │       ├── HomePage.tsx
│   │       ├── InteractiveMapPage.tsx
│   │       ├── PlotDetailPage.tsx
│   │       ├── ProjectOverviewPage.tsx
│   │       ├── ProjectsPage.tsx
│   │       └── PublicDocumentsPage.tsx
│   ├── services/
│   │   └── api.ts                        # Real Supabase database queries & RPCs
│   ├── types/
│   │   └── database.ts                   # TypeScript schema interfaces
│   ├── App.tsx                           # Master router configuration
│   ├── index.css                         # Tailwind CSS base styles
│   └── main.tsx                          # React DOM entry point
├── supabase/
│   └── migrations/
│       └── 20260101000000_initial_schema.sql  # Full schema, RLS, functions & realtime
├── tests/
│   └── unit/
│       ├── dxfParser.test.ts
│       └── utils.test.ts
├── .env.example
└── vite.config.ts
```

---

## 4. Setup & Installation

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```env
VITE_SUPABASE_URL=https://gphhlkksrkzppxrihtnm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yh2rwDeBD53jA2eoPeKJLg_QFx3kjP_
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_yh2rwDeBD53jA2eoPeKJLg_QFx3kjP_
```

### Step 3: Run Database Migrations
Apply the migration file `supabase/migrations/20260101000000_initial_schema.sql` to your Supabase project:
- **Option A (Supabase Dashboard):** Open your Supabase Dashboard -> **SQL Editor** -> Create new query -> Paste the contents of `supabase/migrations/20260101000000_initial_schema.sql` -> Click **Run**.
- **Option B (Supabase CLI):**
  ```bash
  npx supabase db push
  ```

### Step 4: Provision the Initial Administrator
1. Navigate to **Authentication -> Users** in your Supabase project dashboard.
2. Click **Add User -> Create User**, entering the administrator's email and password.
3. The database trigger `on_auth_user_created` in the initial schema automatically detects the first registered user and grants the `super_admin` role in `public.profiles`.
4. Sign in at `http://localhost:5173/admin/login` using these credentials.

### Step 5: Start the Development Server
```bash
npm run dev
```

### Step 6: Run Automated Tests
```bash
npm run test
```

---

## 5. Administration Workflow

1. **Create Project:** Open `/admin/projects/new`, specify project name, location, and slug.
2. **Upload Master Layout:**
   - **DXF CAD:** Automatically extracts `LWPOLYLINE` and `POLYLINE` boundaries and associates `TEXT` plot numbers into PostgreSQL.
   - **SVG Blueprint:** Renders clean vectors and extracts viewBox dimensions.
   - **PNG / JPEG:** Serves as a crisp backdrop for manual tracing.
3. **Trace & Edit Boundaries:** Use the interactive Vector Editor (`/admin/projects/:id/layout`) to click vertices, create polygons, inspect self-intersections, and assign plot numbers, area (cents), facing, and pricing.
4. **Publish Layout:** Click "Publish Layout to Customers" to make vector boundaries viewable in the Customer Portal.
5. **Manage Inventory:** View `/admin/projects/:id/plots` to edit statuses, export inventory to CSV, or import bulk plot data.
6. **Process Bookings & Real-Time Sync:** When buyers submit enquiries, view `/admin/projects/:id/bookings` to confirm reservations or place holds. All connected customer browser maps reflect the status update in real time.

---

## 6. Production Security Checklist

- [x] Service role key is **never** committed or bundled into frontend code.
- [x] All Supabase database tables have **Row Level Security (RLS)** enabled.
- [x] Customer bookings use atomic stored procedure with row locking (`FOR UPDATE`) to prevent race conditions.
- [x] SVG uploads are sanitized to remove `<script>` tags and JavaScript event handlers (`onload`, `onclick`).
- [x] Realtime publication only exposes safe plot metadata to public channels; sensitive customer phone numbers and internal staff notes are restricted.
- [x] Input validation enforced on both client (Zod) and server (PostgreSQL constraints).
