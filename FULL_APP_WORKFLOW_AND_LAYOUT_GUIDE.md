# Yazh Land Promoters — Complete Application Workflow, Layout & UI Blueprint Guide

> **Document Version:** 2.0 (Master Production Specification)  
> **Target Audience:** Developers, Administrators, Business Stakeholders & End Users  
> **Scope:** Full-stack walkthrough of every single screen, layout, button, modal, drawer, input form, CAD blueprint tool, and workflow across the entire web application.

---

## Table of Contents
1. [System Architecture & Routing Matrix](#1-system-architecture--routing-matrix)
2. [Global Layouts & Shared UI Infrastructure](#2-global-layouts--shared-ui-infrastructure)
   - [Public Customer Layout & Navbar](#21-public-customer-layout--navbar)
   - [Global Footer](#22-global-footer)
   - [Admin Shell & Sidebar Navigation](#23-admin-shell--sidebar-navigation)
   - [Admin Mobile Top Bar](#24-admin-mobile-top-bar)
3. [Public Customer Portal: Screens, Components & Buttons](#3-public-customer-portal-screens-components--buttons)
   - [3.1 Home Page (`/`)](#31-home-page-)
   - [3.2 All Projects Page (`/projects`)](#32-all-projects-page-projects)
   - [3.3 Project Overview Page (`/projects/:projectSlug`)](#33-project-overview-page-projectsprojectslug)
   - [3.4 Interactive CAD Blueprint Map Page (`/projects/:projectSlug/map`)](#34-interactive-cad-blueprint-map-page-projectsprojectslugmap)
   - [3.5 Floating Map Speed-Dial & Interactive Drawers](#35-floating-map-speed-dial--interactive-drawers)
     - [3.5.1 Filter Drawer (`NammaPlotFilterDrawer`)](#351-filter-drawer-nammaplotfilterdrawer)
     - [3.5.2 Selected Plot Card Drawer (`PlotSelectionCard`)](#352-selected-plot-card-drawer-plotselectioncard)
     - [3.5.3 Project Location & Live GPS Modal (`ProjectLocationModal`)](#353-project-location--live-gps-modal-projectlocationmodal)
     - [3.5.4 Exclusive Plot Offer Modal (`ExclusiveOfferModal`)](#354-exclusive-plot-offer-modal-exclusiveoffermodal)
   - [3.6 Individual Plot Detail Page (`/plots/:plotId`)](#36-individual-plot-detail-page-plotsplotid)
   - [3.7 Plot Booking & Reservation Enquiry Page (`/booking/:plotId`)](#37-plot-booking--reservation-enquiry-page-bookingplotid)
   - [3.8 Booking Confirmation & Receipt Page (`/booking-confirmation/:reference`)](#38-booking-confirmation--receipt-page-booking-confirmationreference)
   - [3.9 Public Legal & Approval Documents Page (`/documents/:projectSlug`)](#39-public-legal--approval-documents-page-documentsprojectslug)
4. [Admin Management Console: Screens, Layouts & Workflows](#4-admin-management-console-screens-layouts--workflows)
   - [4.1 Admin Authentication & Login Page (`/admin/login`)](#41-admin-authentication--login-page-adminlogin)
   - [4.2 Admin Dashboard (`/admin`)](#42-admin-dashboard-admin)
   - [4.3 All Projects Management (`/admin/projects`)](#43-all-projects-management-adminprojects)
     - [4.3.1 Project Big Card & Accordion Sections](#431-project-big-card--accordion-sections)
     - [4.3.2 Edit Project Details Modal](#432-edit-project-details-modal)
     - [4.3.3 Delete Project Safeguard Modal](#433-delete-project-safeguard-modal)
     - [4.3.4 Slide-Over All Projects Sidebar (`AdminAllProjectsSidebar`)](#434-slide-over-all-projects-sidebar-adminallprojectssidebar)
   - [4.4 Create New Project Page (`/admin/projects/new`)](#44-create-new-project-page-adminprojectsnew)
   - [4.5 Project Settings / Metadata Configuration (`/admin/projects/:projectId/edit`)](#45-project-settings--metadata-configuration-adminprojectsprojectidedit)
   - [4.6 Interactive CAD Layout & Plot Boundary Editor (`/admin/projects/:projectId/layout`)](#46-interactive-cad-layout--plot-boundary-editor-adminprojectsprojectidlayout)
     - [4.6.1 SVG Canvas & Blueprint Navigation Controls](#461-svg-canvas--blueprint-navigation-controls)
     - [4.6.2 Editor Toolbar & Tool Modes](#462-editor-toolbar--tool-modes)
     - [4.6.3 Tab 1: Individual Plot Configuration](#463-tab-1-individual-plot-configuration)
     - [4.6.4 Tab 2: Bulk Plot Configuration ("Configure All")](#464-tab-2-bulk-plot-configuration-configure-all)
     - [4.6.5 HTML / CAD Blueprint Import Modal](#465-html--cad-blueprint-import-modal)
     - [4.6.6 Blueprint Export Actions (DXF, SVG, GeoJSON)](#466-blueprint-export-actions-dxf-svg-geojson)
   - [4.7 Project Plot Inventory Table (`/admin/projects/:projectId/plots`)](#47-project-plot-inventory-table-adminprojectsprojectidplots)
     - [4.7.1 Add Single Plot Modal](#471-add-single-plot-modal)
     - [4.7.2 Edit Plot Modal](#472-edit-plot-modal)
     - [4.7.3 CSV Import & Export](#473-csv-import--export)
   - [4.8 Project Bookings & Reservation Manager (`/admin/projects/:projectId/bookings`)](#48-project-bookings--reservation-manager-adminprojectsprojectidbookings)
   - [4.9 Project Legal Documents Manager (`/admin/projects/:projectId/documents`)](#49-project-legal-documents-manager-adminprojectsprojectiddocuments)
   - [4.10 Unified Buyer Leads & Inquiries Manager (`/admin/leads`)](#410-unified-buyer-leads--inquiries-manager-adminleads)
   - [4.11 Team, Profile & Security Settings (`/admin/team`)](#411-team-profile--security-settings-adminteam)
   - [4.12 Audit Trail & Compliance Ledger (`/admin/audit-logs`)](#412-audit-trail--compliance-ledger-adminaudit-logs)
5. [Database Schema, State Management & Real-Time Sync](#5-database-schema-state-management--real-time-sync)
6. [Complete End-to-End User Journeys](#6-complete-end-to-end-user-journeys)

---

## 1. System Architecture & Routing Matrix

The application is structured into two main portals:
1. **Public Customer Portal**: Built for buyers, investors, and prospective farmland owners to browse approved projects, inspect layouts via an interactive CAD map canvas, filter inventory in real-time, view official legal approvals, and submit reservation inquiries.
2. **Admin Management Console**: Built for land promoters and sales teams to manage project metadata, upload/trace digitized blueprints, update plot prices/status, review leads, handle reservations, upload documents, and track audit logs.

### Application Routing Table

| Route Path | Access Level | Layout Wrapper | Page Component | Key Purpose |
|---|---|---|---|---|
| `/` | Public | `CustomerLayout` | `HomePage` | Landing page, brand intro, featured projects, inquiry form |
| `/projects` | Public | `CustomerLayout` | `ProjectsPage` | Searchable directory of all published layouts |
| `/projects/:projectSlug` | Public | `CustomerLayout` | `ProjectOverviewPage` | Detailed project presentation, amenities, specs, GPS |
| `/projects/:projectSlug/map` | Public | Standalone Canvas | `InteractiveMapPage` | Full-screen vector CAD blueprint, plot selection & filters |
| `/plots/:plotId` | Public | `CustomerLayout` | `PlotDetailPage` | Dedicated single plot specifications, dimensions, CTA |
| `/booking/:plotId` | Public | `CustomerLayout` | `BookingEnquiryPage` | Customer reservation form with contact preferences |
| `/booking-confirmation/:reference` | Public | `CustomerLayout` | `BookingConfirmationPage` | Success acknowledgement, reference ID, download receipt |
| `/documents/:projectSlug` | Public | `CustomerLayout` | `PublicDocumentsPage` | Publicly verifiable DTCP approvals, patta, legal certificates |
| `/admin/login` | Public / Guest | Standalone | `AdminLoginPage` | Secure admin credentials authentication |
| `/admin` | Protected (Staff) | `AdminLayout` | `AdminDashboardPage` | Real-time metrics, inventory counters, recent activity |
| `/admin/projects` | Protected (Staff) | `AdminLayout` | `AdminProjectsPage` | Full projects manager, accordion cards, quick edits |
| `/admin/all-projects` | Protected (Staff) | Redirect | Redirect to `/admin/projects` | Alias route |
| `/admin/projects/new` | Protected (Staff) | `AdminLayout` | `AdminNewProjectPage` | New layout/project registration form |
| `/admin/projects/:projectId` | Protected (Staff) | Redirect | Redirect to `:projectId/layout` | Default project view |
| `/admin/projects/:projectId/layout` | Protected (Staff) | `AdminLayout` | `AdminProjectLayoutPage` | Digitized CAD blueprint editor & bulk plot configurator |
| `/admin/projects/:projectId/plots` | Protected (Staff) | `AdminLayout` | `AdminProjectPlotsPage` | Tabular inventory list, inline status toggles, CSV I/O |
| `/admin/projects/:projectId/bookings`| Protected (Staff)| `AdminLayout` | `AdminProjectBookingsPage` | Enquiry approval, hold management, booking lifecycle |
| `/admin/projects/:projectId/documents`| Protected (Staff)| `AdminLayout`| `AdminProjectDocumentsPage`| PDF approvals upload, category tagging, public toggles |
| `/admin/projects/:projectId/edit` | Protected (Staff) | `AdminLayout` | `AdminEditProjectPage` | Project identity, coordinates, slug, publication toggle |
| `/admin/projects/:projectId/settings`| Protected (Staff)| `AdminLayout`| `AdminEditProjectPage` | Alias to edit project settings |
| `/admin/leads` | Protected (Staff) | `AdminLayout` | `AdminLeadsPage` | Unified customer CRM, click-to-call, lead deletion |
| `/admin/team` | Protected (Staff) | `AdminLayout` | `AdminTeamPage` | Password updates, team profiles, invite admin modal |
| `/admin/audit-logs` | Protected (Staff) | `AdminLayout` | `AdminAuditLogsPage` | Ledger of status changes, price updates, user actions |

---

## 2. Global Layouts & Shared UI Infrastructure

### 2.1 Public Customer Layout & Navbar
The `CustomerLayout` wraps all public customer routes (except `/projects/:projectSlug/map` which uses a specialized full-screen map canvas). It incorporates the sticky `Navbar` and the multi-column `Footer`.

#### Navbar Layout & Elements
- **Logo & Brand Identity**:
  - Displays circular Yazh Farm Land emblem (`/logo.png`) with golden ring accent.
  - Brand title: **Yazh Promoters** with subtitle **Farm Land & DTCP Layouts**.
  - Clicking the logo routes directly to `/`.
- **Desktop Navigation Links**:
  - `Projects` (`/projects`): Navigates to all projects catalog.
  - `About & Approvals` (`/#about` or project documents): Directs to company background and legal legitimacy.
  - `Contact Us` (`/#contact`): Smooth scrolls to footer or contact form.
  - `Admin Portal` (`/admin`): Direct link for staff to enter the management console.
- **Header Actions**:
  - `Explore Layouts` Button: Direct CTA styled in glossy emerald green linking to `/projects`.
  - `Mobile Menu Toggle Button` (Hamburger icon `Menu` / Close icon `X`): Reveals a full-width mobile navigation drawer with all links and contact buttons.

---

### 2.2 Global Footer
Located at the bottom of customer-facing pages:
- **Left Column**: Yazh Farm Land emblem, company description, DTCP and legal commitment note.
- **Middle Column ("Quick Links")**: Links to `Home`, `All Projects`, `Legal Documents`, `Admin Login`.
- **Right Column ("Contact Info & Office")**:
  - Official phone number: Clickable `tel:` link.
  - Official email address: Clickable `mailto:` link.
  - Office address: Head office / branch office in Tirunelveli / Tamil Nadu.
- **Bottom Bar**: Copyright notice (`© 2026 Yazh Land Promoters. All rights reserved.`) and disclaimer on layout representations.

---

### 2.3 Admin Shell & Sidebar Navigation
The `AdminLayout` provides a responsive dark-mode sidebar navigation drawer (`AdminSidebar`) with a main content area.

#### Admin Sidebar Components & Buttons
- **Top Brand Section**:
  - Displays the Yazh Farm Land circular emblem.
  - Header text: **Yazh Promoters** with golden subtext **ADMIN CONSOLE**.
- **Navigation Menu Items**:
  1. `Dashboard` (`/admin`): Icon `LayoutDashboard`. Active state highlighted in glossy green gradient with amber border.
  2. `All Projects` (`/admin/projects`): Icon `FolderKanban`. Displays a green `Live` pill badge. Clicking triggers navigation to the projects manager.
  3. `Buyer Leads` (`/admin/leads`): Icon `Users`. Direct navigation to customer inquiries CRM.
  4. `View Public Site` (`/`): Icon `ExternalLink`. Opens the live public customer portal in a new browser tab.
  5. `Team & Security` (`/admin/team`): Icon `ShieldCheck`. Direct navigation to password and admin user manager.
- **Bottom User Profile & Logout**:
  - Shows logged-in user email and role badge (`SUPER_ADMIN` or `ADMIN`).
  - `Logout Button` (Icon `LogOut`): Terminates the Supabase session and redirects to `/admin/login`.

---

### 2.4 Admin Mobile Top Bar
For viewports under `768px` (smartphones and tablets):
- Sticky top header (`#051c13`).
- Left: Hamburger toggle button opening `AdminSidebar` as a full slide-over drawer with backdrop blur.
- Center: Yazh Promoters logo and title.
- Right: Quick logout icon button.

---

## 3. Public Customer Portal: Screens, Components & Buttons

### 3.1 Home Page (`/`)
The main digital storefront of Yazh Land Promoters.

#### Page Sections & Elements:
1. **Hero Banner Section**:
   - Headline: Premium Farm Lands & DTCP Approved Layouts in Tamil Nadu.
   - Subheading: Digitized CAD blueprints, clear legal titles, and real-time plot availability.
   - `Explore Projects` Button: Navigates to `/projects`.
   - `View Live CAD Map` Button: Quick launch to the featured project's interactive blueprint.
2. **Key Metric Badges**:
   - Total Acres Developed, Digitized Plots Count, 100% DTCP / Legal Approvals guarantee.
3. **Featured Projects Showcase**:
   - Displays project cards (e.g., *Nanguneri 23 Acres Project*, *11 Acres Moolaikaraipatti*).
   - Each card displays: Project thumbnail, approval badge (`DTCP Approved` / `Managed Farmland`), location, available plot count, starting price.
   - Card Action 1: `View Project` button -> `/projects/:projectSlug`.
   - Card Action 2: `Explore Interactive Map` button -> `/projects/:projectSlug/map`.
4. **Why Choose Yazh Farm Land Section**:
   - Feature items: High ROI farmland, drip irrigation infrastructure, gated boundaries, 30ft/25ft internal roads.
5. **Contact / Inquiry Form (`ContactForm`)**:
   - Fields: Full Name, Phone Number, Email, Message.
   - `Submit Inquiry` Button: Sends email notification via Web3Forms and stores customer lead.

---

### 3.2 All Projects Page (`/projects`)
Comprehensive directory of all property developments.

#### Components & Controls:
- **Search Bar**: Text input filtering projects by title, city, district, or approval type.
- **Classification Filters**:
  - `All Projects`
  - `DTCP Approved`
  - `Managed Farmland`
- **Project Grid Cards**:
  - Status pill: `Live & Selling` or `Upcoming`.
  - Statistics row: Total Land Area, Total Plots, Available Plots.
  - Action buttons on each card:
    - `Explore Layout CAD Map` (Compass icon): Opens `/projects/:projectSlug/map`.
    - `Overview & Pricing` (ArrowRight icon): Opens `/projects/:projectSlug`.

---

### 3.3 Project Overview Page (`/projects/:projectSlug`)
The complete project briefing hub.

#### Components & Controls:
- **Navigation Header**:
  - `← Back to Projects` link.
  - Project Title and Approval Classification badge.
  - Project City, State and Landmark address.
- **Quick Action Bar**:
  - `Explore CAD Map` Button: Primary action button launching the interactive blueprint canvas.
  - `Open in Google Maps` Button: Opens verified GPS location in Google Maps / Google Earth.
  - `Legal Documents` Button: Navigates to `/documents/:projectSlug`.
- **Project Specifications Grid**:
  - Total Land Area (e.g., 23 Acres / 11 Acres).
  - Total Plots Count and Available Plots counter.
  - Road widths (e.g., 25ft / 50ft).
  - Soil & Water suitability (copious groundwater, sweet water, red soil).
- **Embedded Interactive CAD Preview**:
  - Read-only preview of the digitized SVG layout.
  - Click-to-launch banner: "Click to explore full interactive map with plot selection".
- **Legal Compliance Section**:
  - Previews DTCP / Farm approval certificates with direct download links.

---

### 3.4 Interactive CAD Blueprint Map Page (`/projects/:projectSlug/map`)
The flagship interactive feature of the platform. A full-screen vector CAD viewer rendered with SVG polygons directly representing digitized plot boundaries.

#### Canvas Header Bar:
- **Back Button** (`←`): Navigates back to the Project Overview page.
- **Branding & Title**:
  - Yazh Farm Land circular logo.
  - Project title (e.g., *Nanguneri 23 Acres Project*).
  - Classification tag (`MANAGED FARMLAND` or `DTCP APPROVED`).
- **Live Search Input (`Plot #`)**:
  - Real-time search box with magnifying glass.
  - Typing a number (e.g. `1`, `42`) immediately highlights and centers that plot on the canvas.
- **Top Actions**:
  - `Filter Toggle Button` (Icon `Sliders` / `Filter`): Opens `NammaPlotFilterDrawer`.
  - `Real-Time Sync Indicator`:
    - Green pulsing dot: Connected to Supabase Realtime channel.
    - Displays live inventory status updates without page refreshing.

#### SVG Map Canvas & Plot Interaction:
- **Plot Polygons**:
  - Digitized polygons with exact vertex coordinates matching CAD blueprints.
  - Color-coded by live status:
    - **Green** (`#10b981` / `bg-emerald-500`): **Available**.
    - **Blue** (`#3b82f6` / `bg-blue-600`): **Booked**.
    - **Purple / Red** (`#8b5cf6` / `#ef4444`): **Sold / Registered**.
    - **Amber / Grey** (`#f59e0b` / `#6b7280`): **On Hold / Blocked**.
  - Clicking any plot opens the `PlotSelectionCard` bottom/side drawer and highlights the plot with an animated glowing golden border.
- **Plot Labels**:
  - Plot numbers centered on polygon centroids.
  - Dynamic font scaling according to viewport zoom level.
- **Canvas Zoom & Pan Toolbar (Floating Right)**:
  - `Zoom In` (`+` button): Increases SVG scale factor smoothly.
  - `Zoom Out` (`-` button): Decreases SVG scale factor.
  - `Reset View / Center` (Icon `RotateCcw`): Recalculates canvas boundaries and perfectly fits the blueprint.
  - `Toggle Labels` (Icon `Eye` / `EyeOff`): Show/hide plot number tags.
  - `Fullscreen Toggle` (Icon `Maximize2` / `Minimize2`): Toggles browser native fullscreen mode.

#### Legend Bar (Floating Bottom-Left):
- Indicators: `● Available` (Green), `● Booked` (Blue), `● Registered` (Red), `● Blocked` (Amber).

---

### 3.5 Floating Map Speed-Dial & Interactive Drawers

#### 3.5.1 Filter Drawer (`NammaPlotFilterDrawer`)
Triggered from the header filter button or floating speed dial.
- **Header**: Title **Filter Plots**, Close button (`X`).
- **Filter Groups**:
  1. **Availability Filter**:
     - Chips: `All`, `Available`, `Booked`, `Registered`, `Blocked`.
  2. **Facing Direction Filter**:
     - Chips: `All`, `North`, `East`, `South`, `West`.
  3. **Area Size Filter (Cents)**:
     - Chips: `All`, `< 2 Cents`, `2 - 5 Cents`, `5 - 8 Cents`, `8 - 13 Cents`, `> 13 Cents`.
- **Footer Buttons**:
  - `Reset All Filters` Button: Clears all selections to `all`.
  - `Apply & Close` Button: Filters visible plots on the map immediately. Plots matching criteria stay full opacity; non-matching plots fade to 15% opacity.

#### 3.5.2 Selected Plot Card Drawer (`PlotSelectionCard`)
Appears automatically at the bottom right/center when a plot is clicked on the map.
- **Plot Header**:
  - "Plot #{plot_number}" title.
  - Live status badge (`Available`, `Booked`, `Registered`, `On Hold`).
  - Close button (`X`) to dismiss the card.
- **Specifications Table**:
  - Land Area in Cents (e.g. `32 Cents`) and square feet conversion (`13,939.2 sq.ft`).
  - Facing direction (e.g. `North-East`).
  - Total Price in Indian Rupees (`₹25,00,000`).
  - Rate per Cent (`₹78,125 / Cent`).
- **Card Action Buttons**:
  - `Book / Reserve Plot` Button: Styled in glossy emerald green. Directs to `/booking/:plotId`.
  - `View Detailed Specs` Button: Directs to `/plots/:plotId`.
  - `Exclusive Offer / Callback` Button: Opens the `ExclusiveOfferModal`.
  - `Share Plot Link` Button: Copies the direct URL to clipboard with a success toast notification.

#### 3.5.3 Project Location & Live GPS Modal (`ProjectLocationModal`)
Triggered by the Map Pin icon on the floating speed dial.
- **Header**: Project Title, location address, Close button (`X`).
- **Satellite Map Viewer**:
  - Embedded responsive Google Maps Satellite view centered on the project's exact GPS coordinates.
- **Navigation Buttons**:
  - `Open in Google Maps` Button (Icon `ExternalLink`): Opens native Google Maps in a new tab with pin marker.
  - `Launch Live GPS Navigation` Button (Icon `Compass`): Launches live turn-by-turn driving directions to the site.

#### 3.5.4 Exclusive Plot Offer Modal (`ExclusiveOfferModal`)
Triggered by the Sparkles button on the floating speed dial or within the plot card.
- **Header**: Golden badge "Exclusive Farmland Opportunity", Close button (`X`).
- **Offer Content**: Special spot booking discount, free registration / drip irrigation incentives.
- **Callback Request Form**:
  - Full Name input.
  - Phone Number input.
  - Email Address input.
  - `Claim Offer & Request Callback` Button: Submits form to Supabase `leads` table and triggers instant Web3Forms email notification to promoters.

---

### 3.6 Individual Plot Detail Page (`/plots/:plotId`)
Dedicated deep-dive page for a specific plot.

#### Components & Controls:
- **Breadcrumb Navigation**: `Home` > `Projects` > `{Project Name}` > `Plot #{plot_number}`.
- **Plot Title & Status Pill**:
  - Large display of Plot Number and current inventory status.
- **Key Metrics Grid**:
  - Total Land Area (Cents & Sq.Ft).
  - Facing Direction.
  - Total Price in INR.
  - Rate per Cent.
  - Boundary Vertices Count.
- **CAD Geometry Inspector**:
  - Visual preview of the plot's polygonal boundary.
  - Dimension measurements for each edge.
- **Action Buttons**:
  - `Proceed to Reserve Plot` Button: Directs to `/booking/:plotId`.
  - `Back to Interactive Map` Button: Returns to `/projects/:projectSlug/map`.
  - `Contact Sales Desk` Button: Prompts direct phone dial to `+91 94884 10077`.

---

### 3.7 Plot Booking & Reservation Enquiry Page (`/booking/:plotId`)
Official booking form allowing a prospective buyer to express intent and reserve a plot.

#### Components & Controls:
- **Back Link**: `← Back to Plot #{plot_number} Details`.
- **Plot Summary Banner**:
  - Displays selected Plot Number, Project Name, Land Area, Facing, and Total Price.
- **Booking Form Fields**:
  1. `Full Name *`: Required text input.
  2. `Mobile Number *`: Phone input with country code validation.
  3. `Email Address`: Optional email for receiving booking reference copy.
  4. `Current City / Location`: City or state of residence.
  5. `Preferred Contact Channel`: Radio options for `Phone Call`, `WhatsApp`, `Email`.
  6. `Additional Notes / Queries`: Textarea for custom requirements or site visit requests.
  7. `Consent Checkbox *`: Mandatory legal acknowledgement to be contacted by Yazh Promoters.
- **Form Submission Buttons**:
  - `Submit Reservation Enquiry` Button:
    - Validates fields via Zod schema.
    - Generates unique booking reference ID (e.g. `YZH-BK-874291`).
    - Writes record to Supabase `bookings` table.
    - Dispatches instant Web3Forms email alert to admin.
    - Transitions user to `/booking-confirmation/:reference`.
  - `Cancel` Button: Returns to plot details.

---

### 3.8 Booking Confirmation & Receipt Page (`/booking-confirmation/:reference`)
Displays immediate validation after enquiry submission.

#### Components & Controls:
- **Confirmation Header**:
  - Animated green checkmark badge.
  - Headline: "Enquiry Successfully Registered!".
- **Booking Reference Box**:
  - High-visibility display of the Booking Reference Number (e.g., `YZH-BK-918204`).
  - `Copy Reference Number` Button: Copies reference code to clipboard.
- **Reservation Details Card**:
  - Customer Name, Contact Number, Selected Plot Number, Project Name, Timestamp.
- **Next Steps Guide**:
  1. Verification Call: Promoter sales representative calls within 24 business hours.
  2. Free Site Inspection: Complimentary site visit scheduled with executive transport.
  3. Title Deed Verification: Legal verification of parent documents and DTCP records.
- **Action Buttons**:
  - `Return to Layout Map` Button: Navigates back to the interactive map.
  - `Explore More Projects` Button: Navigates to `/projects`.

---

### 3.9 Public Legal & Approval Documents Page (`/documents/:projectSlug`)
Provides total transparency by hosting all government certifications and approvals.

#### Components & Controls:
- **Header**: Project Title, "Official Approvals & Legal Transparency Documents".
- **Category Filters**:
  - `All Documents`
  - `DTCP Approvals`
  - `Layout Blueprint Plans`
  - `RERA Certificates`
  - `Legal Title Opinion`
  - `Patta / Chitta Documents`
- **Document Cards**:
  - Title and document category badge.
  - Approval / Registration number (e.g. `DTCP No: 142/2024`).
  - Date of government issuance.
  - File format badge (`PDF`, `Image`) and file size.
  - `View / Download Document` Button: Opens public Supabase storage document directly in browser PDF viewer.

---

## 4. Admin Management Console: Screens, Layouts & Workflows

### 4.1 Admin Authentication & Login Page (`/admin/login`)
Secure gateway to the promoter administration platform.

#### Components & Controls:
- **Branding Header**:
  - Large Yazh Farm Land circular emblem.
  - Subtitle: "Sign in to manage CAD layouts, plot inventories, and reservations."
- **Login Form**:
  - `Email Address` input field (with mail icon).
  - `Password` input field (with lock icon).
  - Error banner: Displays Supabase authentication error messages if invalid.
- **Buttons**:
  - `Sign In to Admin Console` Button (ArrowRight icon):
    - Authenticates credentials against Supabase Auth.
    - Verifies user has staff role (`role === 'admin'` or `role === 'super_admin'`).
    - On success: Redirects to `/admin`.
    - On failure: Displays clear error message.
  - `← Return to Public Site` Link: Directs to public home page.

---

### 4.2 Admin Dashboard (`/admin`)
Real-time operational command center.

#### Components & Controls:
- **Header Section**:
  - Title: **Inventory & Operations Dashboard**.
  - Subtitle: "Real-time synchronization across CAD blueprints, plot availability, and customer reservations."
  - `Refresh Metrics` Button (Icon `RefreshCw`): Forces reload of all counts.
  - `New Project` Button (Icon `Plus`): Links to `/admin/projects/new`.
- **Top Metrics Grid (Live Supabase Real-time Counters)**:
  1. `Total Plots`: Count of all digitized plots across all layouts.
  2. `Available Plots`: Green card showing plots open for purchase.
  3. `Booked / On Hold Plots`: Blue card showing active reservations.
  4. `Sold / Registered Plots`: Purple card showing completed sales.
- **Recent Projects Section**:
  - List of latest 5 projects with live status badges (`Published` / `Draft`).
  - Shows total plot count, available count, and city.
  - Action: `Manage Layout` link.
- **Recent Customer Enquiries & Bookings Section**:
  - List of latest 5 reservation inquiries.
  - Customer name, phone number, plot number, enquiry reference, timestamp.
  - Quick status badge (`booking_pending`, `on_hold`, `confirmed`).
  - Action: `View All Leads` link to `/admin/leads`.

---

### 4.3 All Projects Management (`/admin/projects`)
Central management dashboard for all property developments.

#### 4.3.1 Project Big Card & Accordion Sections
Each project is rendered in a comprehensive card with deep management capabilities:
- **Project Identity Header**:
  - Project Title and Approval pill (`DTCP Approved` / `Managed Farmland`).
  - Land Area (e.g. `23 Acres`) and Location.
  - Publication Status badge (`Published - Live to public` / `Draft`).
- **Google Maps & GPS Section**:
  - Displays verified Google Maps link.
  - `Open in Google Maps` Button: Opens live satellite view.
- **Inventory Statistics Strip**:
  - Total Plots count.
  - Available count with percentage pill.
  - Booked count with percentage pill.
  - Sold / Registered count with percentage pill.
- **Primary Management Action Buttons**:
  1. `Edit Project Details` Button (Pencil icon): Opens the project edit modal.
  2. `Open CAD Layout Editor` Button (PenTool icon): Navigates to `/admin/projects/:projectId/layout`.
  3. `Plots Inventory Table` Button (Table icon): Navigates to `/admin/projects/:projectId/plots`.
  4. `Reservations & Bookings` Button (Calendar icon): Navigates to `/admin/projects/:projectId/bookings`.
  5. `Documents Manager` Button (FileCheck icon): Navigates to `/admin/projects/:projectId/documents`.
  6. `View Public Site` Button (ExternalLink icon): Opens the public map in a new tab.
  7. `Delete Project` Button (Trash2 icon): Opens the double-confirmation deletion modal.

#### 4.3.2 Edit Project Details Modal
Modal triggered by the `Edit Project Details` button on any project card:
- **Input Fields**:
  - `Project Name *`: Name of the layout.
  - `URL Slug *`: Web-friendly slug (e.g. `nanguneri-23-acres-project`).
  - `Approval & Classification`:
    - Radio cards: `DTCP Approved`, `Managed Farmland`, `Custom Type`.
  - `Total Land Area`: Free text (e.g. `23 Acres`).
  - `Publication Status`: Dropdown (`Published (Live to public)` or `Draft (Hidden)`).
  - `Address / Landmark`: Location text.
  - `Google Maps Link / GPS Coordinates`: Validates URL or DMS/decimal coordinates.
  - `City`, `State`, `Postal Code`.
  - `Project Contact Phone` and `Project Contact Email`.
- **Modal Buttons**:
  - `Cancel` Button: Dismisses modal without saving.
  - `Save Changes` Button: Commits updates to Supabase and refreshes project card.

#### 4.3.3 Delete Project Safeguard Modal
- Double-safety verification dialog:
  - Requires admin to type the exact project title to confirm deletion.
  - Warns that all associated plots, layout blueprints, and bookings will be removed.
  - `Cancel` Button.
  - `Confirm Delete` Button: Executes cascade deletion.

#### 4.3.4 Slide-Over All Projects Sidebar (`AdminAllProjectsSidebar`)
Slide-over drawer accessible throughout the admin console:
- Quick search bar filtering by name, city, or approval.
- Status filter pills (`All`, `Published`, `Draft`).
- Mini project cards with one-click navigation to CAD editor or inventory table.
- Close button (`X`).

---

### 4.4 Create New Project Page (`/admin/projects/new`)
Wizard to register a new layout development before digitizing the blueprint.

#### Form Fields & Buttons:
- `Project Name *`: Required text.
- `URL Slug *`: Auto-generated from name with manual override option.
- `Land Classification`: Radio selection (`DTCP Approved`, `Managed Farmland`, `Custom`).
- `Total Land Area`: e.g. `11 Acres`, `50 Cents`.
- `City *`, `State *`, `Postal Code`.
- `Google Maps Link or GPS Coordinates`: Validated location input.
- `Project Phone Number` & `Email Address`.
- `Publication Status`: Default `Draft` or `Published`.
- `Create Project & Continue to Layout` Button: Writes project row to Supabase and immediately routes to `/admin/projects/:projectId/layout` to upload the blueprint.
- `Cancel` Button: Returns to `/admin/projects`.

---

### 4.5 Project Settings / Metadata Configuration (`/admin/projects/:projectId/edit`)
Comprehensive settings editor for an existing project:
- Configures banner images, brochure URLs, RERA numbers, GPS latitude/longitude, and contact assignments.
- `Save Settings` Button: Commits updates.

---

### 4.6 Interactive CAD Layout & Plot Boundary Editor (`/admin/projects/:projectId/layout`)
The core blueprint digitization studio. This is where CAD blueprints are rendered, plots are mapped, and geometries are configured.

#### 4.6.1 SVG Canvas & Blueprint Navigation Controls
- **Canvas Viewport**:
  - Renders the underlying blueprint image (PNG, JPG, or converted vector PDF).
  - Renders all 63 pre-digitized plot polygons on top of the blueprint.
  - Mouse wheel zoom (in/out) centered at cursor position.
  - Click-and-drag pan across the blueprint.
- **Top Canvas Controls**:
  - `Zoom In` (`+` button).
  - `Zoom Out` (`-` button).
  - `Reset View / Center` (Icon `RotateCcw`): Re-centers the blueprint to fit the viewport.
  - `Toggle Blueprint Image` (Icon `Eye`): Hides/shows the raster blueprint overlay.
  - `Blueprint Opacity Slider` (0% to 100%): Dynamically blends the blueprint with the vector plots.
  - `Toggle Plot Labels` (Icon `Tag`): Shows/hides plot numbers.
  - `Toggle Edge Dimensions` (Icon `Ruler`): Displays measurements along polygon boundaries.

#### 4.6.2 Editor Toolbar & Tool Modes
- **Tool Selector Buttons**:
  1. `Pan & Select Mode` (MousePointer icon): Default mode for clicking plots, inspecting prices, and panning the canvas.
  2. `Vertex Edit Mode`: When a plot is selected, dragging its boundary vertices adjusts the polygon shape in real time.
  3. `Trace Mode` (PenTool icon): Allows drawing new custom polygons by clicking sequential vertices.
  4. `Eraser Mode` (Eraser icon): Tool to clear active vertices.
- **Publish & Re-upload Actions**:
  - `Publish Blueprint Live` Button (Sparkles icon): Sets `is_published = true` on the layout, making it instantly live on the public website.
  - `Delete & Re-upload Blueprint` Button (Trash2 icon): Allows resetting the blueprint background image.

#### 4.6.3 Tab 1: Individual Plot Configuration
Sidebar panel for editing a single selected plot:
- **Plot Selector**:
  - Dropdown listing all plots (e.g. `Plot #1 (Available • 32 Cents)`).
  - `Previous Plot` (`<`) and `Next Plot` (`>`) buttons for rapid sequential stepping.
- **Inventory Status Radio Group**:
  - `Available` (Green).
  - `Booked` (Blue).
  - `On Hold` (Amber).
  - `Registered / Sold` (Purple/Red).
  - `Blocked` (Dark Grey).
- **Pricing & Area Form**:
  - `Area (Cents)`: Number input. Auto-calculates square footage equivalent (`1 Cent = 435.6 sq.ft`).
  - `Rate / Cent (INR)`: Price per cent input. Auto-calculates Total Price.
  - `Total Price (INR)`: Total plot cost input. Auto-calculates Rate per cent.
  - `Facing Direction`: Dropdown (`East`, `West`, `North`, `South`, `North-East`, `North-West`, `South-East`, `South-West`).
- **Polygon Geometry Section**:
  - Vertex coordinates count.
  - `Reset Vertices` Button: Undoes vertex drag modifications.
  - `Save Plot Changes` Button: Commits status, pricing, facing, and vertices to Supabase.
  - **Deletion Safeguard Banner**: Clearly states that plot boundaries are protected from accidental deletion to preserve CAD blueprint integrity.

#### 4.6.4 Tab 2: Bulk Plot Configuration ("Configure All")
Allows configuring prices, statuses, or facing directions across multiple plots simultaneously:
- **Scope Selector**:
  - `All Plots (1 to 63)`
  - `Plot Range`: From `[ 1 ]` to `[ 63 ]` inputs.
  - `By Status`: Apply only to plots matching a specific status.
  - `By Facing`: Apply only to plots matching a specific facing direction.
- **Bulk Action Settings**:
  - **Pricing**: `Keep Existing`, `Set Fixed Price (INR)`, `Set Rate per Cent`, `Set Rate per Sq.Ft`.
  - **Status**: `Keep Existing`, `Available`, `Booked`, `On Hold`, `Registered`, `Blocked`.
  - **Facing**: `Keep Existing`, `East`, `West`, `North`, `South`, etc.
- **Action Button**:
  - `Apply Bulk Configuration to All Plots` Button: Executes atomic batch updates to Supabase with live progress bar.

#### 4.6.5 HTML / CAD Blueprint Import Modal
Accessible via the `Import HTML` button:
- Paste digitized SVG / HTML coordinates directly.
- `Parse & Import Polygons` Button: Automatically detects plot IDs and boundary paths.

#### 4.6.6 Blueprint Export Actions (DXF, SVG, GeoJSON)
- `Export DXF` Button: Generates AutoCAD compatible `.dxf` vector file with boundary layers.
- `Export SVG` Button: Generates clean standalone vector `.svg` layout.
- `Export GeoJSON` Button: Generates GIS-compatible `.geojson` format with plot feature properties.

---

### 4.7 Project Plot Inventory Table (`/admin/projects/:projectId/plots`)
Tabular spreadsheet-style view of all plots in the project.

#### Components & Controls:
- **Header**:
  - `← Back to Projects` link.
  - Project Title & "Plot Inventory & Pricing Manager".
- **Top Actions**:
  - `Search Plots`: Filter by plot number, area, or facing.
  - `Status Filter Chips`: `All`, `Available`, `Booked`, `On Hold`, `Sold / Registered`, `Blocked`.
  - `Add Single Plot` Button (Plus icon): Opens manual plot creation modal.
  - `Export CSV` Button (Download icon): Exports complete inventory to `.csv`.
  - `Import CSV` Button (Upload icon): Bulk updates pricing and inventory from `.csv`.
- **Plot Inventory Table Columns**:
  1. `Plot #`: Number badge.
  2. `Area (Cents)`: Land area in cents.
  3. `Area (Sq.Ft)`: Computed area in square feet.
  4. `Facing`: Facing direction badge.
  5. `Price (INR)`: Formatted currency (`₹25,00,000`).
  6. `Status`: Live status pill with inline change dropdown.
  7. `Actions`:
     - `Edit Plot Details` Button (Pencil icon): Opens Edit Plot Modal.
     - `Delete Plot` Button: Guarded with protection alert preventing CAD corruption.

#### 4.7.1 Add Single Plot Modal
- Form: Plot Number (1-63), Area Cents, Rate per Cent, Total Price, Facing, Status.
- `Create Plot` Button & `Cancel` Button.

#### 4.7.2 Edit Plot Modal
- Form: Modify Area, Rate, Price, Facing, Status with real-time bidirectional price calculation.
- `Save Changes` Button & `Cancel` Button.

#### 4.7.3 CSV Import & Export
- Import processes CSV rows: `Plot Number`, `Area (Cents)`, `Facing`, `Price (INR)`, `Status`.
- Updates Supabase records atomically.

---

### 4.8 Project Bookings & Reservation Manager (`/admin/projects/:projectId/bookings`)
Lifecycle manager for customer reservation requests.

#### Components & Controls:
- **Header**: Project Title, "Customer Enquiries & Reservation Approvals".
- **Enquiry Cards / Table Columns**:
  - `Customer Information`: Full name, phone number (with `tel:` link), email (with `mailto:` link), location.
  - `Booking Reference`: Reference code (e.g. `YZH-BK-382910`).
  - `Plot Number`: Assigned plot number with direct link.
  - `Preferred Contact`: Phone, WhatsApp, or Email tag.
  - `Status Badge`: `booking_pending`, `on_hold`, `confirmed`, `sold`, `cancelled`.
  - `Timestamp`: Date and time submitted.
- **Workflow Action Buttons**:
  - `Approve Hold` Button: Sets booking status to `on_hold` and atomically updates plot inventory to `On Hold`.
  - `Confirm Booking` Button: Transitions status to `confirmed` and updates plot to `Booked`.
  - `Mark as Sold` Button: Sets status to `sold` and updates plot to `Registered / Sold`.
  - `Cancel Enquiry` Button: Sets status to `cancelled` and atomically releases plot back to `Available`.
  - `Delete Enquiry` Button (Trash2 icon): Opens delete confirmation and releases plot inventory.

---

### 4.9 Project Legal Documents Manager (`/admin/projects/:projectId/documents`)
Upload and manage official legal certifications, DTCP approvals, and layout documents.

#### Components & Controls:
- **Upload Document Form**:
  - `Document Title *`: e.g. "DTCP Final Approval Order 2024".
  - `Category Dropdown`:
    - `dtcp_approval`
    - `layout_plan`
    - `rera_certificate`
    - `legal_opinion`
    - `patta_chitta`
    - `other`
  - `Approval / Reference Number`: e.g. "DTCP/CR/142-2024".
  - `Date of Issuance`: Date picker.
  - `Description`: Optional summary of the document.
  - `File Upload Area`: Drag-and-drop or file picker for PDF or images.
  - `Upload & Publish Document` Button: Uploads file to Supabase Storage bucket `project-documents` and creates database record.
- **Published Documents Table**:
  - Columns: Title, Category, Approval Number, File Size, Issue Date, Visibility Status.
  - `Public Visibility Toggle` (Icon `Eye` / `EyeOff`): Toggles whether document appears on the public website.
  - `Download / View` Button: Opens stored file in new tab.
  - `Delete Document` Button: Removes file from storage and database.

---

### 4.10 Unified Buyer Leads & Inquiries Manager (`/admin/leads`)
Unified customer relationship manager combining booking inquiries, callback requests, and contact submissions.

#### Components & Controls:
- **Top Filter Controls**:
  - `Search Box`: Search by customer name, phone, email, reference ID, or project name.
  - `Channel / Type Filter`: `All Inquiries`, `Plot Bookings`, `Direct Leads / Callbacks`.
  - `Status Filter`: `All`, `Pending`, `On Hold`, `Contacted`, `Closed`.
- **Customer Lead Cards / Table**:
  - Customer Name and Location.
  - Click-to-call Phone link (`tel:`) and click-to-email Mail link (`mailto:`).
  - Target Project & Plot Number tags.
  - Submission timestamp and reference code.
  - Customer notes or preferred contact channel.
- **Lead Actions**:
  - `Mark as Contacted` Button: Updates follow-up status.
  - `Delete Lead` Button: Opens modal to remove spam or completed leads.

---

### 4.11 Team, Profile & Security Settings (`/admin/team`)
Administrator account credentials and permissions manager.

#### Components & Controls:
- **Current Administrator Profile Card**:
  - Name, email address, assigned role (`SUPER_ADMIN` / `ADMIN`), last login timestamp.
- **Change Password Card**:
  - `New Password` input (with show/hide eye toggle).
  - `Confirm New Password` input.
  - `Update Password` Button: Securely calls Supabase Auth `updateUser({ password })`.
  - Success / error alert notifications.
- **Team Members Directory**:
  - Lists all registered staff users and their roles.
  - `Invite / Add New Administrator` Button:
    - Opens modal with `Full Name`, `Email Address`, `Temporary Password`, and `Role`.
    - Creates user account and assigns admin permissions.

---

### 4.12 Audit Trail & Compliance Ledger (`/admin/audit-logs`)
Immutable ledger recording all sensitive administrative operations.

#### Components & Controls:
- **Ledger Table Columns**:
  1. `Timestamp`: Precise date and time of the event.
  2. `Entity Type`: `Plot`, `Booking`, `Project`, `Document`.
  3. `Action`: `UPDATE`, `CREATE`, `DELETE`, `STATUS_CHANGE`.
  4. `Actor`: Email or user ID of the administrator who performed the action.
  5. `State Transition Details`: Shows prior value and updated value (e.g. `Available → Booked`, `Price updated to ₹25,00,000`).

---

## 5. Database Schema, State Management & Real-Time Sync

### Key Tables & Foreign Key Relationships
1. `projects`:
   - `id`, `name`, `slug`, `city`, `state`, `address`, `google_maps_link`, `approval_type`, `total_area_acres`, `status` (`published`/`draft`).
2. `project_layouts`:
   - `id`, `project_id`, `layout_bounds` (JSON with width/height/viewBox), `source_file_path`, `is_published`.
3. `plots`:
   - `id`, `project_id`, `layout_id`, `plot_number`, `area_cents`, `area_sqft`, `facing`, `price_inr`, `status` (`available`/`booked`/`sold`/`on_hold`/`blocked`).
4. `plot_geometries`:
   - `id`, `plot_id`, `geometry_type` (`polygon`), `coordinates` (JSON array of `[x, y]` pairs), `centroid` (`[x, y]`).
5. `bookings`:
   - `id`, `project_id`, `plot_id`, `booking_reference`, `customer_name`, `phone`, `email`, `location`, `status`, `preferred_contact_method`, `notes`.
6. `project_documents`:
   - `id`, `project_id`, `title`, `category`, `approval_number`, `issue_date`, `storage_path`, `is_public`, `is_published`.
7. `audit_logs`:
   - `id`, `entity_type`, `entity_id`, `action`, `actor_id`, `old_data`, `new_data`, `created_at`.

### Supabase Realtime Channels
- `customer_map_{project.id}`: Subscribes to `UPDATE` events on `plots` table. Automatically updates polygon fill colors and selection card without page reloads.
- `admin-dashboard-metrics`: Subscribes to `*` on `plots`, `bookings`, and `projects` to ensure KPI cards always reflect live inventory.

---

## 6. Complete End-to-End User Journeys

### User Journey A: Prospective Buyer Plot Reservation
1. **Discovery**: Customer visits `https://yazhpropertydevelopers.santoge.com/`.
2. **Catalog Browsing**: Clicks `Explore Projects` -> Lands on `/projects`.
3. **Project Selection**: Selects *Nanguneri 23 Acres Project* -> Clicks `Explore CAD Map`.
4. **Interactive Map Exploration**:
   - Customer opens `/projects/23acreproject/map`.
   - Filters by `Facing: North` and `Status: Available`.
   - Clicks on **Plot #2** (green polygon).
5. **Plot Inspection**:
   - `PlotSelectionCard` appears showing 32 Cents, ₹25,00,000, North facing.
   - Clicks `Book / Reserve Plot`.
6. **Reservation Submission**:
   - Lands on `/booking/:plotId`.
   - Fills in Name, Phone, WhatsApp preference, and clicks `Submit Reservation Enquiry`.
7. **Confirmation**:
   - Lands on `/booking-confirmation/YZH-BK-XXXXXX`.
   - Copies reference number.

### User Journey B: Promoter Sales Team Processing
1. **Real-Time Notification**: Admin receives instant Web3Forms email alert.
2. **Dashboard Review**: Admin logs in at `/admin/login` -> Views updated pending bookings on `/admin`.
3. **Booking Action**:
   - Admin navigates to `/admin/projects/:projectId/bookings`.
   - Finds new enquiry for Plot #2.
   - Clicks `Approve Hold`.
4. **Instant Synchronization**:
   - Booking transitions to `on_hold`.
   - Plot #2 transitions to `On Hold` (amber color) across the database.
   - Public interactive map updates Plot #2 to `On Hold` in real time.
5. **Compliance Recorded**:
   - State transition is immutably logged in `/admin/audit-logs`.

---

*End of Specification Guide — Documented and Verified for Production Deployment.*
