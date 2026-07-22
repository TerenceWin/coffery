import {useRef} from 'react';
import {QRCodeCanvas} from 'qrcode.react';

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

export default QRCard; 