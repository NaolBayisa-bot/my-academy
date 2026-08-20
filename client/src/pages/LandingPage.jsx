import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole } from '../utils/dashboardPath'
import styles from './LandingPage.module.css'

function LandingPage() {
  const { user, loading } = useAuth()

  // For authenticated users, offer a direct link back into their dashboard
  // instead of the generic sign-in/register CTAs.
  const dashboardPath = dashboardPathForRole(user?.role)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          HUISHUB
        </Link>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Your personal learning hub</h1>
          <p className={styles.heroSubtitle}>
            Discover, enroll in, and master courses across every category —
            all in one place.
          </p>

          {!loading &&
            (user ? (
              <Link to={dashboardPath} className={styles.ctaPrimary}>
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className={styles.ctaPrimary}>
                  Sign in
                </Link>
                <Link to="/register" className={styles.ctaSecondary}>
                  Get started
                </Link>
              </>
            ))}
        </section>

        <section className={styles.features}>
          <div className={styles.featureCard}>
            <h3>Browse courses</h3>
            <p>Explore courses across every category and find the right path.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Track progress</h3>
            <p>Resume where you left off with automatic lesson tracking.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Stay updated</h3>
            <p>Get the latest posts and announcements from your categories.</p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} HUISHUB. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default LandingPage