import { Link } from 'react-router-dom'

const categoryRoadmaps = [
  {
    title: 'Cybersecurity',
    accent: 'red',
    glowColor: 'rgba(239, 68, 68, 0.16)',
    gradient: 'cyber-gradient',
    icon: '🛡️',
    description: 'Network security, ethical hacking, cryptography, and security operations.',
    nodes: [
      {
        title: 'Security Fundamentals',
        description: 'Learn core security concepts, threat modeling, and risk assessment methodologies.',
        duration: '4 weeks',
        skills: ['Threat Analysis', 'Risk Assessment', 'Security Policies', 'Compliance'],
      },
      {
        title: 'Network Security',
        description: 'Master firewall configuration, IDS/IPS, VPNs, and secure network architecture.',
        duration: '6 weeks',
        skills: ['Firewalls', 'IDS/IPS', 'VPNs', 'Network Hardening'],
      },
      {
        title: 'Ethical Hacking',
        description: 'Hands-on penetration testing, vulnerability assessment, and exploit development.',
        duration: '8 weeks',
        skills: ['Pen Testing', 'Reconnaissance', 'Exploitation', 'Reporting'],
      },
      {
        title: 'Cryptography & Compliance',
        description: 'Deep dive into encryption algorithms, PKI, and security compliance frameworks.',
        duration: '4 weeks',
        skills: ['Encryption', 'PKI', 'ISO 27001', 'GDPR'],
      },
    ],
  },
  {
    title: 'Development',
    accent: 'blue',
    glowColor: 'rgba(59, 130, 246, 0.16)',
    gradient: 'dev-gradient',
    icon: '💻',
    description: 'Software engineering, web development, mobile apps, and DevOps.',
    nodes: [
      {
        title: 'Frontend Fundamentals',
        description: 'HTML, CSS, JavaScript, TypeScript, and modern frontend frameworks.',
        duration: '6 weeks',
        skills: ['HTML/CSS', 'JavaScript', 'TypeScript', 'React'],
      },
      {
        title: 'Backend Development',
        description: 'Server-side programming, REST APIs, databases, and authentication.',
        duration: '6 weeks',
        skills: ['Node.js', 'NestJS', 'PostgreSQL', 'REST APIs'],
      },
      {
        title: 'Mobile & DevOps',
        description: 'Cross-platform mobile development, CI/CD pipelines, and cloud deployment.',
        duration: '6 weeks',
        skills: ['React Native', 'Docker', 'CI/CD', 'Cloud Services'],
      },
      {
        title: 'Full-Stack Project',
        description: 'Capstone project building a complete production-ready application.',
        duration: '4 weeks',
        skills: ['Architecture', 'Testing', 'Deployment', 'Documentation'],
      },
    ],
  },
  {
    title: 'Networking',
    accent: 'green',
    glowColor: 'rgba(34, 197, 94, 0.15)',
    gradient: 'net-gradient',
    icon: '🌐',
    description: 'Network administration, routing, switching, and cloud infrastructure.',
    nodes: [
      {
        title: 'Networking Basics',
        description: 'OSI model, TCP/IP, subnetting, and basic network troubleshooting.',
        duration: '4 weeks',
        skills: ['OSI Model', 'TCP/IP', 'Subnetting', 'Troubleshooting'],
      },
      {
        title: 'Routing & Switching',
        description: 'Configure routers and switches, VLANs, STP, and dynamic routing protocols.',
        duration: '8 weeks',
        skills: ['Routing', 'Switching', 'VLANs', 'OSPF/EIGRP'],
      },
      {
        title: 'Cloud Infrastructure',
        description: 'AWS/Azure networking, VPC design, load balancing, and auto-scaling.',
        duration: '6 weeks',
        skills: ['AWS VPC', 'Load Balancing', 'Auto Scaling', 'DNS'],
      },
      {
        title: 'Network Automation',
        description: 'Scripting network configurations, Ansible, and network monitoring tools.',
        duration: '4 weeks',
        skills: ['Python', 'Ansible', 'SNMP', 'Monitoring'],
      },
    ],
  },
  {
    title: 'Creative Works',
    accent: 'purple',
    glowColor: 'rgba(168, 85, 247, 0.15)',
    gradient: 'creative-gradient',
    icon: '🎨',
    description: 'Graphic design, video editing, UI/UX, and digital content creation.',
    nodes: [
      {
        title: 'Design Fundamentals',
        description: 'Color theory, typography, composition, and design principles.',
        duration: '4 weeks',
        skills: ['Color Theory', 'Typography', 'Layout', 'Branding'],
      },
      {
        title: 'UI/UX Design',
        description: 'User research, wireframing, prototyping, and usability testing.',
        duration: '6 weeks',
        skills: ['Wireframing', 'Figma', 'Prototyping', 'User Testing'],
      },
      {
        title: 'Motion & Video',
        description: 'Animation principles, video editing, motion graphics, and post-production.',
        duration: '6 weeks',
        skills: ['After Effects', 'Premiere Pro', 'Animation', 'Color Grading'],
      },
      {
        title: 'Digital Portfolio',
        description: 'Build a professional portfolio showcasing your creative work.',
        duration: '4 weeks',
        skills: ['Portfolio', 'Presentation', 'Freelancing', 'Personal Brand'],
      },
    ],
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
          <div className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            <span>e i s h u b — v1.0.0</span>
          </div>
          <h1 className="hero-title">Learn. Build. Innovate.</h1>
          <p className="hero-subtitle">
            IS Hub Academy is the training platform for Haramaya University&apos;s
            Information System Hub. Build real skills in Cybersecurity, Development,
            Networking, and Creative Works.
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
            {categoryRoadmaps.map((category) => (
              <button
                key={category.title}
                type="button"
                className={`category-card ${category.accent}`}
                aria-label={`View ${category.title} roadmap`}
              >
                <div className="category-topline">
                  <span className={`category-dot ${category.accent}`} />
                  <span>/category/</span>
                </div>

                <div className="category-header">
                  <span className="category-icon">{category.icon}</span>
                  <h3>{category.title}</h3>
                </div>

                <p>{category.description}</p>

                <div className="category-footer">
                  <span className="category-arrow">▼</span>
                  <span>view roadmap</span>
                  <span className="category-stage-count">({category.nodes.length} stages)</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="steps-section">
          <h2><span className="how-arrow">&gt;</span> How It Works</h2>

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
