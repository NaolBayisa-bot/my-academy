import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { Button } from '../components/ui'

const categories = [
  {
    id: 1,
    title: 'Cybersecurity',
    icon: '🛡️',
    color: 'from-red-500 to-red-600',
    glowColor: 'rgba(239, 68, 68, 0.2)',
    description: 'Master network security, ethical hacking, and cryptography',
    students: '2,340',
    courses: 12,
    difficulty: 'Advanced',
  },
  {
    id: 2,
    title: 'Development',
    icon: '💻',
    color: 'from-blue-500 to-blue-600',
    glowColor: 'rgba(59, 130, 246, 0.2)',
    description: 'Learn full-stack development and modern frameworks',
    students: '5,890',
    courses: 18,
    difficulty: 'Intermediate',
  },
  {
    id: 3,
    title: 'Networking',
    icon: '🌐',
    color: 'from-green-500 to-green-600',
    glowColor: 'rgba(34, 197, 94, 0.2)',
    description: 'Build expertise in network administration and infrastructure',
    students: '1,560',
    courses: 10,
    difficulty: 'Intermediate',
  },
  {
    id: 4,
    title: 'Creative Works',
    icon: '🎨',
    color: 'from-purple-500 to-purple-600',
    glowColor: 'rgba(168, 85, 247, 0.2)',
    description: 'Create stunning designs and visual content',
    students: '3,210',
    courses: 14,
    difficulty: 'Beginner',
  },
]

const features = [
  {
    icon: '📚',
    title: 'Expert-Led Courses',
    description: 'Learn from industry professionals with years of experience',
  },
  {
    icon: '🎯',
    title: 'Structured Paths',
    description: 'Follow carefully designed learning roadmaps',
  },
  {
    icon: '🏆',
    title: 'Certifications',
    description: 'Earn recognized certificates upon completion',
  },
  {
    icon: '👥',
    title: 'Community',
    description: 'Connect with thousands of learners worldwide',
  },
  {
    icon: '⚡',
    title: 'Hands-On Projects',
    description: 'Build real-world projects and portfolio pieces',
  },
  {
    icon: '🚀',
    title: 'Career Support',
    description: 'Get guidance and support for your career growth',
  },
]

const stats = [
  { number: '10K+', label: 'Active Learners', icon: '👨‍🎓' },
  { number: '50+', label: 'Expert Courses', icon: '📖' },
  { number: '95%', label: 'Satisfaction Rate', icon: '⭐' },
  { number: '24/7', label: 'Community Support', icon: '💬' },
]

const steps = [
  {
    number: '01',
    title: 'Register',
    description: 'Create your account and choose your learning path',
    icon: '📝',
  },
  {
    number: '02',
    title: 'Get Approved',
    description: 'Our team reviews your profile and grants access',
    icon: '✅',
  },
  {
    number: '03',
    title: 'Start Learning',
    description: 'Access courses, build projects, and grow your skills',
    icon: '🚀',
  },
]

function LandingPage() {
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      setScrollProgress(scrolled / windowHeight)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="bg-[#0a1428] text-white overflow-hidden">
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-40 sticky top-0 backdrop-blur-md bg-[#0a1428]/80 border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-[#0a1428] text-sm">
              IS
            </div>
            <span className="font-bold text-lg hidden sm:inline">IS Hub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#categories" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">Categories</a>
            <a href="#features" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">How It Works</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="text-sm px-3 sm:px-4 py-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-all"
            >
              Login
            </Link>
            <Button renderAs={Link} to="/register" size="sm" className="text-xs sm:text-sm">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20 sm:py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs sm:text-sm text-cyan-300 font-medium">Welcome to IS Hub Academy</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Master Your Skills
            </span>
            <br />
            <span className="text-white">Shape Your Future</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Learn from industry experts. Build real projects. Earn certifications. Join thousands of successful learners at IS Hub Academy and transform your career.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button renderAs={Link} to="/register" size="lg" className="w-full sm:w-auto">
              Start Learning Today
            </Button>
            <button className="w-full sm:w-auto px-6 py-3 rounded-lg border border-cyan-500/50 text-cyan-400 font-semibold hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-2">
              <span>▶</span>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 pt-12 border-t border-gray-800">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center group hover:scale-105 transition-transform">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400">{stat.number}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-4">Why Choose IS Hub?</h2>
          <p className="text-gray-400 text-center mb-16 text-sm sm:text-base">Everything you need to accelerate your learning and career growth</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-4">Learning Categories</h2>
          <p className="text-gray-400 text-center mb-16 text-sm sm:text-base">Choose your path and start your journey</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/60 to-gray-900/20 p-6 text-left cursor-pointer hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg h-full"
                style={{ boxShadow: expandedCategory === category.id ? `0 0 30px ${category.glowColor}` : 'none' }}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <div className="relative z-10">
                  <div className="text-5xl mb-4">{category.icon}</div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">{category.title}</h3>

                  <p className="text-sm text-gray-400 mb-4">{category.description}</p>

                  {/* Expandable Content */}
                  <div className={`overflow-hidden transition-all duration-300 ${expandedCategory === category.id ? 'max-h-40' : 'max-h-0'}`}>
                    <div className="pt-4 border-t border-gray-700 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Students:</span>
                        <span className="text-cyan-400 font-semibold">{category.students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Courses:</span>
                        <span className="text-cyan-400 font-semibold">{category.courses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Level:</span>
                        <span className="text-cyan-400 font-semibold">{category.difficulty}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs text-gray-500">Explore →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-4">How It Works</h2>
          <p className="text-gray-400 text-center mb-16 text-sm sm:text-base">Get started in three simple steps</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/60 to-gray-900/20 p-8 text-center hover:border-cyan-500/50 transition-all duration-300 h-full">
                  <div className="text-5xl mb-4">{step.icon}</div>
                  <div className="text-4xl font-black text-cyan-400 mb-3">{step.number}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>

                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-1 bg-gradient-to-r from-cyan-500 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-8 sm:p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Ready to Transform Your Future?</h2>
          <p className="text-gray-400 mb-8 text-sm sm:text-base">Join thousands of successful learners at IS Hub Academy</p>

          <Button renderAs={Link} to="/register" size="lg" className="w-full sm:w-auto">
            Get Started Now
          </Button>

          <p className="text-xs text-gray-500 mt-6">
            ✓ No credit card required • ✓ Free tier available • ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        @media (max-width: 640px) {
          .text-4xl {
            font-size: 2rem;
          }
          .text-5xl {
            font-size: 2.5rem;
          }
          .text-7xl {
            font-size: 3rem;
          }
        }
      `}</style>
    </div>
  )
}

export default LandingPage
