import { useState, useEffect } from 'react';
import { getEmoji } from '../../utils/helpers';
import { MenuItem } from '../../models/MenuItem'


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
          <span>MMK</span>
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
            <path d="M3 6h18M8 6V4h8v2M19   6l-1 14a2 2 0 01-2 1.99H8A2 2 0 016 20L5 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ItemCard; 