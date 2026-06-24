import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useLang } from '../context/LangContext';
import Navbar from '../components/Navbar';
import { useToast, ToastContainer } from '../components/Toast';
import { getSession } from '../utils/storage';
import { getEmoji } from '../utils/helpers';
import api from '../services/api';
import { MenuItem } from '../models/MenuItem'

export default function BossPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { toasts, toast } = useToast();

  const [session] = useState(() => getSession());
  const [tab, setTab] = useState<'menu' | 'qr'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newImageName, setNewImageName] = useState('');
  const [newImage, setNewImage] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [adding, setAdding]   = useState(false);
  const [confirmItem, setConfirmItem] = useState<{ code: string; name: string } | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [tableCount, setTableCount] = useState(10);
  const [qrList, setQrList]   = useState<number[]>([]);
  const wsRetry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef   = useRef<WebSocket | null>(null);
  const wsDead  = useRef(false);



  useEffect(() => {
    if (!session || session.role !== 'boss') { navigate('/'); return; }
    setBaseUrl(window.location.origin + '/customer');
    wsDead.current = false;
    loadMenu();
    return () => {
      wsDead.current = true;
      if (wsRetry.current) clearTimeout(wsRetry.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  async function loadMenu() {
    setLoading(true);
    try {
      const res = await api.get<MenuItem[]>('/menu');
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
  
  // Ensure all required fields including the file are provided
  if (!name || !code || !price || !file) {
    toast(t('fillAllFields'), 'err'); 
    return;
  }

  setAdding(true);

  const formData = new FormData();
  formData.append('item', name);
  formData.append('code', code);
  formData.append('cost', String(price));
  formData.append('imageName', newImageName);

  try {
    await api.post('/add-item', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Reset all form fields
    setNewName('');
    setNewCode('');
    setNewPrice('');
    setNewImageName('');
    setNewImage(''); // Added reset for newImage state
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
      await api.post('/update-cost', { code, price: newCost });
      setMenuItems(prev => prev.map(i => i.code === code ? { ...i, cost: newCost } : i));
      toast(t('toastPriceOK'), 'ok');
    } catch {
      toast(t('toastErrPrice'), 'err');
    }
  }
  
  async function toggleAvail(code: string, avail: boolean) {
    try {
      await api.post('/update-availability', { code, avail });
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
      await api.delete(`/delete-item/${code}`);
      setMenuItems(prev => prev.filter(i => i.code !== code));
      toast(t('toastDeleted'), 'ok');
    } catch {
      toast(t('toastErrDel'), 'err');
    }
  }

  return (
    <div style={{ background: '#F5F1EC', minHeight: '100vh', fontFamily: "'Inter','Noto Sans Myanmar',sans-serif" }}>

      {/* Navbar */}
      <Navbar variant="boss" userName={session?.name || session?.username} />

      {/* Tabs */}
      <div className="dash-tabs">
        <button className={`dash-tab${tab === 'menu' ? ' active' : ''}`} onClick={() => setTab('menu')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          {t('menuMgmt')}
        </button>
        <button className={`dash-tab${tab === 'qr' ? ' active' : ''}`} onClick={() => setTab('qr')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h3M20 14v3"/>
          </svg>
          {t('qrCodes')}
        </button>
      </div>

      {/* ── Menu Tab ── */}
      {tab === 'menu' && (
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
                  <div 
                    className="drop-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setFile(e.dataTransfer.files[0]);
                        setNewImageName(e.dataTransfer.files[0].name); // Optional: auto-fill name
                      }
                    }}
                  >
                    {file ? (
                      <p>Selected: {file.name}</p>
                    ) : (
                      <p>Drag & Drop image here</p>
                    )}
                  </div>

                  <div className="add-field">
                    <label>Save as Name:</label>
                    <input 
                      type="text" 
                      value={newImageName} 
                      onChange={(e) => setNewImageName(e.target.value)} 
                      placeholder="e.g. burger.jpg"
                    />
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
            />
          ))}
        </div>
      )}

      {/* ── QR Tab ── */}
      {tab === 'qr' && (
        <div className="dash-content active">
          <div className="qr-config">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h3M20 14v3"/>
              </svg>
              {t('generateQR')}
            </h3>
            <div className="cfg-field">
              <label>{t('baseUrl')}</label>
              <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
            </div>
            <div className="cfg-row">
              <div className="cfg-field">
                <label>{t('tableCount')}</label>
                <input type="number" value={tableCount} min={1} max={50}
                  onChange={e => setTableCount(Math.min(50, parseInt(e.target.value) || 10))} />
              </div>
              <button className="btn-gen" onClick={() => setQrList(Array.from({ length: tableCount }, (_, i) => i + 1))}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                {t('generateQR')}
              </button>
            </div>
          </div>
          <div className="qr-grid">
            {qrList.map(i => (
              <QRCard key={i} tableNum={i} url={`${baseUrl}?table=${i}`} label={t('tableQrLabel', i)} dlLabel={t('downloadQR')} />
            ))}
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
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

      <ToastContainer toasts={toasts} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ItemCard({ item, onSavePrice, onToggle, onDelete }: {
  item: MenuItem;
  onSavePrice: (v: string) => void;
  onToggle: (v: boolean) => void;
  onDelete: () => void;
}) {
  const [price, setPrice] = useState(String(item.cost));

  useEffect(() => setPrice(String(item.cost)), [item.cost]);

  return (
    <div className={`item-card${!item.available ? ' unavail' : ''}`} id={`card-${item.code}`}>
      <div className="item-emoji-sm">{getEmoji(item.item)}</div>
      <div className="item-meta">
        <div className="item-meta-name">{item.item}</div>
        <div className="item-meta-code">{item.code}</div>
      </div>
      <div className="item-controls">
        <div className="price-wrap">
          <span>K</span>
          <input className="price-input" type="number" value={price}
            onChange={e => setPrice(e.target.value)}
            onBlur={() => onSavePrice(price)}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
        </div>
        <label className="toggle">
          <input type="checkbox" checked={item.available} onChange={e => onToggle(e.target.checked)} />
          <span className="slider" />
        </label>
        <button className="btn-del" onClick={onDelete}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 1.99H8A2 2 0 016 20L5 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function QRCard({ tableNum, url, label, dlLabel }: { tableNum: number; url: string; label: string; dlLabel: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  function download() {
    const canvas = wrapRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `hana-table-${tableNum}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  return (
    <div className="qr-card">
      <div className="qr-table-name">{label}</div>
      <div className="qr-canvas" ref={wrapRef}>
        <QRCodeCanvas value={url} size={140} fgColor="#2C1308" bgColor="#ffffff" level="M" />
      </div>
      <button className="btn-dl" onClick={download}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        {dlLabel}
      </button>
    </div>
  );
}
