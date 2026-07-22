import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useLang } from '../../context/LangContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUsers, faTrash } from '@fortawesome/free-solid-svg-icons';
import { getAccounts, createAccount, deleteAccount } from '../../utils/storage';
import type { Account, Session } from '../../utils/storage';

interface Props {
  session: Session | null;
  toast: (msg: string, type?: 'ok' | 'err') => void;
}

export default function StaffAccountTab({ session, toast }: Props) {
  const { t } = useLang();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [newAccUsername, setNewAccUsername] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccRole, setNewAccRole] = useState<'boss' | 'staff'>('staff');
  const [creatingAcc, setCreatingAcc] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setAccountsLoading(true);
    try {
      const list = await getAccounts();
      setAccounts(list);
    } catch {
      toast(t('loadAccountsFailed'), 'err');
    } finally {
      setAccountsLoading(false);
    }
  }

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault();
    const username = newAccUsername.trim();
    const name = newAccName.trim();
    if (!username || !newAccPassword || !name) {
      toast(t('fillAllFields'), 'err');
      return;
    }
    if (newAccPassword.length < 6) {
      toast(t('errPasswordLength'), 'err');
      return;
    }
    setCreatingAcc(true);
    try {
      await createAccount(username, newAccPassword, newAccRole, name);
      setNewAccUsername(''); setNewAccPassword(''); setNewAccName(''); setNewAccRole('staff');
      toast(t('accountCreated'), 'ok');
      await loadAccounts();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast(msg || t('accountCreateFailed'), 'err');
    } finally {
      setCreatingAcc(false);
    }
  }

  async function confirmDeleteAccount() {
    if (!deleteTarget) return;
    try {
      await deleteAccount(deleteTarget.id);
      setAccounts(prev => prev.filter(a => a.id !== deleteTarget.id));
      toast(t('accountDeleted'), 'ok');
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast(msg || t('accountDeleteFailed'), 'err');
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="dash-content active">
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <span className="card-title">
            <FontAwesomeIcon icon={faUserPlus} /> {t('newAccount')}
          </span>
        </div>
        <form onSubmit={handleCreateAccount} style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 160px', margin: 0 }}>
            <label>{t('labelUsername')}</label>
            <input className="form-input" value={newAccUsername} onChange={e => setNewAccUsername(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 160px', margin: 0 }}>
            <label>{t('labelName')}</label>
            <input className="form-input" value={newAccName} onChange={e => setNewAccName(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 140px', margin: 0 }}>
            <label>{t('labelPassword')}</label>
            <input className="form-input" type="password" value={newAccPassword} onChange={e => setNewAccPassword(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '0 0 130px', margin: 0 }}>
            <label>{t('labelRole')}</label>
            <select className="form-input" value={newAccRole} onChange={e => setNewAccRole(e.target.value as 'boss' | 'staff')}>
              <option value="staff">{t('roleStaff')}</option>
              <option value="boss">{t('roleAdmin')}</option>
            </select>
          </div>
          <button className="btn-gen" type="submit" disabled={creatingAcc}>
            <FontAwesomeIcon icon={faUserPlus} />
            {creatingAcc ? t('saving') : t('createAccount')}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">
            <FontAwesomeIcon icon={faUsers} /> {t('staffTab')}
          </span>
        </div>
        {accountsLoading ? (
          <div className="state-box"><div className="spinner-sm" /><p>Loading...</p></div>
        ) : accounts.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faUsers} />
            <p>{t('noAccounts')}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('labelUsername')}</th>
                  <th>{t('labelName')}</th>
                  <th>{t('labelRole')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id}>
                    <td>{acc.username}{acc.id === session?.id && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>({t('you')})</span>}</td>
                    <td>{acc.name}</td>
                    <td>{acc.role === 'boss' ? t('roleAdmin') : t('roleStaff')}</td>
                    <td style={{ textAlign: 'right' }}>
                      {acc.id !== session?.id && (
                        <button className="btn-icon del" onClick={() => setDeleteTarget(acc)} title={t('deleteAccount')}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm delete dialog (staff account) */}
      <div className={`confirm-overlay${deleteTarget ? ' open' : ''}`}>
        <div className="confirm-box">
          <h3>{t('deleteAccount')}</h3>
          <p>{deleteTarget ? t('deleteAccountConfirm', deleteTarget.username) : ''}</p>
          <div className="confirm-btns">
            <button className="btn-cancel-soft" onClick={() => setDeleteTarget(null)}>{t('cancel')}</button>
            <button className="btn-danger" onClick={confirmDeleteAccount}>{t('deleteAccount')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
