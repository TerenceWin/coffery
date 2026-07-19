import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import LangSwitcher from './LangSwitcher';
import { clearSession } from '../utils/storage';

const CoffeeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4z"/>
    <path d="M6 1v3M10 1v3M14 1v3"/>
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
);

interface NavbarProps {
  variant: 'boss' | 'staff';
  userName?: string;
  callCount?: number;
}

export default function Navbar({ variant, userName, callCount = 0 }: NavbarProps) {
  const { t } = useLang();
  const navigate = useNavigate();

  async function logout() {
    await clearSession();
    navigate('/');
  }

  if (variant === 'boss') {
    return (
      <nav className="dash-nav">
        <div className="nav-brand">
          <CoffeeIcon />
          <span>Hana Coffee</span>
        </div>
        <div className="nav-right">
          <span className="nav-user">{userName}</span>
          <LangSwitcher variant="light" />
          <button className="btn-logout" onClick={logout}>
            <LogoutIcon />
            {t('signOut')}
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <CoffeeIcon />
        <span className="navbar-brand-name">Hana Coffee</span>
      </div>
      <span className="badge badge-staff">Staff</span>
      {callCount > 0 && (
        <div className="nav-call-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {callCount}&nbsp;{t('tablesCalling')}
        </div>
      )}
      <LangSwitcher variant="dark" />
      <div className="navbar-user">
        <div className="navbar-avatar">{userName?.charAt(0).toUpperCase()}</div>
        <span className="navbar-username">{userName}</span>
      </div>
      <button className="btn-logout" onClick={logout}>
        <LogoutIcon />
        {t('signOut')}
      </button>
    </nav>
  );
}