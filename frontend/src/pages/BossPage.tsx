import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import Navbar from '../components/Navbar';
import { useToast, ToastContainer } from '../components/Toast';
import { getSession, getOrders } from '../utils/storage';
import type { Order } from '../utils/storage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple, faUsers, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { faFile } from '@fortawesome/free-regular-svg-icons';
import MenuTab from '../components/BossPageComponents/MenuTab';
import QRTab from '../components/BossPageComponents/QRTab';
import ReportTab from '../components/BossPageComponents/ReportTab';
import StaffAccountTab from '../components/BossPageComponents/StaffAccountTab';

export default function BossPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { toasts, toast } = useToast();

  const [session] = useState(() => getSession());
  const [tab, setTab] = useState<'menu' | 'qr' | 'report' | 'staff'>('menu');

  // Report data lives here (not inside ReportTab) because the WebSocket below
  // must keep it fresh in the background even while the Reports tab isn't mounted.
  const [transactions, setTransactions] = useState<Order[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  const wsRetry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef   = useRef<WebSocket | null>(null);
  const wsDead  = useRef(false);

  useEffect(() => {
    if (!session || session.role !== 'boss') { navigate('/'); return; }
    wsDead.current = false;
    connectWS();
    return () => {
      wsDead.current = true;
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
          // Keep report data fresh in the background, whether or not
          // the Reports tab is the one currently showing.
          loadReports();
        }
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };
    ws.onclose = () => { if (!wsDead.current) wsRetry.current = setTimeout(connectWS, 4000); };
    ws.onerror = () => ws.close();
  }

  useEffect(() => {
    if (tab === 'report') loadReports(true);
  }, [tab]);

  async function loadReports(showSpinner = false) {
    if (showSpinner) setReportLoading(true);
    try {
      const orders = await getOrders();
      setTransactions(orders);
    } catch {
      if (showSpinner) toast(t('loadOrdersFailed'), 'err');
    } finally {
      if (showSpinner) setReportLoading(false);
    }
  }

  return (
    <div style={{ background: '#F5F1EC', minHeight: '100vh', fontFamily: "'Inter','Noto Sans Myanmar',sans-serif" }}>
      
      <Navbar variant="boss" userName={session?.name || session?.username} />

      <div className="dash-tabs">
        <button className={`dash-tab${tab === 'menu' ? ' active' : ''}`} onClick={() => setTab('menu')}>
          <FontAwesomeIcon icon={faFile} />
          {t('menuMgmt')}
        </button>
        <button className={`dash-tab ${tab === 'qr' ? ' active' : ''}`} onClick={() => setTab('qr')}>
          <FontAwesomeIcon icon={faQrcode} />
          {t('qrCodes')}
        </button>
        <button className={`dash-tab ${tab === 'report' ? 'active' : ''}`} onClick={()=> setTab('report')}>
          <FontAwesomeIcon icon={faChartSimple} />
          {t('reports')}
        </button>
        <button className={`dash-tab ${tab === 'staff' ? 'active' : ''}`} onClick={()=> setTab('staff')}>
          <FontAwesomeIcon icon={faUsers} />
          {t('staffTab')}
        </button>
      </div>

      {tab === 'menu' && <MenuTab toast={toast} />}
      {tab === 'qr' && <QRTab />}
      {tab === 'report' && <ReportTab transactions={transactions} loading={reportLoading} />}
      {tab === 'staff' && <StaffAccountTab session={session} toast={toast} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}