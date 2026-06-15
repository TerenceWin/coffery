export function timeAgo(iso: string, t: (key: string, ...args: unknown[]) => string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return t('secondsAgo', s);
  if (s < 3600) return t('minutesAgo', Math.floor(s / 60));
  return t('hoursAgo', Math.floor(s / 3600));
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

export function getEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('matcha') || n.includes('green tea')) return '🍵';
  if (n.includes('chocolate') || n.includes('mocha'))  return '🍫';
  if (n.includes('oat') || n.includes('燕麦'))          return '🌿';
  if (n.includes('orange') || n.includes('橙'))         return '🍊';
  if (n.includes('latte') || n.includes('拿铁'))        return '🥛';
  if (n.includes('cappuccino') || n.includes('卡布'))   return '☕';
  if (n.includes('ice') || n.includes('cold') || n.includes('冰')) return '🧊';
  return '☕';
}
