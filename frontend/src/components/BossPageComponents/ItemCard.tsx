import { useState, useEffect, useRef } from 'react';
import { MenuItem } from '../../models/MenuItem'
import { useLang } from '../../context/LangContext';
import { CATEGORIES } from '../../constants/categories';


function ItemCard({ item, onSavePrice, onToggle, onDelete, onSaveName, onSaveCategory }: {
  item: MenuItem;
  onSavePrice: (v: string) => void;
  onToggle: (v: boolean) => void;
  onDelete: () => void;
  onSaveName: (v: string) => void;
  onSaveCategory: (v: string) => void;
}) {
  const { t } = useLang();
  const [price, setPrice] = useState(String(item.cost));
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(item.item);
  const [editingCategory, setEditingCategory] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => setPrice(String(item.cost)), [item.cost]);
  useEffect(() => setName(item.item), [item.item]);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingCategory) {
      categorySelectRef.current?.focus();
    }
  }, [editingCategory]);

  function saveName() {
    setEditingName(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === item.item) {
      setName(item.item);
      return;
    }
    onSaveName(trimmed);
  }

  function saveCategory(value: string) {
    setEditingCategory(false);
    if (!value || value === item.category) return;
    onSaveCategory(value);
  }

  const categoryLabel = CATEGORIES.find(c => c.value === item.category);

  return (
    <div className={`item-card${!item.available ? ' unavail' : ''}`} id={`card-${item.code}`}>
      {item.imagePath ? (
        <img className="item-image-sm" src={item.imagePath} alt={item.item} />
      ) : (
        <div className="item-emoji-sm">☕</div>
      )}
      <div className="item-meta">
        {editingName ? (
          <input
            ref={nameInputRef}
            className="item-meta-name-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
        ) : (
          <div className="item-meta-name" onClick={() => setEditingName(true)}>{item.item}</div>
        )}
        {editingCategory ? (
          <select
            ref={categorySelectRef}
            className="item-meta-category-input"
            defaultValue={item.category}
            onChange={e => saveCategory(e.target.value)}
            onBlur={() => setEditingCategory(false)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
            ))}
          </select>
        ) : (
          <div className="item-meta-category" onClick={() => setEditingCategory(true)}>
            {categoryLabel ? t(categoryLabel.labelKey) : (item.category || item.code)}
          </div>
        )}
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
