import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';
import { useToast, ToastContainer } from '../components/Toast';
import { placeOrder, callStaff } from '../utils/storage';
import type { OrderItem } from '../utils/storage';
import { getEmoji } from '../utils/helpers';
import api from '../services/api';

interface MenuItem {
  item: string;
  code: string;
  cost: number;
  available: boolean;
}

interface CartEntry extends OrderItem {
  emoji: string;
}

export default function CustomerPage() {
  const { t } = useLang();
  const [searchParams] = useSearchParams();
  const { toasts, toast } = useToast();
  const tableNum = searchParams.get('table');

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading]     = useState(false);
  const [loadErr, setLoadErr]     = useState('');
  const [cart, setCart]           = useState<Record<string, CartEntry>>({});
  const [cartOpen, setCartOpen]   = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const wsRetry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef   = useRef<WebSocket | null>(null);
  const wsDead  = useRef(false);

  useEffect(() => {
    if (!tableNum) return;
    wsDead.current = false;
    loadMenu();
    return () => {
      wsDead.current = true;
      if (wsRetry.current) clearTimeout(wsRetry.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [tableNum]);

  async function loadMenu() {
    setLoading(true); setLoadErr('');
    try {
      const res = await api.get<MenuItem[]>('/menu');
      setMenuItems(res.data);
      connectWS();
    } catch (err) {
      setLoadErr((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function connectWS() {
    if (wsRetry.current) clearTimeout(wsRetry.current);
    if (wsRef.current) wsRef.current.close();

    const wsUrl = (import.meta.env.VITE_API_URL ?? 'http://coffery.onrender.com').replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws`);
    wsRef.current = ws;

    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'availability_update') {
          setMenuItems(prev => prev.map(i => i.code === msg.code ? { ...i, available: msg.available } : i));
          if (!msg.available) {
            setCart(prev => {
              if (!prev[msg.code]) return prev;
              const name = prev[msg.code].name;
              toast(t('itemNowSoldOut', name), 'err');
              const next = { ...prev };
              delete next[msg.code];
              return next;
            });
          }
        }
      } catch { /* ignore malformed messages */ }
    };
    ws.onclose = () => {
      if (!wsDead.current) wsRetry.current = setTimeout(connectWS, 4000);
    };
    ws.onerror = () => ws.close();
  }

  function addToCart(item: MenuItem) {
    if (!item.available) return;
    const emoji = getEmoji(item.item);
    setCart(prev => {
      const existing = prev[item.code];
      return {
        ...prev,
        [item.code]: existing
          ? { ...existing, qty: existing.qty + 1 }
          : { emoji, name: item.item, code: item.code, price: item.cost, qty: 1 },
      };
    });
  }

  function removeFromCart(code: string) {
    setCart(prev => {
      if (!prev[code]) return prev;
      const qty = prev[code].qty - 1;
      if (qty <= 0) { const next = { ...prev }; delete next[code]; return next; }
      return { ...prev, [code]: { ...prev[code], qty } };
    });
  }

  function cartTotal() { return Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0); }
  function cartCount() { return Object.values(cart).reduce((s, i) => s + i.qty, 0); }

  function submitOrder() {
    const items = Object.values(cart);
    if (!items.length || !tableNum) return;
    placeOrder(tableNum, items);
    setCart({});
    setOrderPlaced(true);
    setTimeout(() => { setCartOpen(false); setOrderPlaced(false); }, 2200);
  }

  function handleCallStaff() {
    if (!tableNum) return;
    const ok = callStaff(tableNum);
    toast(ok ? t('callSent') : t('callDuplicate'), ok ? 'ok' : 'err');
  }

  const count = cartCount();

  return (
    <div style={{ background: '#FAF7F3', minHeight: '100vh', fontFamily: "'Inter','Noto Sans Myanmar',sans-serif" }}>

      {/* Header */}
      <div className="c-header">
        <div className="c-header-top">
          <div className="c-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4z"/>
              <path d="M6 1v3M10 1v3M14 1v3"/>
            </svg>
            <span>Hana Coffee</span>
          </div>
          <div className="header-actions">
            <LangSwitcher variant="light" />
            {tableNum && (
              <button className="btn-call" onClick={handleCallStaff}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {t('callStaff')}
              </button>
            )}
          </div>
        </div>

        {!tableNum ? (
          <div><h1>{t('noTableHeader')}</h1><p>{t('noTableSub')}</p></div>
        ) : (
          <div>
            <div className="c-table-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              {t('tableLabel')} {tableNum}
            </div>
            <h1 className="c-header-h1">{t('todayMenu')}</h1>
            <p>{t('menuSubtitle')}</p>
          </div>
        )}
      </div>

      {/* Body */}
      {!tableNum ? (
        <div className="invalid-state">
          <div className="big-icon">📱</div>
          <h2>{t('noTableTitle')}</h2>
          <p style={{ whiteSpace: 'pre-line' }}>{t('noTableBody')}</p>
        </div>
      ) : loading ? (
        <div className="loading-state"><div className="spinner" /><p>{t('todayMenu')}...</p></div>
      ) : loadErr ? (
        <div className="error-state">
          <div className="e-icon">⚠️</div>
          <h2>{t('noTableTitle')}</h2>
          <p>{loadErr}</p>
          <button className="btn-retry" onClick={loadMenu}>Retry</button>
        </div>
      ) : (
        <div className="menu-list">
          {menuItems.map(item => {
            const qty   = cart[item.code]?.qty || 0;
            const emoji = getEmoji(item.item);
            return (
              <div key={item.code} className={`menu-item${!item.available ? ' unavailable' : ''}`} data-code={item.code}>
                <div className="item-emoji">{emoji}</div>
                <div className="item-info">
                  <div className="item-name">{item.item}</div>
                  <div className="item-code">{item.code}</div>
                  {!item.available && <span className="item-unavail-tag">{t('soldOut')}</span>}
                </div>
                <div className="item-right">
                  <div className="item-price">K {item.cost}</div>
                  <div className="qty-ctrl">
                    {qty > 0 && (
                      <button className="qty-btn minus" onClick={() => removeFromCart(item.code)} disabled={!item.available}>−</button>
                    )}
                    {qty > 0 && <span className="qty-num">{qty}</span>}
                    <button className="qty-btn plus" onClick={() => addToCart(item)} disabled={!item.available}>+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart bar */}
      {count > 0 && (
        <div className="cart-bar" onClick={() => setCartOpen(true)}>
          <div className="cart-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.98-1.67L23 6H6"/>
            </svg>
            <div className="cart-badge">{count}</div>
          </div>
          <div className="cart-bar-info">
            <div className="cart-bar-total">K {cartTotal()}</div>
            <div className="cart-bar-hint">{t('tapToView')}</div>
          </div>
          <div className="cart-bar-btn">{t('viewOrder')}</div>
        </div>
      )}

      {/* Cart overlay + sheet */}
      <div className={`cart-overlay${cartOpen ? ' open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`cart-sheet${cartOpen ? ' open' : ''}`}>
        <div className="cart-sheet-head">
          <h3>{t('myOrder')}</h3>
          <button className="sheet-close" onClick={() => setCartOpen(false)}>✕</button>
        </div>

        <div className="cart-items-scroll">
          {orderPlaced ? (
            <div className="order-success">
              <div className="s-icon">✅</div>
              <h3>{t('orderSuccess')}</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{t('orderSuccessSub')}</p>
            </div>
          ) : Object.values(cart).length === 0 ? (
            <div className="cart-empty">
              <div className="e-icon">🛒</div>
              <p style={{ whiteSpace: 'pre-line' }}>{t('emptyCart')}</p>
            </div>
          ) : Object.values(cart).map(i => (
            <div key={i.code} className="cart-item">
              <div className="cart-item-emoji">{i.emoji}</div>
              <div className="cart-item-name">{i.name}</div>
              <div className="cart-item-price">K {i.price * i.qty}</div>
              <div className="qty-ctrl">
                <button className="qty-btn minus" onClick={() => removeFromCart(i.code)}>−</button>
                <span className="qty-num">{i.qty}</span>
                <button className="qty-btn plus" onClick={() => addToCart({ item: i.name, code: i.code, cost: i.price, available: true })}>+</button>
              </div>
            </div>
          ))}
        </div>

        {!orderPlaced && Object.values(cart).length > 0 && (
          <div className="cart-sheet-foot">
            <div className="cart-total-row">
              <span className="cart-total-label">{t('total')}</span>
              <span className="cart-total-val">K {cartTotal()}</span>
            </div>
            <button className="btn-place-order" onClick={submitOrder}>{t('submitOrder')}</button>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
