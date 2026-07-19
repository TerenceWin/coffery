import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import LangSwitcher from './LangSwitcher';
import { clearSession, changePassword } from '../utils/storage';

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

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5L18 5M12 11l3.5 3.5"/>
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
  const [pwOpen, setPwOpen] = useState(false);

  async function logout() {
    await clearSession();
    navigate('/');
  }

  if (variant === 'boss') {
    return (
      <>
        <nav className="dash-nav">
          <div className="nav-brand">
            <CoffeeIcon />
            <span>Hana Coffee</span>
          </div>
          <div className="nav-right">
            <span className="nav-user">{userName}</span>
            <LangSwitcher variant="light" />
            <button className="btn-logout" onClick={() => setPwOpen(true)} title={t('changePassword')}>
              <KeyIcon />
            </button>
            <button className="btn-logout" onClick={logout}>
              <LogoutIcon />
              {t('signOut')}
            </button>
          </div>
        </nav>
        <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
      </>
    );
  }

  return (
    <>
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
        <button className="btn-logout" onClick={() => setPwOpen(true)} title={t('changePassword')}>
          <KeyIcon />
        </button>
        <button className="btn-logout" onClick={logout}>
          <LogoutIcon />
          {t('signOut')}
        </button>
      </nav>
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </>
  );
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    setError(''); setSuccess(false); setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t('errFillAll'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('errPasswordLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('errPasswordMismatch'));
      return;
    }
    setSaving(true);
    try {
      await changePassword(oldPassword, newPassword);
      setSuccess(true);
      setTimeout(handleClose, 1500);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || t('errNetwork'));
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-head">
          <h3>{t('changePassword')}</h3>
          <button className="btn-close" onClick={handleClose}>&times;</button>
        </div>
        {success ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--coffee, #5C2E0E)' }}>
            {t('passwordUpdated')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '18px 20px' }}>
            <div className="form-group">
              <label>{t('currentPassword')}</label>
              <input className="form-input" type="password" value={oldPassword}
                onChange={e => { setOldPassword(e.target.value); setError(''); }}
                autoComplete="current-password" />
            </div>
            <div className="form-group">
              <label>{t('newPassword')}</label>
              <input className="form-input" type="password" value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label>{t('confirmNewPassword')}</label>
              <input className="form-input" type="password" value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                autoComplete="new-password" />
            </div>
            {error && <div className="error-msg show"><span>{error}</span></div>}
            <div className="modal-foot">
              <button type="button" className="btn-cancel" onClick={handleClose}>{t('cancel')}</button>
              <button type="submit" className="btn-confirm" disabled={saving}>
                {saving ? t('saving') : t('savePassword')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}