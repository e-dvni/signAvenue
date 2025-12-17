// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";

// Customer pages
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import CustomerSchedule from "./pages/CustomerSchedule";
import CustomerDayDetail from "./pages/CustomerDayDetail";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminContactRequests from "./pages/AdminContactRequests";
import AdminProjects from "./pages/AdminProjects";
import AdminSchedule from "./pages/AdminSchedule";

import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />

        {/* Customer routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        {/* main schedule page (list/calendar) */}
        <Route
          path="my-schedule"
          element={
            <ProtectedRoute>
              <CustomerSchedule />
            </ProtectedRoute>
          }
        />
        {/* optional alias /schedule -> same page */}
        <Route
          path="schedule"
          element={
            <ProtectedRoute>
              <CustomerSchedule />
            </ProtectedRoute>
          }
        />
        {/* day detail page: click a date on calendar */}
        <Route
          path="schedule/:date"
          element={
            <ProtectedRoute>
              <CustomerDayDetail />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/contact-requests"
          element={
            <ProtectedRoute>
              <AdminContactRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/projects"
          element={
            <ProtectedRoute>
              <AdminProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/schedule"
          element={
            <ProtectedRoute>
              <AdminSchedule />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
