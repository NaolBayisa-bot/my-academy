import { createContext, useContext, useState } from 'react'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => setIsCollapsed(prev => !prev)
  const collapseSidebar = () => setIsCollapsed(true)
  const expandSidebar = () => setIsCollapsed(false)

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleSidebar, collapseSidebar, expandSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
