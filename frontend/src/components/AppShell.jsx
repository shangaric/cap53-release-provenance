import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity, Bell, CheckSquare, ChevronRight, ClipboardCheck,
  Command, LayoutDashboard, Menu, PackageCheck, ShieldCheck, X,
} from 'lucide-react'

const navigation = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Releases', path: '/releases', icon: PackageCheck },
  { label: 'Deployments', path: '/deployments', icon: Activity },
  { label: 'Approvals', path: '/approvals', icon: ShieldCheck },
  { label: 'Test evidence', path: '/test-evidence', icon: ClipboardCheck },
]

const pageTitles = {
  '/': 'Overview',
  '/releases': 'Releases',
  '/deployments': 'Deployments',
  '/approvals': 'Approvals',
  '/test-evidence': 'Test evidence',
}

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = location.pathname.startsWith('/releases/')
    ? 'Release details'
    : (pageTitles[location.pathname] || 'ReleaseTrack')

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Command size={20} strokeWidth={2.5} /></div>
          <div><span className="brand-name">ReleaseTrack</span><span className="brand-caption">RELEASE OPERATIONS</span></div>
          <button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">RT</div>
          <div className="workspace-copy"><strong>Release workspace</strong><span>Personal workspace</span></div>
          <ChevronRight className="workspace-chevron" size={16} />
        </div>
        <p className="nav-section-label">WORKSPACE</p>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`} onClick={() => setSidebarOpen(false)}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>
              {label === 'Approvals' && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><div className="help-icon"><CheckSquare size={17} /></div><strong>All systems in view</strong><span>Keep releases clear and traceable.</span></div>
          <div className="profile">
            <div className="profile-avatar">RT</div>
            <div className="profile-copy"><strong>Release team</strong><span>Workspace member</span></div>
            <button className="icon-button profile-action" aria-label="Notifications"><Bell size={17} /></button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{title}</strong></div>
          <div className="topbar-right"><span className="environment-indicator"><span />Application workspace</span><div className="topbar-avatar">RT</div></div>
        </header>
        <main className="page-content"><Outlet /></main>
        <footer className="app-footer"><span>ReleaseTrack</span><span>Release management, made clear.</span></footer>
      </div>
    </div>
  )
}
