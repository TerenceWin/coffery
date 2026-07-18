import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import Navbar from '../components/Navbar';
import { useToast, ToastContainer } from '../components/Toast';
import { getSession, getOrders, setOrderStatus, getCalls, dismissCall } from '../utils/storage';
import type { Order, Call } from '../utils/storage';
import { timeAgo, fmtTime } from '../utils/helpers';

export default function StaffPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { toasts, toast } = useToast();

  const [session] = useState(() => getSession());
  const [tab, setTab]         = useState<'pending' | 'done'>('pending');
  const [orders, setOrders]   = useState<Order[]>([]);
  const [calls, setCalls]     = useState<Call[]>([]);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [cancelOrder, setCancelOrder]     = useState<Order | null>(null);
  const [lastUpdate, setLastUpdate]       = useState('');

  const prevPendingCount = useRef(-1);
  const prevCallCount    = useRef(-1);
  const wsRetry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef   = useRef<WebSocket | null>(null);
  const wsDead  = useRef(false);

  useEffect(() => {
    if (!session || session.role !== 'staff') { navigate('/'); return; }
    wsDead.current = false;
    refresh();
    connectWS();
    const id = setInterval(refresh, 3000); // fallback poll in case the socket drops
    return () => {
      wsDead.current = true;
      clearInterval(id);
      if (wsRetry.current) clearTimeout(wsRetry.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  function connectWS() {
    if (wsDead.current) return;
    if (wsRetry.current) clearTimeout(wsRetry.current);

    const wsUrl = 'wss://coffery.onrender.com';
    const ws = new WebSocket(`${wsUrl}/ws`);
    wsRef.current = ws;

    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'new_transaction' || msg.type === 'transaction_status_update') {
          refresh();
        }
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };
    ws.onclose = () => { if (!wsDead.current) wsRetry.current = setTimeout(connectWS, 4000); };
    ws.onerror = () => ws.close();
  }

  async function refresh() {
    let allOrders: Order[] = [];
    try {
      allOrders = await getOrders();
    } catch {
      toast(t('loadOrdersFailed'), 'err');
      return;
    }
    const activeCalls = getCalls().filter(c => !c.handled);

    const pending = allOrders.filter(o => o.status === 'pending');

    if (prevPendingCount.current >= 0 && pending.length > prevPendingCount.current) {
      const n = pending.length - prevPendingCount.current;
      toast(t('toastNewOrder', n), 'ok');
      const ids = new Set(pending.slice(0, n).map(o => o.id));
      setNewOrderIds(ids);
      setTimeout(() => setNewOrderIds(new Set()), 6000);
    }
    if (prevCallCount.current >= 0 && activeCalls.length > prevCallCount.current) {
      toast(t('toastNewCall'), 'err');
    }
    prevPendingCount.current = pending.length;
    prevCallCount.current    = activeCalls.length;

    setOrders(allOrders);
    setCalls(activeCalls);

    const d = new Date();
    setLastUpdate(
      t('lastUpdated') + ' ' +
      [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => n.toString().padStart(2, '0')).join(':') +
      ' · ' + t('autoRefresh')
    );
  }

  function handleDismiss(callId: string) {
    dismissCall(callId);
    refresh();
    toast(t('toastDismissed'), 'ok');
  }

  async function confirmPayment() {
    if (!checkoutOrder) return;
    try {
      await setOrderStatus(checkoutOrder.id, 'paid');
      setCheckoutOrder(null);
      toast(t('toastPayment'), 'ok');
      refresh();
    } catch {
      toast(t('statusUpdateFailed'), 'err');
    }
  }

  async function confirmCancel() {
    if (!cancelOrder) return;
    try {
      await setOrderStatus(cancelOrder.id, 'cancelled');
      setCancelOrder(null);
      toast(t('toastCancelled'), 'err');
      refresh();
    } catch {
      toast(t('statusUpdateFailed'), 'err');
    }
  }

  const pending = orders.filter(o => o.status === 'pending');
  const done    = orders.filter(o => o.status !== 'pending');

  return (
    <div className="dashboard-page">
      <Navbar variant="staff" userName={session?.name} callCount={calls.length} />

      {/* Calls banner */}
      {calls.length > 0 && (
        <div className="calls-banner">
          <div className="calls-banner-title">{t('customerCalls')}</div>
          <div className="calls-list">
            {calls.map(c => (
              <div key={c.id} className="call-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {t('tableNum')} {c.tableNum} · {timeAgo(c.createdAt, t)}
                <button className="call-dismiss" onClick={() => handleDismiss(c.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="main">
        <div className="page-hdr">
          <h1>{t('orderMgmt')}</h1>
          <div className="last-update">{lastUpdate}</div>
        </div>

        <div className="sec-tabs">
          <button className={`sec-tab${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>
            {t('pending')} <span className="tab-count">{pending.length}</span>
          </button>
          <button className={`sec-tab${tab === 'done' ? ' active' : ''}`} onClick={() => setTab('done')}>
            {t('completed')} <span className="tab-count">{done.length}</span>
          </button>
        </div>

        {tab === 'pending' && (
          pending.length === 0
            ? <div className="empty-orders"><div className="icon">✅</div><p>{t('noPending')}</p></div>
            : pending.map(o => (
              <OrderCard key={o.id} order={o} isPending isNew={newOrderIds.has(o.id)}
                onCheckout={() => setCheckoutOrder(o)}
                onCancel={() => setCancelOrder(o)}
                t={t}
              />
            ))
        )}
        {tab === 'done' && (
          done.length === 0
            ? <div className="empty-orders"><div className="icon">📋</div><p>{t('noCompleted')}</p></div>
            : done.map(o => <OrderCard key={o.id} order={o} isPending={false} isNew={false} t={t} />)
        )}
      </main>

      {/* Checkout modal */}
      <div className={`modal-overlay${checkoutOrder ? ' open' : ''}`}>
        <div className="modal">
          <div className="modal-head">
            <h3>{checkoutOrder ? `${t('tableNum')} ${checkoutOrder.tableNum} · ${t('checkoutTitle')}` : ''}</h3>
            <button className="btn-close" onClick={() => setCheckoutOrder(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          {checkoutOrder?.items.map(i => (
            <div key={i.code} className="checkout-item">
              <div className="checkout-item-left">
                <span className="checkout-item-em">{i.emoji}</span>
                <div>
                  <div className="checkout-item-name">{i.name}</div>
                  <div className="checkout-item-qty">× {i.qty} · {t('eachUnit', i.price)}</div>
                </div>
              </div>
              <span className="checkout-item-sub">K{i.price * i.qty}</span>
            </div>
          ))}
          <div className="checkout-total">
            <span className="checkout-total-label">{t('amountDue')}</span>
            <span className="checkout-total-val">K{checkoutOrder?.total ?? 0}</span>
          </div>
          <div className="modal-foot">
            <button className="btn-cancel" onClick={() => setCheckoutOrder(null)}>{t('cancel')}</button>
            <button className="btn-confirm" onClick={confirmPayment}>{t('confirmPayment')}</button>
          </div>
        </div>
      </div>

      {/* Cancel confirm */}
      <div className={`confirm-overlay${cancelOrder ? ' open' : ''}`}>
        <div className="confirm-box">
          <div className="confirm-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h3 className="confirm-title">{t('confirmCancelTitle')}</h3>
          <p className="confirm-msg">{cancelOrder ? t('confirmCancelMsg', cancelOrder.tableNum) : ''}</p>
          <div className="confirm-btns">
            <button className="btn-cancel" onClick={() => setCancelOrder(null)}>{t('back')}</button>
            <button className="btn-danger" onClick={confirmCancel}>{t('confirmCancel')}</button>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

function OrderCard({ order, isPending, isNew, onCheckout, onCancel, t }: {
  order: Order;
  isPending: boolean;
  isNew: boolean;
  onCheckout?: () => void;
  onCancel?: () => void;
  t: (key: string, ...args: unknown[]) => string;
}) {
  return (
    <div className={`order-card${isNew ? ' new-order' : ''}${!isPending ? ' done' : ''}`}>
      <div className="order-card-head">
        <div className="order-table">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          {t('tableNum')} {order.tableNum}
        </div>
        <div className="order-meta">
          <div className="order-time">{fmtTime(order.createdAt)}</div>
          <div>{timeAgo(order.createdAt, t)}</div>
          {!isPending && (
            <span className={`status-pill ${order.status}`}>
              {order.status === 'paid' ? t('statusPaid') : t('statusCancelled')}
            </span>
          )}
        </div>
      </div>
      <div className="order-card-body">
        {order.items.map(i => (
          <div key={i.code} className="order-item-row">
            <div className="order-item-left">
              <span className="em">{i.emoji}</span>
              <span className="order-item-name">{i.name}</span>
              <span className="order-item-qty">× {i.qty}</span>
            </div>
            <span className="order-item-sub">K{i.price * i.qty}</span>
          </div>
        ))}
        <div className="order-total-row">
          <span className="order-total-label">{t('total')}</span>
          <span className="order-total-val">K{order.total}</span>
        </div>
      </div>
      {isPending && (
        <div className="order-card-foot">
          <button className="btn-order-cancel" onClick={onCancel}>{t('cancelOrder')}</button>
          <button className="btn-order-pay" onClick={onCheckout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            {t('checkout')}
          </button>
        </div>
      )}
    </div>
  );
}