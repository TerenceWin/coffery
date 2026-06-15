import { useLang } from '../context/LangContext';

export default function LangSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`lang-sw ${variant}`}>
      <button className={`ls-btn${lang === 'zh' ? ' active' : ''}`} onClick={() => setLang('zh')}>中</button>
      <button className={`ls-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
      <button className={`ls-btn${lang === 'my' ? ' active' : ''}`} onClick={() => setLang('my')}>မြ</button>
    </div>
  );
}
