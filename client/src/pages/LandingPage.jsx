import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeToggleContext'
import Button from '../components/ui/Button'

const categoryRoadmaps = [
  {
    title: 'Cybersecurity',
    color: 'bg-red-500',
    glowColor: 'rgba(239, 68, 68, 0.15)',
    gradient: 'from-red-500/20 to-red-500/5',
    icon: '🛡️',
    description: 'Network security, ethical hacking, cryptography, and security operations.',
    nodes: [
      {
        title: 'Security Fundamentals',
        description:
          'Learn core security concepts, threat modeling, and risk assessment methodologies.',
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
        description:
          'Hands-on penetration testing, vulnerability assessment, and exploit development.',
        duration: '8 weeks',
        skills: ['Pen Testing', 'Reconnaissance', 'Exploitation', 'Reporting'],
      },
      {
        title: 'Cryptography & Compliance',
        description:
          'Deep dive into encryption algorithms, PKI, and security compliance frameworks.',
        duration: '4 weeks',
        skills: ['Encryption', 'PKI', 'ISO 27001', 'GDPR'],
      },
    ],
  },
  {
    title: 'Development',
    color: 'bg-blue-500',
    glowColor: 'rgba(59, 130, 246, 0.15)',
    gradient: 'from-blue-500/20 to-blue-500/5',
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
        description:
          'Server-side programming, REST APIs, databases, and authentication.',
        duration: '6 weeks',
        skills: ['Node.js', 'NestJS', 'PostgreSQL', 'REST APIs'],
      },
      {
        title: 'Mobile & DevOps',
        description:
          'Cross-platform mobile development, CI/CD pipelines, and cloud deployment.',
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
    color: 'bg-green-500',
    glowColor: 'rgba(34, 197, 94, 0.15)',
    gradient: 'from-green-500/20 to-green-500/5',
    icon: '🌐',
    description: 'Network administration, routing, switching, and cloud infrastructure.',
    nodes: [
      {
        title: 'Networking Basics',
        description:
          'OSI model, TCP/IP, IP addressing, subnetting, and basic protocols.',
        duration: '4 weeks',
        skills: ['OSI Model', 'TCP/IP', 'Subnetting', 'Routing Basics'],
      },
      {
        title: 'Routing & Switching',
        description:
          'Configure routers and switches, VLANs, STP, and dynamic routing protocols.',
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
    color: 'bg-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.15)',
    gradient: 'from-purple-500/20 to-purple-500/5',
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

function BulletItem({ node, index, isVisible, color }) {
  return (
    <div
      className={`flex items-start gap-3 py-2.5 transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="relative flex-shrink-0 mt-1.5">
        <div
          className={`w-2.5 h-2.5 rounded-full ${color} transition-all duration-300 ${
            isVisible ? 'scale-100' : 'scale-0'
          }`}
          style={{ transitionDelay: `${index * 120 + 150}ms` }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-0.5">
          <h4
            className={`text-sm font-semibold text-slate-900 dark:text-white transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{ transitionDelay: `${index * 120 + 80}ms` }}
          >
            {node.title}
          </h4>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all duration-300 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
            style={{ transitionDelay: `${index * 120 + 180}ms` }}
          >
            {node.duration}
          </span>
        </div>
        <p
          className={`text-xs text-slate-500 dark:text-slate-400 leading-relaxed transition-all duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: `${index * 120 + 120}ms` }}
        >
          {node.description}
        </p>
      </div>
    </div>
  )
}

function totalWeeks(nodes) {
  return nodes.reduce((acc, n) => acc + parseInt(n.duration), 0)
}

function LandingNavbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="bg-white/90 dark:bg-tech-surface/90 backdrop-blur-md border-b border-slate-200 dark:border-tech-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Brand */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400 font-mono tracking-wider">
              IS Hub Academy
            </span>
          </div>

          {/* Right - Controls */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-tech-border dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Login */}
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>

            {/* Register */}
            <Link to="/register">
              <Button size="sm">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function LandingFooter() {
  return (
    <footer className="bg-white dark:bg-tech-surface border-t border-slate-200 dark:border-tech-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">IS</span>
            </div>
            <span className="text-sm text-slate-400 dark:text-slate-500">
              IS Hub Academy &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-600 font-mono tracking-wider">
            Learn. Build. Innovate.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const [expandedCategory, setExpandedCategory] = useState(null)

  const toggleCategory = (title) => {
    setExpandedCategory((prev) => (prev === title ? null : title))
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-tech-surface">
      {/* Navbar */}
      <LandingNavbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-slate-900 dark:bg-tech-surface overflow-hidden">
          <div className="absolute inset-0 bg-tech-grid opacity-20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-hero-glow" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/20 bg-primary-500/5 text-primary-400 text-sm font-mono mb-6">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                <span>ishub ~ v1.0.0</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                Learn.<span className="text-primary-400"> Build.</span> Innovate.
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl leading-relaxed">
                IS Hub Academy is the training platform for Haramaya University's
                Information System Hub. Build real skills in Cybersecurity, Development,
                Networking, and Creative Works.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow duration-300">
                    $ get-started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="ghost" className="text-slate-300 border border-slate-700 hover:bg-slate-800 hover:border-slate-600">
                    $ login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
        </section>

        {/* Categories with Animated Roadmaps */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center mb-4">
            Explore Our Categories
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-12 max-w-xl mx-auto">
            Click on a category to see the full learning roadmap.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryRoadmaps.map((cat) => {
              const isExpanded = expandedCategory === cat.title
              return (
                <div key={cat.title} className="flex flex-col group/cat">
                  <button
                    onClick={() => toggleCategory(cat.title)}
                    className={`relative card-tech rounded-tech p-6 cursor-pointer text-left transition-all duration-300 ease-out
                      hover:-translate-y-2 hover:shadow-xl
                      ${
                        isExpanded
                          ? 'ring-2 ring-primary-500/30 dark:ring-primary-400/20 scale-[1.02]'
                          : 'hover:scale-[1.03]'
                      }
                  `}
                    style={{
                      transitionProperty: 'all',
                      boxShadow: isExpanded ? `0 8px 32px ${cat.glowColor}` : undefined,
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-tech opacity-0 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at 50% 0%, ${cat.glowColor} 0%, transparent 70%)`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                    />

                    <div className="relative flex items-center gap-3 mb-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${cat.color} transition-all duration-300
                        group-hover/cat:scale-150 group-hover/cat:shadow-lg
                        ${isExpanded ? 'animate-ping' : ''}
                      `}/>
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500 transition-all duration-300
                        group-hover/cat:translate-x-1 group-hover/cat:text-primary-400">
                        ~/category/
                      </span>
                    </div>

                    <div className="relative flex items-center gap-2 mb-2">
                      <span
                        className="text-lg inline-block transition-all duration-300 ease-out
                          group-hover/cat:scale-125 group-hover/cat:-translate-y-0.5
                          group-hover/cat:animate-bounce"
                        style={{ animationDuration: '0.6s' }}
                      >
                        {cat.icon}
                      </span>
                      <h3
                        className="text-lg font-semibold text-slate-900 dark:text-white
                          group-hover/cat:text-primary-500 dark:group-hover/cat:text-primary-400
                          transition-colors duration-300"
                      >
                        {cat.title}
                      </h3>
                    </div>

                    <p
                      className="relative text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3
                        transition-all duration-300 group-hover/cat:text-slate-700 dark:group-hover/cat:text-slate-300"
                    >
                      {cat.description}
                    </p>

                    <div
                      className="relative flex items-center gap-2 text-xs font-mono
                        text-primary-500 dark:text-primary-400
                        transition-all duration-300 group-hover/cat:tracking-wider
                    ">
                      <span className="transition-transform duration-300 inline-block group-hover/cat:translate-x-1">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                      <span>{isExpanded ? 'collapse roadmap' : 'view roadmap'}</span>
                      <span className="text-slate-400 transition-all duration-300 group-hover/cat:opacity-100 opacity-60">
                        ({cat.nodes.length} stages)
                      </span>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out
                      ${isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
                    `}
                  >
                    <div className={`rounded-tech p-4 bg-gradient-to-b ${cat.gradient} border border-slate-200 dark:border-tech-border`}>
                      <div className="flex items-center gap-2 mb-2 text-xs font-mono text-slate-500 dark:text-slate-400"
                        style={{ transitionDelay: '80ms' }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full bg-current ${isExpanded ? 'animate-pulse' : ''}`} />
                        <span>
                          ~/roadmap/{cat.title.toLowerCase().replace(/\s+/g, '-')}
                        </span>
                      </div>

                      <div className="pl-1">
                        {cat.nodes.map((node, index) => (
                          <BulletItem
                            key={node.title}
                            node={node}
                            index={index}
                            isVisible={isExpanded}
                            color={cat.color}
                          />
                        ))}
                      </div>

                      <div
                        className={`text-center transition-all duration-500 delay-[600ms]
                          ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                        `}
                      >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                          bg-primary-500/10 text-primary-400 text-xs font-mono
                          border border-primary-500/20
                          hover:bg-primary-500/20 hover:scale-105 hover:shadow-tech-glow
                          transition-all duration-300 cursor-default
                        ">
                          <span className="inline-block animate-bounce" style={{ animationDuration: '1s' }}>🎯</span>
                          <span>
                            {cat.nodes.length} stages · ~
                            {totalWeeks(cat.nodes)} weeks total
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-slate-50 dark:bg-tech-card/50 border-y border-slate-200 dark:border-tech-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center mb-4 font-mono">
              <span className="text-primary-500">{'>'}</span> How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Register', desc: 'Create an account with your university details and pick your preferred learning category.' },
                { step: '2', title: 'Get Approved', desc: 'Our admins review your registration and assign you to a category.' },
                { step: '3', title: 'Start Learning', desc: 'Access trainings, complete lessons, take quizzes, and track your progress.' },
              ].map((item) => (
                <div key={item.step} className="text-center group/step">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4
                    transition-all duration-300 group-hover/step:scale-110 group-hover/step:shadow-lg group-hover/step:shadow-primary-500/25
                    group-hover/step:-translate-y-1">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2
                    transition-colors duration-300 group-hover/step:text-primary-500 dark:group-hover/step:text-primary-400">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300
                    group-hover/step:text-gray-700 dark:group-hover/step:text-gray-300">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Join IS Hub Academy and build skills that matter.
          </p>
          <Link to="/register">
            <Button size="lg">Register Now</Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
