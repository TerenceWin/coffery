import { useLang } from '../context/LangContext';

export default function ConnectionBadge({ connected }: { connected: boolean }) {
  const { t } = useLang();
  if (connected) return null;
  return <span className="connection-badge">⚠ {t('connectionLost')}</span>;
}
