/* Small formatting helpers the review screens share. */

export function relativeTime(iso: string, now = new Date('2026-10-01T14:26:00-05:00')): string {
  const then = new Date(iso).getTime();
  const min = Math.round((now.getTime() - then) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
