import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { Role } from './constants'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import UnauthorizedPage from './pages/dashboard/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'
import StudentDashboard from './pages/dashboard/StudentDashboard'
import Overview from './pages/superadmin/Overview'
import CategoryAdminDashboard from './pages/dashboard/CategoryAdminDashboard'
import CourseFormPage from './pages/dashboard/CourseFormPage'
import CourseListView from './pages/dashboard/CourseListView'
import CourseViewPage from './pages/dashboard/CourseViewPage'
import AdminResourcesPage from './pages/dashboard/AdminResourcesPage'
import StudentResourcesPage from './pages/dashboard/StudentResourcesPage'
import StudentEnrollmentsPage from './pages/student/MyEnrollment'

export default function App() {
  return (
    <Routes>
      {/* Public - standalone pages without Layout */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes with Layout */}
      <Route element={<Layout />}>
        {/* Student Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Super Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[Role.MAIN_ADMIN]}>
              <Overview />
            </ProtectedRoute>
          }
        />

        {/* Student Courses */}
        <Route
          path="/courses"
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <CourseListView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <CourseViewPage />
            </ProtectedRoute>
          }
        />

        {/* Category Admin Courses */}
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowedRoles={[Role.CATEGORY_ADMIN]}>
              <CategoryAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/new"
          element={
            <ProtectedRoute allowedRoles={[Role.CATEGORY_ADMIN]}>
              <CourseFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/:id"
          element={
            <ProtectedRoute allowedRoles={[Role.CATEGORY_ADMIN]}>
              <CourseFormPage />
            </ProtectedRoute>
          }
        />

        {/* Enrollments */}
        <Route
          path="/enrollments"
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <StudentEnrollmentsPage />
            </ProtectedRoute>
          }
        />

        {/* Resources (unimplemented - keeping routes for future) */}
        <Route
          path="/admin/resources"
          element={
            <ProtectedRoute allowedRoles={[Role.CATEGORY_ADMIN]}>
              <AdminResourcesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <StudentResourcesPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
