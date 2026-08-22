# Unused API Endpoints - Frontend to Backend Gap Analysis

## Training Management System (11 endpoints) ❌ UNFIXED

These endpoints are for a comprehensive "Training" system. **None exist in the backend.**

| Endpoint | Method | File | Description |
|----------|--------|------|-------------|
| `/trainings` | POST | TrainingFormPage.jsx | Create a new training |
| `/trainings/:id` | GET | TrainingFormPage, StudentTrainingViewPage | Get training details |
| `/trainings/:id` | PATCH | TrainingFormPage.jsx | Update training |
| `/trainings/category` | GET | StudentTrainingListPage, CategoryAdminDashboard | Get trainings by category |
| `/trainings/:id/modules` | POST | ModuleLessonBuilder.jsx | Create a module |
| `/trainings/modules/:moduleId` | DELETE | ModuleLessonBuilder.jsx | Delete a module |
| `/trainings/lessons/:lessonId` | PATCH | ModuleLessonBuilder.jsx | Update a lesson |
| `/trainings/modules/:moduleId/lessons` | POST | ModuleLessonBuilder.jsx | Create a lesson in module |
| `/trainings/:trainingId/access-grants` | GET | TrainingAccessGrantsPanel.jsx | Get access grants |
| `/trainings/:trainingId/access-grants` | POST | TrainingAccessGrantsPanel.jsx | Grant access |
| `/trainings/:trainingId/access-grants/:grantId` | DELETE | TrainingAccessGrantsPanel.jsx | Revoke access |

## Resource Management (4 endpoints) ❌ UNFIXED

For managing learning resources (files and links). **None exist in the backend.**

| Endpoint | Method | File | Description |
|----------|--------|------|-------------|
| `/resources/category/:categoryId` | GET | AdminResourcesPage.jsx, StudentResourcesPage.jsx | Get category resources |
| `/resources/category/:categoryId` | POST | AdminResourcesPage.jsx | Create resource |
| `/resources/training/:id` | GET | StudentTrainingViewPage.jsx | Get training resources |
| `/resources/:id` | DELETE | AdminResourcesPage.jsx | Delete resource |

## User Management - Path Mismatches (3 endpoints) ✅ FIXED

The following issues have been fixed in the frontend:

| Frontend Path | Backend Path | File | Status |
|---------------|--------------|------|--------|
| `GET /api/users` | `GET /api/admin/users` | AdminDashboard.jsx | ✅ Fixed |
| `PATCH /api/users/:id/status` | `PATCH /api/admin/users/:id/suspend\|activate` | AdminDashboard.jsx | ✅ Fixed |
| `GET /api/users/search` | Not implemented | TrainingAccessGrantsPanel.jsx | ❌ Still missing |

## My Enrollments Bug ✅ FIXED

| Frontend | Backend | File | Status |
|----------|---------|------|--------|
| `GET /students/my-enrollments` | `GET /students/my-enrollment` | MyStudents.jsx | ✅ Fixed |

## Summary

**Previously Total Unused/Mismatched Endpoints: 19**

**Current Status After Fixes:**

| Status | Count | Description |
|--------|-------|-------------|
| ❌ Unfixed | 15 | Training Management + Resource Management + User search |
| ✅ Fixed | 4 | Users path mismatch + MyEnrollments bug |

### What's Been Fixed

1. **AdminDashboard.jsx** - Updated `/users` to `/admin/users` and transformed grouped response
2. **AdminDashboard.jsx** - Replaced `/users/:id/status` with individual suspend/activate endpoints
3. **MyStudents.jsx** - Changed `/students/my-enrollments` to `/students/my-enrollment` and updated response handling

### Remaining Work (15 endpoints)

Priority for future development:
1. Training Management System (11 endpoints) - Core feature gap
2. Resource Management (4 endpoints) - Secondary feature

---

*Updated after fixing User Management path mismatches and MyEnrollments bug.*