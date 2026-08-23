import { Link } from 'react-router-dom'

const categories = [
    {
        name: 'Cybersecurity',
        description: 'Network security, ethical hacking, cryptography, and security operations.',
        tag: 'view roadmap',
        accent: 'cyan',
    },
    {
        name: 'Development',
        description: 'Software engineering, web development, mobile apps, and DevOps.',
        tag: 'view roadmap',
        accent: 'purple',
    },
    {
        name: 'Networking',
        description: 'Network administration, routing, switching, and cloud infrastructure.',
        tag: 'view roadmap',
        accent: 'blue',
    },
    {
        name: 'Creative Works',
        description: 'Graphic design, video editing, UI/UX, and digital content creation.',
        tag: 'view roadmap',
        accent: 'pink',
    },
]

const steps = [
    {
        number: '1',
        title: 'Register',
        description: 'Create an account and choose the learning path that matches your goals.',
    },
    {
        number: '2',
        title: 'Get Approved',
        description: 'Our team reviews your profile and confirms your access to the right category.',
    },
    {
        number: '3',
        title: 'Start Learning',
        description: 'Access training, complete learning modules, and track your progress.',
    },
]

function LandingPage() {
    return (
        <div className="page-shell">
            <header className="site-header">
                <div className="brand-block">
                    <div className="brand-mark">IS</div>
                    <span className="brand-name">IS Hub Academy</span>
                </div>

                <div className="header-actions">
                    <button type="button" className="header-icon-button" aria-label="Help">
                        ?
                    </button>
                    <button type="button" className="header-icon-button" aria-label="Info">
                        i
                    </button>
                    <Link to="/login" className="ghost-link">
                        Login
                    </Link>
                    <Link to="/register" className="primary-action small">
                        Get started
                    </Link>
                </div>
            </header>

            <main className="landing-main">
                <section className="hero-section">
                    <div className="hero-glow" aria-hidden="true" />
                    <div className="hero-badge">e i s h u b — v1.0.0</div>
                    <h1 className="hero-title">Learn. Build. Innovate.</h1>
                    <p className="hero-subtitle">
                        IS Hub Academy is the training platform for Haramaya University&apos;s Information
                        System Hub. Build real skills in Cybersecurity, Development, Networking, and
                        Creative Works.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="primary-action">
                            Get started
                        </Link>
                        <Link to="/login" className="secondary-action">
                            Login
                        </Link>
                    </div>
                </section>

                <section className="category-section">
                    <h2>Explore Our Categories</h2>
                    <p>Click on a category to see the full learning roadmap.</p>

                    <div className="category-grid">
                        {categories.map((category) => (
                            <article key={category.name} className={`category-card ${category.accent}`}>
                                <div className="card-topline">/category/</div>
                                <div className="category-icon" aria-hidden="true">
                                    ◆
                                </div>
                                <h3>{category.name}</h3>
                                <p>{category.description}</p>
                                <span>{category.tag}</span>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="steps-section">
                    <h2>How It Works</h2>

                    <div className="steps-grid">
                        {steps.map((step) => (
                            <div key={step.number} className="step-card">
                                <div className="step-number">{step.number}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="cta-panel">
                    <h2>Ready to Start Your Journey?</h2>
                    <p>Join IS Hub Academy and build skills that matter.</p>
                    <Link to="/register" className="primary-action">
                        Register Now
                    </Link>
                </section>
            </main>

            <footer className="site-footer">
                <div className="footer-brand">
                    <div className="brand-mark small">IS</div>
                    <span>IS Hub Academy © 2026</span>
                </div>

                <div className="footer-tagline">Learn. Build. Innovate.</div>
            </footer>
        </div>
    )
}

export default LandingPage
