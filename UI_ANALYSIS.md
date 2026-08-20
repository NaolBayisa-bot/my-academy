# My-Academy — Platform Analysis & UI Design Spec

> **Purpose of this document:** A complete, codebase-verified analysis of the `my-academy` learning management platform, written to guide a redesign of the user interface. Every screen, data field, permission, and state described here is derived from the current source code so the UI can be designed to match exactly what the backend already supports (no inventing features or data that don't exist).

---

## 1. Overview

**My-Academy (branded "HUISHUB" in the navbar)** is a role-based Learning Management System (LMS). Students select a subject **category** (e.g. Development, Cybersecurity, Networking, Creative Works), browse/live inside that category's courses, request enrollment, get approved by an admin, work through video/download **lessons**, and are auto-completed when they finish all lessons. Announcement **posts** are broadcast per-category or globally. A **super admin** manages everything: overview stats, category admins, all students, and all pending enrollments.

**Data-flow principle observed throughout:** the frontend is a thin client that calls a REST API; all authorization and business rules live server-side. The UI must therefore respect and react to the exact response shapes the API returns.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19 + Vite 8 | SPA, ES modules |
| Router | `react-router-dom` v7 | `BrowserRouter`, protected route wrappers |
| HTTP client | Axios | base URL `/api`, JWT attached via interceptor |
| Styling | **None (plain inline `style={{}}` everywhere)** + minimal `index.css` | No Tailwind, no component library, no CSS modules |
| Lint | oxlint | React / Hooks rules |
| Backend | Node.js + Express 5 | REST API on port 5000 |
| ORM | Sequelize 6 | PostgreSQL via `pg` |
| Auth | JWT (`Authorization: Bearer`), bcrypt password hashing | Token expiry 7 days |
| DB | PostgreSQL | Env config via `.env`/`.env.example` |

**Key styling fact for the redesign:** there is currently **no design system**. Every component uses scattered inline styles with hard-coded colors (`#1f2937` header, `#ccc` borders, `#4caf50` success progress, etc.). This is both the biggest UX weakness and the biggest opportunity — the redesign can introduce tokens/components without touching backend logic at all.

---

## 3. Roles, Permissions & Route Protection

Three roles exist: `super_admin`, `category_admin`, `student`. Users are **categorized** via `User.category_id` (FK → `Categories.id`).

### Role → Dashboard redirect
| Role | Landing path |
|---|---|
| student | `/student/dashboard` |
| category_admin | `/admin/dashboard` |
| super_admin | `/super-admin/dashboard` |
| none/unauth | `/login` |

### Permission matrix (verified from route + controller guards)
| Capability | student | category_admin | super_admin |
|---|---|---|---|
| Register / Login | ✔ (register creates student) | — | — (seeded) |
| Select / change category | ✔ (blocked if active enrollment) | — | — |
| Browse category courses | ✔ (own category only) | — | — |
| Request enrollment | ✔ | — | — |
| Mark lessons complete / view progress | ✔ | — | — |
| View posts | own category + global | own category + global | all (+ filter by category) |
| **Create/delete posts** | ✘ | own category only (no global) | any + global |
| **CRUD courses** | ✘ | own category only | any category |
| **CRUD lessons** | ✘ | courses in own category only | any |
| Approve / reject enrollments | — | own category only | all (+ category filter) |
| View students | — | own category only | all, grouped by category |
| Assign / deassign category admins | — | — | ✔ |
| Overview analytics | — | — | ✔ |

**Design implications:**
- Navigation (sidebar/topbar) must be **role-aware** — each role sees only its own set of links.
- Category admins must **never** see a "global" posting option (backend rejects it).
- Super admin screens need a **category-filter dropdown** for enrollments and posts.

---

## 4. Data Model (entities, relationships, key fields the UI consumes)

### Category
- `id` UUID, `name` (unique), `admin_id` (FK → User, nullable)
- API includes `admin` object `{ id, name, email }` (null when unassigned) — used on Assign Admins page.

### User
- `id`, `name`, `email` (unique), `password_hash`, `role` (enum above), `category_id` (nullable FK → Category)
- API serializes without `password_hash`. Student rows may carry `enrollments[]` and `currentEnrollment` for admin views.

### Course
- `id`, `category_id` (required FK), `title`, `description`, `created_by` (FK → User)
- List API also returns `creator` `{id,name,email}` and category.

### Lesson (child of Course)
- `id`, `course_id`, `title`, `type` (`video` | `download`), `url`, `order_index`

### Enrollment
- `id`, `student_id`, `course_id`, `status` (`pending` | `in_progress` | `completed` | `rejected`), `enrolled_at`, `completed_at`, `reason` (nullable — rejection reason)
- **One active enrollment per student** (pending or in_progress) — locking rule.

### LessonProgress
- `id`, `enrollment_id`, `lesson_id`, `completed_at` — drives progress bars and auto-completion.

### Post (announcement)
- `id`, `author_id` (FK), `category_id` (nullable; **null = GLOBAL**), `title`, `content`, `created_at`

### Relationships (for eager-loading in UI)
- Category has admin (User) & many Courses; User belongs to Category.
- Course has creator (User), many Lessons, many Enrollments.
- Enrollment belongs to student (User) & course; Course has many enrollments; Enrollment has many LessonProgresses.
- Post belongs to author (User) and (optionally) Category.

---

## 5. API Surface (what the UI can call)

| Method & Path | Role | Purpose |
|---|---|---|
| `POST /api/auth/register` | public | create student, auto-login (returns user + token) |
| `POST /api/auth/login` | public | login (user + token) |
| `GET /api/auth/me` | authenticated | restore session |
| `GET /api/categories` | public | list categories (with `admin` on each) |
| `POST /api/students/select-category` | student | set category `{ categoryId }` |
| `GET /api/students/my-category-courses` | student | courses in own category |
| `GET /api/students/my-enrollment` | student | latest enrollment + course lessons + progress |
| `GET /api/students/my-history` | student | completed enrollments |
| `POST /api/enrollments` | student | request enrollment `{ courseId }` |
| `GET /api/enrollments/:id/progress` | student | `{ completedLessonIds, totalLessons, completedCount, percentage }` |
| `POST /api/enrollments/:id/lessons/:lessonId/complete` | student | mark lesson done (idempotent; auto-complete course) |
| `GET /api/courses?categoryId=` | any auth | list courses of a category |
| `POST /api/courses` | admin+ | create course |
| `PATCH /api/courses/:id` | admin+ | update course |
| `DELETE /api/courses/:id` | admin+ | delete course |
| `GET /api/courses/:courseId/lessons` | admin+ | list lessons |
| `POST /api/courses/:courseId/lessons` | admin+ | create lesson |
| `PATCH /api/lessons/:id` | admin+ | update lesson |
| `DELETE /api/lessons/:id` | admin+ | delete lesson |
| `GET /api/admin/enrollments/pending?categoryId=` | admin+ | pending enrollments (scoped per role) |
| `PATCH /api/admin/enrollments/:id/approve` | admin+ | approve (→ in_progress) |
| `PATCH /api/admin/enrollments/:id/reject` | admin+ | reject `{ reason }` |
| `GET /api/admin/category/:catId/students` | admin+ | students in one category (own only for category_admin) |
| `GET /api/admin/students` | super_admin | all students grouped by category (nil-UUID key = uncategorized) |
| `GET /api/admin/overview` | super_admin | `{ totalStudents, totalCourses, completionsPerCategory[] }` |
| `PATCH /api/admin/assign-category-admin` | super_admin | `{ userId, categoryId }` |
| `PATCH /api/admin/deassign-category-admin` | super_admin | `{ categoryId }` |
| `GET /api/posts` | any auth | visible posts, newest first, with author |
| `POST /api/posts` | admin+ | create post `{ title, content, category_id }` |
| `DELETE /api/posts/:id` | admin+ | delete (author or super_admin) |

All responses wrap data (e.g. `{ courses }`, `{ posts }`, `{ enrollment }`, `{ studentsByCategory }`, `{ categories }`). Errors are `{ error: "message" }`; typical statuses: 400 (validation/business), 401 (auth), 403 (role/category), 404 (not found), 409 (duplicate email).

---

## 6. Page / Screen Inventory by Role

### Public / shared
- **`/login`** — Login (`Login.jsx`)
- **`/register`** — Register (`Register.jsx`) — always creates a *student*
- **`/403`** — Not Authorized (`NotAuthorized.jsx`)
- **`PostsFeed`** — read-only shared post feed (embedded inside dashboards)

### Student (`/student/...`)
| Route | Screen | Key data / actions |
|---|---|---|
| `/student/dashboard` | Student Dashboard | Renders `PostsFeed`; **redirects to select-category if no `category_id`** |
| `/student/select-category` | Select Category | Grid of category cards → `POST select-category` |
| `/student/browse` | Browse Courses | Course list in own category; banner if an enrollment is pending/in-progress; "Request Enrollment" per course (disabled while locked) |
| `/student/my-enrollment` | My Enrollment | `pending` info; `in_progress` progress bar + checkbox lesson list + "Open" link; `completed` congratulations |
| `/student/history` | History | Completed course cards |

### Category admin (`/admin/...`)
| Route | Screen | Key data / actions |
|---|---|---|
| `/admin/dashboard` | Admin Dashboard | **Currently a stub** (just heading) — design target |
| `/admin/students` | My Students | Table grouped by own category |
| `/admin/courses` | Manage Courses | Add/Edit/Delete course cards; link to lessons |
| `/admin/courses/:courseId` | Course Lessons | Add/Edit/Delete lessons (type, url, order) |
| `/admin/enrollments` | Enrollment Requests | Pending table → Approve / Reject (reject prompts reason) |
| `/admin/posts` | Posts | Create feed-form + delete on own posts |

### Super admin (`/super-admin/...`)
| Route | Screen | Key data / actions |
|---|---|---|
| `/super-admin/dashboard` | Overview | Stat cards (students, courses, completions per category) |
| `/super-admin/assign-admins` | Assign Admins | Per-category cards: current admin, searchable student picker, assign/deassign |
| `/super-admin/students` | All Students | Grouped tables per category + "Uncategorized" |
| `/super-admin/enrollments` | Enrollment Requests | Same as admin + category filter dropdown |
| `/super-admin/posts` | Posts | Same as admin + "Post to my category / globally" toggle |

---

## 7. Current UI Shortcomings (redesign motivation)

1. **No design system / design tokens** — colors, spacing, radii, fonts are hard-coded inline in every file (`#1f2937`, `#ccc`, `#4caf50`, `8px` radius…). Inconsistent and unmaintainable.
2. **Plain top navbar only** — no sidebar, no active-section hierarchy, no logo/branding beyond the text "HUISHUB". Future feature growth (this is a staged project) will outgrow a single horizontal nav.
3. **No reusable components** — buttons, cards, tables, inputs, badges, empty states, loading states are re-implemented ad-hoc in each page (see the near-identical post cards, course cards, table `thStyle`/`tdStyle` everywhere).
4. **Stub dashboards** — AdminDashboard and SuperAdminDashboard are placeholders; only super admin gets real analytics.
5. **Tabular/busy admin pages** — student & enrollment tables use raw `<table>` styling with no pagination, search, filtering, or visual status badges.
6. **Minimal state feedback** — raw "Loading..." text, red raw error strings, `window.prompt`/`window.confirm` for reject/delete.
7. **No responsive behavior** — inline layouts assume desktop; category cards and grids don't adapt well on small screens.
8. **No empty/celebration states** beyond plain text ("No posts yet." / "🎉 Congratulations").

---

## 8. Proposed Design System (tokens & foundation)

A single **`index.css` + CSS variables** design token layer (no new dependency required — keep it vanilla, which matches the codebase). All components consume shared classes; inline styles get replaced page-by-page.

### Color palette (suggested)
| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#f5f7fa` | app background |
| `--color-surface` | `#ffffff` | cards, tables, forms |
| `--color-border` | `#e2e8f0` | borders, dividers |
| `--color-text` | `#1e293b` | primary text |
| `--color-text-muted` | `#64748b` | secondary text |
| `--color-primary` | `#2563eb` | primary actions, active nav, links |
| `--color-primary-hover` | `#1d4ed8` | |
| `--color-success` | `#16a34a` | approved/completed/progress |
| `--color-warning` | `#d97706` | pending |
| `--color-danger` | `#dc2626` | reject/delete/errors |
| `--color-dark` | `#0f172a` | header/sidebar background, brand |
| `--color-dark-muted` | `#1e293b` | header alt |

Enrollment status → badge colors: `pending`=warning, `in_progress`=primary, `completed`=success, `rejected`=danger. Global post → a clear "Global" badge.

### Typography / spacing / shape
- Font stack: `system-ui, 'Segoe UI', Roboto, sans-serif` (already in `index.css`).
- Type scale: 28px (page title) / 20px (section) / 16px (body) / 13-14px (meta/labels).
- Spacing scale: 4/8/12/16/24/32.
- Radius: `8px` cards, `6px` inputs/buttons, `12px` hero cards.
- Shadow: subtle `0 1px 3px rgba(15,23,42,.08)` for cards.

### Reusable components to build (all role-agnostic)
- `Logo`/Header (brandmark + app title "HUISHUB")
- `AppLayout` → **sidebar navigation (role-aware)** + top bar (user name, avatar chip, logout). Replace current `Layout.jsx` nav.
- `PageHeader` (title + optional action button)
- `Button` (primary / secondary / danger / ghost; loading state with spinner + "Saving…")
- `Card`, `StatCard`
- `Badge` (status chips: pending/in_progress/completed/rejected/global)
- `DataTable` (header row, zebra, empty state, sortable-friendly markup)
- `EmptyState` (icon + message + optional CTA link/button)
- `Alert` (error / success / info banners — replaces raw red/green `<p>`)
- `FormField`/`TextInput`/`TextArea`/`Select` (with labels + validation message area)
- `SearchInput` + `Dropdown` (for Assign-Admins picker and super-admin category filter)
- `ProgressBar` (used in My Enrollment; already exists in a basic form)
- `Modal` (replace `window.confirm` delete + `window.prompt` reject-reason)
- `Spinner` / `Skeleton` (replace "Loading…" text)

---

## 9. Per-Screen Design Specs (state-driven)

### Public screens — Login / Register
- Split or centered card layout on a tinted background with the brand.
- Login: email + password fields, inline error banner, primary submit, link to Register.
- Register: name + email + password, password min-6 hint, success → auto-login redirect per role (student).
- `/403` Not Authorized: friendly icon + message + "Back to dashboard" button (uses `dashboardPathForRole`).

### Student Dashboard (`/student/dashboard`)
- Greeting header ("Welcome back, {name}").
- If no `category_id`: immediately show a **category-pick CTA card** (redirect to select-category).
- Body = the **Posts feed** (post cards: title, content, author, category label or "Global" badge, timestamp).

### Select Category
- Hero/section heading + **responsive card grid** (min 2, wraps). Click = select + show inline "Selecting…" on that card. Disabled/success state after picking.

### Browse Courses (student)
- Heading + query/filter search (optional).
- **Warning banner** at top when a pending/in-progress enrollment exists (locking rule).
- Course cards: title, description, "Request Enrollment" button. Button **disabled + tooltip** when locked by active enrollment.

### My Enrollment (student)
- **State branches:**
  - `pending` → info banner + course title.
  - `in_progress` → course title, progress bar (`percentage`), "x of y lessons" count, lesson checklist (checkbox + title + type chip) each with an external "Open"/download link; disabled once completed.
  - `completed` → success/celebration card + "Browse more courses" CTA.
  - `null` (no enrollment) → EmptyState with "Browse Courses" CTA.

### History
- Completed course cards (title, category name, completion date). EmptyState "You have no completed courses yet."
- *(Note: withdrawal of an in-progress course is discussed in the API but not exposed — do **not** design a "Withdraw" action until backend supports it.)*

### Manage Courses (category admin)
- Page header with "Add Course" button opening a form (title, description).
- Course cards: title, description, actions: **View Lessons / Edit / Delete**. Edit reveals inline form. Delete requires **confirm modal**. EmptyState "No courses in your category yet."

### Course Detail / Lessons
- Header with back-link to courses.
- "Add Lesson" form: title, type toggle (`video`/`download`), URL, order.
- Lesson rows: title, type chip, order `#n`, Open link, Edit/Delete. Invalid URL should surface validation error inline.

### Enrollment Requests (admin + super admin)
- Page header + success banner.
- **Super admin only:** category filter dropdown (All Categories + list).
- Responsive `DataTable`: Student | Course | Requested date | Actions (Approve / Reject).
- Reject opens a **modal with optional reason textarea** (replaces `window.prompt`).
- EmptyState "No pending enrollment requests."

### Posts (admin + super admin)
- "New post" composer card: title, content, publish button.
- **Super admin only:** radio "Post to my category" / "Post globally to all users".
- Feed of all visible posts; each shows author, date, category **badge** (`Global` badge for null) and Delete (only if author or super admin) — hide delete otherwise.

### Assign Admins (super admin)
- Grid of per-category cards: category name, current admin (bold name+email) or "— None assigned", **Remove admin** button when assigned.
- Assign section: search input (filters pool by name/email) + dropdown of that category's students + Assign button. Disabled states when no students. Success banner + refetch after assign/deassign.

### All Students (super admin) / My Students (category admin)
- Grouped by category (section header per category) + "Uncategorized" section (nil-UUID) for super admin.
- `DataTable`: Name | Email | Current Course | Enrollment Status (badge).
- Empty per-category state: "No students in this category yet."

### Overview (super admin dashboard)
- Stat-card grid: **Total Students**, **Total Courses**, then one card per category showing its **completion count** + "completions" subtitle. `StatCard` reusable component.

---

## 10. Global UX / State Considerations

- **Loading:** skeletons or spinners on every async page; disable submit buttons while in-flight (patterns already used — standardize them).
- **Errors:** one consistent `Alert` error banner near page top; keep the raw server message (they're descriptive and user-friendly already).
- **Empty states:** always design a dedicated empty state; most endpoints can return empty arrays.
- **Success feedback:** green alert banners for approve / create / assign; auto-dismiss or remain dismissible.
- **Destructive actions:** confirm modals (delete course/lesson/post, remove admin) instead of `window.confirm`.
- **Rejection reasons:** modal with textarea instead of `window.prompt`.
- **Accessibility:** proper `<label>` for every input, `role="status"` on banners (already used in some places), focus-visible outlines, WCAG AA color contrast between muted text/backgrounds, keyboard-navigable dropdowns.
- **Responsive:** sidebar collapses to top bar / drawer on mobile; grids use `minmax(...)` auto-fill (overview already does); tables scroll horizontally on small screens.
- **Role-aware nav:** build the nav from a single source (like `Layout.jsx` NAV_LINKS today) so links match permitted routes exactly; keep `ProtectedRoute` as the security backstop.

---

## 11. Implementation Roadmap (for the redesign)

1. **Foundation:** add design tokens & base styles to `index.css`; build the reusable component kit (`Button`, `Card`, `Badge`, `Alert`, `ProgressBar`, `EmptyState`, `DataTable`, `Modal`, `Spinner`, form fields).
2. **Layout:** rebuild `Layout.jsx` as sidebar + top bar; drive nav from a role map; wire logout + user chip.
3. **Shared components migration:** refactor `PostsFeed` (used by student dashboard) and post composer.
4. **Auth screens:** redesign Login / Register / 403.
5. **Student screens:** SelectCategory, BrowseCourses, MyEnrollment, History.
6. **Admin screens:** ManageCourses, CourseDetail, EnrollmentRequests, Posts.
7. **Super admin screens:** Overview, AssignAdmins, AllStudents.
8. **Polish pass:** responsive audit, empty/library states, a11y, status badges everywhere.

*(No backend/API changes needed — the redesign is purely presentational. Any design choice is guaranteed compatible with every endpoint listed in §5.)*
