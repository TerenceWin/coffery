import { useState, useEffect, useRef } from 'react';
import { useLang } from '../../context/LangContext';
import api from '../../services/api';
import { MenuItem } from '../../models/MenuItem';
import ItemCard from './ItemCard';

interface Props {
  toast: (msg: string, type?: 'ok' | 'err') => void;
}

export default function MenuTab({ toast }: Props) {
  const { t } = useLang();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adding, setAdding] = useState(false);
  const [confirmItem, setConfirmItem] = useState<{ code: string; name: string } | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    setLoading(true);
    try {
      const res = await api.get<MenuItem[]>('/menu-items');
      setMenuItems(res.data ?? []);
    } catch {
      toast(t('loadFailed'), 'err');
    } finally {
      setLoading(false);
    }
  }

  async function addItem() {
    const name = newName.trim();
    const code = newCode.trim().toUpperCase();
    const price = parseInt(newPrice);

    if (!name || !code || !price || !file) {
      toast(t('fillAllFields'), 'err');
      return;
    }

    setAdding(true);

    try {
      // Upload image to disk first, then add the menu item with the returned URL
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post<{ url: string }>('/upload-image', formData, {
        headers: { 'Content-Type': undefined as unknown as string },
      });

      await api.post('/add-item', { item: name, code, cost: price, imagePath: uploadRes.data.url });

      setNewName('');
      setNewCode('');
      setNewPrice('');
      setFile(null);

      setAddOpen(false);
      toast(t('toastAdded'), 'ok');
      await loadMenu();
    } catch (err) {
      toast(t('toastErrAdd') + ' — ' + (err as Error).message, 'err');
    } finally {
      setAdding(false);
    }
  }

  async function savePrice(code: string, value: string, original: number) {
    const newCost = parseInt(value);
    if (isNaN(newCost) || newCost < 1 || newCost === original) return;
    try {
      await api.patch(`/menu-items/${code}/cost`, { price: newCost });
      setMenuItems(prev => prev.map(i => i.code === code ? { ...i, cost: newCost } : i));
      toast(t('toastPriceOK'), 'ok');
    } catch {
      toast(t('toastErrPrice'), 'err');
    }
  }

  async function saveName(code: string, newName: string) {
    try {
      await api.patch(`/menu-items/${code}/name`, { name: newName });
      setMenuItems(prev => prev.map(i => i.code === code ? { ...i, item: newName } : i));
      toast(t('toastNameOK'), 'ok');
    } catch {
      toast(t('toastErrName'), 'err');
    }
  }

  async function toggleAvail(code: string, avail: boolean) {
    try {
      await api.patch(`/menu-items/${code}/availability`, { avail });
      setMenuItems(prev => prev.map(i => i.code === code ? { ...i, available: avail } : i));
      toast(t('toastAvailOK'), 'ok');
    } catch {
      setMenuItems(prev => prev.map(i => i.code === code ? { ...i, available: !avail } : i));
      toast(t('toastErrAvail'), 'err');
    }
  }

  async function doDelete() {
    if (!confirmItem) return;
    const code = confirmItem.code;
    setConfirmItem(null);
    try {
      await api.delete(`/menu-items/${code}`);
      setMenuItems(prev => prev.filter(i => i.code !== code));
      toast(t('toastDeleted'), 'ok');
    } catch {
      toast(t('toastErrDel'), 'err');
    }
  }

  return (
    <div className="dash-content active">
      {/* Add form */}
      <div className={`add-card${addOpen ? ' open' : ''}`}>
        <div className="add-card-head" onClick={() => setAddOpen(o => !o)}>
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
            </svg>
            {t('addItem')}
          </h3>
          <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
        {addOpen && (
          <div className="add-form">
            <div className="add-row">
              <div className="add-field">
                <label>{t('itemName')}</label>
                <input type="text" placeholder={t('phItemName')} value={newName}
                  onChange={e => setNewName(e.target.value)} autoComplete="off" />
              </div>
              <div className="add-field" style={{ maxWidth: 100 }}>
                <label>{t('itemCode')}</label>
                <input type="text" placeholder={t('phItemCode')} value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())} autoComplete="off" style={{ textTransform: 'uppercase' }} />
              </div>
              <div className="add-field" style={{ maxWidth: 100 }}>
                <label>{t('itemPrice')}</label>
                <input type="number" placeholder={t('phItemPrice')} value={newPrice}
                  onChange={e => setNewPrice(e.target.value)} min="1" />
              </div>
              <div className="add-field">
                <label>{t('addImage')}</label>
                <input ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
                <div
                  className="drop-zone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) setFile(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? file.name : '＋'}
                </div>
              </div>
            </div>
            <button className="btn-add" onClick={addItem} disabled={adding}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {t('addBtn')}
            </button>
          </div>
        )}
      </div>

      <p className="section-label">{menuItems.length} items</p>

      {loading ? (
        <div className="state-box"><div className="spinner-sm" /><p>Loading...</p></div>
      ) : menuItems.length === 0 ? (
        <div className="state-box"><div className="s-icon">☕</div><p>{t('noItems')}</p></div>
      ) : menuItems.map(item => (
        <ItemCard key={item.code} item={item}
          onSavePrice={(v) => savePrice(item.code, v, item.cost)}
          onToggle={(v) => toggleAvail(item.code, v)}
          onDelete={() => setConfirmItem({ code: item.code, name: item.item })}
          onSaveName={(v) => saveName(item.code, v)}
        />
      ))}

      {/* Confirm delete dialog (menu item) */}
      <div className={`confirm-overlay${confirmItem ? ' open' : ''}`}>
        <div className="confirm-box">
          <h3>{t('deleteItem')}</h3>
          <p>{confirmItem ? t('deleteConfirm', confirmItem.name) : ''}</p>
          <div className="confirm-btns">
            <button className="btn-cancel-soft" onClick={() => setConfirmItem(null)}>{t('cancel')}</button>
            <button className="btn-danger" onClick={doDelete}>{t('deleteItem')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
