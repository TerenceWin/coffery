import { useState } from 'react';
import { useLang } from '../../context/LangContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode } from '@fortawesome/free-solid-svg-icons';
import QRCard from './QRCard';

export default function QRTab() {
  const { t } = useLang();

  const [tableCount, setTableCount] = useState(0);
  const [qrList, setQrList] = useState<number[]>([]);

  const baseUrl = `${window.location.origin}/customer`;

  function downloadAll() {
    const canvases = document.querySelectorAll<HTMLCanvasElement>('.qr-grid canvas');
    canvases.forEach((canvas, i) => {
      const a = document.createElement('a');
      a.download = `hana-table-${i + 1}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    });
  }

  return (
    <div className="dash-content active">
      <div className="qr-config">
        <h3>
          <FontAwesomeIcon icon={faQrcode} />
          {t('generateQR')}
        </h3>
        <div className="cfg-row">
          <div className="cfg-field">
            <label>{t('tableCount')}</label>
            <input type="number" value={tableCount} min={1} max={50}
              onChange={e => setTableCount(Math.min(50, parseInt(e.target.value)))}/>
          </div>
          <button className="btn-gen" onClick={() => setQrList(Array.from({ length: tableCount }, (_, i) => i + 1))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            {t('generateQR')}
          </button>
          <button className="btn-gen" onClick={() => downloadAll()}>
            {t('downloadAll')}
          </button>
        </div>
      </div>
      <div className="qr-grid">
        {qrList.map(i => (
          <QRCard key={i} tableNum={i} url={`${baseUrl}?table=${i}`} label={t('tableQrLabel', i)} dlLabel={t('downloadQR')} />
        ))}
      </div>
    </div>
  );
}
