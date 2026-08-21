// ishub-academy shared enums (mirrors backend User model values).
export const Role = {
  STUDENT: 'student',
  CATEGORY_ADMIN: 'category_admin',  
  MAIN_ADMIN: 'super_admin',
}

export const UserStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  // Note: 'pending' status does not exist in this backend schema.
}

export const getDashboardPath = (role) => {
  switch (role) {
    case Role.MAIN_ADMIN:
      return '/admin'
    case Role.CATEGORY_ADMIN:
      return '/admin/trainings'
    case Role.STUDENT:
      return '/dashboard'
    default:
      return '/'
  }
}
