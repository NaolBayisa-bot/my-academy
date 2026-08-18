import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Register from '../pages/Register'
import NotAuthorized from '../pages/NotAuthorized'
import Layout from '../components/Layout'
import StudentDashboard from '../pages/StudentDashboard'
import SelectCategory from '../pages/student/SelectCategory'
import BrowseCourses from '../pages/student/BrowseCourses'
import MyEnrollment from '../pages/student/MyEnrollment'
import History from '../pages/student/History'
import AdminDashboard from '../pages/AdminDashboard'
import AllStudents from '../pages/superadmin/AllStudents'
import ManageCourses from '../pages/admin/ManageCourses'
import CourseDetail from '../pages/admin/CourseDetail'
import EnrollmentRequests from '../pages/admin/EnrollmentRequests'
import Posts from '../pages/admin/Posts'
import AssignAdmins from '../pages/superadmin/AssignAdmins'
import Overview from '../pages/superadmin/Overview'
import ProtectedRoute from './ProtectedRoute'
import { dashboardPathForRole } from '../utils/dashboardPath'
import { useAuth } from '../context/AuthContext'

// Redirects "/" to the dashboard that matches the current user's role.
function RoleRedirect() {
  const { user } = useAuth()
  return <Navigate to={dashboardPathForRole(user?.role)} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/403" element={<NotAuthorized />} />

      {/* Student routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <StudentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/select-category"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <SelectCategory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/browse"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <BrowseCourses />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/my-enrollment"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <MyEnrollment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/history"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <History />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Category admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['category_admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={['category_admin']}>
            <Layout>
              <AllStudents />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute allowedRoles={['category_admin']}>
            <Layout>
              <ManageCourses />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses/:courseId"
        element={
          <ProtectedRoute allowedRoles={['category_admin']}>
            <Layout>
              <CourseDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/enrollments"
        element={
          <ProtectedRoute allowedRoles={['category_admin']}>
            <Layout>
              <EnrollmentRequests />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/posts"
        element={
          <ProtectedRoute allowedRoles={['category_admin']}>
            <Layout>
              <Posts />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Super admin routes */}
      <Route
        path="/super-admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <Layout>
              <Overview />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/assign-admins"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <Layout>
              <AssignAdmins />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/students"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <Layout>
              <AllStudents />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/enrollments"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <Layout>
              <EnrollmentRequests />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/posts"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <Layout>
              <Posts />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRoutes

