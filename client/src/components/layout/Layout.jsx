import { Outlet } from 'react-router-dom'
import { useSidebar } from '../../context/SidebarContext'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function Layout() {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-tech-surface">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
