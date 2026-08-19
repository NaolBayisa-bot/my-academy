// Maps a user role to its dashboard route path.
export function dashboardPathForRole(role) {
  switch (role) {
    case 'student':
      return '/student/dashboard'
    case 'category_admin':
      return '/admin/dashboard'
    case 'super_admin':
      return '/super-admin/dashboard'
    default:
      return '/login'
  }
}
