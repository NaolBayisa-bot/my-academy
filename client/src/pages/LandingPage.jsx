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
      <header className="site-header w-[min(1200px,calc(100%-48px))] mx-auto pt-[22px] pb-2.5 flex items-center justify-between border-b border-[rgba(148,175,211,0.15)] max-md:flex-wrap max-md:gap-3">
        <div className="brand-block inline-flex items-center gap-2.5">
          <div className="brand-mark bg-gradient-to-br from-cyan-default to-cyan-strong text-[#021522] font-black text-[0.8rem] rounded-lg grid place-items-center w-7 h-7 shadow-[0_0_20px_rgba(56,215,255,0.35)]">
            IS
          </div>
          <span className="brand-name font-semibold">IS Hub Academy</span>
        </div>

        <div className="header-actions flex items-center gap-3">
          <Link
            to="/login"
            className="ghost-link text-muted hover:text-cyan-default transition-colors no-underline px-4 py-2.5 rounded-[10px]"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="primary-action small inline-flex items-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_8px_24px_rgba(13,190,255,0.25)] hover:scale-[1.03] transition-all duration-200"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="landing-main relative z-[1] w-[min(1200px,calc(100%-48px))] mx-auto">
        <section className="hero-section relative py-24 md:py-32 text-center animate-fade-up">
          <div
            className="hero-glow absolute -inset-x-1/4 -top-10 h-[220px] rounded-[50%] bg-[radial-gradient(circle,rgba(32,214,255,0.35),transparent_60%)] blur-[18px] pointer-events-none animate-float-glow"
            aria-hidden="true"
          />
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-muted mb-6">
            <span className="hero-badge-dot w-2 h-2 rounded-full bg-green-default animate-pulse-soft" aria-hidden="true" />
            <span>i s h u b — v1.0.0</span>
          </div>
          <h1 className="hero-title text-4xl md:text-6xl font-black tracking-tight m-0 mb-4 leading-tight">
            Learn. Build. Innovate.
          </h1>
          <p className="hero-subtitle text-base md:text-lg text-muted max-w-[560px] mx-auto mb-8 leading-relaxed">
            IS Hub Academy is the training platform for Haramaya University&apos;s
            Information System Hub. Build real skills in Cybersecurity, Development,
            Networking, and Creative Works.
          </p>
          <div className="hero-actions flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="primary-action inline-flex items-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-7 py-3.5 rounded-xl shadow-[0_8px_24px_rgba(13,190,255,0.25)] hover:scale-[1.03] transition-all duration-200"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="secondary-action inline-flex items-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-7 py-3.5 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200"
            >
              Login
            </Link>
          </div>
        </section>

        <section className="category-section py-16">
          <h2 className="text-3xl font-bold text-center m-0 mb-2">Explore Our Categories</h2>
          <p className="text-muted text-center mb-10">Click on a category to see the full learning roadmap.</p>

          <div className="category-grid grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-md:grid-cols-2">
            {categoryRoadmaps.map((category) => (
              <button
                key={category.title}
                type="button"
                aria-label={`View ${category.title} roadmap`}
                className={`category-card group relative overflow-hidden rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 text-left cursor-pointer transition-transform duration-300 hover:-translate-y-2 ${category.gradient}`}
                style={{ boxShadow: `0 10px 40px ${category.glowColor}` }}
              >
                <div className="category-topline flex items-center justify-between text-xs text-muted mb-4">
                  <span className={`category-dot w-2 h-2 rounded-full ${
                    category.accent === 'red' ? 'bg-red-400' :
                    category.accent === 'blue' ? 'bg-blue-400' :
                    category.accent === 'green' ? 'bg-green-400' : 'bg-purple'
                  }`} />
                  <span>/category/</span>
                </div>

                <div className="category-header flex items-center gap-3 mb-3">
                  <span className="category-icon text-2xl">{category.icon}</span>
                  <h3 className="text-lg font-bold m-0">{category.title}</h3>
                </div>

                <p className="text-sm text-muted leading-relaxed mb-5">{category.description}</p>

                <div className="category-footer flex items-center gap-2 text-xs text-muted mt-auto">
                  <span className="category-arrow transition-transform duration-200 group-hover:translate-y-0.5">▼</span>
                  <span>view roadmap</span>
                  <span className="category-stage-count">({category.nodes.length} stages)</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="steps-section py-16">
          <h2 className="text-3xl font-bold text-center m-0 mb-10">
            <span className="how-arrow text-cyan-default">&gt;</span> How It Works
          </h2>

          <div className="steps-grid grid gap-5 grid-cols-1 sm:grid-cols-3 max-sm:grid-cols-1">
            {steps.map((step) => (
              <div
                key={step.number}
                className="step-card rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-6 transition-colors duration-200 hover:border-cyan-default/30"
              >
                <div className="step-number bg-gradient-to-br from-cyan-default to-cyan-strong text-[#031320] font-black w-10 h-10 rounded-xl grid place-items-center mb-4 text-lg">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold m-0 mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed m-0">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-panel my-16 rounded-2xl border border-[rgba(123,200,255,0.25)] bg-gradient-to-br from-[rgba(56,215,255,0.08)] to-[rgba(45,212,167,0.06)] p-10 md:p-14 text-center">
          <h2 className="text-3xl font-bold m-0 mb-2">Ready to Start Your Journey?</h2>
          <p className="text-muted mb-8">Join IS Hub Academy and build skills that matter.</p>
          <Link
            to="/register"
            className="primary-action inline-flex items-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-8 py-3.5 rounded-xl shadow-[0_8px_24px_rgba(13,190,255,0.25)] hover:scale-[1.03] transition-all duration-200"
          >
            Register Now
          </Link>
        </section>
      </main>

      <footer className="site-footer relative z-[1] w-[min(1200px,calc(100%-48px))] mx-auto py-8 flex items-center justify-between border-t border-[rgba(148,175,211,0.15)]">
        <div className="footer-brand flex items-center gap-2.5">
          <div className="brand-mark small bg-gradient-to-br from-cyan-default to-cyan-strong text-[#021522] font-black text-[0.66rem] rounded-lg grid place-items-center w-5 h-5">
            IS
          </div>
          <span className="text-sm text-muted">IS Hub Academy © 2026</span>
        </div>

        <div className="footer-tagline text-sm text-muted">Learn. Build. Innovate.</div>
      </footer>
    </div>
  )
}

export default LandingPage
