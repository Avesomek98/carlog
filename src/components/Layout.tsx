import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home as IconHome, Wrench as IconWrench, ShieldCheck as IconShield, History as IconHistory, Wallet as IconWallet, Settings as IconSettings } from 'lucide-react';
import VehicleSwitcher from './VehicleSwitcher';

const TABS = [
  { to: '/', label: 'Start', icon: IconHome, end: true },
  { to: '/serwis', label: 'Serwis', icon: IconWrench },
  { to: '/prawne', label: 'Prawne', icon: IconShield },
  { to: '/historia', label: 'Historia', icon: IconHistory },
  { to: '/budzet', label: 'Budżet', icon: IconWallet },
];

const SIDEBAR_TABS = [...TABS, { to: '/ustawienia', label: 'Ustawienia', icon: IconSettings, end: false }];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">CL</span>
          <span className="app-title">CarLog</span>
        </div>
        <div className="sidebar-switcher">
          <VehicleSwitcher />
        </div>
        <nav className="sidebar-nav">
          {SIDEBAR_TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-column">
        <header className="app-header">
          <VehicleSwitcher />
          <NavLink to="/ustawienia" className="header-icon-btn" aria-label="Ustawienia">
            <IconSettings size={20} />
          </NavLink>
        </header>

        <main className="app-content">
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </main>

        <nav className="bottom-nav">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
