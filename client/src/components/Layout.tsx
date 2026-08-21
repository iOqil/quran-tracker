import React from 'react';
import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  BarChart2,
  Bell,
  User,
  LogOut,
  Users,
  CheckSquare,
  Sparkles,
  Heart,
  Sun,
  Moon
} from 'lucide-react';
import { requestNotificationPermission, useNotifications, checkNotificationPermission } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface LayoutProps {
  lastStudied: { name: string; time: string } | null;
  adminMode: boolean;
  setAdminMode: (mode: boolean) => void;
  contextValues: any;
}

export const Layout: React.FC<LayoutProps> = ({
  lastStudied,
  adminMode,
  setAdminMode,
  contextValues
}) => {
  const { currentUser, logout, theme, toggleTheme } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationStatus, setNotificationStatus] = React.useState('default');
  const isOnline = useOnlineStatus();

  React.useEffect(() => {
    checkNotificationPermission().then(granted => {
      if (granted) setNotificationStatus('granted');
    });
  }, []);

  useNotifications(currentUser);

  if (!currentUser) return null;

  // Determine subheader title based on route
  let subtitle = "Suralar Ro'yxati";
  if (location.pathname === '/todos') subtitle = "Kunlik Reja va Vazifalar";
  else if (location.pathname === '/stats') subtitle = "Mening Progress Statistikam";
  else if (location.pathname === '/reminders') subtitle = "Takrorlash va Eslatmalar";
  else if (location.pathname === '/profile') subtitle = "Akkaunt Sozlamalari";
  else if (location.pathname === '/admin/users') subtitle = "Foydalanuvchilarni Boshqarish";

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation - Desktop only */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <Heart size={22} fill="var(--primary-dark)" color="var(--primary-dark)" />
          <span>QuranTracker</span>
        </div>
        
        <div className="sidebar-profile">
          <div className="sidebar-avatar">{currentUser.name.slice(0, 1).toUpperCase()}</div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{currentUser.name}</span>
            <span className="sidebar-profile-status">
              {currentUser.role === 'admin' ? 'Tizim Admini' : 'Yodlovchi'}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <BookOpen size={18} />
            Jadval
          </NavLink>
          <NavLink
            to="/todos"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <CheckSquare size={18} />
            Kunlik Reja
          </NavLink>
          <NavLink
            to="/stats"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <BarChart2 size={18} />
            Statistika
          </NavLink>
          <NavLink
            to="/reminders"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Bell size={18} />
            Eslatmalar
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <User size={18} />
            Profil
          </NavLink>
          {currentUser.role === 'admin' && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              Foydalanuvchilar
            </NavLink>
          )}
          <button className="sidebar-nav-item logout-btn" onClick={handleLogoutClick} style={{ marginTop: 'auto' }}>
            <LogOut size={18} />
            Chiqish (LogOut)
          </button>
        </nav>

        {lastStudied && (
          <div className="sidebar-last-studied">
            <span className="last-studied-title">Oxirgi yodlangan sura</span>
            <h4 className="last-studied-name">{lastStudied.name}</h4>
            <span className="last-studied-time">{lastStudied.time}</span>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="app-main-content">
        {!isOnline && (
          <div style={{ backgroundColor: '#ff4d4f', color: 'white', textAlign: 'center', padding: '6px', fontSize: '13px', fontWeight: 600 }}>
            Tarmoq aloqasi yo'q. Oflayn rejimdasiz. Ma'lumotlar saqlanmoqda...
          </div>
        )}
        {/* Top Header bar */}
        <header className="main-header">
          <div className="main-header-info">
            <h1 className="main-header-title">Qalbimdagi Qur'on</h1>
            <p className="main-header-subtitle">{subtitle}</p>
          </div>
          <div className="main-header-actions">
            {notificationStatus !== 'granted' && (
              <button
                className="admin-toggle-pill"
                onClick={async () => {
                  const granted = await requestNotificationPermission(currentUser.token);
                  if (granted) setNotificationStatus('granted');
                }}
                title="Eslatmalar uchun ruxsat berish"
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)' }}
              >
                <Bell size={16} />
                <span className="desktop-only">Eslatmalarni yoqish</span>
              </button>
            )}
            
            {/* Theme Toggle Button */}
            <button
              className="admin-toggle-pill"
              onClick={toggleTheme}
              title="Mavzuni o'zgartirish"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span className="desktop-only">{theme === 'light' ? 'Tungi' : 'Kunduzgi'}</span>
            </button>

            {currentUser.role === 'admin' && location.pathname === '/' && (
              <button
                className={`admin-toggle-pill ${adminMode ? 'active' : ''}`}
                onClick={() => setAdminMode(!adminMode)}
                title="Sura qo'shish paneli"
              >
                <Sparkles size={16} />
                <span className="desktop-only">Admin Rejimi</span>
              </button>
            )}
            <button className="admin-toggle-pill mobile-only" onClick={handleLogoutClick} title="Tizimdan chiqish">
              <LogOut size={16} />
            </button>
          </div>
        </header>



        {/* Child Pages Outlet */}
        <Outlet context={contextValues} />
      </main>

      {/* Bottom Nav Bar - Mobile only */}
      <nav className="bottom-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BookOpen className="nav-item-icon" />
          <span className="nav-item-text">Jadval</span>
        </NavLink>
        <NavLink
          to="/stats"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BarChart2 className="nav-item-icon" />
          <span className="nav-item-text">Statistika</span>
        </NavLink>
        <NavLink
          to="/todos"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <CheckSquare className="nav-item-icon" />
          <span className="nav-item-text">Reja</span>
        </NavLink>
        <NavLink
          to="/reminders"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Bell className="nav-item-icon" />
          <span className="nav-item-text">Eslatmalar</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <User className="nav-item-icon" />
          <span className="nav-item-text">Profil</span>
        </NavLink>
        {currentUser.role === 'admin' && (
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Users className="nav-item-icon" />
            <span className="nav-item-text">Userlar</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
};
