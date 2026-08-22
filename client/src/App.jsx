<<<<<<< HEAD
import { useMemo, useState } from 'react'
import './App.css'

const translations = {
  en: {
    brand: 'Ishub Academy',
    tagline: 'System ready. Skills online.',
    heroTitle: 'Learn the skills that power tomorrow’s digital world.',
    heroText:
      'Built for students and teams who want a focused, modern learning path in technology, security, networking, and design.',
    primaryCta: 'Get started',
    secondaryCta: 'Browse tracks',
    topNav: 'Home',
    catTitle: 'Choose your path',
    catSubtitle:
      'Four focused learning tracks to help you build practical skills and grow with confidence.',
    development: 'Development',
    cybersecurity: 'Cybersecurity',
    networking: 'Networking',
    creativeDesign: 'Creative Design',
    devText: 'Web apps, APIs, cloud workflows, and product engineering.',
    secText: 'Threat analysis, defense strategies, and secure system thinking.',
    netText: 'Network architecture, routing, cloud connectivity, and troubleshooting.',
    designText: 'UI systems, visual storytelling, branding, and digital experiences.',
    learnTitle: 'How to start learning on the platform',
    learnSubtitle:
      'A simple path from onboarding to real-world skill building, designed for modern learners.',
    step1: 'Create your account',
    step2: 'Pick a learning track',
    step3: 'Complete guided lessons',
    step4: 'Build projects and grow',
    step1Text: 'Sign up and set your learning goals in minutes.',
    step2Text: 'Choose the path that matches your ambition and schedule.',
    step3Text: 'Follow structured lessons, labs, and interactive tasks.',
    step4Text: 'Apply what you learn through projects and team challenges.',
    featureTitle: 'Why learners choose Ishub',
    feature1Title: 'Structured path',
    feature1Text: 'Each course moves from fundamentals to practical application.',
    feature2Title: 'Mentor support',
    feature2Text: 'Get guidance, feedback, and accountability from experts.',
    feature3Title: 'Project driven',
    feature3Text: 'Build confidence through hands-on assignments and demos.',
    finalTitle: 'Ready to begin your learning journey?',
    finalText: 'Join the academy and start building real-world digital skills with a clear roadmap.',
    finalCta: 'Join now',
    statsLearners: 'Active learners',
    statsCourses: 'Course tracks',
    statsProjects: 'Projects shipped',
    statsMentors: 'Mentors online',
    login: 'Login',
    signup: 'Sign up',
    terminal: 'workspace:/academy',
    userMode: 'student@ishub:~$',
  },
  am: {
    brand: 'ኢሹብ አካዳሚ',
    tagline: 'ስርዓቱ ዝግጁ ነው። ክህሎት በመስመር ላይ።',
    heroTitle: 'በዘመናዊ ትምህርት የወደፊት ዲጂታል አለምን ይማሩ።',
    heroText:
      'ለተማሪዎች እና ቡድኖች በቴክኖሎጂ፣ ደኅንነት፣ ኔትወርክ እና ዲዛይን ውስጥ በቀላሉ የሚከተሉ የማስተማር መንገዶች ተሰርቷል።',
    primaryCta: 'ጀምር',
    secondaryCta: 'ትራኮችን ይመልከቱ',
    topNav: 'መነሻ',
    catTitle: 'መንገድዎን ይምረጡ',
    catSubtitle:
      'አራት የተወሰኑ የመማር ትራኮች በተግባራዊ ክህሎት እና ተማሪ እርዳታ ይረዱ።',
    development: 'እድገት',
    cybersecurity: 'የኮምፒዩተር ደኅንነት',
    networking: 'ኔትወርክ',
    creativeDesign: 'ፈጠራ ዲዛይን',
    devText: 'የድር መተግበሪያዎች፣ APIዎች እና የክላውድ ሂደቶች።',
    secText: 'የአደጋ ትንተና እና የደኅንነት ምልክቶችን መረዳት።',
    netText: 'የኔትወርክ አርክቴክቸር እና አስተካክል።',
    designText: 'UI ስርዓቶች እና የንድፍ ተሞክሮ።',
    learnTitle: 'በመድረኩ እንዴት መጀመር እንደሚቻል',
    learnSubtitle:
      'ከመጀመሪያ እስከ ተግባራዊ ክህሎት ድረስ በቀላሉ የሚሄድ መንገድ።',
    step1: 'መለያ ይፍጠሩ',
    step2: 'የመማር ትራክ ይምረጡ',
    step3: 'ስልጠናዎችን ያጠናቅቁ',
    step4: 'ፕሮጀክቶችን ይሠሩ',
    step1Text: 'መለያ በአጭር ጊዜ ይመዝገቡ።',
    step2Text: 'ከእርስዎ ግቦች ጋር የሚስማማ ትራክ ይምረጡ።',
    step3Text: 'ተከታታይ ትምህርት እና ልምምዶችን ይከተሉ።',
    step4Text: 'በፕሮጀክቶች እና ቡድን ተግባራት ክህሎትዎን ያዳብሩ።',
    featureTitle: 'ተማሪዎች ለምን ኢሹብን ይመርጣሉ?',
    feature1Title: 'የተዋቀረ መንገድ',
    feature1Text: 'እያንዳንዱ ኮርስ ከመሠረታዊ እስከ ተግባራዊ ክህሎት ይንቀሳቀሳል።',
    feature2Title: 'የአማካሪ ድጋፍ',
    feature2Text: 'ከባለሙያዎች ጋር አስተያየት እና የእድገት እርዳታ ያገኛሉ።',
    feature3Title: 'ፕሮጀክት ላይ የተመሰረተ',
    feature3Text: 'በእገባ እና በእውቀት የተሞላ ልምምዶች በእጅ ክህሎት ያገኛሉ።',
    finalTitle: 'የመማር ጉዞዎን ለመጀመር ዝግጁ ነዎት?',
    finalText: 'አካዳሚውን ተቀላቀሉ እና ከግል መንገድ ጋር ተግባራዊ ክህሎት ይግነጃሉ።',
    finalCta: 'አሁን ይቀላቀሉ',
    statsLearners: 'ንቁ ተማሪዎች',
    statsCourses: 'የኮርስ ትራኮች',
    statsProjects: 'የተሠሩ ፕሮጀክቶች',
    statsMentors: 'በመስመር ላይ ያሉ አማካሪዎች',
    login: 'ግባ',
    signup: 'መመዝገብ',
    terminal: 'workspace:/academy',
    userMode: 'student@ishub:~$',
  },
}

