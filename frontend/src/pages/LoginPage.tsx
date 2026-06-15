import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';
import { initDB, login, getSession } from '../utils/storage';

export default function LoginPage() {
  const { t } = useLang();
  const navigate = useNavigate();

  const [role, setRole]       = useState<'boss' | 'staff'>('boss');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initDB();
    const s = getSession();
    if (s) navigate(s.role === 'staff' ? '/staff' : '/dashboard', { replace: true });
  }, [navigate]);

  function handleRoleSwitch(r: 'boss' | 'staff') {
    setRole(r);
    setUsername('');
    setPassword('');
    setErrMsg('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) { setErrMsg(t('errFillAll')); return; }
    setLoading(true);
    const session = login(role, username, password);
    if (session) {
      setTimeout(() => navigate(session.role === 'staff' ? '/staff' : '/dashboard'), 500);
    } else {
      setErrMsg(t('errWrongCreds'));
      setPassword('');
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* ── Brand Panel ── */}
      <div className="brand-panel">
        <div className="brand-deco" />
        <div className="brand-content">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4z"/>
              <path d="M6 1v3M10 1v3M14 1v3"/>
            </svg>
            <span className="brand-logo-text">Hana Coffee</span>
          </div>
          <div className="brand-tagline" dangerouslySetInnerHTML={{ __html: t('brandTagline') }} />
          <div className="brand-sub">{t('brandSub')}</div>
          <div className="brand-dots">
            <div className="brand-dot" />
            <div className="brand-dot" style={{ background: 'rgba(255,255,255,.2)' }} />
            <div className="brand-dot" style={{ background: 'rgba(255,255,255,.2)' }} />
          </div>
        </div>
      </div>

      {/* ── Form Panel ── */}
      <div className="form-panel">
        <div className="form-content">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <LangSwitcher variant="dark" />
          </div>

          <div className="form-header">
            <h2>{t('loginWelcome')}</h2>
            <p>{t('loginSubtitle')}</p>
          </div>

          <div className="role-tabs">
            <button className={`role-tab${role === 'boss' ? ' active' : ''}`} onClick={() => handleRoleSwitch('boss')}>
              {t('roleAdmin')}
            </button>
            <button className={`role-tab${role === 'staff' ? ' active' : ''}`} onClick={() => handleRoleSwitch('staff')}>
              {t('roleStaff')}
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>{t('labelUsername')}</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input className="form-input" type="text" placeholder={t('phUsername')}
                  value={username} onChange={e => { setUsername(e.target.value); setErrMsg(''); }}
                  autoComplete="username" />
              </div>
            </div>

            <div className="form-group">
              <label>{t('labelPassword')}</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input className="form-input" type="password" placeholder={t('phPassword')}
                  value={password} onChange={e => { setPassword(e.target.value); setErrMsg(''); }}
                  autoComplete="current-password" />
              </div>
            </div>

            {errMsg && (
              <div className="error-msg show">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <span>{errMsg}</span>
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}>
              <span>{loading ? t('signingIn') : t('btnLogin')}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </form>

          <div className="hint-box">
            <div className="hint-label">{t('demoAccount')}</div>
            <div dangerouslySetInnerHTML={{ __html: role === 'boss' ? t('hintBoss') : t('hintStaff') }} />
          </div>
        </div>
      </div>
    </div>
  );
}
