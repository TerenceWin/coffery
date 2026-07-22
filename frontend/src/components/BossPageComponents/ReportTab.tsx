import { useState } from 'react';
import { useLang } from '../../context/LangContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple, faCoins, faReceipt, faClock, faBan } from '@fortawesome/free-solid-svg-icons';
import { getEmoji } from '../../utils/helpers';
import type { Order } from '../../utils/storage';

interface Props {
  transactions: Order[];
  loading: boolean;
}

export default function ReportTab({ transactions, loading }: Props) {
  const { t } = useLang();
  const [reportFilter, setReportFilter] = useState<'today' | '7d' | '30d' | 'all'>('today');

  function filterCutoff(): number {
    const now = Date.now();
    if (reportFilter === 'today') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    if (reportFilter === '7d') return now - 7 * 24 * 60 * 60 * 1000;
    if (reportFilter === '30d') return now - 30 * 24 * 60 * 60 * 1000;
    return 0; // 'all'
  }

  const cutoff = filterCutoff();
  const filteredTx = transactions.filter(tx => new Date(tx.createdAt).getTime() >= cutoff);
  const paidTx = filteredTx.filter(tx => tx.status === 'paid');
  const pendingTx = filteredTx.filter(tx => tx.status === 'pending');
  const cancelledTx = filteredTx.filter(tx => tx.status === 'cancelled');
  const totalRevenue = paidTx.reduce((s, tx) => s + tx.total, 0);

  return (
    <div className="dash-content active">
      {/* Stat cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-green"><FontAwesomeIcon icon={faCoins} /></div>
          <div>
            <div className="stat-value">K {totalRevenue}</div>
            <div className="stat-label">{t('reportRevenue')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-brown"><FontAwesomeIcon icon={faReceipt} /></div>
          <div>
            <div className="stat-value">{filteredTx.length}</div>
            <div className="stat-label">{t('reportOrders')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-blue"><FontAwesomeIcon icon={faClock} /></div>
          <div>
            <div className="stat-value">{pendingTx.length}</div>
            <div className="stat-label">{t('reportPending')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-brown"><FontAwesomeIcon icon={faBan} /></div>
          <div>
            <div className="stat-value">{cancelledTx.length}</div>
            <div className="stat-label">{t('reportCancelled')}</div>
          </div>
        </div>
      </div>

      {/* Date range filter */}
      <div className="sec-tabs">
        {(['today', '7d', '30d', 'all'] as const).map(f => (
          <button
            key={f}
            className={`sec-tab${reportFilter === f ? ' active' : ''}`}
            onClick={() => setReportFilter(f)}
          >
            {t(f === 'today' ? 'filterToday' : f === '7d' ? 'filter7d' : f === '30d' ? 'filter30d' : 'filterAll')}
          </button>
        ))}
      </div>

      {/* Transaction history table */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">
            <FontAwesomeIcon icon={faChartSimple} /> {t('reports')}
          </span>
        </div>
        {loading ? (
          <div className="state-box"><div className="spinner-sm" /><p>Loading...</p></div>
        ) : filteredTx.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faReceipt} />
            <p>{t('noTransactions')}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('colTable')}</th>
                  <th>{t('colItems')}</th>
                  <th>{t('colTotal')}</th>
                  <th>{t('colStatus')}</th>
                  <th>{t('colTime')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map(tx => (
                  <tr key={tx.id}>
                    <td>{t('tableNum')} {tx.tableNum}</td>
                    <td>{tx.items.map(i => `${getEmoji(i.name)} ${i.name} ×${i.qty}`).join(', ')}</td>
                    <td>K {tx.total}</td>
                    <td>
                      {tx.status === 'paid' && <span className="status-pill paid">{t('statusPaid')}</span>}
                      {tx.status === 'cancelled' && <span className="status-pill cancelled">{t('statusCancelled')}</span>}
                      {tx.status === 'pending' && <span>{t('pending')}</span>}
                    </td>
                    <td className="date-cell">{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