const categoryCards = [
  { key: 'development', textKey: 'devText', accent: 'cyan' },
  { key: 'cybersecurity', textKey: 'secText', accent: 'green' },
  { key: 'networking', textKey: 'netText', accent: 'violet' },
  { key: 'creativeDesign', textKey: 'designText', accent: 'amber' },
]

const featureCards = [
  { titleKey: 'feature1Title', textKey: 'feature1Text' },
  { titleKey: 'feature2Title', textKey: 'feature2Text' },
  { titleKey: 'feature3Title', textKey: 'feature3Text' },
]

const steps = [
  { titleKey: 'step1', textKey: 'step1Text' },
  { titleKey: 'step2', textKey: 'step2Text' },
  { titleKey: 'step3', textKey: 'step3Text' },
  { titleKey: 'step4', textKey: 'step4Text' },
]

const stats = [
  { value: '12.4k', key: 'statsLearners' },
  { value: '04', key: 'statsCourses' },
  { value: '340+', key: 'statsProjects' },
  { value: '28', key: 'statsMentors' },
]

function App() {
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('en')

  const t = useMemo(() => translations[language], [language])

  return (
    <div className={`app-shell ${theme}`} dir={language === 'am' ? 'ltr' : 'ltr'}>
      <div className="terminal-window">
        <header className="terminal-topbar">
          <div className="window-controls">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>

          <div className="terminal-path">{t.terminal}</div>

          <div className="top-actions">
            <div className="language-switch" aria-label="Language switcher">
              <button
                type="button"
                className={language === 'en' ? 'lang active' : 'lang'}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={language === 'am' ? 'lang active' : 'lang'}
                onClick={() => setLanguage('am')}
              >
                AM
              </button>
            </div>

            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
        </header>

        <div className="terminal-body">
          <nav className="main-nav">
            <div className="brand-block">
              <span className="brand-pill">I</span>
              <span>{t.brand}</span>
            </div>

            <div className="nav-links">
              <a href="#home">{t.topNav}</a>
              <a href="#categories">{t.catTitle}</a>
              <a href="#start">{t.learnTitle}</a>
            </div>

            <div className="nav-actions">
              <button type="button" className="ghost-button">
                {t.login}
              </button>
              <button type="button" className="primary-button">
                {t.signup}
              </button>
            </div>
          </nav>

          <main className="landing-page" id="home">
            <section className="hero-section">
              <div className="hero-copy">
                <div className="prompt-row">
                  <span className="prompt-user">{t.userMode}</span>
                  <span className="cursor">_</span>
                </div>

                <span className="section-tag">{t.brand}</span>
                <h1>{t.heroTitle}</h1>
                <p>{t.heroText}</p>

                <div className="cta-row">
                  <button type="button" className="primary-button large">
                    {t.primaryCta}
                  </button>
                  <button type="button" className="ghost-button large">
                    {t.secondaryCta}
                  </button>
                </div>

                <div className="stats-row">
                  {stats.map((stat) => (
                    <div className="mini-stat" key={stat.key}>
                      <strong>{stat.value}</strong>
                      <span>{t[stat.key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hero-visual" aria-label="Terminal dashboard preview">
                <div className="terminal-panel">
                  <div className="panel-header">
                    <span>academy_status</span>
                    <span className="status-live">live</span>
                  </div>

                  <div className="panel-body">
                    <div className="code-line">
                      <span className="code-key">$</span> boot academy
                    </div>
                    <div className="code-line muted">loading tracks...</div>
                    <div className="code-line">
                      <span className="code-key">$</span> enroll user --path=fullstack
                    </div>

                    <div className="metrics-grid">
                      <div>
                        <small>progress</small>
                        <strong>82%</strong>
                      </div>
                      <div>
                        <small>team sync</small>
                        <strong>5h</strong>
                      </div>
                      <div>
                        <small>mentor</small>
                        <strong>online</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="section-block" id="categories">
              <div className="section-header">
                <span className="section-tag">{t.brand}</span>
                <h2>{t.catTitle}</h2>
                <p>{t.catSubtitle}</p>
              </div>

              <div className="category-grid">
                {categoryCards.map((category) => (
                  <article className={`category-card ${category.accent}`} key={category.key}>
                    <div className="card-glow" />
                    <div className="category-icon" aria-hidden="true" />
                    <h3>{t[category.key]}</h3>
                    <p>{t[category.textKey]}</p>
                    <button type="button">{t.secondaryCta}</button>
                  </article>
                ))}
              </div>
            </section>

            <section className="section-block learning-block" id="start">
              <div className="section-header left">
                <span className="section-tag">{t.brand}</span>
                <h2>{t.learnTitle}</h2>
                <p>{t.learnSubtitle}</p>
              </div>

              <div className="steps-grid">
                {steps.map((step, index) => (
                  <div className="step-card" key={step.titleKey}>
                    <span className="step-number">0{index + 1}</span>
                    <h3>{t[step.titleKey]}</h3>
                    <p>{t[step.textKey]}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-block features-block">
              <div className="section-header left">
                <span className="section-tag">{t.brand}</span>
                <h2>{t.featureTitle}</h2>
              </div>

              <div className="feature-grid">
                {featureCards.map((feature) => (
                  <article className="feature-card" key={feature.titleKey}>
                    <div className="feature-icon" aria-hidden="true" />
                    <h3>{t[feature.titleKey]}</h3>
                    <p>{t[feature.textKey]}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="cta-panel">
              <div>
                <span className="section-tag">{t.brand}</span>
                <h2>{t.finalTitle}</h2>
              </div>
              <p>{t.finalText}</p>
              <button type="button" className="primary-button large">
                {t.finalCta}
              </button>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
=======
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
>>>>>>> origin/main
