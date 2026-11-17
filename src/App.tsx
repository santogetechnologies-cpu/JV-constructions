import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { ProjectsPage } from './pages/customer/ProjectsPage';
import { ProjectOverviewPage } from './pages/customer/ProjectOverviewPage';
import { InteractiveMapPage } from './pages/customer/InteractiveMapPage';
import { PlotDetailPage } from './pages/customer/PlotDetailPage';
import { BookingEnquiryPage } from './pages/customer/BookingEnquiryPage';
import { BookingConfirmationPage } from './pages/customer/BookingConfirmationPage';
import { PublicDocumentsPage } from './pages/customer/PublicDocumentsPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminNewProjectPage } from './pages/admin/AdminNewProjectPage';
import { AdminProjectLayoutPage } from './pages/admin/AdminProjectLayoutPage';
import { AdminProjectPlotsPage } from './pages/admin/AdminProjectPlotsPage';
import { AdminProjectBookingsPage } from './pages/admin/AdminProjectBookingsPage';
import { AdminProjectDocumentsPage } from './pages/admin/AdminProjectDocumentsPage';
import { AdminLeadsPage } from './pages/admin/AdminLeadsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminTeamPage } from './pages/admin/AdminTeamPage';
import { AdminEditProjectPage } from './pages/admin/AdminEditProjectPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC CUSTOMER PORTAL */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectSlug" element={<ProjectOverviewPage />} />
              <Route path="/projects/:projectSlug/map" element={<InteractiveMapPage />} />
              <Route path="/plots/:plotId" element={<PlotDetailPage />} />
              <Route path="/documents/:projectSlug" element={<PublicDocumentsPage />} />
              <Route path="/booking/:plotId" element={<BookingEnquiryPage />} />
              <Route
                path="/booking-confirmation/:reference"
                element={<BookingConfirmationPage />}
              />
            </Route>

            {/* ADMIN LOGIN */}
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* PROTECTED ADMIN PORTAL */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="projects" element={<AdminProjectsPage />} />
              <Route path="all-projects" element={<Navigate to="/admin/projects" replace />} />
              <Route path="projects/new" element={<AdminNewProjectPage />} />
              <Route
                path="projects/:projectId"
                element={<Navigate to="layout" replace />}
              />
              <Route
                path="projects/:projectId/layout"
                element={<AdminProjectLayoutPage />}
              />
              <Route
                path="projects/:projectId/plots"
                element={<AdminProjectPlotsPage />}
              />
              <Route
                path="projects/:projectId/bookings"
                element={<AdminProjectBookingsPage />}
              />
              <Route
                path="projects/:projectId/documents"
                element={<AdminProjectDocumentsPage />}
              />
              <Route
                path="projects/:projectId/edit"
                element={<AdminEditProjectPage />}
              />
              <Route
                path="projects/:projectId/settings"
                element={<AdminEditProjectPage />}
              />
              <Route path="leads" element={<AdminLeadsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="team" element={<AdminTeamPage />} />
              <Route path="settings" element={<AdminTeamPage />} />
            </Route>

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
